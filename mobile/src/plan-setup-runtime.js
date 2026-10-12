// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as __dependency0 from "./shared/plan-fit";
import * as __dependency1 from "./equipment-survey";
import * as __dependency2 from "./shared/source-programs";
import * as __dependency3 from "./shared/equipment";
import * as __dependency4 from "./science";
import * as __dependency5 from "./shared/session-duration";
import * as __dependency6 from "./shared/session-guide";
import * as __dependency7 from "./appearance";
import * as __dependency8 from "./shared/presentation";
import * as __dependency9 from "react";
import * as __dependency10 from "react-native";
import * as __dependency11 from "./shared/training";
import * as __dependency12 from "./shared/onboarding";
import * as __dependency13 from "./storage";
import * as __dependency14 from "./shared/training-focus";
import * as __dependency15 from "react/jsx-runtime";
var _sharedPlanFit = __dependency0;
var _equipmentSurvey = __dependency1;
var _sharedSourcePrograms = __dependency2;
var _sharedEquipment = __dependency3;
var _science = __dependency4;
var _sharedSessionDuration = __dependency5;
var _sharedSessionGuide = __dependency6;
var _appearance = __dependency7;
var _sharedPresentation = __dependency8;
var _react = __dependency9;
var _reactNative = __dependency10;
var _sharedTraining = __dependency11;
var _sharedOnboarding = __dependency12;
var _storage = __dependency13;
var _sharedTrainingFocus = __dependency14;
var _reactJsxRuntime = __dependency15;
var c = {
    ink: '#19362D',
    green: '#214D3A',
    line: '#DCE1D7'
};
var baseStyles = _reactNative.StyleSheet.create({
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: c.ink
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: c.ink
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    input: {
        fontSize: 16,
        minHeight: 48,
        borderWidth: 1,
        borderColor: c.line,
        borderRadius: 8,
        padding: 12
    },
    button: {
        minHeight: 48,
        padding: 12,
        borderWidth: 1,
        borderColor: c.green,
        borderRadius: 8,
        justifyContent: 'center'
    },
    card: {
        borderWidth: 1,
        borderColor: c.line,
        borderRadius: 12,
        padding: 16,
        gap: 12
    }
});
function Choice({ label, selected, onPress }) {
    var styles = (0, _appearance.useThemedStyles)(baseStyles), { colors: c } = (0, _appearance.useNativeAppearance)();
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Pressable, {
        accessibilityRole: "button",
        accessibilityState: {
            selected
        },
        onPress: onPress,
        style: [styles.button, selected && {
                backgroundColor: c.green
            }],
        children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
            style: [styles.body, selected && {
                    color: c.onAccent
                }],
            children: label
        })
    });
}
function Field({ label, value, onChange, numeric = false }) {
    var styles = (0, _appearance.useThemedStyles)(baseStyles), { colors: c } = (0, _appearance.useNativeAppearance)();
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: {
            gap: 6
        },
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.body,
                children: label
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                accessibilityLabel: label,
                value: value,
                onChangeText: onChange,
                maxLength: 100,
                keyboardType: numeric ? 'decimal-pad' : 'default',
                style: styles.input
            })]
    });
}
function PlanSetup({ state, onAccept, sample = false }) {
    var styles = (0, _appearance.useThemedStyles)(baseStyles), { colors: c } = (0, _appearance.useNativeAppearance)();
    var [p, setP] = (0, _react.useState)({
        ...state.profile,
        start: (0, _sharedTraining.day)(),
        programId: undefined,
        inventory: (0, _sharedOnboarding.hydrateSetupProfile)(state.profile).inventory,
        name: state.profile.name === 'Local demo' ? '' : state.profile.name,
        ...(sourceChoice ? {
            goal: sourceChoice.goal,
            mode: 'app',
            programId: sourceChoice.id,
            trainingDays: (0, _sharedSourcePrograms.sourceProgram)(sourceChoice.id)?.days
        } : {})
    }), [step, setStep] = (0, _react.useState)(0), [selected, setSelected] = (0, _react.useState)(null), [error, setError] = (0, _react.useState)(''), [showAll, setShowAll] = (0, _react.useState)(false);
    var [loaded, setLoaded] = (0, _react.useState)(false), [saveNote, setSaveNote] = (0, _react.useState)('Opening saved setup…'), [draftBlocked, setDraftBlocked] = (0, _react.useState)(false);
    var accepted = (0, _react.useRef)(false), write = (0, _react.useRef)(0);
    (0, _react.useEffect)(() => {
        var live = true;
        (0, _storage.readLocalSetup)(sample).then(d => {
            if (!live)
                return;
            if (d && d.basePlanId === (state.plan?.id || null)) {
                setP({
                    ...(0, _sharedOnboarding.hydrateSetupProfile)(d.profile),
                    ...(sourceChoice ? {
                        goal: sourceChoice.goal,
                        mode: 'app',
                        programId: sourceChoice.id,
                        trainingDays: (0, _sharedSourcePrograms.sourceProgram)(sourceChoice.id)?.days
                    } : {})
                });
                setStep(sourceChoice ? 0 : d.profile.mode === 'app' && !d.profile.inventory ? Math.min(2, d.step) : d.baseEvents === JSON.stringify(state.events) ? Math.min(3, d.step) : 1);
                setSaveNote('Your saved setup is ready. Review your choices before accepting.');
            }
            else
                setSaveNote('Your setup will be saved on this device.');
        }).catch(() => {
            if (live)
                setDraftBlocked(true);
            if (live)
                setSaveNote('The previous setup could not be opened. Your accepted plan and workouts are unchanged.');
        }).finally(() => {
            if (live)
                setLoaded(true);
        });
        return () => {
            live = false;
        };
    }, []);
    (0, _react.useEffect)(() => {
        if (!loaded || accepted.current || draftBlocked)
            return;
        var version = ++write.current;
        var live = true;
        Promise.resolve().then(() => (0, _storage.saveLocalSetup)({
            schema: 1,
            basePlanId: state.plan?.id || null,
            baseEvents: JSON.stringify(state.events),
            profile: p,
            events: state.events,
            step
        }, sample)).then(() => {
            if (live && version === write.current)
                setSaveNote('Setup saved on this device. You can close and continue later.');
        }).catch(() => {
            if (live && version === write.current)
                setSaveNote('Setup could not be saved. Keep it open to finish, or try again.');
        });
        return () => {
            live = false;
        };
    }, [p, step, loaded, state.plan?.id, state.events, draftBlocked]);
    var options = (0, _react.useMemo)(() => step === 3 ? (0, _sharedOnboarding.planOptions)(p, state.events).sort((a, b) => Number(b.id === sourceChoice?.id && p.goal === sourceChoice.goal) - Number(a.id === sourceChoice?.id && p.goal === sourceChoice.goal)) : [], [step, p, state.events, sourceChoice]);
    var set = (key, value) => {
        setP(v => ({
            ...v,
            [key]: value,
            programId: undefined
        }));
        setSelected(null);
        setError('');
    };
    var next = () => {
        var errors = (step === 0 ? [0] : step === 1 ? [3] : [2, 4]).flatMap(i => (0, _sharedOnboarding.setupErrors)(p, i));
        if (errors.length) {
            setError(errors.join(' '));
            return;
        }
        setError('');
        setStep(step + 1);
    };
    if (!loaded)
        return /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
            style: styles.body,
            children: "Opening saved setup\u2026"
        });
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: {
            gap: 16
        },
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.title,
                children: ['Your goal', 'Your schedule', 'Equipment and coaching', 'Choose your plan'][step]
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                style: styles.body,
                children: ["Step ", step + 1, " of 4"]
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                accessibilityLiveRegion: "polite",
                style: styles.body,
                children: saveNote
            }), step === 0 && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                        label: "Profile name",
                        value: p.name,
                        onChange: v => set('name', v)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                        label: "Age",
                        numeric: true,
                        value: String(p.age || ''),
                        onChange: v => set('age', Number(v))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Main goal"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.View, {
                        style: styles.row,
                        children: _sharedTraining.goals.map(([id, label]) => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                            label: label,
                            selected: p.goal === id,
                            onPress: () => set('goal', id)
                        }, id))
                    }), p.goal === 'sport' && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                                label: "Sport",
                                value: p.sport,
                                onChange: v => set('sport', v)
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                                label: "Position or event",
                                value: p.position,
                                onChange: v => set('position', v)
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "Available sport plans develop general foundations. They do not yet provide position-specific training."
                            })]
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Experience"
                    }), ['First time', 'Some experience', 'Experienced'].map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: x,
                        selected: p.experience === x,
                        onPress: () => set('experience', x)
                    }, x)), p.experience === 'Experienced' && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: "I have at least 8 recent weeks of steady training",
                        selected: !!p.establishedTraining,
                        onPress: () => set('establishedTraining', !p.establishedTraining)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.View, {
                        style: styles.row,
                        children: ['lb', 'kg'].map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                            label: x,
                            selected: p.units === x,
                            onPress: () => set('units', x)
                        }, x))
                    })]
            }), step === 1 && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                        label: "Start date \xB7 YYYY-MM-DD",
                        value: p.start,
                        onChange: v => set('start', v)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                        label: "Training weeks \xB7 2\u201312",
                        numeric: true,
                        value: String(p.weeks || ''),
                        onChange: v => set('weeks', Number(v))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                        label: "Minutes per session \xB7 15\u2013120",
                        numeric: true,
                        value: String(p.minutes || ''),
                        onChange: v => set('minutes', Number(v))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Days you can train"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.View, {
                        style: styles.row,
                        children: _sharedTraining.weekdays.map((label, i) => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                            label: label,
                            selected: p.days.includes(i),
                            onPress: () => set('days', p.days.includes(i) ? p.days.filter(d => d !== i) : [...p.days, i].sort())
                        }, label))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Training days per week"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                        style: styles.row,
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: "Recommend a frequency",
                                selected: p.trainingDays === undefined,
                                onPress: () => set('trainingDays', undefined)
                            }), [2, 3, 4, 5, 6, 7].map(n => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: `${n} days`,
                                selected: p.trainingDays === n,
                                onPress: () => set('trainingDays', n)
                            }, n))]
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Availability and desired frequency are separate. Seven-day options include an easy activity day."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Your saved commitments are included. Review every date before starting."
                    })]
            }), step === 2 && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Available equipment"
                    }), ['Full gym', 'Dumbbells', 'Bodyweight + band', 'No equipment'].map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: x,
                        selected: p.equipment === x,
                        onPress: () => {
                            set('equipment', x);
                            set('inventory', (0, _sharedEquipment.defaultInventory)(x));
                        }
                    }, x)), ['Full gym', 'Dumbbells'].includes(p.equipment) && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                        label: `Heaviest ONE dumbbell (${p.units}) · optional`,
                        numeric: true,
                        value: p.dumbbellMaxKg === undefined ? '' : String(Math.round(p.dumbbellMaxKg * (p.units === 'lb' ? 2.2046226218 : 1) * 100) / 100),
                        onChange: v => set('dumbbellMaxKg', v === '' ? undefined : (0, _sharedTraining.toKg)(Number(v), p.units))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_equipmentSurvey.NativeEquipmentSurvey, {
                        profile: p,
                        onChange: v => set('inventory', v)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: "Standing or seated exercises only",
                        selected: !!p.noFloor,
                        onPress: () => set('noFloor', !p.noFloor)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Who leads training?"
                    }), [['app', 'Guide me with a plan'], ['coach', 'Track my coach’s plan'], ['manual', 'Write my own plan']].map(([id, label]) => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: label,
                        selected: p.mode === id,
                        onPress: () => set('mode', id)
                    }, id)), (p.age < 18 || p.focuses?.includes('jumping')) && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: "Qualified supervision is available",
                        selected: p.supervision,
                        onPress: () => set('supervision', !p.supervision)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Optional extra work"
                    }), _sharedTrainingFocus.focusChoices.map(f => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: f.title,
                                selected: p.focuses?.includes(f.id),
                                onPress: () => set('focuses', p.focuses?.includes(f.id) ? p.focuses.filter(x => x !== f.id) : [...(p.focuses || []), f.id])
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: f.description
                            })]
                    }, f.id)), p.focuses?.includes('jumping') && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: "Clear landing area and comfortable landing skill",
                        selected: p.jumpReady,
                        onPress: () => set('jumpReady', !p.jumpReady)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "The preview checks whether this extra work fits your time, equipment and recovery needs. Age and supervision requirements also apply."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Season"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.View, {
                        style: styles.row,
                        children: ['Off-season', 'Preseason', 'In-season', 'Transition / recovery'].map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                            label: x,
                            selected: p.season === x,
                            onPress: () => set('season', x)
                        }, x))
                    }), ['running', 'hybrid'].includes(p.goal) && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: "I already run 30 minutes comfortably",
                                selected: !!p.runBase,
                                onPress: () => set('runBase', !p.runBase)
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                                label: "Recent running days each week",
                                numeric: true,
                                value: String(p.runDays ?? 0),
                                onChange: v => set('runDays', Number(v))
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Field, {
                                label: "Recent easy running minutes each week",
                                numeric: true,
                                value: String(p.runMinutes ?? 0),
                                onChange: v => set('runMinutes', Number(v))
                            })]
                    })]
            }), step === 3 && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [!options.some(o => o.plan && o.profile.mode === p.mode && o.profile.goal === p.goal) && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "No plan in your selected mode fits these choices. Go back to adjust time, days or equipment, or use your own tracking schedule."
                            }), [...new Set(options.filter(o => !o.plan && o.profile.mode === p.mode && o.profile.goal === p.goal).flatMap(o => o.errors))].slice(0, 5).map(e => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: e
                            }, e))]
                    }), options.filter(o => o.plan).map(o => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                        style: styles.card,
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.title,
                                children: o.plan ? (0, _sharedPresentation.planName)(o.plan) : o.title
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: o.description
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.body,
                                children: [o.plan.sessions.length, " sessions \xB7 ends ", (0, _sharedTraining.niceDate)(o.plan.sessions.at(-1).date)]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: selected?.id === o.id ? 'Selected' : 'Review this plan',
                                selected: selected?.id === o.id,
                                onPress: () => {
                                    setSelected(o);
                                    setShowAll(false);
                                }
                            })]
                    }, o.id)), selected?.plan && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                        style: styles.card,
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.title,
                                children: ["Review ", (0, _sharedPresentation.planName)(selected.plan)]
                            }), selected.plan.sessions.filter(x => showAll || x.week === 1).map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                        style: [styles.body, {
                                                fontWeight: '700'
                                            }],
                                        children: [(0, _sharedTraining.niceDate)(x.date), " \xB7 ", (0, _sharedPresentation.sessionName)(x, selected.plan), " \xB7 ", (0, _sharedSessionDuration.durationText)(x, state.custom)]
                                    }), x.items.map(i => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                        style: styles.body,
                                        children: [(0, _sharedTraining.exFor)(i.exerciseId).name, " \xB7 ", i.sets, " \xD7 ", (0, _sharedTraining.targetText)(i), " \xB7 ", i.rest, "s rest"]
                                    }, i.exerciseId))]
                            }, x.id)), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: "Workout instructions and progression",
                                onPress: () => {
                                    var x = selected.plan.sessions[0], guide = (0, _sharedSessionGuide.sessionGuide)(selected.plan, x);
                                    _reactNative.Alert.alert((0, _sharedPresentation.sessionName)(x, selected.plan), [...guide.warmup, guide.effort, ...guide.order, ...guide.progression, guide.finish].join('\n\n'));
                                }
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: showAll ? 'Show first week' : 'Show all workouts',
                                onPress: () => setShowAll(!showAll)
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.body,
                                children: ["Week ", (0, _sharedPlanFit.planFit)(selected.plan).week, ": ", (0, _sharedPlanFit.planFit)(selected.plan).strengthDays, " strength days, ", (0, _sharedPlanFit.planFit)(selected.plan).runningDays, " running days, ", (0, _sharedPlanFit.planFit)(selected.plan).easyDays, " easy activity days \xB7 ", (0, _sharedPlanFit.planFit)(selected.plan).weeklyWorkSets, " strength work sets. Combined sessions count in both categories."]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: "Show regional work counts",
                                onPress: () => _reactNative.Alert.alert('Planned weekly work', (0, _sharedPlanFit.planFit)(selected.plan).regions.map(r => `${r.name}: ${r.sets} sets involving this region across ${r.days} days`).join('\n') + '\nCompound work can appear in multiple regions. These are planned counts, not equivalent isolation sets or guaranteed results.')
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_science.NativePlanEvidence, {
                                plan: selected.plan
                            }, selected.plan.id), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: (0, _sharedPresentation.trainingCopy)(selected.plan.progression)
                            }), selected.plan.notes.filter(n => n.startsWith('[Focus]')).map(n => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: n
                            }, n)), selected.plan.notes.filter(n => n.startsWith('Days off') || n.startsWith('Competition')).map(n => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: n
                            }, n)), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                                label: "Start this plan",
                                onPress: async () => {
                                    if (draftBlocked) {
                                        setError('Resolve the preserved setup draft first.');
                                        return;
                                    }
                                    var message = await onAccept(selected.profile, selected.plan, state.events);
                                    if (message)
                                        setError(message);
                                    else {
                                        accepted.current = true;
                                        await (0, _storage.clearLocalSetup)(sample);
                                    }
                                }
                            })]
                    })]
            }), !!error && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                accessibilityRole: "alert",
                style: [styles.body, {
                        color: c.danger
                    }],
                children: error
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                style: styles.row,
                children: [step > 0 && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: "Back",
                        onPress: () => {
                            setStep(step - 1);
                            setError('');
                        }
                    }), step < 3 && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Choice, {
                        label: step === 2 ? 'See my plans' : 'Continue',
                        onPress: next
                    })]
            })]
    });
}
export { PlanSetup };
