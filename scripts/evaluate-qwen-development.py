#!/usr/bin/env python3
"""Compare cached base and adapter on original development examples, CPU only.

This deliberately does not load the locked held-out evaluation. Results are
synthetic development task measurements, never browser/device qualification.
No downloads, training, adapter writes or model publication occur here.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import platform
try:
    import resource
except ImportError:
    resource = None
import statistics
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CONTEXT_TOKENS = 1024
OUTPUT_TOKENS = 192
PINNED_BASE = {
    'repository': 'Qwen/Qwen3-0.6B',
    'revision': 'c1899de289a04d12100db370d81485cdf75e47ca',
    'weightsFile': 'model.safetensors',
    'weightsBytes': 1503300328,
    'weightsSha256': 'f47f71177f32bcd101b7573ec9171e6a57f4f4d31148d38e382306f42996874b',
}


def digest(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def unique_object(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError('Duplicate JSON key: ' + key)
        value[key] = item
    return value


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'), object_pairs_hook=unique_object)


def load_training_module():
    spec = importlib.util.spec_from_file_location('movefield_qwen_training', ROOT / 'scripts/train-qwen.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify_adapter(directory, manifest, dataset_manifest_sha256):
    directory = Path(directory)
    report_path = directory / 'training-result.json'
    if report_path.is_symlink() or not report_path.is_file() or report_path.stat().st_size > 1024 * 1024:
        raise ValueError('Missing or invalid adapter training-result.json.')
    report = read_json(report_path)
    if (report.get('schema') != 1 or report.get('status') not in {'trained-pilot', 'trained-experiment'} or
            report.get('qualified') is not False or report.get('heldoutEvaluationRan') is not False or
            report.get('demoUsesThisAdapter') is not False or report.get('publishedModel') is not False):
        raise ValueError('Expected an unqualified local training result.')
    if report.get('baseModel') != manifest['baseModel'] or report.get('task') != manifest['task']:
        raise ValueError('Adapter base model or task differs from the dataset.')
    if report.get('datasetManifestSha256') != dataset_manifest_sha256:
        raise ValueError('Adapter was trained against a different dataset manifest.')
    if report.get('contract') != manifest['contract']:
        raise ValueError('Adapter token/task contract differs from the dataset.')
    for field in ['corpusSha256', 'contractSha256', 'defaultPromptSha256', 'runtimePromptSha256']:
        if field in manifest and report.get(field) != manifest[field]:
            raise ValueError('Adapter provenance mismatch: ' + field)
    steps = report.get('trainingSteps')
    before, after = report.get('adapterBeforeSha256'), report.get('adapterAfterSha256')
    valid_hash = lambda value: isinstance(value, str) and len(value) == 64 and all(c in '0123456789abcdef' for c in value)
    if type(steps) is not int or steps < 1 or not valid_hash(before) or not valid_hash(after) or before == after:
        raise ValueError('No verified adapter parameter update.')
    artifacts = report.get('artifacts')
    if not isinstance(artifacts, dict) or not {'adapter_config.json', 'adapter_model.safetensors'} <= set(artifacts):
        raise ValueError('Adapter manifest lacks safe adapter artifacts.')
    if set(p.name for p in directory.iterdir()) != set(artifacts) | {'training-result.json'}:
        raise ValueError('Adapter directory has unmanifested artifacts.')
    for name, record in artifacts.items():
        if (not isinstance(name, str) or Path(name).name != name or name in {'.', '..', 'training-result.json'} or
                name.endswith(('.bin', '.pt', '.pth', '.pkl', '.pickle')) or not isinstance(record, dict)):
            raise ValueError('Unsafe adapter artifact: ' + str(name))
        file = directory / name
        if (file.is_symlink() or not file.is_file() or type(record.get('bytes')) is not int or
                record['bytes'] < 1 or not valid_hash(record.get('sha256')) or
                file.stat().st_size != record['bytes'] or digest(file) != record['sha256']):
            raise ValueError('Adapter artifact fingerprint mismatch: ' + name)
    config = read_json(directory / 'adapter_config.json')
    if (config.get('base_model_name_or_path') != manifest['baseModel']['repository'] or
            config.get('revision') != manifest['baseModel']['revision'] or
            config.get('peft_type') != 'LORA' or config.get('task_type') != 'CAUSAL_LM'):
        raise ValueError('Unsupported adapter configuration.')
    return report, digest(report_path)


def grade_reply(row, reply, completed=True):
    data = json.loads(row['messages'][1]['content'].split('\n', 1)[1])
    expected = json.loads(row['messages'][2]['content'])
    value, error = None, None
    try:
        value = json.loads(reply.strip(), object_pairs_hook=unique_object)
    except (ValueError, TypeError) as failure:
        error = str(failure)
    keys = {'policy', 'corpusVersion', 'requestId', 'workoutId', 'noteIds'}
    schema = (isinstance(value, dict) and set(value) == keys and
              value.get('policy') == data['policy'] and value.get('corpusVersion') == data['corpusVersion'] and
              isinstance(value.get('requestId'), str) and 8 <= len(value['requestId']) <= 100 and
              isinstance(value.get('workoutId'), str) and 1 <= len(value['workoutId']) <= 150 and
              isinstance(value.get('noteIds'), list) and len(value['noteIds']) <= 2 and
              all(isinstance(item, str) and 1 <= len(item) <= 100 for item in value['noteIds']))
    identifiers = isinstance(value, dict) and all(value.get(key) == data[key] for key in ['policy', 'corpusVersion', 'requestId', 'workoutId'])
    notes = bool(schema and len(set(value['noteIds'])) == len(value['noteIds']) and
                 set(value['noteIds']) <= {note['id'] for note in data['notes']})
    # Mirror the deployed strict reply length limit, including UTF-16 units.
    length_ok = len(reply.encode('utf-16-le')) // 2 <= 2048
    accepted = bool(completed and schema and identifiers and notes and length_ok)
    correct = bool(accepted and set(value['noteIds']) == set(expected['noteIds']))
    return {'expected': expected, 'parsedReply': value, 'parseError': error,
            'schemaCorrect': bool(schema), 'identifiersCorrect': bool(identifiers),
            'suppliedNoteIdsCorrect': notes, 'replyLengthCorrect': length_ok,
            'completed': bool(completed), 'acceptedByTaskContract': accepted, 'taskCorrect': correct}


def select_cases(rows, maximum):
    # Cover the four authored label forms before repeating a topic. This is
    # development sampling, not a random population accuracy estimate.
    groups = {kind: {} for kind in ['single', 'pair', 'distractor', 'empty']}
    for row in rows:
        data = json.loads(row['messages'][1]['content'].split('\n', 1)[1])
        ids = json.loads(row['messages'][2]['content'])['noteIds']
        kind = 'empty' if not ids else 'pair' if len(ids) == 2 else 'distractor' if len(data['notes']) > 1 else 'single'
        key = tuple(sorted(ids)) if ids else row['scenarioGroup']
        groups[kind].setdefault(key, []).append(row)
    buckets = {}
    for kind, topics in groups.items():
        buckets[kind] = [topic[index] for index in range(max([len(topic) for topic in topics.values()], default=0))
                         for topic in topics.values() if index < len(topic)]
    selected = [bucket[index] for index in range(max([len(bucket) for bucket in buckets.values()], default=0))
                for bucket in buckets.values() if index < len(bucket)]
    return selected[:maximum]


def summarize(cases):
    latencies = [case['generationSeconds'] for case in cases]
    count = len(cases)
    counts = {key: sum(case[key] for case in cases) for key in
              ['schemaCorrect', 'identifiersCorrect', 'suppliedNoteIdsCorrect', 'acceptedByTaskContract', 'taskCorrect']}
    return {'cases': count, 'counts': counts, 'taskAccuracy': counts['taskCorrect'] / count,
            'meanGenerationSeconds': statistics.mean(latencies), 'medianGenerationSeconds': statistics.median(latencies),
            'maximumGenerationSeconds': max(latencies), 'totalGenerationSeconds': sum(latencies),
            'generatedTokens': sum(case['generatedTokens'] for case in cases),
            'incompleteCases': sum(not case['completed'] for case in cases),
            'maximumPromptTokens': max(case['promptTokens'] for case in cases)}


def evaluate(args):
    # Force offline mode even if the shell has configured online hub access.
    for name in ['HF_HUB_OFFLINE', 'TRANSFORMERS_OFFLINE', 'HF_HUB_DISABLE_TELEMETRY', 'HF_HUB_DISABLE_XET']:
        os.environ[name] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'
    job = load_training_module()
    manifest, splits = job.load_bundle(args.dataset)
    if any(manifest['baseModel'].get(key) != value for key, value in PINNED_BASE.items()):
        raise ValueError('Development evaluator accepts only the pinned Qwen3-0.6B base.')
    if (manifest['contract']['contextTokens'] != CONTEXT_TOKENS or
            manifest['contract']['outputTokens'] != OUTPUT_TOKENS or manifest['contract']['thinking'] is not False):
        raise ValueError('Dataset contract differs from the deployed context/output limits.')
    dataset_hash = digest(args.dataset / 'manifest.json')
    adapter_report, adapter_report_hash = verify_adapter(args.adapter, manifest, dataset_hash)
    output = args.output.resolve()
    protected = [args.dataset.resolve(), args.adapter.resolve(), (ROOT / 'docs/evals').resolve()]
    if any(output == path or path in output.parents for path in protected):
        raise ValueError('Evaluation output must be outside dataset, adapter and locked evaluation directories.')
    if output.exists():
        raise ValueError('Output already exists; preserve previous evaluations.')
    started = time.monotonic()
    import torch
    import transformers
    import peft
    from huggingface_hub import hf_hub_download
    from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig, set_seed
    from peft import PeftModel
    torch.set_num_threads(args.threads)
    torch.set_num_interop_threads(min(args.threads, 4))
    torch.use_deterministic_algorithms(True)
    set_seed(0)
    base = manifest['baseModel']
    weights = Path(hf_hub_download(base['repository'], filename=base['weightsFile'], revision=base['revision'], local_files_only=True))
    if weights.stat().st_size != base['weightsBytes'] or digest(weights) != base['weightsSha256']:
        raise ValueError('Cached base weights failed fingerprint verification.')
    # Use the verified immutable snapshot path, never an unpinned repository.
    snapshot = weights.parent
    base_files = adapter_report.get('baseFilesSha256')
    if not isinstance(base_files, dict) or set(base_files) != {'config.json', 'tokenizer.json', 'tokenizer_config.json'}:
        raise ValueError('Adapter report lacks pinned base metadata fingerprints.')
    for name, fingerprint in base_files.items():
        if digest(snapshot / name) != fingerprint:
            raise ValueError('Cached base metadata differs from training: ' + name)
    tokenizer = AutoTokenizer.from_pretrained(snapshot, local_files_only=True, trust_remote_code=False)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id
    stop_id = tokenizer.convert_tokens_to_ids('<|im_end|>')
    if type(stop_id) is not int or stop_id == tokenizer.unk_token_id:
        raise ValueError('Pinned tokenizer lacks the deployed ChatML stop token.')
    selected = {split: select_cases(rows, args.max_cases) for split, rows in splits.items()}
    encoded = {split: [(row, job.encode_example(tokenizer, row, context_tokens=CONTEXT_TOKENS, output_tokens=OUTPUT_TOKENS))
                       for row in rows] for split, rows in selected.items()}
    load_started = time.monotonic()
    dtype = torch.bfloat16 if args.cpu_dtype == 'bfloat16' else torch.float32
    model = AutoModelForCausalLM.from_pretrained(snapshot, local_files_only=True, trust_remote_code=False,
                                               use_safetensors=True, dtype=dtype, attn_implementation='sdpa')
    model.to('cpu')
    model.eval()
    base_load_seconds = time.monotonic() - load_started
    generation = GenerationConfig(max_new_tokens=OUTPUT_TOKENS, do_sample=False, num_beams=1,
                                  eos_token_id=stop_id, pad_token_id=tokenizer.pad_token_id, use_cache=True)
    results = {}
    for name in ['base', 'adapter']:
        if name == 'adapter':
            _, current_hash = verify_adapter(args.adapter, manifest, dataset_hash)
            if current_hash != adapter_report_hash:
                raise ValueError('Adapter training report changed during evaluation.')
            load_started = time.monotonic()
            model = PeftModel.from_pretrained(model, args.adapter, is_trainable=False, local_files_only=True,
                                             use_safetensors=True, trust_remote_code=False, autocast_adapter_dtype=False)
            model.to('cpu')
            model.eval()
            adapter_load_seconds = time.monotonic() - load_started
        results[name] = {}
        for split, rows in encoded.items():
            cases = []
            for row, item in rows:
                prompt_ids = item['input_ids'][:item['prompt_tokens']]
                prompt = job.build_prompt(row)
                if tokenizer.encode(prompt, add_special_tokens=False) != prompt_ids:
                    raise ValueError('Generation prompt differs from the training/deployed prompt.')
                ids = torch.tensor([prompt_ids], dtype=torch.long, device='cpu')
                generation_started = time.monotonic()
                with torch.inference_mode():
                    generated = model.generate(input_ids=ids, attention_mask=torch.ones_like(ids), generation_config=generation)
                generation_seconds = time.monotonic() - generation_started
                output_ids = generated[0, len(prompt_ids):].tolist()
                completed = bool(output_ids and output_ids[-1] == stop_id)
                # Remove only the actual terminal stop token. Other special
                # tokens remain visible and fail strict JSON parsing.
                reply_ids = output_ids[:-1] if completed else output_ids
                reply = tokenizer.decode(reply_ids, skip_special_tokens=False, clean_up_tokenization_spaces=False)
                case = {'id': row['id'], 'scenarioGroup': row['scenarioGroup'],
                        'promptSha256': hashlib.sha256(prompt.encode()).hexdigest(), 'promptTokens': len(prompt_ids),
                        'generatedTokens': len(output_ids), 'outputTokenIds': output_ids,
                        'reply': reply, 'generationSeconds': generation_seconds,
                        'reachedTokenLimit': len(output_ids) >= OUTPUT_TOKENS,
                        **grade_reply(row, reply, completed)}
                cases.append(case)
                print(json.dumps({'model': name, 'split': split, 'id': row['id'], 'taskCorrect': case['taskCorrect'],
                                  'generationSeconds': round(generation_seconds, 3)}), flush=True)
            results[name][split] = {'summary': summarize(cases), 'cases': cases}
    # Detect changed provenance rather than label a mixed run reproducible.
    job.load_bundle(args.dataset)
    if digest(args.dataset / 'manifest.json') != dataset_hash or verify_adapter(args.adapter, manifest, dataset_hash)[1] != adapter_report_hash:
        raise ValueError('Dataset or adapter changed during evaluation.')
    report = {'schema': 1, 'status': 'complete-development-evaluation', 'qualified': False,
              'task': manifest['task'], 'baseModel': base, 'datasetManifestSha256': dataset_hash,
              'adapterTrainingResultSha256': adapter_report_hash, 'adapterArtifacts': adapter_report['artifacts'],
              'baseFilesSha256': base_files, 'adapterTrainingEnvironment': adapter_report['environment'],
              'toolingSha256': {'evaluator': digest(Path(__file__)), 'trainer': digest(ROOT / 'scripts/train-qwen.py')},
              'corpusSha256': manifest['corpusSha256'], 'contractSha256': manifest['contractSha256'],
              'defaultPromptSha256': manifest['defaultPromptSha256'], 'runtimePromptSha256': manifest.get('runtimePromptSha256'),
              'casesPerSplitLimit': args.max_cases, 'availableCases': {split: len(rows) for split, rows in splits.items()},
              'selectedIds': {split: [row['id'] for row in rows] for split, rows in selected.items()},
              'selection': 'Deterministic round-robin of single, pair, distractor and empty labels, diversified by authored target topics; N per original development split. No locked held-out cases or random population accuracy estimate.',
              'generation': {'contextTokens': CONTEXT_TOKENS, 'maxNewTokens': OUTPUT_TOKENS, 'thinking': False,
                             'doSample': False, 'numBeams': 1, 'seed': 0, 'stopToken': '<|im_end|>', 'stopTokenId': stop_id,
                             'truncate': False, 'dtype': str(dtype), 'offline': True, 'trustRemoteCode': False, 'safetensorsOnly': True},
              'baseLoadSeconds': base_load_seconds, 'adapterLoadSeconds': adapter_load_seconds,
              'elapsedSeconds': time.monotonic() - started,
              'peakProcessRssBytes': (resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == 'darwin' else 1024)) if resource else None,
              'environment': {'python': platform.python_version(), 'torch': torch.__version__, 'transformers': transformers.__version__,
                              'peft': peft.__version__, 'device': 'cpu', 'machine': platform.machine(),
                              'threads': torch.get_num_threads(), 'interopThreads': torch.get_num_interop_threads(), 'dtype': str(dtype)},
              'results': results, 'heldoutEvaluationRan': False, 'deviceQualificationRan': False,
              'demoUsesThisAdapter': False, 'publishedModel': False,
              'limits': 'Original synthetic development examples, including training examples. Task accuracy is agreement with authored note-selection labels, not exercise-science knowledge, coaching safety or independent generalization. CPU greedy timings at the reported dtype include prompt processing and generation with a warm model; they do not measure cold browser/WebGPU, MLC quantization or Android inference. No model tier is qualified or enabled.'}
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status': report['status'], 'qualified': False, 'output': str(output),
                      'accuracy': {name: {split: run['summary']['taskAccuracy'] for split, run in runs.items()} for name, runs in results.items()}}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dataset', type=Path, default=ROOT / 'training/qwen-evidence-v1')
    parser.add_argument('--adapter', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--max-cases', type=int, default=34, help='Up to N representative cases per original split, 1 through 34.')
    parser.add_argument('--threads', type=int, default=4)
    parser.add_argument('--cpu-dtype', choices=['float32', 'bfloat16'], default='float32',
                        help='Use bfloat16 deliberately on supporting CPUs to reduce memory; recorded in results.')
    args = parser.parse_args()
    if not 1 <= args.max_cases <= 34 or not 1 <= args.threads <= 32:
        parser.error('Expected --max-cases 1–34 and --threads 1–32.')
    evaluate(args)


if __name__ == '__main__':
    main()
