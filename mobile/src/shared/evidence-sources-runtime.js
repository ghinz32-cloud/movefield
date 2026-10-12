// Recovered executed implementation; typed public contract is in the adjacent declaration.
// Function bodies/data recovered from the successful 12 October export after scratch cleanup.
import * as __dependency0 from "./source-programs";
var _sourcePrograms = __dependency0;
/** Existing linked references. Their presence is not a claim of current full-text review. */
var evidenceLinks = {
    'TIME-EFFICIENT': {
        name: 'Iversen et al. · Time-efficient strength training',
        url: 'https://link.springer.com/article/10.1007/s40279-021-01490-1',
        summary: 'Short focused sessions can distribute training across the week. Short app plans use less weekly work and do not promise the same results as longer plans.'
    },
    'REP-PROGRESSION': {
        name: 'Plotkin et al. · Repetition versus load progression',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36199287/',
        summary: 'Research reference on changing repetitions versus load. The app reviews actual work and available equipment; indefinite fixed-weight progress or equal maximal-strength transfer is not established here.'
    },
    'SEX-RESPONSE': {
        name: 'Roberts et al. · Sex differences in resistance training',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32218059/',
        summary: 'Group response differences do not justify fixed sex-based loads or separate goal menus. Individual capacity and actual feedback guide this app.'
    },
    'OLDER-ADULT': {
        name: 'NSCA · Resistance training for older adults',
        url: 'https://www.nsca.com/contentassets/2a4112fb355a4a48853bbafbe070fb8e/resistance_training_for_older_adults__position.1.pdf',
        summary: 'Training adapts to function, experience and tolerance; chronological age alone does not determine the starting load.'
    },
    'AAP-2020': {
        name: 'AAP · Resistance Training for Children and Adolescents',
        url: 'https://publications.aap.org/pediatrics/article/145/6/e20201011/76942/Resistance-Training-for-Children-and-Adolescents',
        summary: 'Qualified instruction, appropriate supervision, low initial intensity, and gradual progression tied to observed competence.'
    },
    'NSCA-YOUTH': {
        name: 'NSCA · Youth resistance training position statement',
        url: 'https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf',
        summary: 'A broad strength foundation, dynamic warm-up, nonconsecutive training, and appropriate rest.'
    },
    'ACSM-2026': {
        name: 'ACSM · Resistance Training Prescription, 2026',
        url: 'https://acsm.org/resistance-training-guidelines-update-2026/',
        summary: 'Adult guidance distinguishes strength, hypertrophy and power outcomes. Consistent progressive training matters; failure is not essential.'
    },
    'ACSM-2009': {
        name: 'ACSM · Historical progression statement (2009)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/',
        summary: 'Superseded by the 2026 adult position stand. Historical context only. A published range is not a universal automatic load increase.'
    },
    'IOC-YOUTH': {
        name: 'IOC · Youth athletic development consensus',
        url: 'https://bjsm.bmj.com/content/49/13/843',
        summary: 'Development, experience and total sport demands require individual consideration.'
    },
    'PL-EXPERT': {
        name: 'Powerlifting program architecture · Barbell Medicine',
        url: 'https://www.barbellmedicine.com/training-programs/powerlifting/',
        summary: 'Expert program examples centered on squat, bench and deadlift. Our templates are original, not copies or endorsed programs.'
    },
    'PB-EXPERT': {
        name: 'Powerbuilding architecture · Barbell Medicine',
        url: 'https://www.barbellmedicine.com/training-programs/powerbuilding/',
        summary: 'Examples combining strength and hypertrophy. Exact app prescriptions remain product choices.'
    },
    'HYP-EXPERT': {
        name: 'Hypertrophy program examples · Jeff Nippard',
        url: 'https://jeffnippard.com/products/fundamentals-hypertrophy-program',
        summary: 'Expert split examples; no commercial routines are reproduced.'
    },
    'CONCURRENT': {
        name: 'Concurrent training · systematic review and meta-analysis',
        url: 'https://link.springer.com/article/10.1007/s40279-021-01587-7',
        summary: 'Research reference on combining strength and endurance. Original hybrid blocks display their strength and easy running/walking work; their exact dose and arrangement remain app choices.'
    },
    'EXERCISE-DATA': {
        name: 'Exercise reference catalog · public-domain dataset',
        url: 'https://github.com/yuhonas/free-exercise-db',
        summary: 'Detailed source-based guides and exact-record photos. Each variation states its logging rules. Independent professional certification and universal video coverage are not claimed.'
    },
    'NHS-C25K': {
        name: 'NHS · Couch to 5K',
        url: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/',
        summary: 'A staged run/walk program with three weekly runs and rest days between. Repeat stages when needed.'
    },
    'WHO-ACTIVITY': {
        name: 'WHO · Adult physical activity recommendations',
        url: 'https://www.who.int/europe/news-room/fact-sheets/item/physical-activity',
        summary: 'General adult health guidance supports regular aerobic activity and building from manageable amounts. It does not validate the app’s running schedules or guarantee that a starter alone meets the full weekly activity recommendation.'
    },
    'RT-DOSE': {
        name: 'Pelland et al. · Volume and frequency dose response',
        url: 'https://doi.org/10.1007/s40279-025-02344-w',
        summary: 'Weekly volume and frequency have different relationships with strength and muscle growth. Returns diminish, and regional involvement is not equivalent direct-muscle set volume.'
    },
    'RIR-RESEARCH': {
        name: 'Robinson et al. · Proximity to failure',
        url: 'https://doi.org/10.1007/s40279-024-02069-2',
        summary: 'Set effort matters for interpreting work. Research does not establish one optimal RIR or validate this app’s two-workout and 5% progression thresholds.'
    },
    'RIR-TRIAL': {
        name: 'Refalo et al. · Failure versus set-specific RIR, 2024',
        url: 'https://doi.org/10.1080/02640414.2024.2321021',
        summary: 'An eight-week lower-body study in 18 trained adults found similar quadriceps growth with failure and 1–2 RIR. Failure produced more acute fatigue. This narrow study does not identify a universal effort target.'
    },
    'RIR-PERCEPTION': {
        name: 'Refalo et al. · Effort, discomfort and feelings, 2025',
        url: 'https://doi.org/10.1002/ejsc.12266',
        summary: 'In the same lower-body intervention, leaving reps in reserve had more favorable perceptual responses. Long-term adherence was not measured; these results support optional feedback rather than a guaranteed adherence benefit.'
    },
    'REST-INTERVALS': {
        name: 'Singer et al. · Rest intervals and hypertrophy',
        url: 'https://doi.org/10.3389/fspor.2024.1429789',
        summary: 'Small average benefits may favor rests beyond 60 seconds, with substantial uncertainty. Keep enough rest for performance; 90 seconds is not a recovery ceiling.'
    },
    'RT-PRESCRIPTION': {
        name: 'Currier et al. · Resistance-training prescriptions',
        url: 'https://doi.org/10.1136/bjsports-2023-106807',
        summary: 'Many approaches improve strength and muscle size. Heavier resistance better supports maximal strength, while multiple work sets can support muscle growth.'
    }
};
for (var p of _sourcePrograms.sourcePrograms)
    evidenceLinks[p.id] = {
        name: p.name + ' · ' + p.creator,
        url: p.url,
        summary: p.scope + ' Published routine facts are preloaded; source-specific progression and adaptations are shown before acceptance.'
    };
