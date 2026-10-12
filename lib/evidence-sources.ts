/** Existing linked references. Their presence is not a claim of current full-text review. */
export const evidenceLinks:Record<string,{name:string;url:string;summary:string}>={
 'TIME-EFFICIENT':{name:'Iversen et al. · Time-efficient strength training',url:'https://link.springer.com/article/10.1007/s40279-021-01490-1',summary:'Short focused sessions can distribute training across the week. Short app plans use less weekly work and do not promise the same results as longer plans.'},
 'REP-PROGRESSION':{name:'Plotkin et al. · Repetition versus load progression',url:'https://pubmed.ncbi.nlm.nih.gov/36199287/',summary:'Research reference on changing repetitions versus load. The app reviews actual work and available equipment; indefinite fixed-weight progress or equal maximal-strength transfer is not established here.'},
 'SEX-RESPONSE':{name:'Roberts et al. · Sex differences in resistance training',url:'https://pubmed.ncbi.nlm.nih.gov/32218059/',summary:'Group response differences do not justify fixed sex-based loads or separate goal menus. Individual capacity and actual feedback guide this app.'},
 'OLDER-ADULT':{name:'NSCA · Resistance training for older adults',url:'https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf',summary:'Training adapts to function, experience and tolerance; chronological age alone does not determine the starting load.'},
 'AAP-2020':{name:'AAP · Resistance Training for Children and Adolescents',url:'https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/Resistance-Training-for-Children-and-Adolescents',summary:'Qualified instruction, appropriate supervision, low initial intensity, and gradual progression tied to observed competence.'},
 'NSCA-YOUTH':{name:'NSCA · Youth resistance training position statement',url:'https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf',summary:'A broad strength foundation, dynamic warm-up, nonconsecutive training, and appropriate rest.'},
 'ACSM-2026':{name:'ACSM · Resistance Training Prescription, 2026',url:'https://acsm.org/resistance-training-guidelines-update-2026/',summary:'Adult guidance distinguishes strength, hypertrophy and power outcomes. Consistent progressive training matters; failure is not essential.'},
 'ACSM-2009':{name:'ACSM · Historical progression statement (2009)',url:'https://pubmed.ncbi.nlm.nih.gov/19204579/',summary:'Superseded by the 2026 adult position stand. Historical context only. A published range is not a universal automatic load increase.'},
 'IOC-YOUTH':{name:'IOC · Youth athletic development consensus',url:'https://bjsm.bmj.com/content/49/13/843',summary:'Development, experience and total sport demands require individual consideration.'},
 'PL-EXPERT':{name:'Powerlifting program architecture · Barbell Medicine',url:'https://www.barbellmedicine.com/training-programs/powerlifting/',summary:'Expert program examples centered on squat, bench and deadlift. Our templates are original, not copies or endorsed programs.'},
 'PB-EXPERT':{name:'Powerbuilding architecture · Barbell Medicine',url:'https://www.barbellmedicine.com/training-programs/powerbuilding/',summary:'Examples combining strength and hypertrophy. Exact app prescriptions remain product choices.'},
 'HYP-EXPERT':{name:'Hypertrophy program examples · Jeff Nippard',url:'https://jeffnippard.com/products/fundamentals-hypertrophy-program',summary:'Expert split examples; no commercial routines are reproduced.'},
 'CONCURRENT':{name:'Concurrent training · systematic review and meta-analysis',url:'https://link.springer.com/article/10.1007/s40279-021-01587-7',summary:'Research reference on combining strength and endurance. Original hybrid blocks display their strength and easy running/walking work; their exact dose and arrangement remain app choices.'},
 'EXERCISE-DATA':{name:'Exercise reference catalog · public-domain dataset',url:'https://github.com/yuhonas/free-exercise-db',summary:'Detailed source-based guides and exact-record photos. Each variation states its logging rules. Independent professional certification and universal video coverage are not claimed.'},
 'NHS-C25K':{name:'NHS · Couch to 5K',url:'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/',summary:'A staged run/walk program with three weekly runs and rest days between. Repeat stages when needed.'}
};
export function evidenceReview(id:string):string{
 if(id==='ACSM-2026')return 'Official public summary reviewed; full position stand not reviewed.';
 if(['NSCA-YOUTH','OLDER-ADULT'].includes(id))return 'Selected sections of the official full-text statement reviewed.';
 if(id==='NHS-C25K')return 'All 27 official running sequences compared.';
 if(/EXPERT/.test(id))return 'Public expert examples; exact app prescriptions are original.';
 if(id==='EXERCISE-DATA')return 'Individual source records and photo provenance checked.';
 return 'Linked reference; current detailed findings not verified.';
}
