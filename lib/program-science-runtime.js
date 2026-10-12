// Recovered executed implementation; typed public contract is in the adjacent declaration.
// Function bodies/data recovered from the successful 12 October export after scratch cleanup.
import * as __dependency0 from "./program-catalog";
import * as __dependency1 from "./source-programs";
import * as __dependency2 from "./muscle-work";
var _programCatalog = __dependency0;
var _sourcePrograms = __dependency1;
var _muscleWork = __dependency2;
function programScience(plan) {
    var named = (0, _sourcePrograms.sourceProgram)(plan.template), def = _programCatalog.programCatalog.find(d => d.id === plan.template), work = (0, _muscleWork.muscleWork)(plan), adult = plan.profile.age >= 18;
    // Accepted plan notes retain provenance; a catalog edit cannot relabel old prescriptions.
    var acceptedVersion = plan.notes?.find(n => n.startsWith('Version: '))?.slice(9);
    if (named && acceptedVersion && acceptedVersion !== named.version) {
        var source = plan.notes?.find(n => n.startsWith('Creator/source: '))?.match(/^Creator\/source: (.+)\. (https:\/\/\S+)$/);
        named = {
            ...named,
            version: acceptedVersion,
            creator: source?.[1] || named.creator,
            url: source?.[2] || named.url,
            adaptations: [...plan.notes.filter(n => !n.startsWith('Creator/source: ') && !n.startsWith('Version: ')), 'This accepted version keeps its original progression context. Preview a new source block to adopt a newer catalog revision.']
        };
    }
    var runningOnly = plan.profile.goal === 'running', nhs = plan.template === 'RUN-WALK';
    var references = plan.profile.mode !== 'app' ? [] : runningOnly ? nhs ? ['NHS-C25K'] : ['WHO-ACTIVITY'] : adult ? ['ACSM-2026', 'RT-PRESCRIPTION', 'RT-DOSE', 'RIR-RESEARCH', 'RIR-TRIAL', 'RIR-PERCEPTION', 'REST-INTERVALS', ...(['running', 'hybrid'].includes(plan.profile.goal) ? ['CONCURRENT'] : []), ...(plan.template === 'RUN-WALK' ? ['NHS-C25K'] : [])] : ['NSCA-YOUTH', 'AAP-2020', 'IOC-YOUTH'];
    var principles = plan.profile.mode !== 'app' ? [] : runningOnly ? [nhs ? 'The exact 27 run/walk sequences are checked against the NHS publication. The programme builds running duration with walking recovery and separated sessions.' : 'This is easy base running or brief walk/run practice, not a race-specific or speed progression. Existing running readiness is required for continuous-run blocks.', 'Keep the pace conversational. Source sequence, planned duration and completed prerequisites guide progression; the app does not infer a universal percentage increase.'] : [adult ? 'Progressive resistance training has support for strength, muscle size and physical function in healthy adults.' : 'Youth training requires appropriate instruction and supervision; adult prescriptions are not transferred unchanged.', ...(['strength', 'powerlifting', 'powerbuilding'].includes(plan.profile.goal) ? ['Heavier resistance and practice of the target lift support maximal-strength goals. A light or fixed-weight foundation has a different ceiling.'] : []), ...(['hypertrophy', 'powerbuilding'].includes(plan.profile.goal) ? ['Multiple work sets and goal-appropriate weekly muscle volume support growth. Roughly ten weekly sets is a useful general reference, not a required minimum or a personal optimum.'] : []), 'Frequency distributes practice and workload. More days alone do not establish better muscle growth when weekly volume is comparable.', 'Effort and adequate rest matter. Mandatory failure, one universally optimal RIR and exact timer seconds are not established for every user.'];
    var gaps = runningOnly ? [] : work.rows.filter(r => ['Chest', 'Back', 'Quadriceps', 'Hamstrings'].includes(r.name) && r.primaryDays < 2).map(r => r.name);
    var editedSource = named && plan.sessions.some(x => {
        var baseline = named.slots.find(b => x.roleId === named.id + '-' + b.title);
        if (!baseline || baseline.items.map(i => i.exerciseId).join('|') !== x.items.map(i => i.exerciseId).join('|'))
            return true;
        return baseline.items.some((i, n) => {
            var actual = x.items[n], stage = actual.sourceRule?.stage ?? 0, gzcl = i.sourceRule?.kind === 'gzcl-t1' || i.sourceRule?.kind === 'gzcl-t2', sets = gzcl && i.sourceRule?.kind === 'gzcl-t1' ? [5, 6, 10][stage] : i.sets, reps = gzcl ? (i.sourceRule?.kind === 'gzcl-t1' ? [3, 2, 1] : [10, 8, 6])[stage] : i.repMin;
            return actual.sets !== sets || actual.repMin !== reps || actual.repMax !== (gzcl ? reps : i.repMax) || actual.rest !== i.rest || actual.sourceRule?.kind !== i.sourceRule?.kind || JSON.stringify(actual.setPlan) !== JSON.stringify(i.setPlan);
        });
    });
    var scope = plan.profile.mode !== 'app' ? 'Owner-directed targets' : nhs ? 'NHS Couch to 5K public run/walk sequence' : runningOnly ? 'Easy running base or walk/run introduction' : named ? named.scope : def?.description ? 'Original app routine: ' + def.description : def?.brief && !def?.distributed ? 'Brief practice with deliberately less weekly work' : 'Original app routine';
    var limits = [...(editedSource ? ['This accepted plan contains changes to the published baseline. The source describes the preloaded version; it does not certify your reviewed customizations.'] : []), ...(runningOnly && !nhs ? ['WHO supports general aerobic activity, not this exact running prescription. This running block alone does not claim to meet the complete weekly aerobic and muscle-strengthening recommendations.'] : []), ...(gaps.length ? [`${gaps.join(', ')} receive primary work less than twice per sampled week. Review this against the routine’s scope; secondary work is not counted as equal direct work.`] : []), ...(plan.profile.goal === 'hypertrophy' && work.rows.some(r => ['Chest', 'Back', 'Quadriceps', 'Hamstrings'].includes(r.name) && r.primarySets < 10) ? ['This is a lower-volume muscle starting block, not a maximum-volume growth prescription.'] : []), ...(plan.profile.goal === 'sport' ? ['This is general strength preparation, not a validated position-specific sport program.'] : []), ...(!work.completeCycle ? ['The chosen block does not include a complete source rotation; displayed averages cover only the available weeks.'] : []), ...(work.unclassified.length ? ['Some exercises have no reviewed primary/secondary allocation. They are not silently converted into muscle-dose equivalents.'] : [])];
    return {
        label: plan.profile.mode === 'app' ? 'Evidence-informed principles' : 'Source support not assessed',
        recipeTrial: 'No controlled trial of this exact shipped routine was identified in this review.',
        scope,
        creator: named?.creator,
        sourceUrl: named?.url,
        sourceVersion: named?.version,
        principles,
        references: [...new Set(references)],
        limits,
        implementationChoices: named ? [...named.adaptations, 'Source progression thresholds are creator or community coaching rules. The 35-day comparable-history window and concern holds are app policies; no exact universal optimum is claimed.'] : runningOnly ? [nhs ? 'NHS running and walking intervals are retained. The five-minute scheduling buffer is an app estimate.' : 'The easy-running arrangement and duration are app choices, requiring reviewed running readiness.', 'Repeat and return proposals are conservative app choices, not calculated fitness loss or trial-proven personal progression.'] : ['The exact exercise arrangement and set distribution are app decisions.', 'The 2–3 RIR target, two-success trigger, 5% increase ceiling, 35-day history window and final-week reduction are app policies informed by broader evidence, not individually proven optimum thresholds.'],
        work
    };
}
export { programScience };
