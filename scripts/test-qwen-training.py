"""Verify training boundaries without installing a model or learning stack."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile

spec=importlib.util.spec_from_file_location('qwen_training',Path(__file__).with_name('train-qwen.py'))
job=importlib.util.module_from_spec(spec)
spec.loader.exec_module(job)
bundle=job.ROOT/'training/qwen-evidence-v1'
manifest,splits=job.load_bundle(bundle)
checks=0


def check(value,message):
    global checks
    assert value,message
    checks+=1


check(len(splits['train'])==132 and len(splits['validation'])==34,'Expected authored cases')
for row in [r for split in splits.values() for r in split]:
    check(row['origin']=='original-synthetic','No private/imported records')
    reply=json.loads(row['messages'][2]['content'])
    check(len(reply['noteIds'])<=2,'Bounded source-only target')
    check(set(reply)=={'policy','corpusVersion','requestId','workoutId','noteIds'},'No prescription/text target')
check(any('\\u003c|im_start|' in r['messages'][1]['content'] for r in splits['train']),'Instruction attack encoded as data')
heldout=json.loads((job.ROOT/'docs/evals/qwen-fitness-v1.json').read_text())
training_questions={json.loads(r['messages'][1]['content'].split('\n',1)[1])['question'] for split in splits.values() for r in split}
check(not training_questions & {r['question'] for r in heldout['cases']},'Held-out questions never used as training examples')
check(manifest['provenance']['heldoutEvaluationUsedForTraining'] is False,'Evaluation held separately')


def mutate_failure(mutator,expected):
    global checks
    with tempfile.TemporaryDirectory() as temporary:
        directory=Path(temporary)/'data'
        shutil.copytree(bundle,directory)
        mutator(directory)
        try:
            job.load_bundle(directory)
        except ValueError as error:
            check(expected in str(error),'Reject '+expected)
        else:
            raise AssertionError('Invalid training bundle accepted: '+expected)


def edit_row(directory,fn):
    file=directory/'train.jsonl'
    rows=[json.loads(line) for line in file.read_text().splitlines()]
    fn(rows)
    file.write_text('\n'.join(json.dumps(r) for r in rows)+'\n')
    path=directory/'manifest.json'
    m=json.loads(path.read_text())
    m['files']['train.jsonl']={'bytes':file.stat().st_size,'sha256':job.digest(file)}
    path.write_text(json.dumps(m))


mutate_failure(lambda d:(d/'train.jsonl').write_text('{}\n'),'fingerprint')
mutate_failure(lambda d:edit_row(d,lambda rows:rows[0]['messages'][0].update(content='unreviewed prompt')),'system prompt')
mutate_failure(lambda d:edit_row(d,lambda rows:rows[0].update(origin='private-history')),'Unapproved')
mutate_failure(lambda d:edit_row(d,lambda rows:rows[0].update(scenarioGroup=splits['validation'][0]['scenarioGroup'])),'overlap')


def inject_target(rows,field,value):
    reply=json.loads(rows[0]['messages'][2]['content'])
    reply[field]=value
    rows[0]['messages'][2]['content']=json.dumps(reply)


mutate_failure(lambda d:edit_row(d,lambda rows:inject_target(rows,'advice','Change loads.')),'unsupported advice')
mutate_failure(lambda d:edit_row(d,lambda rows:inject_target(rows,'noteIds',['unknown-note'])),'unknown source')
mutate_failure(lambda d:edit_row(d,lambda rows:inject_target(rows,'requestId','stale-id')),'identifiers')


class TokenizerFixture:
    def apply_chat_template(self,messages,**options):
        check(options=={'tokenize':False,'add_generation_prompt':True,'enable_thinking':False},'Publisher non-thinking mode')
        check([m['role'] for m in messages]==['system','user'],'Assistant target is not in the prompt')
        return 'prefix'

    def encode(self,text,add_special_tokens):
        check(add_special_tokens is False,'No duplicate chat/BOS tokens')
        return [1,2,3] if text=='prefix' else [4,5]


encoded=job.encode_example(TokenizerFixture(),splits['train'][0])
check(encoded['labels']==[-100,-100,-100,4,5],'Only assistant tokens train the adapter')
check(encoded['input_ids']==[1,2,3,4,5] and encoded['attention_mask']==[1]*5,'Complete untruncated token stream')
try:
    job.encode_example(TokenizerFixture(),splits['train'][0],context_tokens=4,output_tokens=2)
except ValueError:
    checks+=1
else:
    raise AssertionError('Overlong input silently truncated')
print(f'PASS original Qwen dataset/provenance/separation/targets/fingerprints: {checks} assertions. No training or model-accuracy claim from these checks.')
