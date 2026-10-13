// Which published sources support each kind of Movefield plan. Keys must exist in app/page.tsx SOURCE_LINKS.
// Sources that were only partly checked are marked in their Sources entries. Expert program pages are named as expert examples, not trials.
export const disciplineEvidence: Record<string, {label: string; keys: string[]}> = {
  powerlifting: {label: 'Powerlifting', keys: ['SCHOENFELD-2017-LOAD', 'PETERSON-2004', 'SUCHOMEL-2018-STRENGTH', 'WILLIAMS-2017-PERIODIZED', 'PELLAND-2026-DOSE', 'GRGIC-2018-FREQ-STRENGTH', 'PL-EXPERT']},
  powerbuilding: {label: 'Powerbuilding', keys: ['SCHOENFELD-2017-LOAD', 'WILLIAMS-2017-PERIODIZED', 'PELLAND-2026-DOSE', 'SCHOENFELD-2019-FREQ', 'SCHOENFELD-2017-VOLUME', 'REFALO-2023-FAILURE', 'PB-EXPERT']},
  hypertrophy: {label: 'Bodybuilding and muscle building', keys: ['PELLAND-2026-DOSE', 'SCHOENFELD-2019-FREQ', 'SCHOENFELD-2017-VOLUME', 'REFALO-2023-FAILURE', 'ZHANG-2025-SUPERSET', 'VAROVIC-2025-LENGTH', 'WOLF-2025-PARTIAL', 'MOLINARI-2024-WOMEN', 'SCHOENFELD-2016-REST', 'GRGIC-2017-REST', 'REP-PROGRESSION', 'ACSM-2026', 'CURRIER-2023', 'SINGER-2024-REST', 'MOESGAARD-2022-PERIOD']},
  strength: {label: 'Strength', keys: ['SCHOENFELD-2017-LOAD', 'SUCHOMEL-2018-STRENGTH', 'WILLIAMS-2017-PERIODIZED', 'PELLAND-2026-DOSE', 'ACSM-2026', 'CURRIER-2023', 'SINGER-2024-REST', 'MOESGAARD-2022-PERIOD']},
  sport: {label: 'Sport performance', keys: ['WISLOFF-2004', 'SUCHOMEL-2018-STRENGTH', 'STOJANOVIC-2017', 'MARKOVIC-2007']},
  running: {label: 'Running', keys: ['NHS-C25K', 'CONCURRENT']},
  hybrid: {label: 'Hybrid strength and running', keys: ['CONCURRENT', 'SCHOENFELD-2019-FREQ', 'WHO-2020']},
  calisthenics: {label: 'Calisthenics', keys: ['ACSM-2026', 'REP-PROGRESSION', 'WHO-2020']},
  general: {label: 'General fitness', keys: ['WHO-2020', 'ACSM-2026', 'CURRIER-2023', 'SINGER-2024-REST', 'MOESGAARD-2022-PERIOD']},
  jumping: {label: 'Jump practice', keys: ['MARKOVIC-2007', 'STOJANOVIC-2017']},
  // IOC-YOUTH is not mapped here: it does not address maximal lifts, testing or supervision, which these plans rely on.
  youth: {label: 'Youth training', keys: ['AAP-2020', 'NSCA-YOUTH', 'LLOYD-2016-LTAD']},
};

export function planEvidence(input: {goal: string; run: boolean; youth: boolean; jumping: boolean; age?:number; source?:string}): string[] {
  // Youth supervision/competence guidance does not inherit adult goal studies.
  if(input.youth)return [...disciplineEvidence.youth.keys];
  // `run` means the actual NHS stage recipe. App-authored intervals and existing
  // running-base plans use activity context, without claiming NHS source fidelity.
  if(input.run||input.goal==='running')return input.run?['NHS-C25K','WHO-2020']:['WHO-2020'];
  const goal = disciplineEvidence[input.goal]?.keys ?? [];
  const extra = [...(input.jumping ? disciplineEvidence.jumping.keys : []),...(input.age!==undefined&&input.age>=65?['OLDER-ADULT','WHO-2020']:[])];
  return [...new Set(['ACSM-2026', ...goal, ...(input.source?[input.source]:[]), ...extra])];
}

/** Selected add-on principles, not independent validation of their exact dose. */
export function focusEvidence(focuses:readonly string[],youth:boolean):string[]{
  if(youth)return focuses.some(f=>f==='core'||f==='jumping')?['NSCA-YOUTH']:[];
  const sources:Record<string,string[]>={core:['ACSM-2026'],jumping:['NSCA-PLYOMETRICS'],supersets:['ZHANG-2025-SUPERSET'],activity:['CDC-ACTIVITY','WHO-2020']};
  return [...new Set(focuses.flatMap(f=>sources[f]||[]))];
}
