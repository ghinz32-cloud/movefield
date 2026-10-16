// Recovered executed implementation; typed public contract is in the adjacent declaration.
// Function bodies/data recovered from the successful 12 October export after scratch cleanup.
import * as _training from "./training";
import * as _equipment from "./equipment";
var ruleItem = (exerciseId, sets, lo, hi, rest, kind, extra = {}) => ({
    exerciseId,
    sets,
    reps: lo,
    repMin: lo,
    repMax: hi,
    rest,
    kg: null,
    sourceRule: {
        kind,
        ...extra
    }
});
var slot = (title, group, items) => ({
    title,
    group,
    items
});
var sl = (id, days) => ({
    id,
    name: `Stronglifts 5×5 · ${days} days`,
    creator: 'Mehdi / Stronglifts',
    url: 'https://stronglifts.com/stronglifts-5x5/workout-program/',
    version: 'Public standard straight-set version, checked 2026-10-12',
    goals: ['strength', 'powerlifting', 'powerbuilding'],
    days,
    experience: 'all',
    offsets: days === 3 ? [0, 2, 4] : [0, 3],
    scope: 'General barbell strength foundation, not meet peaking or a complete bodybuilding split.',
    adaptations: ['The source permits two or three separated days. A/B alternation continues across week boundaries.', 'Default rest is three minutes; extend as needed. Starting weights remain individually selected. The app uses the source-permitted standard +5 lb / +2.5 kg step; smaller or slower options remain deliberate source choices.'],
    progression: 'Complete the prescribed sets/reps, then review the next source-sized load increment. Repeat after a miss; after three fully recorded failed attempts at the same load, review about a 10% reduction. The source thresholds are coaching rules, not trial-proven optima.',
    slots: [slot('Workout A', 'full', [ruleItem('bar-squat', 5, 5, 5, 180, 'sl5x5'), ruleItem('bench', 5, 5, 5, 180, 'sl5x5'), ruleItem('lib-bar-bent-over-row', 5, 5, 5, 180, 'sl5x5')]), slot('Workout B', 'full', [ruleItem('bar-squat', 5, 5, 5, 180, 'sl5x5'), ruleItem('ref-Standing_Military_Press', 5, 5, 5, 180, 'sl5x5'), ruleItem('deadlift', 1, 5, 5, 180, 'sl5x5')])]
});
var gzcl = (id, days) => ({
    id,
    name: `GZCLP · ${days}-day base`,
    creator: 'Cody Lefever',
    url: 'https://swoleateveryheight.blogspot.com/2016/02/gzcl-applications-adaptations.html',
    version: 'Creator 2016 base; progression revision 2, checked 2026-10-12',
    ruleVersion: 'creator-2016-v2',
    goals: ['strength', 'powerbuilding', 'powerlifting'],
    days,
    experience: days === 4 ? 'some' : 'all',
    offsets: days === 3 ? [0, 2, 4] : [0, 1, 3, 4],
    scope: 'The published minimum T1/T2/T3 base. Extra T3 choices are not silently added. General strength development, not meet peaking.',
    adaptations: ['Three-day schedules follow the creator rotation. The optional four-day layout comes from the public r/gzcl wiki; it includes adjacent training days.', 'Rest defaults are 3 minutes for T1, 2 minutes for T2 and 90 seconds for T3; extend rest when needed.', 'A zero-rep or unfinished attempt stays partial. Terminal-stage resets require a separately assessed baseline and a new reviewed block.', 'Main-lift increases use 5 lb for upper and 10 lb for lower lifts, or 2.5 kg for either; these are choices within the creator range. T3 uses the actual available increment after review.', 'Earlier accepted community-version plans keep their original progression context. New creator-version records are not silently mixed with them.'],
    progression: 'T1 uses total completed volume through 5×3+, 6×2+ and 10×1+. Keep 1–2 reps in reserve on the final set and cap its reps at ten. T2 progresses through 3×10, 3×8 and 3×6. T3 increases after 25 final-set reps with reserve. After a terminal T1 miss, the creator reassesses a 5RM after 2–3 days and opens at 85%; a T2 restart is modestly above its prior opening load. Baselines are individually assessed, never guessed.',
    slots: [slot('A1 · squat / bench / pulldown', 'source-a', [ruleItem('bar-squat', 5, 3, 3, 180, 'gzcl-t1', {
                amrapLast: true,
                stage: 0
            }), ruleItem('bench', 3, 10, 10, 120, 'gzcl-t2', {
                stage: 0
            }), ruleItem('pulldown', 3, 15, 15, 90, 'gzcl-t3', {
                amrapLast: true
            })]), slot('B1 · press / deadlift / row', 'source-b', [ruleItem('ref-Standing_Military_Press', 5, 3, 3, 180, 'gzcl-t1', {
                amrapLast: true,
                stage: 0
            }), ruleItem('deadlift', 3, 10, 10, 120, 'gzcl-t2', {
                stage: 0
            }), ruleItem('row', 3, 15, 15, 90, 'gzcl-t3', {
                amrapLast: true
            })]), slot('A2 · bench / squat / pulldown', 'source-a', [ruleItem('bench', 5, 3, 3, 180, 'gzcl-t1', {
                amrapLast: true,
                stage: 0
            }), ruleItem('bar-squat', 3, 10, 10, 120, 'gzcl-t2', {
                stage: 0
            }), ruleItem('pulldown', 3, 15, 15, 90, 'gzcl-t3', {
                amrapLast: true
            })]), slot('B2 · deadlift / press / row', 'source-b', [ruleItem('deadlift', 5, 3, 3, 180, 'gzcl-t1', {
                amrapLast: true,
                stage: 0
            }), ruleItem('ref-Standing_Military_Press', 3, 10, 10, 120, 'gzcl-t2', {
                stage: 0
            }), ruleItem('row', 3, 15, 15, 90, 'gzcl-t3', {
                amrapLast: true
            })])]
});
var ph = (id, sets, lo, hi, rest, max = sets) => ruleItem(id, sets, lo, hi, rest, 'phul', {
    minRir: 1,
    publishedSetsMax: max
});
var pplMain = (id, sets, role) => ({
    ...ruleItem(id, sets, 5, 5, 180, 'ppl-main', {
        amrapLast: true
    }),
    loadRole: role
});
var accessory = (id, sets, lo = 8, hi = 12) => ruleItem(id, sets, lo, hi, 90, 'double');
function pplPush(benchFirst) {
    var items = [pplMain(benchFirst ? 'bench' : 'ref-Standing_Military_Press', 5, 'heavy'), {
            ...accessory(benchFirst ? 'ref-Standing_Military_Press' : 'bench', 3),
            loadRole: 'assistance'
        }, accessory('incline-press', 3), accessory('triceps', 3), accessory('lib-cable-overhead-triceps', 3), accessory('lateral', 6, 15, 20)];
    items[3].setPlan = Array.from({
        length: 3
    }, () => ({
        pair: 'pushdown-lateral',
        position: 1,
        rest: 0
    }));
    items[4].setPlan = Array.from({
        length: 3
    }, () => ({
        pair: 'overhead-lateral',
        position: 1,
        rest: 0
    }));
    items[5].setPlan = [...Array.from({
            length: 3
        }, () => ({
            pair: 'pushdown-lateral',
            position: 2,
            rest: 90
        })), ...Array.from({
            length: 3
        }, () => ({
            pair: 'overhead-lateral',
            position: 2,
            rest: 90
        }))];
    return slot(benchFirst ? 'Push A · bench first' : 'Push B · press first', 'push', items);
}
var sourcePrograms = [sl('src-sl5x5-3', 3), sl('src-sl5x5-2', 2), gzcl('src-gzclp-3', 3), gzcl('src-gzclp-4', 4), {
        id: 'src-fitness-basic',
        name: 'r/Fitness Basic Beginner · barbell module',
        creator: 'r/Fitness / The Fitness Wiki',
        url: 'https://thefitness.wiki/routines/r-fitness-basic-beginner-routine/',
        version: 'Public barbell module, checked 2026-10-12',
        goals: ['strength', 'powerbuilding'],
        days: 3,
        experience: 'all',
        offsets: [0, 2, 4],
        scope: 'A short introduction for up to three months. The source also asks for two conditioning sessions; this entry preloads its barbell module only and does not claim to deliver the full conditioning prescription.',
        adaptations: ['The author-listed lat pulldown alternative is used for chinups.', 'A/B alternation continues across weeks. Two-minute rests are within the source 2–3-minute range.', 'The public page specifies pounds. In kg mode the app uses rounded 1.25 kg upper / 2.5 kg lower increments, rather than presenting those as separately published metric prescriptions.'],
        progression: 'The final set is a quality AMRAP with about 1–2 reps left. Review +2.5 lb upper / +5 lb lower (with explicitly rounded app metric steps) per exposure; double the increment after more than ten final-set reps. Fewer than fifteen total recorded reps supports reviewing a 10% reduction. Microplate alternatives require a deliberate choice.',
        slots: [slot('Workout A', 'full', [ruleItem('lib-bar-bent-over-row', 3, 5, 5, 120, 'fitness-basic', {
                    amrapLast: true,
                    minRir: 1
                }), ruleItem('bench', 3, 5, 5, 120, 'fitness-basic', {
                    amrapLast: true,
                    minRir: 1
                }), ruleItem('bar-squat', 3, 5, 5, 120, 'fitness-basic', {
                    amrapLast: true,
                    minRir: 1
                })]), slot('Workout B', 'full', [ruleItem('pulldown', 3, 5, 5, 120, 'fitness-basic', {
                    amrapLast: true,
                    minRir: 1
                }), ruleItem('ref-Standing_Military_Press', 3, 5, 5, 120, 'fitness-basic', {
                    amrapLast: true,
                    minRir: 1
                }), ruleItem('deadlift', 3, 5, 5, 120, 'fitness-basic', {
                    amrapLast: true,
                    minRir: 1
                })])]
    }, {
        id: 'src-phul',
        name: 'PHUL · published four-day routine',
        creator: 'Brandon Campbell / Muscle & Strength',
        url: 'https://www.muscleandstrength.com/workouts/phul-workout',
        version: 'Public table updated 2021-05-26; checked 2026-10-12',
        goals: ['powerbuilding', 'hypertrophy'],
        days: 4,
        experience: 'some',
        offsets: [0, 1, 3, 4],
        scope: 'Two power and two hypertrophy days; the source gives 12 weeks and permits beginning at the lower end of its set ranges.',
        adaptations: ['All table exercises are loaded at the lower published set bound. Flat dumbbell flyes, an EZ-bar skullcrusher and selectorized calf machines are explicit equipment variations.', 'Rest timers default to 3 minutes for heavy compounds, 2 minutes for other compounds and 90 seconds for isolation. These seconds are app defaults; the source table does not prescribe them.', 'The source asks for at least one rep left but does not specify a numerical overload trigger. Reviewable top-of-range load suggestions are an app implementation choice.'],
        progression: 'Keep the source rep ranges and at least one good rep left. Use the lower published set count initially. This app offers a reviewed available load step after all current sets reach the upper bound with recorded RIR ≥1; that trigger is an app policy, not a PHUL clinical finding.',
        slots: [slot('Upper Power', 'upper', [ph('bench', 3, 3, 5, 180, 4), ph('incline-press', 3, 6, 10, 120, 4), ph('lib-bar-bent-over-row', 3, 3, 5, 180, 4), ph('pulldown', 3, 6, 10, 120, 4), ph('ref-Standing_Military_Press', 2, 5, 8, 120, 3), ph('ref-Barbell_Curl', 2, 6, 10, 90, 3), ph('ref-EZ-Bar_Skullcrusher', 2, 6, 10, 90, 3)]), slot('Lower Power', 'lower', [ph('bar-squat', 3, 3, 5, 180, 4), ph('deadlift', 3, 3, 5, 180, 4), ph('lib-stack-leg-press', 3, 10, 15, 120, 5), ph('leg-curl', 3, 6, 10, 90, 4), ph('ref-Standing_Dumbbell_Calf_Raise', 4, 6, 10, 90)]), slot('Upper Hypertrophy', 'upper', [ph('lib-bar-incline-bench', 3, 8, 12, 120, 4), ph('ref-Dumbbell_Flyes', 3, 8, 12, 90, 4), ph('lib-cable-seated-row', 3, 8, 12, 120, 4), ph('row', 3, 8, 12, 120, 4), ph('lateral', 3, 8, 12, 90, 4), ph('ref-Incline_Dumbbell_Curl', 3, 8, 12, 90, 4), ph('triceps', 3, 8, 12, 90, 4)]), slot('Lower Hypertrophy', 'lower', [ph('ref-Front_Barbell_Squat', 3, 8, 12, 150, 4), ph('ref-Barbell_Lunge', 3, 8, 12, 120, 4), ph('leg-extension', 3, 10, 15, 90, 4), ph('leg-curl', 3, 10, 15, 90, 4), ph('lib-stack-seated-calf-raise', 3, 8, 12, 90, 4), ph('ref-Calf_Press', 3, 8, 12, 90, 4)])]
    }, {
        id: 'src-reddit-ppl',
        name: 'Reddit PPL · six-day linear progression',
        creator: 'u/Metallicadpa / r/Fitness; Fitness Wiki archive',
        url: 'https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/',
        version: 'Public original PPLPPLR table, checked 2026-10-12',
        goals: ['powerbuilding', 'hypertrophy'],
        days: 6,
        experience: 'some',
        offsets: [0, 1, 2, 3, 4, 5],
        scope: 'A demanding six-day novice/intermediate routine; all sets, high-rep face pulls and assistance supersets are retained. No hard seventh day.',
        adaptations: ['The source permits pulldowns, cable rows and calf variations; the listed choices are preloaded.', 'The six lateral-raise sets retain their two three-round triceps pairs. Main barbell lifts keep straight sets.', 'Three-minute main-lift and 90-second assistance timers lie within the published rest ranges.', 'The source distinguishes transient recovery misses from strength failure. A three-miss reduction is a review proposal; check that context before accepting.'],
        progression: 'Main barbell lifts use source linear increments with a final quality AMRAP; three fully recorded misses support a reviewed 10% reduction. Accessories use their published rep ranges and an available load step after all prescribed sets reach the upper bound. No catch-up sets or automatic missed-day increases.',
        slots: [slot('Pull A · deadlift', 'pull', [pplMain('deadlift', 1, 'heavy'), accessory('pulldown', 3), accessory('lib-cable-seated-row', 3), accessory('ref-Face_Pull', 5, 15, 20), accessory('lib-db-hammer-curl', 4), accessory('curl', 4)]), pplPush(true), slot('Legs A', 'lower', [pplMain('bar-squat', 3, 'heavy'), accessory('lib-bar-rdl', 3), accessory('lib-stack-leg-press', 3), accessory('leg-curl', 3), accessory('ref-Standing_Dumbbell_Calf_Raise', 5)]), slot('Pull B · row', 'pull', [pplMain('lib-bar-bent-over-row', 5, 'heavy'), accessory('pulldown', 3), accessory('lib-cable-seated-row', 3), accessory('ref-Face_Pull', 5, 15, 20), accessory('lib-db-hammer-curl', 4), accessory('curl', 4)]), pplPush(false), slot('Legs B', 'lower', [pplMain('bar-squat', 3, 'heavy'), accessory('lib-bar-rdl', 3), accessory('lib-stack-leg-press', 3), accessory('leg-curl', 3), accessory('ref-Standing_Dumbbell_Calf_Raise', 5)])]
    }, {
        id: 'src-db-stopgap',
        name: 'Dumbbell Stopgap · public A/B routine',
        creator: 'r/Fitness community / Fitness Wiki archive',
        url: 'https://thefitness.wiki/reddit-archive/dumbbell-stopgap/',
        version: 'Public archived routine, checked 2026-10-12',
        goals: ['strength', 'general', 'hypertrophy'],
        days: 3,
        experience: 'all',
        offsets: [0, 2, 4],
        scope: 'Short-term limited-equipment introduction. The source requires adjustable dumbbells or a weight range and explicitly describes this as a stopgap rather than an optimal long-term strength or muscle plan.',
        adaptations: ['The author-listed dumbbell lunge is used instead of the optional Bulgarian split squat.', 'A stable seated press is used. Plank time is open-ended; the estimate budgets sixty seconds per hold, not a prescribed sixty-second target.'],
        progression: 'Do three quality sets of up to ten reps, with one minute between sets. After 3×10, review the next available dumbbell step. Three identical stalled exposures support a review two available steps lighter. Record actual plank time and stop when control changes.',
        slots: [slot('Workout A', 'full', [ruleItem('ref-Dumbbell_Lunges', 3, 1, 10, 60, 'db-stopgap'), ruleItem('lib-db-floor-press', 3, 1, 10, 60, 'db-stopgap'), ruleItem('ref-Stiff-Legged_Dumbbell_Deadlift', 3, 1, 10, 60, 'db-stopgap'), ruleItem('plank', 3, 60, 60, 60, 'hold')]), slot('Workout B', 'full', [ruleItem('ref-Dumbbell_Lunges', 3, 1, 10, 60, 'db-stopgap'), ruleItem('ref-Seated_Dumbbell_Press', 3, 1, 10, 60, 'db-stopgap'), ruleItem('ref-Bent_Over_Two-Dumbbell_Row', 3, 1, 10, 60, 'db-stopgap'), ruleItem('plank', 3, 60, 60, 60, 'hold')])]
    }];
