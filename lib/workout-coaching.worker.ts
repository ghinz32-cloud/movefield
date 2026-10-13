import {MLCEngine,type ChatOptions} from '@mlc-ai/web-llm';
import {Tokenizer} from '@mlc-ai/web-tokenizers';
import {createBrowserQwenStore} from './browser-qwen-cache';
import {createQwenDownloader,QwenDownloadError} from './qwen-download';
import {createQwenRuntimeCache} from './qwen-runtime-cache';
import {COACHING_POLICY,WORKOUT_COACHING_PROMPT,serializeWorkoutCoaching,parseWorkoutCoachingReply} from './workout-coaching';
import {workoutCoachingModel,workoutCoachingPromptFits,WORKOUT_COACHING_MAX_FILE_BYTES,
  WORKOUT_COACHING_CONTEXT_TOKENS,WORKOUT_COACHING_OUTPUT_TOKENS} from './workout-coaching-models';
import {workoutCoachingData,workoutCoachingPromptSegments,workoutCoachingJsonSchema,workoutCoachingJsonReply,
  workoutCoachingWorkerRequest,type WorkoutCoachingWorkerReply} from './workout-coaching-runtime-contract';

type WorkerScope={isSecureContext:boolean;indexedDB:IDBFactory;navigator:Pick<Navigator,'locks'|'storage'>&
  {gpu?:{requestAdapter():Promise<{features:{has(feature:string):boolean}}|null>}};
  onmessage:((event:MessageEvent<unknown>)=>Promise<void>)|null;postMessage:(value:WorkoutCoachingWorkerReply)=>void;close:()=>void};
