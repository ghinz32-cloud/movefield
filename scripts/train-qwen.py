#!/usr/bin/env python3
"""Local LoRA experiment for original evidence-selection examples, never coaching.

No account, hosted inference, private records, or automatic model publication.
The trained adapter needs independent evaluation and MLC compilation before use.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import resource
import time

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def load_bundle(directory, canonical_root=ROOT):
    directory = Path(directory)
    manifest = json.loads((directory / 'manifest.json').read_text())
    if manifest['version'] != 'movefield-qwen-sft-v1':
        raise ValueError('Unknown training format.')
    for name, record in manifest['files'].items():
        if name not in {'train.jsonl', 'validation.jsonl', 'default-prompt.txt'}:
            raise ValueError('Unexpected training file.')
        file = directory / name
        if file.stat().st_size != record['bytes'] or digest(file) != record['sha256']:
            raise ValueError('Training file fingerprint mismatch: ' + name)
    for key, file in [('corpusSha256', 'lib/fitness-reference.json'), ('contractSha256', 'lib/fitness-grounding.ts')]:
        if digest(canonical_root / file) != manifest[key]:
            raise ValueError('Stale corpus or task contract.')
    prompt = (directory / 'default-prompt.txt').read_text().rstrip('\n')
    if hashlib.sha256(prompt.encode()).hexdigest() != manifest['defaultPromptSha256']:
        raise ValueError('Default prompt changed.')
    splits = {}
    for split, count in [('train', 'trainCases'), ('validation', 'validationCases')]:
        rows = [json.loads(line) for line in (directory / (split + '.jsonl')).read_text().splitlines()]
        if len(rows) != manifest[count] or len({row['id'] for row in rows}) != len(rows):
            raise ValueError('Invalid split count/IDs.')
        for row in rows:
            messages = row['messages']
            if row['origin'] != 'original-synthetic' or [m['role'] for m in messages] != ['system', 'user', 'assistant'] or messages[0]['content'] != prompt:
                raise ValueError('Unapproved example or system prompt.')
            data = json.loads(messages[1]['content'].split('\n', 1)[1])
            reply = json.loads(messages[2]['content'])
            if set(reply) != {'policy', 'corpusVersion', 'requestId', 'workoutId', 'noteIds'}:
                raise ValueError('Target contains unsupported advice or fields.')
            for key in ['policy', 'corpusVersion', 'requestId', 'workoutId']:
                if reply[key] != data[key]:
                    raise ValueError('Target identifiers do not match the request.')
            ids = reply['noteIds']
            if len(ids) > 2 or len(set(ids)) != len(ids) or any(id not in {n['id'] for n in data['notes']} for id in ids):
                raise ValueError('Target selects an unknown source.')
        splits[split] = rows
    for field in ['id', 'scenarioGroup']:
        if {r[field] for r in splits['train']} & {r[field] for r in splits['validation']}:
            raise ValueError('Training/validation overlap: ' + field)
    train_questions = {json.loads(r['messages'][1]['content'].split('\n', 1)[1])['question'] for r in splits['train']}
    validation_questions = {json.loads(r['messages'][1]['content'].split('\n', 1)[1])['question'] for r in splits['validation']}
    if train_questions & validation_questions:
        raise ValueError('Question leakage between splits.')
    return manifest, splits


def encode_example(tokenizer, row, context_tokens=2048, output_tokens=256):
    # Use the publisher's non-thinking template, then supervise ONLY the JSON
    # assistant continuation. Neither prompt tokens nor padding are loss targets.
    prompt = tokenizer.apply_chat_template(row['messages'][:2], tokenize=False, add_generation_prompt=True, enable_thinking=False)
    prefix = tokenizer.encode(prompt, add_special_tokens=False)
    target = tokenizer.encode(row['messages'][2]['content'] + '<|im_end|>\n', add_special_tokens=False)
    if not prefix or len(prefix) + output_tokens > context_tokens or not target or len(target) > output_tokens:
        raise ValueError('Token budget exceeded; no truncation permitted: ' + row['id'])
    return {'input_ids': prefix + target, 'attention_mask': [1] * (len(prefix) + len(target)),
            'labels': [-100] * len(prefix) + target, 'example_id': row['id'], 'prompt_tokens': len(prefix), 'output_tokens': len(target)}


def parameter_fingerprint(model):
    h = hashlib.sha256()
    for name, value in model.named_parameters():
        if value.requires_grad:
            h.update(name.encode())
            h.update(value.detach().float().cpu().contiguous().numpy().tobytes())
    return h.hexdigest()


def train(args, manifest, splits):
    os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
    os.environ.setdefault('HF_HUB_DISABLE_XET', '1')
    os.environ.setdefault('TOKENIZERS_PARALLELISM', 'false')
    import torch
    import transformers
    import peft
    from huggingface_hub import hf_hub_download
    from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments, set_seed
    from peft import LoraConfig, get_peft_model
    if not torch.cuda.is_available() and not args.cpu:
        raise RuntimeError('No CUDA GPU. Use --cpu deliberately for a bounded CPU experiment.')
    if args.output.exists() and any(args.output.iterdir()):
        raise ValueError('Output directory is not empty. Keep previous experiments intact.')
    started = time.monotonic()
    torch.set_num_threads(args.threads)
    set_seed(42)
    base = manifest['baseModel']
    weights = hf_hub_download(base['repository'], filename=base['weightsFile'], revision=base['revision'])
    if Path(weights).stat().st_size != base['weightsBytes'] or digest(weights) != base['weightsSha256']:
        raise ValueError('Base model weights failed verification.')
    tokenizer = AutoTokenizer.from_pretrained(base['repository'], revision=base['revision'], trust_remote_code=False)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id
    encoded = {split: [encode_example(tokenizer, row) for row in rows] for split, rows in splits.items()}
    if args.pilot_steps:
        # A pilot has an explicit small validation subset; its loss is never a
        # held-out accuracy result or a substitute for the full qualification.
        encoded['validation'] = encoded['validation'][:4]
    cuda = torch.cuda.is_available() and not args.cpu
    bf16 = cuda and torch.cuda.is_bf16_supported()
    dtype = torch.bfloat16 if bf16 else torch.float16 if cuda else torch.float32
    model = AutoModelForCausalLM.from_pretrained(base['repository'], revision=base['revision'], trust_remote_code=False, use_safetensors=True, dtype=dtype, attn_implementation='sdpa')
    model.config.use_cache = False
    model = get_peft_model(model, LoraConfig(task_type='CAUSAL_LM', r=8, lora_alpha=16, lora_dropout=0.05, target_modules=['q_proj', 'v_proj'], bias='none'))
    model.gradient_checkpointing_enable(gradient_checkpointing_kwargs={'use_reentrant': False})
    model.enable_input_require_grads()
    before = parameter_fingerprint(model)

    def collate(rows):
        width = max(len(r['input_ids']) for r in rows)
        return {'input_ids': torch.tensor([r['input_ids'] + [tokenizer.pad_token_id] * (width - len(r['input_ids'])) for r in rows]),
                'attention_mask': torch.tensor([r['attention_mask'] + [0] * (width - len(r['attention_mask'])) for r in rows]),
                'labels': torch.tensor([r['labels'] + [-100] * (width - len(r['labels'])) for r in rows]),
                'example_id': [r['example_id'] for r in rows]}

    class RecordedTrainer(Trainer):
        used_examples = []

        def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
            ids = inputs.pop('example_id')
            if model.training:
                self.used_examples.extend(ids)
            return super().compute_loss(model, inputs, return_outputs=return_outputs, **kwargs)

    training_args = TrainingArguments(output_dir=str(args.output), learning_rate=2e-4, per_device_train_batch_size=1,
        per_device_eval_batch_size=1, gradient_accumulation_steps=1 if args.pilot_steps else 4,
        num_train_epochs=args.epochs, max_steps=args.pilot_steps or -1, weight_decay=0.01,
        logging_steps=1, save_strategy='no', eval_strategy='no', report_to=[], push_to_hub=False,
        use_cpu=not cuda, bf16=bf16, fp16=cuda and not bf16, seed=42, data_seed=42,
        dataloader_num_workers=0, dataloader_pin_memory=False, remove_unused_columns=False,
        gradient_checkpointing=True, gradient_checkpointing_kwargs={'use_reentrant':False})
    trainer = RecordedTrainer(model=model, args=training_args, train_dataset=encoded['train'], eval_dataset=encoded['validation'], data_collator=collate)
    baseline = trainer.evaluate()
    result = trainer.train()
    evaluation = trainer.evaluate()
    after = parameter_fingerprint(model)
    if trainer.state.global_step < 1 or before == after:
        raise RuntimeError('No verified adapter update occurred.')
    model.save_pretrained(args.output, safe_serialization=True)
    tokenizer.save_pretrained(args.output)
    artifacts = {p.name: {'bytes':p.stat().st_size, 'sha256':digest(p)} for p in args.output.iterdir() if p.is_file()}
    report = {'schema':1, 'status':'trained-pilot' if args.pilot_steps else 'trained-experiment', 'qualified':False,
        'task':manifest['task'], 'baseModel':base, 'datasetManifestSha256':digest(args.dataset / 'manifest.json'),
        'corpusSha256':manifest['corpusSha256'], 'contractSha256':manifest['contractSha256'], 'defaultPromptSha256':manifest['defaultPromptSha256'],
        'trainingSteps':trainer.state.global_step, 'usedExamples':trainer.used_examples, 'uniqueUsedExamples':len(set(trainer.used_examples)),
        'trainableParameters':sum(p.numel() for p in model.parameters() if p.requires_grad), 'adapterBeforeSha256':before, 'adapterAfterSha256':after,
        'baselineValidation':baseline, 'postTrainingValidation':evaluation, 'trainMetrics':result.metrics,
        'validationCases':len(encoded['validation']), 'validationIsHeldoutQualification':False,
        'maxPromptTokens':max(r['prompt_tokens'] for rows in encoded.values() for r in rows),
        'maxTargetTokens':max(r['output_tokens'] for rows in encoded.values() for r in rows),
        'elapsedSeconds':round(time.monotonic()-started,2), 'peakProcessRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,
        'environment':{'torch':torch.__version__,'transformers':transformers.__version__,'peft':peft.__version__,'device':'cuda' if cuda else 'cpu','threads':args.threads},
        'artifacts':artifacts,'heldoutEvaluationRan':False,'demoUsesThisAdapter':False,'publishedModel':False,
        'limits':'Small synthetic source-selection experiment. Loss is not accuracy, safety qualification or exercise-science training. Merge and compile a separately pinned MLC artifact only after independent evaluation.'}
    (args.output / 'training-result.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['status','trainingSteps','uniqueUsedExamples','elapsedSeconds','qualified','demoUsesThisAdapter']}), flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dataset',type=Path,default=ROOT/'training/qwen-evidence-v1')
    parser.add_argument('--output',type=Path,default=ROOT/'.sites-runtime/qwen-adapter')
    parser.add_argument('--preflight',action='store_true')
    parser.add_argument('--cpu',action='store_true')
    parser.add_argument('--pilot-steps',type=int,default=0)
    parser.add_argument('--epochs',type=int,default=3)
    parser.add_argument('--threads',type=int,default=4)
    args=parser.parse_args()
    if args.pilot_steps<0 or args.pilot_steps>64 or args.epochs<1 or args.epochs>10 or args.threads<1 or args.threads>32:
        parser.error('Invalid training bounds.')
    manifest,splits=load_bundle(args.dataset)
    if args.preflight:
        dependencies={p:importlib.util.find_spec(p) is not None for p in ['torch','transformers','peft','accelerate','safetensors']}
        print(json.dumps({'status':'preflight-only','cases':{s:len(r) for s,r in splits.items()},'dependencies':dependencies,'trained':False,'downloadedWeights':False}))
        return
    train(args,manifest,splits)


if __name__=='__main__':
    main()