function evidenceReview(id) {
    if (id.startsWith('src-'))
        return 'Public workout structure and available progression instructions checked; named-source and scientific evidence are separate. See the displayed version and adaptations.';
    if (id === 'ACSM-2026')
        return 'Official public summary and fetched research abstract reviewed; full position stand not reviewed.';
    if (id === 'REST-INTERVALS')
        return 'Abstract and selected primary full-text methods, results and limitations reviewed.';
    if (id === 'RIR-TRIAL')
        return 'Consensus-fetched original abstract and metadata reviewed. Full paper, figures and individual outcome precision not qualified. Same intervention as the 2025 perceptual report.';
    if (id === 'RIR-PERCEPTION')
        return 'Wiley Scholar Gateway passages plus primary abstract, selected methods/results, Table 2 and limitations reviewed. Figures and supplements were not independently verified. Same intervention as the 2024 hypertrophy report.';
    if (['TIME-EFFICIENT', 'REP-PROGRESSION', 'SEX-RESPONSE', 'CONCURRENT', 'RT-DOSE', 'RIR-RESEARCH', 'RT-PRESCRIPTION'].includes(id))
        return 'Fetched research abstract and metadata reviewed; full-paper qualification remains incomplete.';
    if (['NSCA-YOUTH', 'OLDER-ADULT'].includes(id))
        return 'Selected sections of the official full-text statement reviewed.';
    if (id === 'NHS-C25K')
        return 'All 27 official running sequences compared.';
    if (id === 'WHO-ACTIVITY')
        return 'Official public adult recommendations reviewed; the full guideline evidence review was not accessed. Exact running schedules are app choices.';
    if (/EXPERT/.test(id))
        return 'Public expert examples; exact app prescriptions are original.';
    if (id === 'EXERCISE-DATA')
        return 'Individual source records and photo provenance checked.';
    return 'Linked reference; current detailed findings not verified.';
}
export { evidenceLinks };
export { evidenceReview };