function sourceProgram(id) {
    return sourcePrograms.find(p => p.id === id);
}
function buildSourcePlan(p, events) {
    var def = sourceProgram(p.programId);
    if (!def || !def.goals.includes(p.goal))
        return {
            plan: null,
            errors: ['Choose a published routine that matches this training goal.']
        };
    var errors = [];
    if (p.age < 18)
        errors.push('These public routines are adult choices. Use supervised foundations or coach tracking for youth.');
    if (def.experience === 'some' && p.experience === 'First time')
        errors.push('This public routine needs established lifting practice. Choose an introductory routine first.');
    if (p.trainingDays !== undefined && p.trainingDays !== def.days)
        errors.push(`This source version uses ${def.days} training days; change frequency or choose another version.`);
    if (p.days.length < def.days)
        errors.push(`Add ${def.days} available weekdays.`);
    if (p.focuses?.length)
        errors.push('This entry preserves the published routine. Remove optional add-ons before selecting it; review customization after accepting.');
    if (def.id === 'src-db-stopgap' && p.inventory?.confirmed && (p.inventory.dumbbells !== 'pair' || p.inventory.dumbbellLoading !== 'adjustable'))
        errors.push('The source requires two matching adjustable dumbbells or a range of pairs, rather than one fixed pair.');
    if (def.id === 'src-fitness-basic' && p.weeks > 12)
        errors.push('The public introduction is limited to about three months. Choose at most twelve weeks, then review a fuller routine.');
    var weekday = new Date(p.start + 'T12:00:00').getDay(), arranged = Array.from({
        length: 7
    }, (_, n) => def.offsets.map(o => (weekday + n + o) % 7)).find(ds => ds.every(d => p.days.includes(d)));
    if (!arranged)
        errors.push('Your weekdays cannot preserve this published layout and its rest days. Add availability or choose another routine.');
    if (errors.length)
        return {
            plan: null,
            errors
        };
    var days = arranged.slice().sort((a, b) => a - b), id = (0, _training.uid)('plan'), sessions = [];
    for (var n = 0; n < p.weeks * 7; n++) {
        var date = (0, _training.addDays)(p.start, n);
        if (!days.includes(new Date(date + 'T12:00:00').getDay()))
            continue;
        var spec = def.slots[sessions.length % def.slots.length], items = spec.items.map(i => ({
            ...i,
            sourceRule: {
                ...i.sourceRule
            },
            setPlan: i.setPlan?.map(x => ({
                ...x
            })),
            loadRole: `${def.id}/${i.loadRole || i.sourceRule.kind}${def.ruleVersion ? '/' + def.ruleVersion : ''}`,
            note: [def.ruleVersion && i.sourceRule.kind === 'gzcl-t1' ? 'Final set: keep 1–2 good reps left and stop at ten reps. Record that set’s RIR.' : def.ruleVersion && i.sourceRule.kind === 'gzcl-t3' ? 'Final set: keep 1–2 good reps left. Twenty-five reps permits a reviewed modest load increase.' : i.sourceRule?.amrapLast ? 'Final set: extra quality reps; stop before uncontrolled failure.' : '', i.sourceRule?.kind === 'hold' ? 'Record actual hold time. End when trunk control changes; the display budgets time only.' : '', i.setPlan ? 'Alternate each triceps set with its paired lateral-raise set. Rest after the raise.' : ''].filter(Boolean).join(' ')
        }));
        for (var i of items) {
            if ((0, _training.exFor)(i.exerciseId).name === 'Archived exercise')
                errors.push('This source exercise is not available: ' + i.exerciseId);
            else {
                var fit = (0, _equipment.equipmentFit)((0, _training.exFor)(i.exerciseId), p);
                if (p.inventory?.confirmed && !fit.available)
                    errors.push((0, _training.exFor)(i.exerciseId).name + ': ' + fit.reason);
                if (p.noFloor && i.exerciseId === 'plank' || p.noFloor && i.exerciseId === 'lib-db-floor-press')
                    errors.push('This exact routine includes floor work. Choose a floor-free plan.');
            }
        }
        var minutes = (0, _training.estimateSessionMinutes)(items);
        if (minutes > p.minutes)
            errors.push(`${spec.title} needs about ${minutes} minutes with its complete work and rest. No source sets are removed.`);
        var sessionId = id + '-s' + sessions.length;
        var depends = sessions.length ? [sessions.at(-1).id] : [];
        sessions.push({
            id: sessionId,
            date,
            week: Math.floor(n / 7) + 1,
            title: def.name + ' · ' + spec.title,
            kind: 'Published routine',
            minutes,
            items,
            status: 'scheduled',
            recoveryGroup: def.id === 'src-reddit-ppl' && spec.title.startsWith('Pull A') ? 'pull-hinge' : spec.group,
            roleId: def.id + '-' + spec.title,
            dependsOn: depends,
            progressionStep: def.progression
        });
    }
    if (events.some(e => sessions.some(s => s.date === e.date)))
        errors.push('A published workout overlaps a commitment. Review the start date or availability; the source order is preserved.');
    if (errors.length)
        return {
            plan: null,
            errors: [...new Set(errors)]
        };
    return {
        errors: [],
        plan: {
            id,
            name: def.name + ' by ' + def.creator,
            version: 1,
            progressionModel: 'source',
            profile: {
                ...p,
                days,
                programId: def.id
            },
            acceptedAt: null,
            sessions,
            phases: [{
                    name: 'Published progression',
                    weeks: `1–${p.weeks}`,
                    description: 'Repeat the verified source sequence. Work changes follow recorded performance and an accepted proposal; no app-authored final-week deload is inserted.'
                }],
            evidence: ['ACSM-2026', 'RT-PRESCRIPTION', 'RIR-RESEARCH', 'RT-DOSE', 'REST-INTERVALS', def.id],
            notes: [`Creator/source: ${def.creator}. ${def.url}`, `Version: ${def.version}`, def.scope, ...def.adaptations, 'Preloaded exercise, set and repetition facts with original app instructions. No creator endorsement or independent trial of this exact named routine is claimed.', 'Starting weights are unknown until you choose manageable equipment loads. Missing or partial records do not become successful or failed attempts. Source order waits for the preceding workout: restore/move a skipped workout, or review a new opening source block after partial work. Fully recorded positive-rep misses may continue with the source repeat or approved change.'],
            progression: def.progression,
            template: def.id,
            paused: false
        }
    };
}
function sourceLoadSuggestion(s, i) {
    var rule = i.sourceRule;
    // Earlier substitutions could retain the original lift's rule. Keep those
    // saved targets intact, but only apply automatic rules to a source movement.
    var definition = sourceProgram(s.plan?.template);
    if (rule && !definition?.slots.some(slot => slot.items.some(item => item.exerciseId === i.exerciseId && item.sourceRule?.kind === rule.kind)))
        rule = undefined;
    var creatorGzcl = i.loadRole?.endsWith('/creator-2016-v2');
    if (s.hold || s.plan?.paused || s.profile.age < 18 || s.profile.mode !== 'app')
        return {
            kg: null,
            reason: 'Published-routine progression is held or owner-directed.'
        };
    var e = (0, _training.exFor)(i.exerciseId, s.custom), machine = e.requiresSetup, limit = (0, _training.equipmentLimit)(s, i.exerciseId), context = s.loadContext?.[i.exerciseId];
    var fit = (0, _equipment.equipmentFit)(e, s.profile);
    if (s.profile.inventory?.confirmed && !fit.available)
        return {
            kg: null,
            reason: fit.reason + ' Review equipment or a suitable routine before progressing.'
        };
    if (limit === 0)
        return {
            kg: null,
            reason: 'This equipment is marked unavailable. Review equipment or the routine before selecting a load.'
        };
    if (i.kg !== null) {
        if (!e.loadTracked || e.metric !== 'reps' || !Number.isFinite(i.kg) || i.kg < 0 || i.kg > 1500)
            return {
                kg: null,
                reason: 'Review a valid starting weight for this exercise.'
            };
        if (limit !== undefined && i.kg > limit)
            return {
                kg: null,
                reason: 'The reviewed source load exceeds the current equipment limit.'
            };
        if (machine && (!context || i.loadContext !== context))
            return {
                kg: null,
                reason: 'This reviewed load belongs to a different or unrecorded machine setup. Select a manageable load for the current setup.'
            };
        return {
            kg: i.kg,
            reason: rule ? 'Reviewed source load for this session. Reassess during the warm-up.' : 'Starting weight reviewed for this substitute. You choose its progression; automatic source increases are disabled.'
        };
    }
    if (!rule)
        return {
            kg: null,
            reason: 'Choose your own starting weight and progression for this substitute; automatic source increases and stage changes are disabled.'
        };
    var records = s.history.filter(w => w.finishedAt && w.targets?.some(t => t.exerciseId === i.exerciseId && t.loadRole === i.loadRole && t.sourceRule?.kind === rule.kind) && (!machine || !!context && w.loadContext?.[i.exerciseId] === context)).sort((a, b) => b.date.localeCompare(a.date) || (b.finishedAt || 0) - (a.finishedAt || 0));
    var w = records[0], t = w?.targets?.find(t => t.exerciseId === i.exerciseId);
    if (!w || !t)
        return {
            kg: null,
            reason: 'Choose a manageable starting load for this source exercise and setup; no personal weight is inferred.'
        };
    var a = w.sets.filter(x => x.exerciseId === i.exerciseId && x.done).sort((x, y) => x.set - y.set), kg = a[0]?.kg;
    if (w.partial || w.symptom !== 'no' || a.length !== t.sets || a.some((x, n) => x.set !== n + 1 || x.kg !== kg || !Number.isInteger(x.reps) || x.reps <= 0 || !(0, _training.comparableSet)(x)) || kg == null || kg <= 0 || (0, _training.dayDistance)(w.date, (0, _training.day)()) < 0 || (0, _training.dayDistance)(w.date, (0, _training.day)()) > 35 || machine && !context)
        return {
            kg: null,
            date: w.date,
            reason: 'Reassess the load. Partial, unmatched, old or concern-flagged records do not qualify as a source success or failure.'
        };
    if (limit !== undefined && kg > limit)
        return {
            kg: null,
            date: w.date,
            reason: 'The previous load exceeds current equipment capacity.'
        };
    if (rule.kind === 'hold' || rule.kind === 'gzcl-t3' && !creatorGzcl)
        return {
            kg,
            date: w.date,
            reason: rule.kind === 'hold' ? 'Record actual hold time; no automatic seconds increase.' : 'The verified public source gives T3 quality-AMRAP work. A numeric increase threshold is not verified in this excerpt; review this assistance load individually.'
        };
    var previousRule = t.sourceRule, stage = previousRule.stage ?? 0, min = t.repMin ?? t.reps, hi = t.repMax ?? min, total = a.reduce((n, x) => n + x.reps, 0);
    if ((rule.stage ?? 0) !== stage || i.sets !== t.sets || (i.repMin ?? i.reps) !== min || i.repMax !== t.repMax)
        return {
            kg: null,
            date: w.date,
            reason: 'The previous record belongs to a different source stage or target. Select a manageable current-stage load; no new baseline or progression change is inferred.'
        };
    var success = rule.kind === 'fitness-basic' ? total >= 15 : creatorGzcl && rule.kind === 'gzcl-t1' ? total >= t.sets * min : creatorGzcl && rule.kind === 'gzcl-t3' ? a.slice(0, -1).every(x => x.reps >= min) && a.at(-1).reps >= 25 : a.every(x => x.reps >= (['double', 'phul', 'db-stopgap'].includes(rule.kind) ? hi : min));
    var last = a.at(-1), upper = !['bar-squat', 'deadlift'].includes(i.exerciseId), metric = s.profile.units === 'kg';
    var desired = rule.kind === 'fitness-basic' ? (0, _training.toKg)(upper ? metric ? 1.25 : 2.5 : metric ? 2.5 : 5, s.profile.units) : (0, _training.toKg)(rule.kind.startsWith('gzcl') || rule.kind === 'ppl-main' ? upper || i.exerciseId === 'bar-squat' && rule.kind === 'ppl-main' ? metric ? 2.5 : 5 : metric ? 5 : 10 : metric ? 2.5 : 5, s.profile.units);
    if (creatorGzcl && metric && ['gzcl-t1', 'gzcl-t2'].includes(rule.kind))
        desired = 2.5;
    if (rule.kind === 'fitness-basic' && last.reps > 10)
        desired *= 2;
    var step = s.incrementKg?.[i.exerciseId], recent = r => (0, _training.dayDistance)(r.date, (0, _training.day)()) >= 0 && (0, _training.dayDistance)(r.date, (0, _training.day)()) <= 35, failed = r => {
        var target = r.targets?.find(x => x.exerciseId === i.exerciseId), sets = r.sets.filter(x => x.exerciseId === i.exerciseId && x.done).sort((x, y) => x.set - y.set);
        return recent(r) && !r.partial && r.symptom === 'no' && target?.sets === t.sets && (target.repMin ?? target.reps) === min && sets.length === t.sets && sets.every((x, n) => x.set === n + 1 && x.kg === kg && (0, _training.comparableSet)(x)) && (rule.kind === 'fitness-basic' ? sets.reduce((n, x) => n + x.reps, 0) < 15 : sets.some(x => x.reps < min));
    };
    if (!success && ['gzcl-t1', 'gzcl-t2'].includes(rule.kind)) {
        if (stage === 2)
            return {
                kg,
                date: w.date,
                reason: creatorGzcl ? rule.kind === 'gzcl-t1' ? 'The final T1 stage missed its base volume. The creator reassesses a 5RM after 2–3 recovery days and starts a new 5×3+ cycle at 85% of that separately assessed load. Review a new opening block; no test result or starting weight is guessed.' : 'The final T2 stage missed its base volume. Review a new 3×10 opening block at a manageable load modestly above the prior cycle’s opening load, within the creator’s 20 lb / 9 kg ceiling. The app does not invent that prior baseline.' : 'The final source stage was not completed. Reassess the source baseline and review a new opening block; no maximum or reset weight is guessed.'
            };
        var nextStage = stage + 1, nextSets = rule.kind === 'gzcl-t1' ? [5, 6, 10][nextStage] : 3, nextReps = rule.kind === 'gzcl-t1' ? [3, 2, 1][nextStage] : [10, 8, 6][nextStage];
        return {
            kg,
            nextKg: kg,
            date: w.date,
            ready: true,
            reason: `Recorded ${t.sets}×${min} source work was not completed. Review the next ${nextSets}×${nextReps} stage at the same load.`,
            nextItem: {
                ...i,
                sets: nextSets,
                reps: nextReps,
                repMin: nextReps,
                repMax: nextReps,
                sourceRule: {
                    ...rule,
                    stage: nextStage
                }
            }
        };
    }
    var stalled = rule.kind === 'db-stopgap' && !success && records.length >= 3 && records.slice(0, 3).every(r => recent(r) && !r.partial && r.symptom === 'no' && r.targets?.find(x => x.exerciseId === i.exerciseId)?.sets === t.sets && JSON.stringify(r.sets.filter(x => x.exerciseId === i.exerciseId && x.done).sort((x, y) => x.set - y.set).map(x => [x.set, x.kg, x.reps])) === JSON.stringify(a.map(x => [x.set, x.kg, x.reps])));
    var reduction = rule.kind === 'fitness-basic' && !success || ['sl5x5', 'ppl-main'].includes(rule.kind) && records.length >= 3 && records.slice(0, 3).every(failed) || stalled;
    if (!success && !reduction)
        return {
            kg,
            date: w.date,
            reason: 'Repeat the source load and targets. The recorded work does not yet satisfy its progression rule.'
        };
    if (w.effort === 'harder' && success)
        return {
            kg,
            date: w.date,
            reason: 'The source rep criterion is met, but your harder-than-planned feedback holds an increase for review.'
        };
    if (creatorGzcl && success && ['gzcl-t1', 'gzcl-t3'].includes(rule.kind) && (!(0, _training.validSetRir)(last.rir) || last.rir < 1 || rule.kind === 'gzcl-t1' && last.reps > 10))
        return {
            kg,
            date: w.date,
            reason: 'The creator AMRAP rule keeps 1–2 reps in reserve and caps T1 final sets at ten reps. Review and record the final set’s effort before increasing; legacy exercise-level RIR does not fill it.'
        };
    if (success && rule.minRir !== undefined && a.some(x => x.rir == null || x.rir < rule.minRir))
        return {
            kg,
            date: w.date,
            reason: 'The source asks for at least one rep left. Record set-specific effort before reviewing an increase. PHUL’s top-of-range trigger is an app overlay.'
        };
    if (!step || !Number.isFinite(step) || step <= 0)
        return {
            kg,
            date: w.date,
            ready: true,
            reason: 'Enter the actual available load increment before reviewing a source load change.'
        };
    if (!reduction && !['double', 'phul', 'db-stopgap', ...(creatorGzcl ? ['gzcl-t3'] : [])].includes(rule.kind) && Math.abs(desired / step - Math.round(desired / step)) > 1e-5)
        return {
            kg,
            date: w.date,
            ready: true,
            reason: 'The source increment does not fit your available equipment step. Review a source-approved microloading alternative; no larger step is invented.'
        };
    if (e.equipment === 'Dumbbell' && s.profile.inventory?.confirmed && s.profile.inventory.dumbbellLoading === 'fixed')
        return {
            kg,
            date: w.date,
            atCapacity: true,
            reason: 'This dumbbell pair is fixed. No source load increase is available; review equipment or a different routine.'
        };
    var delta = reduction ? stalled ? 2 * step : Math.max(step, Math.round(kg * .1 / step) * step) : ['double', 'phul', 'db-stopgap', ...(creatorGzcl ? ['gzcl-t3'] : [])].includes(rule.kind) ? step : desired, next = Math.round((kg + (reduction ? -delta : delta)) * 1e6) / 1e6;
    if (next <= 0)
        return {
            kg,
            date: w.date,
            reason: 'The source reduction needs a newly selected manageable load; the available step would reach zero.'
        };
    if (limit !== undefined && next > limit)
        return {
            kg,
            date: w.date,
            atCapacity: true,
            reason: 'The source next step exceeds available equipment. Keep the load and review equipment or the routine.'
        };
    return {
        kg,
        nextKg: next,
        date: w.date,
        ready: true,
        reason: reduction ? `Review the source ${stalled ? 'two-step' : 'approximately ten-percent'} reduction after the required recorded criterion.` : `The recorded source progression criterion is met. Review the available ${(0, _training.displayLoad)(next, s.profile.units)} load; this source trigger is not the app’s ordinary two-workout rule.`
    };
}
function sourceLoadProposal(s) {
    var plan = s.plan;
    if (!plan || plan.progressionModel !== 'source' || s.active || s.hold || plan.paused)
        return {
            error: 'Finish the active workout or resolve the hold before reviewing source progression.'
        };
    var _loop = function (ss) {
        var _loop2 = function (i) {
            var a = sourceLoadSuggestion(s, i);
            if (a.nextKg === undefined)
                return 0; // continue
            var items = ss.items.map(x => x === i ? {
                ...(a.nextItem || x),
                kg: a.nextKg,
                loadContext: s.loadContext?.[x.exerciseId]
            } : x), minutes = (0, _training.estimateSessionMinutes)(items);
            if (minutes > plan.profile.minutes)
                return {
                    v: {
                        v: {
                            error: `The source next stage needs about ${minutes} minutes. Increase the window or review a different routine; rest is not compressed.`
                        }
                    }
                };
            var changes = [{
                    sessionId: ss.id,
                    patch: {
                        items,
                        minutes
                    }
                }];
            if (a.nextItem)
                for (var future of plan.sessions.filter(x => x.status === 'scheduled' && x.date > ss.date && x.items.some(t => t.exerciseId === i.exerciseId && t.loadRole === i.loadRole))) {
                    var changedItems = future.items.map(x => x.exerciseId === i.exerciseId && x.loadRole === i.loadRole ? {
                        ...x,
                        sets: a.nextItem.sets,
                        reps: a.nextItem.reps,
                        repMin: a.nextItem.repMin,
                        repMax: a.nextItem.repMax,
                        sourceRule: {
                            ...a.nextItem.sourceRule
                        },
                        kg: null
                    } : x), nextMinutes = (0, _training.estimateSessionMinutes)(changedItems);
                    if (nextMinutes > plan.profile.minutes)
                        return {
                            v: {
                                v: {
                                    error: 'A future source stage exceeds your available time. Review the session window first.'
                                }
                            }
                        };
                    changes.push({
                        sessionId: future.id,
                        patch: {
                            items: changedItems,
                            minutes: nextMinutes
                        }
                    });
                }
            return {
                v: {
                    v: {
                        proposal: {
                            id: (0, _training.uid)('proposal'),
                            title: 'Review source progression · ' + (0, _training.exFor)(i.exerciseId).name,
                            type: 'load',
                            planId: plan.id,
                            baseVersion: plan.version,
                            historyCount: s.history.length,
                            sessionId: ss.id,
                            status: 'pending',
                            patch: {
                                items,
                                minutes
                            },
                            changes,
                            source: plan.template,
                            createdAt: new Date().toISOString(),
                            reason: a.reason,
                            before: `${i.sets} × ${i.repMin ?? i.reps} · ${(0, _training.displayLoad)(a.kg, s.profile.units)}`,
                            after: `${a.nextItem?.sets ?? i.sets} × ${a.nextItem?.repMin ?? i.repMin ?? i.reps} · ${(0, _training.displayLoad)(a.nextKg, s.profile.units)}`
                        }
                    }
                }
            };
        }, _ret2;
        for (var i of ss.items) {
            _ret2 = _loop2(i);
            if (_ret2 === 0)
                continue;
            if (_ret2)
                return _ret2.v;
        }
    }, _ret;
    for (var ss of plan.sessions.filter(s => s.status === 'scheduled' && !s.needsReview).sort((a, b) => a.date.localeCompare(b.date))) {
        _ret = _loop(ss);
        if (_ret)
            return _ret.v;
    }
    return {
        error: 'No source change is ready. Record comparable work and the available increment. Missing, partial or concern-flagged work does not count as a success or failure.'
    };
}
export { sourcePrograms };
export { sourceProgram };
export { buildSourcePlan };
export { sourceLoadSuggestion };
export { sourceLoadProposal };
