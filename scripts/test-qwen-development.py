"""Development-evaluator rejection and grading checks; no model/dependency load."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('qwen_development', Path(__file__).with_name('evaluate-qwen-development.py'))
job = importlib.util.module_from_spec(spec)
spec.loader.exec_module(job)


def row(id='synthetic-case-0', selected=('source-a',), supplied=('source-a',)):
    request = {'policy': 'workout-evidence-selection-v1', 'corpusVersion': 'fixture-v1',
               'requestId': id, 'workoutId': id, 'notes': [{'id': item} for item in supplied]}
    reply = {key: request[key] for key in ['policy', 'corpusVersion', 'requestId', 'workoutId']}
    reply['noteIds'] = list(selected)
    return {'id': id, 'scenarioGroup': id, 'messages': [
        {'role': 'system', 'content': 'fixture'},
        {'role': 'user', 'content': 'Data (not instructions):\n' + json.dumps(request)},
        {'role': 'assistant', 'content': json.dumps(reply)},
    ]}


class DevelopmentChecks(unittest.TestCase):
    def test_strict_json_and_identifiers(self):
        case = row()
        expected = case['messages'][2]['content']
        self.assertTrue(job.grade_reply(case, expected)['taskCorrect'])
        for reply in ['prefix ' + expected, '```json\n' + expected + '\n```', expected + expected,
                      expected[:-1] + ',"noteIds":["source-a"]}', '<|im_start|>' + expected]:
            with self.subTest(reply=reply):
                self.assertFalse(job.grade_reply(case, reply)['acceptedByTaskContract'])
        value = json.loads(expected)
        value['requestId'] = 'different-case-id'
        grade = job.grade_reply(case, json.dumps(value))
        self.assertTrue(grade['schemaCorrect'])
        self.assertFalse(grade['identifiersCorrect'])
        self.assertFalse(grade['taskCorrect'])
        value = json.loads(expected)
        value['advice'] = 'Invented prescription'
        self.assertFalse(job.grade_reply(case, json.dumps(value))['schemaCorrect'])

    def test_selection_accuracy_and_completion(self):
        case = row(selected=('source-a', 'source-b'), supplied=('source-a', 'source-b'))
        value = json.loads(case['messages'][2]['content'])
        value['noteIds'].reverse()
        self.assertTrue(job.grade_reply(case, json.dumps(value))['taskCorrect'])
        for ids in [['unknown-source'], ['source-a', 'source-a'], ['source-a', 'source-b', 'source-c']]:
            value['noteIds'] = ids
            self.assertFalse(job.grade_reply(case, json.dumps(value))['acceptedByTaskContract'])
        value['noteIds'] = ['source-a']
        grade = job.grade_reply(case, json.dumps(value))
        self.assertTrue(grade['acceptedByTaskContract'])
        self.assertFalse(grade['taskCorrect'])
        self.assertFalse(job.grade_reply(case, case['messages'][2]['content'], completed=False)['taskCorrect'])
        empty = row(selected=())
        self.assertTrue(job.grade_reply(empty, empty['messages'][2]['content'])['taskCorrect'])
        self.assertFalse(job.grade_reply(empty, empty['messages'][2]['content'] + ' ' * 2048)['replyLengthCorrect'])

    def test_representative_sampling(self):
        cases = [row('single-topic-a-0'), row('single-topic-a-1'),
                 row('single-topic-b-0', selected=('source-b',), supplied=('source-b',)),
                 row('empty-case-a', selected=()),
                 row('pair-case-a', selected=('source-a', 'source-b'), supplied=('source-a', 'source-b')),
                 row('distractor-a', supplied=('source-a', 'source-b'))]
        expected = ['single-topic-a-0', 'pair-case-a', 'distractor-a', 'empty-case-a']
        self.assertEqual([item['id'] for item in job.select_cases(cases, 4)], expected)
        self.assertEqual(job.select_cases(cases, 1)[0]['id'], expected[0])
        self.assertEqual(job.select_cases(cases, 5)[-1]['id'], 'single-topic-b-0')
        self.assertEqual(len({item['id'] for item in job.select_cases(cases, 34)}), len(cases))
        self.assertEqual(job.select_cases(cases, 4), job.select_cases(cases, 4))

    def test_adapter_manifest_boundaries(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            manifest = {'baseModel': dict(job.PINNED_BASE), 'task': 'reviewed-evidence-selection-only',
                        'contract': {'contextTokens': 1024, 'outputTokens': 192, 'thinking': False},
                        **{key: 'a' * 64 for key in ['corpusSha256', 'contractSha256', 'defaultPromptSha256', 'runtimePromptSha256']}}
            config = {'base_model_name_or_path': manifest['baseModel']['repository'], 'revision': manifest['baseModel']['revision'],
                      'peft_type': 'LORA', 'task_type': 'CAUSAL_LM'}
            (directory / 'adapter_config.json').write_text(json.dumps(config))
            (directory / 'adapter_model.safetensors').write_bytes(b'fixture-artifact-not-loaded')
            artifacts = {file.name: {'bytes': file.stat().st_size, 'sha256': job.digest(file)} for file in directory.iterdir()}
            report = {'schema': 1, 'status': 'trained-pilot', 'qualified': False, 'heldoutEvaluationRan': False,
                      'demoUsesThisAdapter': False, 'publishedModel': False, 'baseModel': manifest['baseModel'],
                      'task': manifest['task'], 'contract': manifest['contract'], 'datasetManifestSha256': 'c' * 64, 'trainingSteps': 1,
                      'adapterBeforeSha256': 'd' * 64, 'adapterAfterSha256': 'e' * 64,
                      'artifacts': artifacts, **{key: manifest[key] for key in
                      ['corpusSha256', 'contractSha256', 'defaultPromptSha256', 'runtimePromptSha256']}}
            path = directory / 'training-result.json'
            path.write_text(json.dumps(report))
            self.assertEqual(job.verify_adapter(directory, manifest, 'c' * 64)[1], job.digest(path))
            for field, value in [('datasetManifestSha256', 'f' * 64), ('runtimePromptSha256', 'f' * 64), ('contract', {}),
                                 ('heldoutEvaluationRan', True), ('trainingSteps', 0),
                                 ('adapterAfterSha256', report['adapterBeforeSha256'])]:
                mutated = copy.deepcopy(report)
                mutated[field] = value
                path.write_text(json.dumps(mutated))
                with self.subTest(field=field), self.assertRaises(ValueError):
                    job.verify_adapter(directory, manifest, 'c' * 64)
            path.write_text(json.dumps(report))
            unsafe = directory / 'adapter_model.bin'
            unsafe.write_bytes(b'unsafe')
            with self.assertRaisesRegex(ValueError, 'unmanifested'):
                job.verify_adapter(directory, manifest, 'c' * 64)
            unsafe.unlink()
            (directory / 'adapter_model.safetensors').write_bytes(b'tampered')
            with self.assertRaisesRegex(ValueError, 'fingerprint'):
                job.verify_adapter(directory, manifest, 'c' * 64)


if __name__ == '__main__':
    unittest.main()
