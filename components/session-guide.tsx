import {sessionGuide} from '@/lib/session-guide';
import {type Plan,type Session} from '@/lib/training';
export function SessionGuide({plan,session}:{plan:Plan;session:Session}){const guide=sessionGuide(plan,session);return <details className="workout-guide"><summary>Warm-up, effort & finish</summary><ol>{guide.warmup.map((s,i)=><li key={i}>{s}</li>)}</ol><p><b>During the workout:</b> {guide.effort}</p><p><b>After:</b> {guide.finish}</p></details>}
