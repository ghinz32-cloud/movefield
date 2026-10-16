// Recovered executed implementation; typed public contract is in the adjacent declaration.
// Confirmed inventory is a closed list for one training location. An old broad
// equipment label remains unknown until its owner completes this survey.
// Confirmed inventory is a closed list for one training location. An old broad
// equipment label remains unknown until its owner completes this survey.
var equipmentChoices = [['chair', 'Stable seated support / chair', 'Basics'], ['floor', 'Comfortable floor space', 'Basics'], ['wall', 'Clear wall', 'Basics'], ['support', 'Secure raised push-up support', 'Basics'], ['band', 'Resistance band', 'Home'], ['band-anchor', 'Anchor designed for band exercises', 'Home'], ['pullup-bar', 'Secure pull-up bar', 'Home'], ['bench', 'Flat weight bench', 'Weights'], ['incline-bench', 'Adjustable incline bench', 'Weights'], ['barbell', 'Barbell and plates', 'Weights'], ['bar-pad', 'Secure barbell hip-thrust pad', 'Weights'], ['ez-bar', 'EZ curl bar and plates', 'Weights'], ['rack', 'Squat rack with safeties', 'Weights'], ['kettlebell', 'Kettlebell', 'Weights'], ['cable', 'Adjustable cable station — selected stack', 'Machines'], ['dual-cable', 'Two adjustable cable towers with matching stacks', 'Machines'], ['cable-rope', 'Rope attachment for cable exercises', 'Machines'], ['pulldown', 'Lat-pulldown station — selected stack', 'Machines'], ['row-machine', 'Seated row machine — selected stack', 'Machines'], ['plate-row-machine', 'Seated row machine — added plates', 'Machines'], ['chest-press', 'Chest-press machine — selected stack', 'Machines'], ['pec-deck', 'Pec-deck chest fly — selected stack', 'Machines'], ['reverse-fly', 'Reverse-fly machine setting — selected stack', 'Machines'], ['plate-chest-press', 'Chest-press machine — added plates', 'Machines'], ['incline-press', 'Incline chest-press machine — selected stack', 'Machines'], ['plate-incline-press', 'Incline chest-press machine — added plates', 'Machines'], ['shoulder-press', 'Shoulder-press machine — selected stack', 'Machines'], ['plate-shoulder-press', 'Shoulder-press machine — added plates', 'Machines'], ['leg-press', 'Leg-press machine — selected stack', 'Machines'], ['plate-leg-press', 'Leg-press machine — added plates', 'Machines'], ['hack-squat', 'Hack-squat machine — selected stack', 'Machines'], ['plate-hack-squat', 'Hack-squat machine — added plates', 'Machines'], ['leg-curl', 'Leg-curl machine — selected stack', 'Machines'], ['leg-extension', 'Leg-extension machine — selected stack', 'Machines'], ['calf-machine', 'Standing calf-raise machine — selected stack', 'Machines'], ['seated-calf', 'Seated calf-raise machine — selected stack', 'Machines'], ['calf-press', 'Dedicated calf-press machine — selected stack', 'Machines'], ['plate-calf-machine', 'Calf-raise machine — added plates', 'Machines'], ['hip-thrust', 'Hip-thrust machine — added plates', 'Machines'], ['ab-machine', 'Abdominal-crunch machine — selected stack', 'Machines'], ['plate-ab-machine', 'Abdominal-crunch machine — added plates', 'Machines'], ['route', 'Suitable walking/running route', 'Activity']];
var emptyInventory = () => ({
    confirmed: false,
    items: [],
    dumbbells: 'none',
    dumbbellLoading: 'fixed'
});
/** Setup presets are editable suggestions; confirmation is still the owner's choice. */
function defaultInventory(equipment = 'Full gym') {
    var items = equipment === 'Full gym' ? equipmentChoices.map(x => x[0]) : equipment === 'Bodyweight + band' ? ['chair', 'floor', 'wall', 'support', 'band', 'band-anchor', 'route'] : ['chair', 'floor', 'wall', 'support', 'route'];
    return {
        confirmed: false,
        items,
        dumbbells: ['Full gym', 'Dumbbells'].includes(equipment) ? 'pair' : 'none',
        dumbbellLoading: 'adjustable'
    };
}
var movementRoles = {};
function define(ids, role, needs, muscles, extra = {}) {
    for (var id of ids)
        movementRoles[id] = {
            role,
            needs,
            muscles,
            ...extra
        };
}
define(['bench'], 'horizontal-press', ['barbell', 'bench', 'rack'], ['chest', 'triceps', 'front shoulders']);
define(['lib-db-flat-bench-press'], 'horizontal-press', ['bench'], ['chest', 'triceps', 'front shoulders'], {
    dumbbells: 2
});
define(['lib-db-floor-press'], 'horizontal-press', ['floor'], ['chest', 'triceps'], {
    dumbbells: 2,
    floor: true,
    difference: 'The floor limits the bottom of the press; this changes the range of motion.'
});
define(['pushup'], 'horizontal-press', [], ['chest', 'triceps', 'front shoulders'], {
    difference: 'Support height changes resistance. Use a wall or a secure raised support.'
});
define(['ref-Pushups'], 'horizontal-press', ['floor'], ['chest', 'triceps', 'front shoulders'], {
    floor: true
});
define(['lib-stack-chest-press'], 'horizontal-press', ['chest-press'], ['chest', 'triceps', 'front shoulders'], {
    difference: 'The machine guides the path; its displayed load has a separate baseline.'
});
define(['incline-press'], 'incline-press', ['incline-bench'], ['chest', 'triceps', 'front shoulders'], {
    dumbbells: 2
});
define(['lib-bar-incline-bench'], 'incline-press', ['barbell', 'incline-bench', 'rack'], ['chest', 'triceps', 'front shoulders']);
define(['lib-stack-incline-chest-press'], 'incline-press', ['incline-press'], ['chest', 'triceps', 'front shoulders']);
define(['ohp'], 'vertical-press', [], ['shoulders', 'triceps'], {
    dumbbells: 2
});
define(['ref-Dumbbell_One-Arm_Shoulder_Press', 'ref-Standing_Palm-In_One-Arm_Dumbbell_Press'], 'vertical-press', [], ['shoulders', 'triceps'], {
    dumbbells: 1,
    difference: 'Complete both sides; the one-arm version takes longer than a simultaneous press.'
});
define(['lib-stack-shoulder-press'], 'vertical-press', ['shoulder-press'], ['shoulders', 'triceps']);
define(['row'], 'horizontal-pull', [], ['upper back', 'lats', 'elbow flexors'], {
    dumbbells: 1
});
define(['lib-bar-bent-over-row'], 'horizontal-pull', ['barbell'], ['upper back', 'lats', 'elbow flexors']);
define(['lib-cable-seated-row'], 'horizontal-pull', ['cable'], ['upper back', 'lats', 'elbow flexors']);
define(['lib-stack-seated-row'], 'horizontal-pull', ['row-machine'], ['upper back', 'lats', 'elbow flexors']);
define(['band-row'], 'horizontal-pull', ['band', 'band-anchor', 'floor'], ['upper back', 'lats', 'elbow flexors'], {
    floor: true,
    difference: 'Band resistance changes through the movement. Record the band, anchor and starting distance.'
});
define(['lib-band-standing-row'], 'horizontal-pull', ['band', 'band-anchor'], ['upper back', 'lats', 'elbow flexors']);
define(['ref-Shoulder_Press_-_With_Bands'], 'vertical-press', ['band'], ['shoulders', 'triceps']);
define(['lib-single-db-floor-press'], 'horizontal-press', ['floor'], ['chest', 'triceps'], {
    dumbbells: 1,
    floor: true,
    difference: 'One-arm floor pressing uses a shorter range and takes time for both sides.'
});
define(['pulldown'], 'vertical-pull', ['pulldown'], ['lats', 'elbow flexors']);
define(['lib-cable-straight-arm-pulldown'], 'vertical-pull', ['cable'], ['lats'], {
    difference: 'This straight-arm variation does not provide the same elbow-flexor work.'
});
define(['ref-Pullups', 'ref-Chin-Up'], 'vertical-pull', ['pullup-bar'], ['lats', 'elbow flexors'], {
    difference: 'This requires lifting your bodyweight. Choose a manageable variation; it is not a light starting-load substitute.'
});
define(['squat'], 'squat', [], ['quadriceps', 'glutes'], {
    dumbbells: 1
});
define(['bw-squat'], 'squat', [], ['quadriceps', 'glutes'], {
    difference: 'Bodyweight may become too light for continued strength or muscle gains.'
});
define(['bar-squat'], 'squat', ['barbell', 'rack'], ['quadriceps', 'glutes']);
define(['lib-stack-leg-press'], 'squat', ['leg-press'], ['quadriceps', 'glutes'], {
    difference: 'Leg press reduces balance and trunk demands; it does not count as barbell-squat practice.'
});
define(['lib-stack-hack-squat'], 'squat', ['hack-squat'], ['quadriceps', 'glutes']);
define(['split'], 'split-squat', [], ['quadriceps', 'glutes']);
define(['lib-db-split-squat'], 'split-squat', [], ['quadriceps', 'glutes'], {
    dumbbells: 2
});
define(['lib-single-db-split-squat'], 'split-squat', [], ['quadriceps', 'glutes'], {
    dumbbells: 1
});
define(['rdl'], 'hinge', [], ['hamstrings', 'glutes'], {
    dumbbells: 2
});
define(['lib-single-db-rdl'], 'hinge', [], ['hamstrings', 'glutes'], {
    dumbbells: 1
});
define(['deadlift', 'lib-bar-rdl'], 'hinge', ['barbell'], ['hamstrings', 'glutes', 'back extensors'], {
    difference: 'Deadlift and Romanian deadlift differ in knee bend, starting position and competition-lift specificity.'
});
define(['lib-kb-double-rdl'], 'hinge', ['kettlebell'], ['hamstrings', 'glutes'], {
    difference: 'This version needs two equal kettlebells; confirm the pair before selecting it.'
});
define(['ref-Band_Good_Morning'], 'hinge', ['band'], ['hamstrings', 'glutes'], {
    difference: 'Use the band setup in the guide. Do not convert the band to a guessed kilogram load.'
});
define(['bridge'], 'hip-extension', ['floor'], ['glutes'], {
    floor: true,
    difference: 'A bridge trains hip extension but does not replace the hamstring work of a Romanian deadlift.'
});
define(['lib-plate-hip-thrust'], 'hip-extension', ['hip-thrust'], ['glutes']);
define(['ref-Seated_Band_Hamstring_Curl'], 'knee-flexion', ['band', 'band-anchor', 'chair'], ['hamstrings']);
define(['leg-curl', 'lib-stack-seated-leg-curl'], 'knee-flexion', ['leg-curl'], ['hamstrings']);
define(['ref-Lying_Leg_Curls'], 'knee-flexion', ['leg-curl'], ['hamstrings']);
define(['leg-extension', 'lib-stack-single-leg-extension'], 'knee-extension', ['leg-extension'], ['quadriceps']);
define(['calf'], 'calf', [], ['calves']);
define(['ref-Standing_Dumbbell_Calf_Raise'], 'calf', [], ['calves'], {
    dumbbells: 2
});
define(['lib-stack-standing-calf-raise'], 'calf', ['calf-machine'], ['calves']);
define(['curl', 'lib-db-hammer-curl'], 'elbow-flexion', [], ['elbow flexors'], {
    dumbbells: 2
});
define(['lib-cable-curl'], 'elbow-flexion', ['cable'], ['elbow flexors']);
define(['lib-single-db-curl'], 'elbow-flexion', [], ['elbow flexors'], {
    dumbbells: 1
});
define(['lib-band-curl'], 'elbow-flexion', ['band'], ['elbow flexors']);
define(['ref-Band_Skull_Crusher'], 'elbow-extension', ['band', 'floor'], ['triceps'], {
    floor: true
});
define(['triceps', 'lib-cable-overhead-triceps', 'lib-cable-single-arm-pushdown'], 'elbow-extension', ['cable'], ['triceps']);
define(['lib-db-overhead-triceps'], 'elbow-extension', [], ['triceps'], {
    dumbbells: 1
});
define(['lateral'], 'lateral-raise', [], ['side shoulders'], {
    dumbbells: 2
});
define(['ref-One-Arm_Side_Laterals'], 'lateral-raise', [], ['side shoulders'], {
    dumbbells: 1
});
define(['ref-Lateral_Raise_-_With_Bands'], 'lateral-raise', ['band'], ['side shoulders']);
define(['deadbug', 'core-dead-bug'], 'anti-extension', ['floor'], ['trunk stabilizers'], {
    floor: true,
    difference: 'These train trunk control with different limb actions. Keep each variation in its own history.'
});
define(['plank'], 'anti-extension', ['floor'], ['trunk stabilizers'], {
    floor: true,
    difference: 'A timed forearm hold is distinct from moving dead-bug repetitions; preserve its seconds metric and separate history.'
});
define(['core-bird-dog'], 'opposite-limb-control', ['floor'], ['trunk stabilizers'], {
    floor: true
});
define(['core-band-pallof-press'], 'anti-rotation', ['band', 'band-anchor'], ['trunk stabilizers'], {
    difference: 'Pallof press resists rotation; it differs from the back-extension control of a dead bug.'
});
define(['core-cable-pallof-press'], 'anti-rotation', ['cable'], ['trunk stabilizers'], {
    difference: 'Pallof press resists rotation; it differs from the back-extension control of a dead bug.'
});
define(['lib-small-jump-reset'], 'jump-landing', [], ['quadriceps', 'glutes', 'calves']);
function inventoryErrors(p) {
    var v = p.inventory;
    if (!v)
        return [];
    var errors = [];
    if (typeof v.confirmed !== 'boolean' || !Array.isArray(v.items) || new Set(v.items).size !== v.items.length || v.items.some(k => !equipmentChoices.some(x => x[0] === k)) || !['none', 'single', 'pair'].includes(v.dumbbells) || !['fixed', 'adjustable'].includes(v.dumbbellLoading))
        return ['Choose supported equipment and dumbbell options without duplicates.'];
    if (p.mode !== 'app')
        return [];
    if (!v.confirmed)
        errors.push('Confirm the equipment you can reliably use at this location.');
    if (v.items.includes('band-anchor') && !v.items.includes('band'))
        errors.push('A band anchor also needs a resistance band.');
    if (p.dumbbellMaxKg === 0 && v.dumbbells !== 'none')
        errors.push('Your dumbbell limit is zero. Update the limit or mark dumbbells unavailable.');
    return errors;
}
function equipmentFit(e, p) {
    var v = p?.inventory;
    if (!v?.confirmed)
        return {
            available: true,
            known: false,
            reason: 'Confirm equipment and setup before selecting.'
        };
    if (['walk', 'run'].includes(e.id))
        return {
            available: v.items.includes('route'),
            known: true,
            reason: 'Needs a suitable route.'
        };
    if (/unconfirmed|unspecified/i.test(e.equipment))
        return {
            available: false,
            known: false,
            reason: 'This variation does not identify its machine loading type. Use a separately reviewed variation or confirm the exact machine for manual tracking.'
        };
    var m = movementRoles[e.id];
    if (!m)
        return {
            available: false,
            known: false,
            reason: 'This variation has no reviewed inventory match. Confirm its guide and use manual tracking.'
        };
    if (p?.noFloor && m.floor)
        return {
            available: false,
            known: true,
            reason: 'Includes floor transfers.'
        };
    var missing = m.needs.filter(k => !v.items.includes(k));
    if (['pushup', 'calf'].includes(e.id) && !v.items.includes('wall') && !v.items.includes('support'))
        missing.push('support');
    var dbCount = v.dumbbells === 'pair' ? 2 : v.dumbbells === 'single' ? 1 : 0;
    if (m.dumbbells && dbCount < m.dumbbells)
        return {
            available: false,
            known: true,
            reason: `Needs ${m.dumbbells === 2 ? 'two equal dumbbells' : 'one dumbbell'}.`
        };
    // The survey records a single kettlebell; a double-kettlebell lift needs extra confirmation.
    if (e.id === 'lib-kb-double-rdl')
        return {
            available: false,
            known: true,
            reason: 'Needs a confirmed pair of equal kettlebells.'
        };
    return {
        available: !missing.length,
        known: true,
        reason: missing.length ? 'Needs ' + missing.map(k => equipmentChoices.find(x => x[0] === k)?.[1] || k).join(', ') : 'Fits your confirmed equipment.'
    };
}
function sameFunctionIds(id) {
    var role = movementRoles[id]?.role;
    return role ? Object.keys(movementRoles).filter(k => k !== id && movementRoles[k].role === role) : [];
}
function prescriptionAlternatives(id, p) {
    // Bodyweight pull-ups and straight-arm pulldowns require an explicit choice;
    // a broad role is not sufficient to auto-prescribe them as a novice replacement.
    var explicitOnly = new Set(['ref-Pullups', 'ref-Chin-Up', 'lib-cable-straight-arm-pulldown', 'lib-kb-double-rdl']);
    return sameFunctionIds(id).filter(k => !explicitOnly.has(k)).sort((a, b) => {
        var score = k => {
            var m = movementRoles[k];
            return (p.equipment === 'Full gym' ? m.needs.some(n => ['chest-press', 'leg-press', 'cable', 'row-machine'].includes(n)) ? 3 : 0 : p.equipment === 'Bodyweight + band' ? m.needs.includes('band') ? 4 : m.dumbbells ? -5 : 1 : m.dumbbells ? 4 : m.needs.includes('band') ? -2 : 0) + (m.difference ? -1 : 0);
        };
        return score(b) - score(a);
    });
}
function equipmentSummary(exercises, p) {
    var keys = new Set();
    var dumbbells = 0;
    for (var e of exercises) {
        var m = movementRoles[e.id];
        for (var key of m?.needs || [])
            keys.add(key);
        dumbbells = Math.max(dumbbells, m?.dumbbells || 0);
        if (['walk', 'run'].includes(e.id))
            keys.add('route');
        if (['pushup', 'calf'].includes(e.id))
            keys.add(p.inventory?.items.includes('wall') ? 'wall' : 'support');
    }
    return [...(dumbbells ? [dumbbells === 2 ? 'Two equal dumbbells / matching pairs' : 'One dumbbell'] : []), ...[...keys].map(k => equipmentChoices.find(x => x[0] === k)?.[1] || k)];
}
function recoveryGroupsOverlap(a, b) {
    if (a === 'activity' || b === 'activity')
        return false;
    if (a === 'pull-hinge' || b === 'pull-hinge')
        return ['pull-hinge', 'pull', 'upper', 'lower', 'full'].includes(a === 'pull-hinge' ? b || '' : a || '');
    if (!a || !b)
        return a === b;
    if (a === b)
        return true;
    var upper = new Set(['upper', 'push', 'pull']);
    if (a === 'full' || b === 'full')
        return a !== 'run' && b !== 'run';
    return a === 'upper' && upper.has(b) || b === 'upper' && upper.has(a);
}
define(['lib-plate-chest-press'], 'horizontal-press', ['plate-chest-press'], ['chest', 'triceps', 'front shoulders']);
define(['lib-plate-incline-chest-press'], 'incline-press', ['plate-incline-press'], ['chest', 'triceps', 'front shoulders']);
define(['lib-plate-shoulder-press'], 'vertical-press', ['plate-shoulder-press'], ['shoulders', 'triceps']);
define(['lib-plate-chest-supported-row'], 'horizontal-pull', ['plate-row-machine'], ['upper back', 'lats', 'elbow flexors']);
define(['lib-plate-leg-press-45'], 'squat', ['plate-leg-press'], ['quadriceps', 'glutes'], {
    difference: 'A leg press is not barbell-squat practice. Its added plates have a separate baseline.'
});
define(['lib-plate-hack-squat'], 'squat', ['plate-hack-squat'], ['quadriceps', 'glutes']);
define(['lib-plate-standing-calf-raise'], 'calf', ['plate-calf-machine'], ['calves']);
// Public-routine variations keep their existing IDs, guides and load conventions.
define(['ref-Standing_Military_Press'], 'vertical-press', ['barbell', 'rack'], ['shoulders', 'triceps']);
define(['ref-Barbell_Curl'], 'elbow-flexion', ['barbell'], ['elbow flexors']);
define(['ref-EZ-Bar_Skullcrusher'], 'elbow-extension', ['ez-bar', 'bench'], ['triceps']);
define(['ref-Dumbbell_Flyes'], 'chest-fly', ['bench'], ['chest'], {
    dumbbells: 2
});
define(['ref-Incline_Dumbbell_Curl'], 'elbow-flexion', ['incline-bench'], ['elbow flexors'], {
    dumbbells: 2
});
define(['ref-Front_Barbell_Squat'], 'squat', ['barbell', 'rack'], ['quadriceps', 'glutes']);
define(['ref-Barbell_Lunge'], 'split-squat', ['barbell', 'rack'], ['quadriceps', 'glutes']);
define(['lib-stack-seated-calf-raise'], 'calf', ['seated-calf'], ['calves']);
define(['ref-Calf_Press'], 'calf', ['calf-press'], ['calves']);
define(['ref-Face_Pull', 'lib-cable-face-pull'], 'face-pull', ['cable', 'cable-rope'], ['rear shoulders', 'upper back'], {
    difference: 'Needs a suitable rope attachment and face-height pulley setup.'
});
define(['ref-Dumbbell_Lunges'], 'split-squat', [], ['quadriceps', 'glutes'], {
    dumbbells: 2
});
define(['ref-Stiff-Legged_Dumbbell_Deadlift'], 'hinge', [], ['hamstrings', 'glutes'], {
    dumbbells: 2
});
define(['ref-Seated_Dumbbell_Press'], 'vertical-press', ['chair'], ['shoulders', 'triceps'], {
    dumbbells: 2
});
define(['ref-Bent_Over_Two-Dumbbell_Row'], 'horizontal-pull', [], ['upper back', 'lats', 'elbow flexors'], {
    dumbbells: 2
});
// Reviewed guide-specific equipment and muscle roles. A fly is not a press;
// face pulls remain separate from reverse flyes and ordinary rowing movements.
define(['lib-db-chest-supported-row'], 'horizontal-pull', ['incline-bench'], ['upper back', 'lats', 'elbow flexors'], {
    dumbbells: 2,
    difference: 'Chest support reduces balance demands. Keep the bench angle and this variation in their own history.'
});
define(['lib-cable-standing-fly'], 'chest-fly', ['dual-cable'], ['chest'], {
    difference: 'Needs two adjustable towers and matching stacks. Record each stack value once; it is not a pressing exercise or a free-weight equivalent.'
});
define(['lib-cable-lateral-raise'], 'lateral-raise', ['cable'], ['side shoulders'], {
    difference: 'This version uses one arm at a time. Complete both sides and record repetitions per side with the exact station setup.'
});
define(['lib-db-reverse-fly'], 'rear-shoulder', [], ['rear shoulders', 'upper back'], {
    dumbbells: 2,
    difference: 'Keep a steady bent-over position. A reverse fly uses a wide arm arc rather than bending the elbows into a row.'
});
define(['lib-bar-hip-thrust'], 'hip-extension', ['barbell', 'bench', 'floor', 'bar-pad'], ['glutes'], {
    floor: true,
    difference: 'Needs a secured bench, padded bar and safe floor transfer. Hip thrusts do not replace the hamstring work of a Romanian deadlift.'
});
define(['lib-stack-pec-deck'], 'chest-fly', ['pec-deck'], ['chest'], {
    difference: 'Confirm a chest-fly setting on this machine. Record its own stack, seat and range; a chest-press machine is not the same equipment.'
});
define(['lib-stack-reverse-fly'], 'rear-shoulder', ['reverse-fly'], ['rear shoulders', 'upper back'], {
    difference: 'Confirm a reverse-fly setting on this machine. A chest-fly-only machine is insufficient; keep its own load and setup history.'
});
export { equipmentChoices };
export { emptyInventory };
export { defaultInventory };
export { movementRoles };
export { inventoryErrors };
export { equipmentFit };
export { sameFunctionIds };
export { prescriptionAlternatives };
export { equipmentSummary };
export { recoveryGroupsOverlap };