const scope=globalThis as unknown as WorkerScope;
let started=false;
scope.onmessage=async event=>{
  if(started)return;
  const request=workoutCoachingWorkerRequest(event.data);
  if(!request)return;
  started=true;
  const send=(value:Omit<WorkoutCoachingWorkerReply,'policy'|'id'|'modelId'|'contextDigest'>)=>scope.postMessage({
    policy:COACHING_POLICY,id:request.id,modelId:request.modelId,contextDigest:request.contextDigest,...value});
  const owned:{engine:MLCEngine|null;tokenizer:Tokenizer|null}={engine:null,tokenizer:null};
  try{
    const model=workoutCoachingModel(request.modelId);
    if(!model)throw new QwenDownloadError('manifest','Unlisted coaching model.');
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serializeWorkoutCoaching(request.context)))),x=>x.toString(16).padStart(2,'0')).join('');
    if(digest!==request.contextDigest)throw Error('contract');
    if(!scope.isSecureContext||!scope.navigator.gpu)throw new QwenDownloadError('unsupported','WebGPU unavailable.');
    const adapter=await scope.navigator.gpu.requestAdapter();
    if(!adapter?.features.has('shader-f16'))throw new QwenDownloadError('unsupported','shader-f16 unavailable.');
    const store=createBrowserQwenStore({indexedDB:scope.indexedDB,keyRange:IDBKeyRange,locks:scope.navigator.locks,
      random:length=>crypto.getRandomValues(new Uint8Array(length)),estimate:()=>scope.navigator.storage.estimate()});
    const client=createQwenDownloader({models:[model],store,fetchAsset:async()=>{throw new QwenDownloadError('network','Runtime network refused.');}});
    const signal=new AbortController().signal,offer=client.offer(model.id);
    // Refuse every secondary network transport and child worker before loading.
    const refused=class{constructor(){throw new QwenDownloadError('network','Runtime transport refused.');}};
    for(const name of ['XMLHttpRequest','WebSocket','EventSource','Worker','SharedWorker'])Object.defineProperty(globalThis,name,{value:refused,configurable:false,writable:false});
    await client.withCachedModel(model.id,signal,async open=>{
      const local=createQwenRuntimeCache(offer,open,{maxFileBytes:WORKOUT_COACHING_MAX_FILE_BYTES});
      Object.defineProperty(globalThis,'fetch',{value:local.fetch,configurable:false,writable:false});
      Object.defineProperty(globalThis,'caches',{value:local.caches,configurable:false,writable:false});
      const config=JSON.parse(new TextDecoder().decode(await local.file('mlc-chat-config.json')));
      const stops:unknown=config.conv_template?.stop_token_ids;
      if(!Array.isArray(stops)||!stops.length||stops.length>8||stops.some(x=>!Number.isSafeInteger(x)||x<0||x>=config.vocab_size))throw Error('contract');
      // A fixed ChatML template makes chat-API schema decoding and tokenizer
      // preflight agree exactly, including its disabled-thinking reply header.
      const chat:ChatOptions={context_window_size:WORKOUT_COACHING_CONTEXT_TOKENS,max_history_size:1,sliding_window_size:-1,
        conv_config:{},conv_template:{system_template:'<|im_start|>system\n{system_message}<|im_end|>\n',system_message:'',
          roles:{user:'<|im_start|>user',assistant:'<|im_start|>assistant',tool:'<|im_start|>tool'},
          seps:['<|im_end|>\n'],role_content_sep:'\n',role_empty_sep:'\n',stop_str:['<|im_end|>'],stop_token_ids:stops as number[]}};
      owned.tokenizer=await Tokenizer.fromJSON(await local.file('tokenizer.json'));
      // WebLLM encodes each conversation segment separately, not the joined text.
      const inputTokens=workoutCoachingPromptSegments(request.context,digest).reduce((sum,part)=>sum+owned.tokenizer!.encode(part).length,0);
      if(!workoutCoachingPromptFits(inputTokens))throw Error('context');
      owned.tokenizer.dispose();owned.tokenizer=null;
      const loadStarted=performance.now();
      const wasm=offer.assets.find(asset=>asset.path.endsWith('.wasm'))!;
      const engine=owned.engine=new MLCEngine({logLevel:'SILENT',appConfig:{cacheBackend:'cache',model_list:[{
        model_id:model.modelId!,model:`https://huggingface.co/${model.repository}/resolve/${model.modelRevision}/`,
        model_lib:wasm.url,required_features:model.requiredFeatures,overrides:chat}]},
        initProgressCallback:progress=>send({kind:'progress',phase:'loading',progress:progress.progress})});
      await engine.reload(model.modelId!,chat);
      const loadMs=performance.now()-loadStarted;
      send({kind:'progress',phase:'running',progress:1});
      const generationStarted=performance.now();
      const response=await engine.chat.completions.create({model:model.modelId!,stream:false,
        messages:[{role:'system',content:WORKOUT_COACHING_PROMPT},{role:'user',content:workoutCoachingData(request.context,digest)}],
        response_format:{type:'json_object',schema:JSON.stringify(workoutCoachingJsonSchema(request.context,digest))},
        extra_body:{enable_thinking:false},max_tokens:WORKOUT_COACHING_OUTPUT_TOKENS,temperature:0,top_p:1,seed:0});
      const raw=workoutCoachingJsonReply(response.choices[0]?.message.content),usage=response.usage;
      if(response.choices.length!==1||response.choices[0]?.finish_reason!=='stop'||!raw||
        usage?.prompt_tokens!==inputTokens||!Number.isSafeInteger(usage.completion_tokens)||usage.completion_tokens<=0||
        usage.completion_tokens>WORKOUT_COACHING_OUTPUT_TOKENS||!parseWorkoutCoachingReply(request.context,digest,raw))throw Error('contract');
      const generationMs=performance.now()-generationStarted;
      await engine.unload();owned.engine=null;
      send({kind:'result',reply:raw,metrics:{modelId:model.id,modelRevision:model.modelRevision,runtimeVersion:model.runtimeVersion,
        contextTokens:WORKOUT_COACHING_CONTEXT_TOKENS,inputTokens,outputTokens:usage.completion_tokens,loadMs,generationMs}});
    });
  }catch(error){send({kind:'error',code:error instanceof QwenDownloadError?error.code:error instanceof Error&&['context','contract'].includes(error.message)?error.message:'runtime'});}
  finally{owned.tokenizer?.dispose();try{await owned.engine?.unload();}catch{}scope.close();}
};
