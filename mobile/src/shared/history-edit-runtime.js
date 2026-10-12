// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as __dependency0 from "./training";
import * as __dependency1 from "./saved-data";
var _training = __dependency0;
var _savedData = __dependency1;
function beginHistoryEdit(state, id) {
    var record = state.history.find(w => w.id === id);
    if (!record?.finishedAt)
        throw Error('This saved workout is unavailable.');
    return {
        base: JSON.stringify(record),
        draft: JSON.parse(JSON.stringify(record))
    };
}
function applyHistoryEdit(state, edit) {
    var before = state.history.find(w => w.id === edit.draft.id);
    if (!before || JSON.stringify(before) !== edit.base)
        throw Error('This workout changed after you opened it. Reopen the saved record before editing.');
    var draft = edit.draft;
    // Identity, prescription, original timing and equipment context are historical facts.
    var immutable = w => JSON.stringify([w.id, w.sessionId, w.title, w.date, w.startedAt, w.finishedAt, w.targets, w.loadContext, w.supervisorConfirmed, w.demo]);
    if (immutable(before) !== immutable(draft) || before.sets.length !== draft.sets.length || before.sets.some((x, i) => x.exerciseId !== draft.sets[i]?.exerciseId || x.set !== draft.sets[i]?.set))
        throw Error('An edit cannot change workout identity, dates, targets or exercise order.');
    if (!draft.sets.some(x => x.done))
        throw Error('Keep at least one performed set. An empty record cannot be marked completed.');
    var partial = draft.sets.some(x => !x.done) || !!draft.targets?.some(t => draft.sets.filter(x => x.exerciseId === t.exerciseId && x.done).length < t.sets);
    var saved = {
        ...draft,
        partial,
        revision: (before.revision || 1) + 1
    };
    var plan = state.plan?.sessions.some(s => s.id === before.sessionId) ? {
        ...state.plan,
        version: state.plan.version + 1,
        sessions: state.plan.sessions.map(s => s.id === before.sessionId && state.active?.sessionId !== before.sessionId ? {
            ...s,
            status: partial ? 'partial' : 'completed'
        } : s)
    } : state.plan;
    var next = (0, _training.changed)({
        ...state,
        plan,
        history: state.history.map(w => w.id === saved.id ? saved : w),
        proposals: state.proposals.map(p => p.planId === plan?.id && ['pending', 'queued'].includes(p.status) ? {
            ...p,
            status: 'stale'
        } : p)
    }, 'Edited a saved workout. Existing workout IDs, dates and active work were preserved.');
    (0, _savedData.readSavedState)(JSON.stringify(next));
    return next;
}
export { beginHistoryEdit };
export { applyHistoryEdit };
