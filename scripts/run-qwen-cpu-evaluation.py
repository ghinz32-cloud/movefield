"""Actual independent held-out runs. Never used as training examples."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import time

os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY','1')
os.environ.setdefault('HF_HUB_DISABLE_XET','1')
os.environ.setdefault('TOKENIZERS_PARALLELISM','false')
spec=importlib.util.spec_from_file_location('training_job',Path(__file__).with_name('train-qwen.py'))
job=importlib.util.module_from_spec(spec)
spec.loader.exec_module(job)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('prompts',type=Path)
parser.add_argument('adapter',type=Path)
parser.add_argument('output',type=Path)
args=parser.parse_args()
manifest,_=job.load_bundle(job.ROOT/'training/qwen-evidence-v1')
training=json.loads((args.adapter/'training-result.json').read_text())
adapter_sha=job.digest(args.adapter/'adapter_model.safetensors')
if adapter_sha!=training['artifacts']['adapter_model.safetensors']['sha256'] or training['datasetManifestSha256']!=job.digest(job.ROOT/'training/qwen-evidence-v1/manifest.json'):
    raise ValueError('Stale or changed adapter.')
prepared=json.loads(args.prompts.read_text())
import torch
import transformers
import peft
from transformers import AutoModelForCausalLM,AutoTokenizer
from peft import PeftModel
torch.set_num_threads(4)
started=time.monotonic()
base=manifest['baseModel']
tokenizer=AutoTokenizer.from_pretrained(args.adapter,local_files_only=True,trust_remote_code=False)
model=AutoModelForCausalLM.from_pretrained(base['repository'],revision=base['revision'],local_files_only=True,trust_remote_code=False,use_safetensors=True,dtype=torch.float32,attn_implementation='sdpa')
model=PeftModel.from_pretrained(model,args.adapter,local_files_only=True)
model.eval()
raw={k:prepared[k] for k in ['schema','evaluationVersion','fingerprints','temperature','outputTokens','contextTokens']}
raw.update(baseModel=base,adapterSha256=adapter_sha,environment={'device':'cpu-float32','torch':torch.__version__,'transformers':transformers.__version__,'peft':peft.__version__,'threads':4},results=[])
for index,row in enumerate(prepared['cases']):
    if row['prompt'] is None:
        record={'caseId':row['caseId'],'cycle':row['cycle'],'invoked':False,'reply':None,'inputTokens':0,'outputTokens':0,'generationMs':0}
    else:
        inputs=tokenizer(row['prompt'],add_special_tokens=False,return_tensors='pt')
        length=inputs['input_ids'].shape[1]
        if length+prepared['outputTokens']>prepared['contextTokens']:
            raise ValueError('Context overflow.')
        began=time.monotonic()
        # generate() gets a fresh input/cache on every run; no prior dialogue.
        with torch.inference_mode():
            output=model.generate(**inputs,max_new_tokens=prepared['outputTokens'],do_sample=False,use_cache=True,pad_token_id=tokenizer.pad_token_id,eos_token_id=tokenizer.eos_token_id)
        completion=output[0,length:]
        record={'caseId':row['caseId'],'cycle':row['cycle'],'invoked':True,'reply':tokenizer.decode(completion,skip_special_tokens=True),'inputTokens':length,'outputTokens':len(completion),'generationMs':round((time.monotonic()-began)*1000,2)}
    raw['results'].append(record)
    raw['elapsedSeconds']=round(time.monotonic()-started,2)
    args.output.write_text(json.dumps(raw,indent=2)+'\n')
    print(json.dumps({'completed':index+1,'total':len(prepared['cases']),'caseId':row['caseId'],'cycle':row['cycle'],'invoked':record['invoked'],'generationMs':record['generationMs']}),flush=True)
