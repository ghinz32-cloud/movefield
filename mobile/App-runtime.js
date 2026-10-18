import {NativeExerciseGuideScreen} from './src/exercise-guide-screen';
import {NativeFlowScreen,NativeSettingsRow,NativeSection,NativeActionFooter,NativeButton} from './src/phone-ui';
import {NativeWorkoutScreen} from './src/workout-screen';
import {NativeWorkspaceHeader,NativeWorkspaceMenu} from './src/workspace-navigation';
import {nativeWindowLayout} from './src/adaptive-layout';
import {NativeProgramFilters,matchesProgram} from './src/program-filters';
import {NativeWorkoutCoaching} from './src/workout-coaching';
import {beforeWorkoutCoaching,afterWorkoutCoaching} from './src/shared/workout-coaching';
import {GrizzlyPressable} from './src/wild-interactions';
// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as _srcSharedPairedSets from "./src/shared/paired-sets";
import * as _srcSharedSourcePrograms from "./src/shared/source-programs";
import * as _srcSharedTraining from "./src/shared/training";
import * as _srcEquipmentSurvey from "./src/equipment-survey";
import * as _srcTodayHero from "./src/today-hero";
import * as _srcBearDecoration from "./src/bear-decoration";
import * as _srcProgress from "./src/progress";
import * as _srcScience from "./src/science";
import * as _srcSharedSessionDuration from "./src/shared/session-duration";
import * as _srcPlanCustomizer from "./src/plan-customizer";
import * as _srcCalendar from "./src/calendar";
import * as _srcSavedPlans from "./src/saved-plans";
import * as _srcSharedReusablePlan from "./src/shared/reusable-plan";
import * as _srcAppearance from "./src/appearance";
import * as _srcFileTransfer from "./src/file-transfer";
import * as _srcPlanImport from "./src/plan-import";
import * as _srcSharedPlanImport from "./src/shared/plan-import";
import * as _srcHistoryEditor from "./src/history-editor";
import * as _srcSharedHistoryEdit from "./src/shared/history-edit";
import * as _srcCloudAccount from "./src/cloud-account";
import * as _srcSettings from "./src/settings";
import * as _srcSharedExperiencedDemo from "./src/shared/experienced-demo";
import * as _srcSharedDurableState from "./src/shared/durable-state";
import * as _srcSharedWorkoutFlow from "./src/shared/workout-flow";
import * as _srcWorkoutNotifications from "./src/workout-notifications";
import * as _srcSharedPresentation from "./src/shared/presentation";
import * as _srcSharedBrand from "./src/shared/brand";
import * as _srcSharedWorkoutLog from "./src/shared/workout-log";
import * as _srcPlanSetup from "./src/plan-setup";
import * as _srcSessionEditor from "./src/session-editor";
import * as _srcSharedTracking from "./src/shared/tracking";
import * as _srcSharedOnboarding from "./src/shared/onboarding";
import * as _srcRestAlerts from "./src/rest-alerts";
import * as _srcSharedRestTimer from "./src/shared/rest-timer";
import * as _srcSharedSavedData from "./src/shared/saved-data";
import * as _srcSharedSessionGuide from "./src/shared/session-guide";
import * as _react from "react";
import * as _reactNative from "react-native";
import * as _reactNativeSafeAreaContext from "react-native-safe-area-context";
import * as _expoStatusBar from "expo-status-bar";
import * as _srcSharedProgramCatalog from "./src/shared/program-catalog";
import * as _srcSharedSubstitutions from "./src/shared/substitutions";
import * as _srcContent from "./src/content";
import * as _srcMobileEngine from "./src/mobile-engine";
import * as _srcStorage from "./src/storage";
import * as _srcSharedLegacyTransfer from "./src/shared/legacy-transfer";
import * as _reactJsxRuntime from "react/jsx-runtime";
import {NativeWildernessShell,NativeDenHero} from "./src/wilderness";
var h = _react.createElement;
var COLORS = {
    bg: '#F6F5EF',
    ink: '#19362D',
    muted: '#66746B',
    green: '#214D3A',
    line: '#DCE1D7',
    pale: '#E6EDDD',
    orange: '#E6AB74',
    white: '#FFFFFF',
    onAccent: '#FFFFFF',
    danger: '#933C2D'
};
function Button({ label, onPress, secondary = false, disabled = false }) {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), { colors: COLORS, reduceMotion } = (0, _srcAppearance.useNativeAppearance)();
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(GrizzlyPressable, {
        accessibilityRole: "button",
        accessibilityState: {
            disabled
        },
        onPress: onPress,
        disabled: disabled,
        style: ({ pressed }) => [styles.button, secondary && styles.secondaryButton, disabled && {
                opacity: 0.4
            }, pressed && {
                opacity: 0.78
            }],
        children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
            style: [styles.buttonText, secondary && {
                    color: COLORS.ink
                }],
            children: label
        })
    });
}
function Pill({ label, selected, onPress }) {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), { colors: COLORS, reduceMotion } = (0, _srcAppearance.useNativeAppearance)();
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(GrizzlyPressable, {
        accessibilityRole: "button",
        accessibilityState: {
            selected
        },
        onPress: onPress,
        style: [styles.pill, selected && styles.pillSelected],
        children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
            style: [styles.pillText, selected && {
                    color: COLORS.onAccent
                }],
            children: label
        })
    });
}
function Card({ children, dark = false, grow = false, onLayout }) {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), { colors: COLORS, reduceMotion } = (0, _srcAppearance.useNativeAppearance)();
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: [styles.card, dark && styles.darkCard, grow && styles.flex],
        onLayout,
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcBearDecoration.NativeBearDecoration, {}), children]
    });
}
function Heading({ eyebrow, title, detail }) {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), { colors: COLORS, reduceMotion } = (0, _srcAppearance.useNativeAppearance)();
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: styles.heading,
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.eyebrow,
                children: eyebrow
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.title,
                accessibilityRole: 'header',
                children: title
            }), detail && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.body,
                children: detail
            })]
    });
}
function RecordedMetrics({ metrics }) {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), { colors: COLORS, reduceMotion } = (0, _srcAppearance.useNativeAppearance)();
    if (!metrics)
        return null;
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: {
            gap: 4
        },
        children: [metrics.distanceM !== undefined && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                style: styles.small,
                children: ["Distance: ", metrics.distanceM, " m"]
            }), metrics.durationSeconds !== undefined && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                style: styles.small,
                children: ["Duration: ", metrics.durationSeconds, " s"]
            }), !!metrics.notes && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                style: styles.small,
                children: ["Notes: ", metrics.notes]
            })]
    });
}
function ModalFrame({ visible, close, title, children, onDismiss, scroll = true, requestClose, error, closeLabel = "Close", closeDisabled = false, compactChrome = false }) {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), { colors: COLORS, reduceMotion } = (0, _srcAppearance.useNativeAppearance)();
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Modal, {
        visible: visible,
        animationType: reduceMotion ? "none" : "slide",
        onRequestClose: closeDisabled ? () => {} : requestClose || close,
        onDismiss,
        presentationStyle: "pageSheet",
        children: /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNativeSafeAreaContext.SafeAreaView, {
            style: styles.safe,
            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                    style: [styles.modalHeader, compactChrome && {paddingVertical:4,justifyContent:"flex-end"}],
                    children: [!compactChrome && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: scroll ? styles.modalTitle : styles.small,
                            accessibilityRole: 'header',
                            children: title
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(GrizzlyPressable, {
                            accessibilityRole: "button",
                            accessibilityLabel: "Close " + title,
                            accessibilityState: {disabled:closeDisabled},
                            disabled: closeDisabled,
                            onPress: close,
                            style: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
                            children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.link,
                                children: closeLabel
                            })
                        })]
                }), error && h(_reactNative.Text,{accessibilityRole:'alert',style:[styles.errorText,{padding:12}]},error), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.KeyboardAvoidingView, {
                    style: styles.flex,
                    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined,
                    children: !scroll ? h(_reactNative.View,{style:styles.flex},children) : /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.ScrollView, {
                        contentContainerStyle: styles.content,
                        keyboardShouldPersistTaps: "handled",
                        keyboardDismissMode: "on-drag",
                        children: children
                    })
                })]
        })
    });
}
function NativeEquipmentLimit({ state, exercise, onSave }) {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), { colors: COLORS, reduceMotion } = (0, _srcAppearance.useNativeAppearance)();
    var setup = exercise?.requiresSetup ? state.loadContext?.[exercise.id] || '' : '';
    var cap = exercise ? state.equipmentCaps?.find(c => c.exerciseId === exercise.id && c.setup === setup)?.maxKg : state.profile.dumbbellMaxKg;
    var step = exercise ? state.incrementKg?.[exercise.id] : undefined;
    var [draft, setDraft] = (0, _react.useState)(''), [increment, setIncrement] = (0, _react.useState)(''), [setupDraft, setSetupDraft] = (0, _react.useState)(setup), [message, setMessage] = (0, _react.useState)('');
    var context = JSON.stringify([cap, step, setup, exercise?.id, state.profile.units]), [previousContext, setPreviousContext] = (0, _react.useState)('');
    if (context !== previousContext) {
        setPreviousContext(context);
        var factor = state.profile.units === 'lb' ? 2.2046226218 : 1;
        setDraft(cap === undefined ? '' : String(Math.round(cap * factor * 100) / 100));
        setIncrement(step ? String(Math.round(step * factor * 100) / 100) : '');
        setSetupDraft(setup);
        setMessage('');
    }
    var disabled = !!state.active;
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.sectionTitle,
                children: exercise ? 'Equipment and progression' : 'Your dumbbell limit'
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                style: styles.small,
                children: [exercise?.loadConvention || 'Enter the weight of ONE dumbbell, not the pair.', " Blank means unknown. Zero means unavailable. Changes never rewrite history."]
            }), exercise?.requiresSetup && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Machine, attachment and setup"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                        accessibilityLabel: "Equipment setup label",
                        editable: !disabled,
                        value: setupDraft,
                        onChangeText: v => {
                            setSetupDraft(v);
                            setDraft('');
                            setIncrement('');
                        },
                        maxLength: 200,
                        style: styles.input
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.small,
                        children: "A changed setup needs its own limit and comparable history."
                    })]
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                style: styles.body,
                children: ["Maximum available (", state.profile.units, ")"]
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                accessibilityLabel: exercise ? 'Maximum available exercise load' : 'Maximum single dumbbell weight',
                editable: !disabled,
                value: draft,
                onChangeText: setDraft,
                keyboardType: "decimal-pad",
                maxLength: 12,
                style: styles.input
            }), exercise && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                        style: styles.body,
                        children: ["Smallest available increase (", state.profile.units, ")"]
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                        accessibilityLabel: "Smallest equipment load increase",
                        editable: !disabled,
                        value: increment,
                        onChangeText: setIncrement,
                        keyboardType: "decimal-pad",
                        maxLength: 12,
                        style: styles.input
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.small,
                        children: "Use this exercise\u2019s load convention. For a barbell, include both sides. Blank or zero holds increases until you know the available step."
                    })]
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                secondary: true,
                disabled: disabled,
                label: "Save equipment settings",
                onPress: async () => {
                    var parse = v => v.trim() === '' ? undefined : (0, _srcSharedTraining.toKg)(Number(v.trim().replace(',', '.')), state.profile.units);
                    var kg = parse(draft), increase = parse(increment);
                    if (kg !== undefined && (!Number.isFinite(kg) || kg < 0 || kg > (exercise ? 1500 : 500)) || increase !== undefined && (!Number.isFinite(increase) || increase < 0 || increase > 100)) {
                        setMessage('Enter valid nonnegative equipment weights, or leave unknown values blank.');
                        return;
                    }
                    var saved = await onSave(s => {
                        var next = {
                            ...s,
                            proposals: s.proposals.map(p => p.status === 'pending' || p.status === 'queued' ? {
                                ...p,
                                status: 'stale'
                            } : p)
                        };
                        if (exercise) {
                            next = {
                                ...next,
                                loadContext: exercise.requiresSetup ? {
                                    ...next.loadContext,
                                    [exercise.id]: setupDraft.trim()
                                } : next.loadContext,
                                incrementKg: {
                                    ...next.incrementKg,
                                    [exercise.id]: increase || 0
                                }
                            };
                            var r = (0, _srcSharedTraining.setEquipmentLimit)(next, exercise.id, kg);
                            if (r.error)
                                throw Error(r.error);
                            return r.state;
                        }
                        return {
                            ...next,
                            profile: {
                                ...next.profile,
                                dumbbellMaxKg: kg
                            }
                        };
                    });
                    setMessage(saved ? 'Equipment settings saved on this device.' : 'Equipment settings could not be saved. Check the error above.');
                }
            }), disabled && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.small,
                children: "Finish or save the active workout first."
            }), message && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                accessibilityLiveRegion: "polite",
                style: styles.small,
                children: message
            })]
    });
}
function TrainingApp() {
    var styles = (0, _srcAppearance.useThemedStyles)(baseStyles), appearance = (0, _srcAppearance.useNativeAppearance)(), COLORS = appearance.colors;
    var viewport = (0, _reactNative.useWindowDimensions)();
    var [state, setState] = (0, _react.useState)(null);
    var [readError, setReadError] = (0, _react.useState)(false);
    var [saveStatus, setSaveStatus] = (0, _react.useState)('Loading local data…');
    var [error, setError] = (0, _react.useState)('');
    var [tab, setTab] = (0, _react.useState)('Today');
    var [navigationOpen,setNavigationOpen] = (0,_react.useState)(false);
    var [phonePage,setPhonePage] = (0,_react.useState)('home');
    var [constrainedWorkout,setConstrainedWorkout] = (0,_react.useState)(false);
    var compactWorkout = !!state?.active && tab === 'Today' && phonePage === 'workout' && (constrainedWorkout || nativeWindowLayout(viewport.width,viewport.height,appearance.p.textSize,viewport.fontScale).compactHeight);
    var setupBack = (0,_react.useRef)(null), guideBack = (0,_react.useRef)(null);
    var [exercise, setExercise] = (0, _react.useState)(null);
    var [editingHistory, setEditingHistory] = (0, _react.useState)(false);
    var [historyItem, setHistoryItem] = (0, _react.useState)(null);
    var [coaching, setCoaching] = (0, _react.useState)(null);
    var coachingTransition = (0, _react.useRef)({waiting:false,pending:null});
    var [historySection, setHistorySection] = (0, _react.useState)('history');
    var [historyLimit, setHistoryLimit] = (0, _react.useState)(20);
    var [confirm, setConfirm] = (0, _react.useState)(null);
    var [changePreview, setChangePreview] = (0, _react.useState)(null);
    var [moveDate, setMoveDate] = (0, _react.useState)((0, _srcSharedTraining.day)());
    var [linkError, setLinkError] = (0, _react.useState)('');
    var [resetting, setResetting] = (0, _react.useState)(false);
    var stateRef = (0, _react.useRef)(null), personalState = (0, _react.useRef)(null), sampleRef = (0, _react.useRef)(false);
    var [sampleMode, setSampleMode] = (0, _react.useState)(false), [recoveryInput, setRecoveryInput] = (0, _react.useState)(''), [recoveryKey, setRecoveryKey] = (0, _react.useState)(''), [backupInput, setBackupInput] = (0, _react.useState)(''), [backupPreview, setBackupPreview] = (0, _react.useState)(null);
    var transferBackup = (0, _react.useMemo)(() => (0, _srcSharedLegacyTransfer.isLegacyTransfer)(backupInput), [backupInput]);
    var resettingRef = (0, _react.useRef)(false), backupGeneration = (0, _react.useRef)(0);
    var changeBackupInput = raw => {
        backupGeneration.current++;
        setBackupInput(raw);
        setBackupPreview(null);
    };
    var changeRecoveryInput = key => {
        backupGeneration.current++;
        setRecoveryInput(key);
        setBackupPreview(null);
    };
    var previewBackup = async () => {
        var token = ++backupGeneration.current, raw = backupInput, key = recoveryInput, expected = stateRef.current;
        setBackupPreview(null);
        try {
            if (transferBackup && !expected)
                throw Error('Reopen or recover your saved profile before importing an older transfer file. Original records are kept.');
            var _next = transferBackup ? await (0, _srcSharedLegacyTransfer.openLegacyTransfer)(raw, key) : await (0, _srcStorage.previewLocalBackup)(raw, key);
            if (token === backupGeneration.current && !resettingRef.current && !sampleRef.current)
                setBackupPreview({
                    state: _next,
                    raw,
                    key,
                    transfer: transferBackup,
                    expected
                });
        }
        catch (e) {
            if (token === backupGeneration.current)
                setError(e instanceof Error ? e.message : 'Backup could not be previewed.');
        }
    };
    var chooseBackup = async () => {
        var token = ++backupGeneration.current;
        setBackupPreview(null);
        try {
            var raw = await (0, _srcFileTransfer.pickJsonFile)(_srcSharedLegacyTransfer.LEGACY_TRANSFER_MAX_BYTES);
            if (raw !== null && token === backupGeneration.current && !resettingRef.current && !sampleRef.current)
                changeBackupInput(raw);
        }
        catch (e) {
            if (token === backupGeneration.current)
                setError(e instanceof Error ? e.message : 'The file could not be read.');
        }
    };
    var commit = next => {
        var checked = (0, _srcSharedWorkoutLog.normalizeWorkoutRest)(next);
        (0, _srcSharedSavedData.readSavedState)(JSON.stringify(checked));
        stateRef.current = checked;
        setState(checked);
    };
    var [planImportOpen, setPlanImportOpen] = (0, _react.useState)(false);
    var [personalSetup, setPersonalSetup] = (0, _react.useState)(false);
    var [sourceChoice, setSourceChoice] = (0, _react.useState)();
    var [calendarOpen, setCalendarOpen] = (0, _react.useState)(false), [calendarDate, setCalendarDate] = (0, _react.useState)((0, _srcSharedTraining.day)()), [planSection, setPlanSection] = (0, _react.useState)('home'), [planSessionLimit, setPlanSessionLimit] = (0, _react.useState)(20), [previewAll, setPreviewAll] = (0, _react.useState)(false), [scienceOpen, setScienceOpen] = (0, _react.useState)(false);
    var [trackingSession, setTrackingSession] = (0, _react.useState)(''), [customizeSession, setCustomizeSession] = (0, _react.useState)('');
    var [preview, setPreview] = (0, _react.useState)(null);
    var [planGoal, setPlanGoal] = (0, _react.useState)('powerlifting');
    var [planSearch, setPlanSearch] = (0, _react.useState)(''), [planDays, setPlanDays] = (0, _react.useState)(0), [catalogLimit, setCatalogLimit] = (0, _react.useState)(8);
    var [substitution, setSubstitution] = (0, _react.useState)(null);
    var [subEquipment, setSubEquipment] = (0, _react.useState)('All');
    var [showSubInventory, setShowSubInventory] = (0, _react.useState)(false);
    var [search, setSearch] = (0, _react.useState)('');
    var [equipment, setEquipment] = (0, _react.useState)('All');
    var [now, setNow] = (0, _react.useState)(() => Date.now());
    var storeRef = (0, _react.useRef)(null);
    var [savingAction, setSavingAction] = (0, _react.useState)(false);
    var [focusedExercise, renderFocus] = (0, _react.useState)(null);
    var focusRef = (0, _react.useRef)(null);
    var setFocusedExercise = id => {
        focusRef.current = id;
        renderFocus(id);
    };
    var createStore = initial => (0, _srcSharedDurableState.createDurableState)({
        initial,
        validate: next => {
            var checked = (0, _srcSharedWorkoutLog.normalizeWorkoutRest)(next);
            (0, _srcSharedSavedData.readSavedState)(JSON.stringify(checked));
            return checked;
        },
        write: next => (0, _srcStorage.saveLocalState)(next, sampleRef.current),
        publish: commit,
        status: status => setSaveStatus(status === 'saving' ? 'Saving on this device…' : status === 'saved' ? 'Saved on this device' : 'Save failed · keep the app open and retry')
    });
    var persistChange = async (fn) => {
        if (resettingRef.current || !storeRef.current || storeRef.current.busy())
            return false;
        setSavingAction(true);
        try {
            var saved = await storeRef.current.commit(fn);
            if (saved) setError('');
            return saved;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'This action could not be saved.');
            return false;
        }
        finally {
            setSavingAction(false);
        }
    };
    var coachingCurrent = coaching && coaching.store === storeRef.current && coaching.base === storeRef.current?.get() && coaching.sample === sampleRef.current && coaching.day === (0, _srcSharedTraining.day)() && appearance.p.coaching !== 'off';
    (0, _react.useEffect)(() => {
        if (coaching && !coachingCurrent) setCoaching(null);
    }, [coaching, coachingCurrent]);
    var completeCoachingTransition = () => {
        var pending = coachingTransition.current.pending;
        coachingTransition.current = {waiting:false,pending:null};
        if (!pending) return;
        var request = pending.request;
        if (request.store !== storeRef.current || request.base !== storeRef.current?.get() || request.sample !== sampleRef.current || request.day !== (0, _srcSharedTraining.day)()) return;
        if (pending.kind === 'navigation') {
            pending.action();
        } else if (pending.kind === 'record') {
            var record = request.base.history.find(w => w.id === request.workoutId);
            if(record){setEditingHistory(false);setHistoryItem(record);}
        } else if (appearance.p.coaching !== 'off') setCoaching(request);
    };
    var navigateAfterModal = (dismiss, action) => {
        if (_reactNative.Platform.OS === 'ios') {
            var request = {store:storeRef.current,base:storeRef.current?.get(),sample:sampleRef.current,day:(0,_srcSharedTraining.day)()};
            coachingTransition.current = {waiting:true,pending:{kind:'navigation',request,action}};
            dismiss();
        } else {
            dismiss();
            action();
        }
    };
    var selectDestination = destination => {
        if (coachingTransition.current.waiting) return;
        navigateAfterModal(()=>setNavigationOpen(false),()=>{
            setError('');
            if (destination === 'calendar') {setCalendarDate((0,_srcSharedTraining.day)());setCalendarOpen(true);}
            else if (destination === 'sources') setScienceOpen(true);
            else if (destination === 'plans') {setTab('Plan');setPlanSection('home');}
            else if (destination === 'exercises') setTab('Library');
            else if (destination === 'progress' || destination === 'history') {setTab('History');setHistorySection(destination==='progress'?'progress':'history');}
            else if (destination === 'settings') setTab('Settings');
            else if (destination === 'coaching') setTab('Coaching');
            else {setTab('Today');setPhonePage(destination==='workout'&&stateRef.current?.active?'workout':'home');}
        });
    };
    var presentCoaching = request => {
        // UIKit must finish dismissing the current sheet before presenting another.
        if (_reactNative.Platform.OS === 'ios' && (calendarOpen || historyItem || coachingTransition.current.waiting)) {
            coachingTransition.current = {waiting:true,pending:{kind:'coaching',request}};
            setCalendarOpen(false);
            setHistoryItem(null);
        } else {
            setCalendarOpen(false);
            setHistoryItem(null);
            setCoaching(request);
        }
    };
    var startReviewedWorkout = async request => {
        if (!request || request.store !== storeRef.current || request.sample !== sampleRef.current || request.day !== (0, _srcSharedTraining.day)()) {
            setCoaching(null);
            setError('Your profile changed. Review this workout again.');
            return false;
        }
        var saved = await persistChange(s => {
            if (s !== request.base) throw Error('Your training changed. Review this workout again.');
            return (0, _srcMobileEngine.startWorkout)(s, request.sessionId, request.sample);
        });
        if (saved) {
            setCoaching(null);
            setCalendarOpen(false);
            setTab('Today');
            setPhonePage('workout');
            setFocusedExercise(stateRef.current?.active?.targets?.[0]?.exerciseId ?? null);
        }
        return saved;
    };
    var reviewBeforeWorkout = (sessionId, startRequested = false) => {
        var store = storeRef.current, base = store?.get(), target = base?.plan?.sessions.find(x => x.id === sessionId);
        if (!base || !target || resettingRef.current || store.busy()) return Promise.resolve(false);
        if (startRequested) {
            var blocked = (0, _srcSharedTraining.eligibility)(base, target);
            if (base.active || blocked || target.date !== (0, _srcSharedTraining.day)()) {
                setError(base.active ? 'A workout is already open.' : blocked || 'Review moving this workout to today before starting.');
                return Promise.resolve(false);
            }
        }
        if (!startRequested && appearance.p.coaching === 'off') return Promise.resolve(false);
        var sample = sampleRef.current, summary = beforeWorkoutCoaching(base, target, {brand: _srcSharedBrand.isGrizzly ? 'grizzly' : 'movefield', sample});
        var request = {store, base, sample, sessionId, phase:'before', summary, day:(0, _srcSharedTraining.day)()};
        if (startRequested && appearance.p.coaching !== 'auto') return startReviewedWorkout(request);
        if (!summary) return startRequested ? startReviewedWorkout(request) : Promise.resolve(false);
        setError('');
        presentCoaching(request);
        return Promise.resolve(false);
    };
    var reviewAfterWorkout = workoutId => {
        var store = storeRef.current, base = store?.get();
        if (!base || appearance.p.coaching === 'off') return;
        var summary = afterWorkoutCoaching(base, workoutId, {brand: _srcSharedBrand.isGrizzly ? 'grizzly' : 'movefield'});
        if (!summary) return;
        setError('');
        presentCoaching({store, base, sample:sampleRef.current, phase:'after', workoutId, summary, day:(0, _srcSharedTraining.day)()});
    };
    (0, _react.useEffect)(() => {
        var mounted = true;
        void (0, _srcFileTransfer.cleanExportFiles)().catch(() => setError('Expired export files could not be cleaned up. Your profile is kept; retry on this device.'));
        (0, _srcStorage.readLocalState)().then(s => {
            if (mounted) {
                var initial = s ?? (0, _srcMobileEngine.emptyDemo)();
                storeRef.current = createStore(initial);
                commit(initial);
                setSaveStatus('On this device');
            }
        }).catch(e => {
            if (mounted) {
                setReadError(true);
                setError(e instanceof Error ? e.message : 'Saved training could not be opened. The original files are kept.');
            }
        });
        return () => {
            mounted = false;
        };
    }, []);
    (0, _react.useEffect)(() => {
        if (!appearance.active) return;
        // Deadline-based rest keeps time while backgrounded; repaint only while it is visible and running.
        var endAt = state?.restTimer?.endAt;
        if (tab !== 'Today' || !endAt || endAt <= Date.now()) return;
        var timer = setInterval(() => {
            var time = Date.now();
            setNow(time);
            if (time >= endAt) clearInterval(timer);
        }, 500);
        return () => clearInterval(timer);
    }, [appearance.active, tab, state?.restTimer?.endAt]);
    (0, _react.useEffect)(() => {
        if (!appearance.active) return;
        var timer;
        var refresh = () => {
            var time = new Date(), midnight = new Date(time);
            midnight.setHours(24, 0, 0, 25);
            setNow(time.getTime());
            timer = setTimeout(refresh, midnight.getTime() - time.getTime());
        };
        refresh();
        return () => clearTimeout(timer);
    }, [appearance.active]);
    var catalogDay = (0, _srcSharedTraining.day)(new Date(now));
    var catalogMatches = (0, _react.useMemo)(() => {
        if (tab !== 'Plan' || planSection !== 'explore') return {app:[],sources:[],references:[]};
        var fits = p => (planGoal === 'all' || (p.goals ? p.goals.includes(planGoal) : p.goal === planGoal)) && matchesProgram(p, planSearch, planDays);
        return {
            app: _srcSharedProgramCatalog.programCatalog.filter(fits),
            sources: _srcSharedSourcePrograms.sourcePrograms.filter(fits),
            references: _srcSharedProgramCatalog.programReferences.filter(p => fits(p) && !_srcSharedSourcePrograms.sourcePrograms.some(s => s.url === p.url))
        };
    }, [tab, planSection, planGoal, planSearch, planDays]);
    var visibleCatalog = (0, _react.useMemo)(() => catalogMatches.app.slice(0, catalogLimit).map(p => ({definition:p,preview:(0, _srcMobileEngine.previewPlan)(p.id,catalogDay)})), [catalogMatches.app, catalogLimit, catalogDay]);
    var catalogTotal = Object.values(catalogMatches).reduce((total, rows) => total + rows.length, 0), catalogShown = Object.values(catalogMatches).reduce((total, rows) => total + Math.min(rows.length, catalogLimit), 0);
    var workoutReminderMessage = (0, _srcWorkoutNotifications.useNativeWorkoutReminders)(sampleMode ? null : state, appearance.p, appearance.ready);
    var restAlertMessage = (0, _srcRestAlerts.useNativeRestAlerts)(state?.restTimer, state?.active?.id, !!state?.restAlerts, !!state && !sampleMode);
    var [alertMessage, setAlertMessage] = (0, _react.useState)('');
    var equipmentOptions = (0, _react.useMemo)(() => ['All', ...Array.from(new Set(_srcSharedTraining.exercises.map(x => x.equipment))).sort()], []);
    var filtered = (0, _react.useMemo)(() => [..._srcSharedTraining.exercises, ...(state?.custom || [])].filter(x => (equipment === 'All' || x.equipment === equipment) && (0, _srcSharedTraining.matchesExercise)(x, search)), [search, equipment, state?.custom]);
    var modify = fn => {
        if (resettingRef.current || !storeRef.current)
            return false;
        try {
            var accepted = storeRef.current.stage(fn);
            if (accepted)
                setError('');
            return accepted;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'This action could not be completed.');
            return false;
        }
    };
    (0, _react.useEffect)(() => {
        if (error)
            _reactNative.AccessibilityInfo.announceForAccessibility(error);
    }, [error]);
    (0, _react.useEffect)(() => {
        if (saveStatus.startsWith('Save failed'))
            _reactNative.AccessibilityInfo.announceForAccessibility(saveStatus);
    }, [saveStatus]);
    var stageChange = async (proposal) => {
        var saved = await persistChange(s => {
            if (s.plan?.id !== proposal.planId || s.plan.version !== proposal.baseVersion)
                throw Error('The plan changed. Review this change again.');
            return {
                ...s,
                proposals: [proposal, ...s.proposals]
            };
        });
        if (saved) {
            if (calendarOpen) navigateAfterModal(()=>setCalendarOpen(false),()=>setChangePreview(proposal));
            else setChangePreview(proposal);
        }
        return saved;
    };
    var openUrl = async (candidate) => {
        var url = (0, _srcContent.safeWebUrl)(candidate);
        setLinkError('');
        if (!url) {
            setLinkError('This reference is not an available web link.');
            return;
        }
        try {
            await _reactNative.Linking.openURL(url);
        }
        catch {
            setLinkError('Could not open the link. Check your connection and try again.');
        }
    };
    var openSubstitute = (sessionId, from) => {
        var s = stateRef.current;
        setError('');
        setSubEquipment('All');
        setShowSubInventory(false);
        setSubstitution({
            sessionId,
            from,
            to: '',
            all: false,
            setup: '',
            allowLonger: false,
            acknowledgeSpecificity: false,
            planId: s.plan.id,
            version: s.plan.version,
            historyCount: s.history.length
        });
    };
    var openPreview = id => {
        var result = (0, _srcMobileEngine.previewPlan)(id);
        if (result.plan) {
            setPreviewAll(false);
            setPreview(result.plan);
        }
        else
            setError(result.errors.join(' '));
    };
    var switchDataset = async (sample) => {
        if (resettingRef.current || storeRef.current?.busy())
            return;
        resettingRef.current = true;
        backupGeneration.current++;
        try {
            await storeRef.current?.flush();
            if (sample) {
                personalState.current = stateRef.current;
                var saved = await (0, _srcStorage.readLocalState)(true);
                sampleRef.current = true;
                var initial = saved || (0, _srcSharedExperiencedDemo.experiencedDemo)();
                storeRef.current = createStore(initial);
                commit(initial);
            }
            else {
                var _initial = personalState.current || (await (0, _srcStorage.readLocalState)()) || (0, _srcMobileEngine.emptyDemo)();
                sampleRef.current = false;
                storeRef.current = createStore(_initial);
                commit(_initial);
            }
            setPhonePage('home');
            setNavigationOpen(false);
            setPlanSection('home');
            setupBack.current=null;
            coachingTransition.current={waiting:false,pending:null};
            setSampleMode(sample);
            setRecoveryKey('');
            setRecoveryInput('');
            setBackupInput('');
            setBackupPreview(null);
            setFocusedExercise(null);
            setHistoryItem(null);
            setPersonalSetup(false);
            setSourceChoice(undefined);
            setCalendarOpen(false);
            setTrackingSession('');
            setCustomizeSession('');
            setSubstitution(null);
            setChangePreview(null);
            setScienceOpen(false);
            setEditingHistory(false);
            setPlanImportOpen(false);
            setExercise(null);
            setPreview(null);
            setConfirm(null);
            setTab('Today');
            setSaveStatus(sample ? 'Sample data · on this device' : 'On this device');
            setError('');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Could not switch profiles. Your current work is kept.');
        }
        finally {
            resettingRef.current = false;
        }
    };
    var reset = async () => {
        if (!sampleRef.current) {
            setError('Personal data is preserved. Only the sample profile can be reset.');
            return;
        }
        if (resettingRef.current || storeRef.current?.busy())
            return;
        resettingRef.current = true;
        setResetting(true);
        try {
            await storeRef.current?.flush();
            var initial = (0, _srcSharedExperiencedDemo.experiencedDemo)();
            await (0, _srcStorage.resetLocalState)(true);
            await (0, _srcStorage.saveLocalState)(initial, true);
            storeRef.current = createStore(initial);
            commit(initial);
            setSaveStatus('Sample restored on this device');
            setPhonePage('home');
            setFocusedExercise(null);
            setError('');
            setTab('Today');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Sample storage could not be reset.');
        }
        finally {
            resettingRef.current = false;
            setResetting(false);
        }
    };
    if (!state)
        return /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNativeSafeAreaContext.SafeAreaView, {
            style: [styles.safe, _srcSharedBrand.isGrizzly && appearance.p.grizzlyStyle === 'wild' && !appearance.p.contrast && {backgroundColor: 'transparent'}],
            children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.KeyboardAvoidingView, {
                style: styles.flex,
                behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined,
                children: /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.ScrollView, {
                contentContainerStyle: styles.content,
                keyboardShouldPersistTaps: "handled",
                keyboardDismissMode: "on-drag",
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(NativeDenHero, {compact: true}), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Heading, {
                        eyebrow: _srcSharedBrand.brand.name.toUpperCase(),
                        title: readError ? 'Saved data needs attention' : 'Opening your training',
                        detail: readError ? 'We could not open your saved training. It has not been replaced.' : undefined
                    }), readError ? /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "Your original files are kept. Retry opening training after a temporary storage failure, or use a verified recovery file and key."
                            }), error && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                accessibilityRole: "alert",
                                style: styles.errorText,
                                children: error
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Retry opening training",
                                onPress: () => {
                                    if (resettingRef.current) return;
                                    resettingRef.current = true;
                                    void (0, _srcStorage.readLocalState)().then(saved => {
                                        const initial = saved ?? (0, _srcMobileEngine.emptyDemo)();
                                        storeRef.current = createStore(initial);
                                        commit(initial);
                                        setReadError(false);
                                        setError('');
                                    }).catch(e => setError(e instanceof Error ? e.message : 'Saved training could not be opened.')).finally(() => {resettingRef.current = false;});
                                }
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                                accessibilityLabel: "Device recovery key",
                                style: styles.input,
                                value: recoveryInput,
                                onChangeText: changeRecoveryInput,
                                autoCapitalize: "none",
                                autoCorrect: false,
                                secureTextEntry: true
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Restore recovery key",
                                onPress: () => {
                                    if (resettingRef.current)
                                        return;
                                    resettingRef.current = true;
                                    backupGeneration.current++;
                                    void (0, _srcStorage.restoreDeviceKey)(recoveryInput).then(async () => {
                                        var initial = await (0, _srcStorage.readLocalState)();
                                        if (initial) {
                                            storeRef.current = createStore(initial);
                                            commit(initial);
                                            setReadError(false);
                                            setRecoveryInput('');
                                            setBackupPreview(null);
                                        }
                                    }).catch(e => setError(e instanceof Error ? e.message : 'Recovery failed.')).finally(() => {
                                        resettingRef.current = false;
                                    });
                                }
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "Or restore a separately saved encrypted backup and its recovery key."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Choose recovery backup file",
                                onPress: () => {
                                    void chooseBackup();
                                }
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                                accessibilityLabel: "Recovery encrypted backup contents",
                                style: [styles.input, {
                                        minHeight: 80
                                    }],
                                multiline: true,
                                maxLength: _srcSharedLegacyTransfer.LEGACY_TRANSFER_MAX_BYTES,
                                value: backupInput,
                                onChangeText: changeBackupInput,
                                autoCapitalize: "none",
                                autoCorrect: false
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Preview recovery backup",
                                onPress: () => {
                                    void previewBackup();
                                }
                            }), backupPreview && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                        style: styles.body,
                                        children: [backupPreview.state.history.length, " saved workouts. Restoration replaces this device\u2019s unreadable profile. Save its original file first."]
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                        label: "Restore this recovery backup",
                                        onPress: () => {
                                            if (resettingRef.current)
                                                return;
                                            resettingRef.current = true;
                                            backupGeneration.current++;
                                            void (0, _srcStorage.restoreLocalBackup)(backupPreview.raw, backupPreview.key).then(initial => {
                                                storeRef.current = createStore(initial);
                                                commit(initial);
                                                setReadError(false);
                                                setBackupInput('');
                                                setRecoveryInput('');
                                                setBackupPreview(null);
                                            }).catch(e => setError(e.message)).finally(() => {
                                                resettingRef.current = false;
                                            });
                                        }
                                    })]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Share the original saved file",
                                onPress: () => {
                                    void (0, _srcStorage.originalSavedFile)().then(async (raw) => {
                                        if (raw)
                                            await (0, _srcFileTransfer.shareJsonFile)(raw, 'original-saved-file');
                                        else
                                            setError('No saved file is available.');
                                    }).catch(e => setError(e.message));
                                }
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Explore sample training",
                                onPress: () => void switchDataset(true)
                            })]
                    }) : /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.ActivityIndicator, {
                        color: COLORS.green
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(ModalFrame, {
                        visible: !!confirm,
                        onDismiss: completeCoachingTransition,
                        close: () => setConfirm(null),
                        title: confirm?.title ?? '',
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: confirm?.message
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: confirm?.label ?? 'Continue',
                                onPress: () => {
                                    var action = confirm?.action;
                                    setConfirm(null);
                                    action?.();
                                }
                            })]
                    })]
                })
            })
        });
    var next = (0, _srcSharedTraining.nextSession)(state);
    var blocked = next ? (0, _srcSharedTraining.eligibility)(state, next) : null;
    var active = state.active;
    var remaining = state.restTimer ? (0, _srcSharedRestTimer.restSeconds)(state.restTimer) : null;
    var guide = exercise ? _srcContent.guides[exercise.id] : undefined;
    var externalMedia = exercise ? _srcContent.media[exercise.id] : undefined;
    var substitutionPreview = substitution?.to ? (0, _srcSharedSubstitutions.previewSubstitution)(state, substitution) : null;
    var requestFinish = () => {
        var w = stateRef.current?.active;
        if (!w)
            return;
        var expected = (0, _srcSharedWorkoutFlow.workoutConfirmation)(w), done = w.sets.filter(x => x.done).length, unknown = (0, _srcMobileEngine.unknownLoads)(w, stateRef.current.custom), finishingStore = storeRef.current, finishingSample = sampleRef.current;
        setConfirm({
            title: done < w.sets.length ? 'Save a partial workout?' : 'Finish this workout?',
            message: `${done} of ${w.sets.length} sets logged. Only logged sets count toward your record.${unknown ? ` ${unknown} loaded sets have unknown weight.` : ''}`,
            label: 'Save workout',
            action: () => {
                void persistChange(s => {
                    (0, _srcSharedWorkoutFlow.assertWorkoutConfirmation)(s, expected);
                    return (0, _srcMobileEngine.finishWorkout)(s);
                }).then(saved => {
                    if (saved) {
                        setFocusedExercise(null);
                        setPhonePage('home');
                        if (finishingStore === storeRef.current && finishingSample === sampleRef.current && appearance.p.coaching === 'auto') reviewAfterWorkout(w.id);
                    }
                });
            }
        });
    };
    var saveSet = async (index, seconds, requestedAt) => {
        var w = stateRef.current?.active, log = w?.sets[index];
        if (!w || !log || log.done)
            return false;
        var saved = await persistChange(s => {
            if (s.active?.id !== w.id)
                throw Error('This workout is no longer open.');
            return (0, _srcSharedWorkoutLog.logWorkoutSet)(s, index, seconds);
        });
        if (saved) {
            var _next2 = stateRef.current;
            if (focusRef.current === log.exerciseId)
                setFocusedExercise((0, _srcSharedPairedSets.focusAfterSet)(_next2, index));
            setNow(requestedAt);
            _reactNative.AccessibilityInfo.announceForAccessibility('Set saved on this device.');
        }
        return saved;
    };
    var todayView = phonePage === 'workout' && active ? h(NativeWorkoutScreen, {
        state, focusedExercise, busy:savingAction, remaining, restMessage:restAlertMessage || alertMessage,
        sampleMode,saveStatus,saveError:error,compact:compactWorkout,onAvailableHeight:height=>setConstrainedWorkout(previous=>height<320?true:height>560?false:previous),onRetrySave:()=>{void persistChange(s=>({...s}));},
        onExit:()=>setPhonePage('home'), onFocusExercise:setFocusedExercise,
        onChangeSet:(index,patch)=>modify(s=>{if(s.active?.id!==active.id)throw Error('This workout changed. Reopen it before editing.');return (0,_srcSharedWorkoutLog.changeWorkoutSet)(s,index,patch);}),
        onLogSet:(index,seconds)=>saveSet(index,seconds,Date.now()),
        onChangeSetup:(exerciseId,text)=>{void persistChange(s=>{if(s.active?.id!==active.id)throw Error('This workout changed. Reopen it before editing.');return {...s,incrementKg:{...s.incrementKg,[exerciseId]:0},active:{...s.active,loadContext:{...s.active.loadContext,[exerciseId]:text}}};});},
        onOpenGuide:setExercise, onSubstitute:id=>openSubstitute(active.sessionId,id),
        onChangeFeedback:patch=>{void persistChange(s=>{if(s.active?.id!==active.id)throw Error('This workout changed. Reopen it before editing.');return {...s,hold:patch.symptom==='yes'||patch.symptom==='unsure'?true:s.hold,active:{...s.active,...patch}};});},
        onPauseRest:()=>{void persistChange(s=>({...s,restTimer:s.restTimer?s.restTimer.pausedSeconds!==null?(0,_srcSharedRestTimer.resumeRest)(s.restTimer):(0,_srcSharedRestTimer.pauseRest)(s.restTimer):null}));},
        onExtendRest:()=>{void persistChange(s=>({...s,restTimer:s.restTimer?(0,_srcSharedRestTimer.extendRest)(s.restTimer):null}));},
        onEndRest:()=>{void persistChange(s=>({...s,restTimer:null}));},
        onToggleRestAlerts:()=>{if(state.restAlerts){void persistChange(s=>({...s,restAlerts:false})).then(saved=>{if(saved)setAlertMessage('Rest alerts are off.');});}else void (0,_srcRestAlerts.enableRestAlerts)().then(async r=>{if(await persistChange(s=>({...s,restAlerts:r.enabled})))setAlertMessage(r.message);}).catch(e=>setError(e.message));},
        onFinish:requestFinish,
        onDiscard:()=>setConfirm({title:'Discard current workout?',message:'Active entries will be removed. Saved workouts are kept, and this session stays scheduled.',label:'Discard workout',action:()=>{var expected=(0,_srcSharedWorkoutFlow.workoutConfirmation)(active);void persistChange(s=>{(0,_srcSharedWorkoutFlow.assertWorkoutConfirmation)(s,expected);return {...s,active:null,restTimer:null};}).then(saved=>{if(saved){setFocusedExercise(null);setPhonePage('home');}});}})
    }) : h(NativeFlowScreen, {
        title:({home:'Today',options:'Workout options',session:'Workout exercises',warmup:'Warm-up & effort',schedule:'Change workout date',progression:'Review progression'})[phonePage] || 'Today',
        subtitle:phonePage==='home'?(0,_srcSharedTraining.niceDate)((0,_srcSharedTraining.day)()):undefined,
        onBack:phonePage==='home'?undefined:()=>setPhonePage(phonePage==='options'?'home':'options'),handleHardwareBack:phonePage!=='home',
        footer:phonePage==='session'?next && !active && next.date === (0,_srcSharedTraining.day)() && !blocked ? h(NativeActionFooter,{primary:{label:'Prepare to start',disabled:savingAction,onPress:()=>{void reviewBeforeWorkout(next.id,true);}}}) : undefined:undefined,
        children:phonePage==='home' || phonePage==='workout' ? [(0, _reactJsxRuntime.jsx)(_srcTodayHero.NativeTodayHero, {
                state: state,
                sample: sampleMode,
                busy: savingAction,
                onStart: target => { void reviewBeforeWorkout(target.id, true); },
                onPreview: target => {
                    setCalendarDate(target.date);
                    setCalendarOpen(true);
                },
                onTargets: target => setTrackingSession(target.id),
                onPlan: () => {
                    if (state.plan)
                        setTab('Plan');
                    else {
                        setSourceChoice(undefined);
                        setPersonalSetup(true);
                    }
                },
                onResume: () => { setPhonePage('workout'); setFocusedExercise(state.active?.sets.find(x => !x.done)?.exerciseId ?? state.active?.targets?.[0]?.exerciseId ?? null); },
                onCalendar: () => {
                    setCalendarDate((0, _srcSharedTraining.day)());
                    setCalendarOpen(true);
                },
                onResetSampleHold: () => {
                    if (!sampleRef.current)
                        return;
                    setConfirm({
                        title: 'Reset the sample hold?',
                        message: 'This resets a synthetic concern for interface testing. It does not provide medical clearance.',
                        label: 'Reset simulated hold',
                        action: () => {
                            if (!sampleRef.current) {
                                setError('Return to the sample profile before resetting its concern.');
                                return;
                            }
                            void persistChange(s => (0, _srcSharedTraining.changed)({
                                ...s,
                                hold: false
                            }, 'Reset simulated sample concern.'));
                        }
                    });
                }
            }),
!!next && !active && h(NativeButton, {variant:"outline",label:"Workout options", onPress:()=>{setPhonePage('options');}}),
!active && next && appearance.p.coaching !== 'off' && h(NativeButton, {variant:"outline",label:"Workout guidance", onPress:()=>{void reviewBeforeWorkout(next.id);}}),
appearance.p.coaching !== 'off' && state.history.some(w=>w.finishedAt) && h(NativeButton, {variant:"outline",label:"Last workout feedback", onPress:()=>{const latest=[...state.history].filter(w=>w.finishedAt).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0))[0]; if(latest)reviewAfterWorkout(latest.id);}})] : phonePage==='options' ? [h(NativeSettingsRow, {label:"Workout exercises", onPress:()=>{setPhonePage('session');}}),
h(NativeSettingsRow, {label:"Warm-up & effort", onPress:()=>{setPhonePage('warmup');}}),
h(NativeSettingsRow, {label:"Change workout date", onPress:()=>{setPhonePage('schedule');}}),
state.plan?.profile.mode === 'app' && h(NativeSettingsRow, {label:"Review progression", disabled:state.hold, value:state.hold?"Unavailable while a concern is recorded":undefined, onPress:()=>{setPhonePage('progression');}})] : phonePage==='schedule' ? [next && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "Change a workout date"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "Move this and later unstarted workouts together. Review every date before accepting."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                                accessibilityLabel: "New workout date YYYY-MM-DD",
                                style: styles.input,
                                value: moveDate,
                                onChangeText: setMoveDate,
                                placeholder: "YYYY-MM-DD",
                                autoCapitalize: "none",
                                maxLength: 10
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Preview date changes",
                                secondary: true,
                                onPress: () => {
                                    var r = (0, _srcSharedTraining.makeMoveProposal)(stateRef.current, next.id, moveDate, true);
                                    if (r.proposal)
                                        stageChange(r.proposal);
                                    else
                                        setError(r.error || 'This move is unavailable.');
                                }
                            })]
                    })] : phonePage==='warmup' ? [next && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "Warm-up, effort & finish"
                            }), (0, _srcSharedSessionGuide.sessionGuide)(state.plan, next).warmup.map((line, i) => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.body,
                                children: [i + 1, ". ", line]
                            }, i)), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: (0, _srcSharedSessionGuide.sessionGuide)(state.plan, next).effort
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Exercise order and progression",
                                secondary: true,
                                onPress: () => {
                                    var guide = (0, _srcSharedSessionGuide.sessionGuide)(state.plan, next);
                                    _reactNative.Alert.alert("Your workout", [...guide.order, ...guide.progression].join("\n\n"));
                                }
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.small,
                                children: (0, _srcSharedSessionGuide.sessionGuide)(state.plan, next).finish
                            })]
                    })] : phonePage==='progression' ? [state.plan?.profile.mode === 'app' && !active && !state.hold && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.sectionTitle,
                        children: "Review progression"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Load changes need your approval. Enter available increments in an exercise guide. Equipment limits may offer a wider rep range for eligible muscle-focused work."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        secondary: true,
                        label: "Preview a load or rep-range change",
                        onPress: () => {
                            var r = (0, _srcSharedTraining.makeLoadProposal)(stateRef.current);
                            if (r.proposal)
                                stageChange(r.proposal);
                            else
                                setError(r.error || 'No change is ready.');
                        }
                    })]
            }),blocked && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "Review before continuing"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: blocked
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.small,
                                children: "Review a shorter remaining block with the same dates. This does not provide medical return-to-training clearance."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Review a shorter return block",
                                secondary: true,
                                disabled: state.hold || state.plan.paused,
                                onPress: () => {
                                    var p = (0, _srcSharedTraining.makeProposal)(stateRef.current, 'return');
                                    if (p)
                                        stageChange(p);
                                    else
                                        setError('No recovery change is available.');
                                }
                            })]
                    })] : [next?.items.map(i => {
                        var e = (0, _srcSharedTraining.exFor)(i.exerciseId, state.custom);
                        return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(GrizzlyPressable, {
                                    accessibilityRole: "button",
                                    onPress: () => setExercise(e),
                                    style: styles.exerciseRow,
                                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                                            style: styles.flex,
                                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                                    style: styles.rowTitle,
                                                    children: e.name
                                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                                    style: styles.small,
                                                    children: [i.sets, " \xD7 ", (0, _srcSharedTraining.targetText)(i), " ", e.metric, " \xB7 ", i.rest, "s rest"]
                                                })]
                                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                            style: styles.link,
                                            children: "Guide"
                                        })]
                                }), e.metric === 'reps' && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    label: "Substitute exercise",
                                    secondary: true,
                                    onPress: () => openSubstitute(next.id, e.id)
                                })]
                        }, i.exerciseId);
                    }),next && state.plan?.profile.mode !== 'app' && !active && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.sectionTitle,
                        children: "Your workout targets"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Enter or edit your coach\u2019s or your own exercises before starting. No app-written progression is added."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: next.items.length ? 'Edit workout targets' : 'Add workout targets',
                        onPress: () => setTrackingSession(next.id)
                    })]
            })]
    });
    var coachingView = h(NativeFlowScreen,{title:'Coaching',subtitle:'Review your training. Changes need your approval.',children:[
        appearance.p.coaching !== 'off' && h(NativeSection,{title:'Workout guidance'},
            next&&!active&&h(NativeButton,{label:'Before your workout',variant:'outline',onPress:()=>{void reviewBeforeWorkout(next.id);}}),
            state.history.some(w=>w.finishedAt)&&h(NativeButton,{label:'Last workout feedback',variant:'outline',onPress:()=>{const latest=[...state.history].filter(w=>w.finishedAt).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0))[0];if(latest)reviewAfterWorkout(latest.id);}}),
            !next&&!state.history.some(w=>w.finishedAt)&&h(_reactNative.Text,{style:styles.body},'Build a plan to see guidance for your sessions.')),
        state.plan?.profile.mode==='app'&&h(NativeButton,{label:'Review progression',variant:'outline',disabled:!!active||state.hold,onPress:()=>{setTab('Today');setPhonePage('progression');}}),
        blocked&&h(_reactNative.Text,{style:styles.body},blocked),
        h(NativeSection,{title:'Proposed changes'},
            !state.proposals.some(p=>p.status==='pending'||p.status==='queued')&&h(_reactNative.Text,{style:styles.body},'No changes waiting for review.'),
            ...state.proposals.filter(p=>p.status==='pending'||p.status==='queued').map(proposal=>{
                const current=state.plan?.id===proposal.planId&&state.plan.version===proposal.baseVersion&&(proposal.changes||[]).every(change=>state.plan.sessions.some(session=>session.id===change.sessionId));
                return h(NativeSection,{key:proposal.id,title:proposal.title,description:current?proposal.reason:'The plan has changed. Request a fresh review.'},
                    h(_reactNative.Text,{style:styles.small},proposal.status==='queued'?'Queued only · targets stay unchanged until reviewed and confirmed.':'Targets stay unchanged until you accept.'),
                    current&&h(NativeButton,{label:'Review change',variant:'outline',onPress:()=>setChangePreview(proposal)}));
            }))
    ]});
    var planView = tab === 'Plan' && h(NativeFlowScreen,{
        title:({home:'Plans',current:'My plan',schedule:'Plan schedule',details:'Progression & sources',explore:'Find a plan',saved:'Saved & previous',tools:'Plan tools'})[planSection] || 'Plans',
        onBack:planSection==='home'?undefined:()=>setPlanSection('home'),handleHardwareBack:planSection!=='home',
        footer:planSection==='home'&&!state.plan?h(NativeActionFooter,{primary:{label:'Build my plan',disabled:!!active,onPress:()=>{setSourceChoice(undefined);setPersonalSetup(true);}}}):undefined,
        children:planSection==='home'?[
            state.plan ? h(NativeSection,{title:(0,_srcSharedPresentation.planName)(state.plan),description:`${_srcSharedTraining.goals.find(([id])=>id===state.plan.profile.goal)?.[1]||'Your training'} · ${state.plan.sessions.length} sessions${state.plan.paused?' · Paused':''}`},
                h(_reactNative.Text,{style:styles.small},`${state.plan.profile.mode==='app'?'App-guided training':state.plan.profile.mode==='coach'?'Coach-directed tracking':'Self-directed tracking'} · Version ${state.plan.version}`)) : h(_reactNative.Text,{style:styles.body},'Choose your goal, available time and equipment to build your first plan.'),
            h(_reactNative.View,{style:{flexDirection:'row',flexWrap:'wrap',gap:10}},
                state.plan&&h(NativeButton,{label:'Build plan',disabled:!!active,onPress:()=>{setSourceChoice(undefined);setPersonalSetup(true);}}),
                h(NativeButton,{label:'Find a plan',variant:'outline',onPress:()=>setPlanSection('explore')}),
                h(NativeButton,{label:'Import plan',variant:'outline',disabled:!!active,onPress:()=>setPlanImportOpen(true)}),
                h(NativeButton,{label:'Saved & previous',variant:'outline',onPress:()=>setPlanSection('saved')})),
            state.plan&&h(NativeSection,{title:'Your schedule'},
                ...state.plan.sessions.filter(session=>session.status==='scheduled').slice(0,6).map(session=>h(NativeSettingsRow,{key:session.id,label:(0,_srcSharedPresentation.sessionName)(session,state.plan),value:`${(0,_srcSharedTraining.niceDate)(session.date)} · ${(0,_srcSharedSessionDuration.durationText)(session,state.custom)}`,onPress:()=>{setCalendarDate(session.date);setCalendarOpen(true);}})),
                !state.plan.sessions.some(session=>session.status==='scheduled')&&h(_reactNative.Text,{style:styles.small},'No scheduled sessions remain in this block.'),
                h(NativeButton,{label:'View schedule',variant:'outline',onPress:()=>setPlanSection('schedule')})),
            state.plan&&h(_reactNative.View,{style:{flexDirection:'row',flexWrap:'wrap',gap:10}},
                h(NativeButton,{label:'Progression & sources',variant:'outline',onPress:()=>setPlanSection('details')}),
                h(NativeButton,{label:state.plan.paused?'Resume this plan':'Pause future training',variant:'outline',disabled:!!active,onPress:()=>{void persistChange(v=>(0,_srcSharedReusablePlan.setPlanPaused)(v,state.plan.id,state.plan.version,!state.plan.paused));}}),
                h(NativeButton,{label:'Export plan',variant:'outline',onPress:()=>{var snapshot=stateRef.current;void(0,_srcFileTransfer.shareJsonFile)(JSON.stringify(snapshot.plan),'plaintext-plan',()=>!resettingRef.current&&stateRef.current===snapshot).catch(e=>setError(e.message));}}))
        ]:planSection==='current'?(state.plan?[state.plan && h(NativeSection,{title:(0,_srcSharedPresentation.planName)(state.plan),description:`${state.plan.sessions.length} planned workouts${state.plan.paused?' · Paused':''}`}),
h(NativeSettingsRow, {label:"View schedule", onPress:()=>{setPlanSection('schedule');}}),
h(NativeSettingsRow, {label:"Progression & sources", onPress:()=>{setPlanSection('details');}}),
state.plan && h(NativeSettingsRow, {label:"Pause or resume plan", onPress:()=>{void persistChange(v=>(0,_srcSharedReusablePlan.setPlanPaused)(v,state.plan.id,state.plan.version,!state.plan.paused));},value:state.plan.paused?'Paused':'Active',disabled:!!active}),
h(NativeSettingsRow, {label:"Save or reuse a block", onPress:()=>{setPlanSection('saved');}})]:[planSection === 'current' && !state.plan && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Choose or build a plan to see your complete block here."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: "Explore plans",
                        onPress: () => setPlanSection('explore')
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: "Build my plan",
                        onPress: () => {
                            setSourceChoice(undefined);
                            setPersonalSetup(true);
                        }
                    })]
            })]):planSection==='tools'?[(0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                style: styles.tools,
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                    secondary: true, label: "Build plan", disabled: !!active,
                    onPress: () => { setSourceChoice(undefined); setPersonalSetup(true); }
                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                    secondary: true, label: "Import plan", disabled: !!active,
                    onPress: () => setPlanImportOpen(true)
                }), state.plan && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                    secondary: true, label: "Export plan",
                    onPress: () => {
                        var snapshot = stateRef.current;
                        void (0, _srcFileTransfer.shareJsonFile)(JSON.stringify(snapshot.plan), 'plaintext-plan', () => !resettingRef.current && stateRef.current === snapshot).catch(e => setError(e.message));
                    }
                })]
            })]:[planSection === 'saved' && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcSavedPlans.NativeSavedPlans, {
                sample: sampleMode,
                state: state,
                onChange: persistChange,
                onAccepted: () => setTab('Today'),
                onExport: async (p) => {
                    var snapshot = stateRef.current;
                    await (0, _srcFileTransfer.shareJsonFile)(JSON.stringify(p), 'plaintext-plan', () => !resettingRef.current && stateRef.current === snapshot);
                }
            }),planSection === 'details' && state.plan && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.eyebrow,
                        children: "YOUR CURRENT BLOCK"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.sectionTitle,
                        children: (0, _srcSharedPresentation.planName)(state.plan)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                        style: styles.body,
                        children: [state.plan.profile.days.map(x => _srcSharedTraining.weekdays[x]).join(' · '), " \xB7 ", state.plan.sessions.length, " sessions"]
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.small,
                        children: (0, _srcSharedPresentation.trainingCopy)(state.plan.progression)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        secondary: true,
                        label: state.plan.paused ? 'Resume this plan' : 'Pause future training',
                        disabled: !!active,
                        onPress: () => void persistChange(v => (0, _srcSharedReusablePlan.setPlanPaused)(v, state.plan.id, state.plan.version, !state.plan.paused))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcScience.NativePlanEvidence, {
                        plan: state.plan
                    }, state.plan.id), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        secondary: true,
                        label: "Save or reuse a block",
                        onPress: () => setPlanSection('saved')
                    })]
            }),planSection === 'schedule' && state.plan && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.sectionTitle,
                        children: "Every session in this block"
                    }), state.plan.sessions.slice(0, planSessionLimit).map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(GrizzlyPressable, {
                        accessibilityRole: "button",
                        onPress: () => {
                            setCalendarDate(x.date);
                            setCalendarOpen(true);
                        },
                        style: styles.exerciseRow,
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                                style: styles.flex,
                                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.rowTitle,
                                        children: (0, _srcSharedPresentation.sessionName)(x, state.plan)
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                        style: styles.small,
                                        children: [(0, _srcSharedTraining.niceDate)(x.date), " \xB7 week ", x.week, " \xB7 ", (0, _srcSharedSessionDuration.durationText)(x, state.custom), " \xB7 ", x.status]
                                    })]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.link,
                                children: "Review"
                            })]
                    }, x.id)), state.plan.sessions.length > planSessionLimit && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        secondary: true,
                        label: "Show more planned sessions",
                        onPress: () => setPlanSessionLimit(v => v + 20)
                    })]
            }),planSection === 'explore' && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: "Build a plan for my goals",
                        onPress: () => {
                            setSourceChoice(undefined);
                            setPersonalSetup(true);
                        }
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Below are four-week adult sample plans, not a personalized prescription. Experience, equipment, and running readiness shown below are assumptions to review."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        secondary: true,
                        label: "Browse science and source library",
                        onPress: () => setScienceOpen(true)
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.sectionTitle,
                        children: "Training style"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.ScrollView, {
                        horizontal: true,
                        showsHorizontalScrollIndicator: false,
                        contentContainerStyle: styles.pills,
                        children: [['all', 'All styles'], ..._srcSharedTraining.goals].map(([id, label]) => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Pill, {
                            label: label,
                            selected: planGoal === id,
                            onPress: () => {
                                setPlanGoal(id);
                                setCatalogLimit(8);
                                setPreview(null);
                                setError('');
                            }
                        }, id))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(NativeProgramFilters, {
                        query: planSearch, days: planDays, shown: catalogShown, total: catalogTotal,
                        onQuery: value => {setPlanSearch(value);setCatalogLimit(8);},
                        onDays: value => {setPlanDays(value);setCatalogLimit(8);},
                        onClear: () => {setPlanSearch('');setPlanDays(0);setCatalogLimit(8);}
                    }), planGoal === 'running' && !planSearch && !planDays && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "NHS Couch to 5K \xB7 run/walk plan"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "Start with the NHS run/walk sequence. Three separated days. This preview covers its first four weeks."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Preview beginner run/walk",
                                secondary: true,
                                onPress: () => openPreview(_srcMobileEngine.RUN_WALK)
                            })]
                    }), planGoal === 'sport' && !planSearch && !planDays && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "Sport \xB7 General strength foundation"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "General strength only. Position-specific drills and sport-specific competition plans are not available in this starter."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Preview general sport foundation",
                                secondary: true,
                                onPress: () => openPreview(_srcMobileEngine.SPORT_FOUNDATION)
                            })]
                    }), visibleCatalog.map(({definition:p,preview:sample}) => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.eyebrow,
                                children: "APP PLAN"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: p.name
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: p.description
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.small,
                                children: [p.days, " days \xB7 ", Math.max(...(sample.plan?.sessions.map(x => x.minutes) || [p.minutes])), "-minute sample window \xB7 ", p.goal === 'running' ? 'Suitable running route' : p.equipment === 'flexible' ? 'Home / dumbbell / gym options; this sample uses dumbbells' : (0, _srcSharedProgramCatalog.programEquipment)(p)]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.small,
                                children: [p.experience === 'advanced' ? 'Needs established technique and consistent recent training. ' : p.experience === 'some' ? p.goal === 'running' ? 'Needs the stated recent running base.' : 'Assumes established lifting experience.' : 'Starts with time to learn the exercises.', p.runBase ? ' Assumes comfortable continuous running for 30 minutes.' : '']
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.small,
                                children: ["Equipment: ", p.requirements?.join(' · ')]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Preview this plan",
                                secondary: true,
                                onPress: () => openPreview(p.id)
                            })]
                    }, p.id)), catalogMatches.sources.slice(0, catalogLimit).map(p => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.eyebrow,
                                children: "PRELOADED PUBLIC ROUTINE"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: p.name
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                style: styles.body,
                                children: [p.creator, " \xB7 ", p.days, " days"]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: p.scope
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Build this source routine",
                                onPress: () => {
                                    setSourceChoice({
                                        id: p.id,
                                        goal: planGoal === 'all' ? p.goals[0] : planGoal
                                    });
                                    setPersonalSetup(true);
                                }
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "View published source",
                                secondary: true,
                                onPress: () => void openUrl(p.url)
                            })]
                    }, p.id)), catalogMatches.references.length > 0 && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "Established programs from their authors"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "These additional full versions are not preloaded here. Source links let you review the original. Use Build a plan to choose manual or coach tracking and enter the author\u2019s targets."
                            }), catalogMatches.references.slice(0, catalogLimit).map(p => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.sectionTitle,
                                        children: p.name
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                        style: styles.body,
                                        children: [p.author, " \xB7 ", p.days, " days/week \xB7 ", p.weeks ? p.weeks + ' weeks' : 'ongoing']
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.body,
                                        children: p.description
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                        style: styles.small,
                                        children: [p.experience, " \xB7 source checked ", p.checked]
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                        label: "View original program",
                                        secondary: true,
                                        onPress: () => {
                                            void openUrl(p.url);
                                        }
                                    })]
                            }, p.id))]
                    }), catalogShown < catalogTotal && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: 'Show more matching plans', secondary: true, onPress: () => setCatalogLimit(value => value + 8)
                    }), linkError && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        accessibilityRole: "alert",
                        style: styles.errorText,
                        children: linkError
                    })]
            })]
    });
    var libraryView = /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.FlatList, {
        style: styles.flex,
        ListHeaderComponent: /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                style: {gap: 12, paddingBottom: 8},
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Heading, {
                        eyebrow: "EXERCISE LIBRARY",
                        title: "Exercise library.",
                        detail: "Search by name, movement or muscle. Equipment filters match the listed equipment."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                        accessibilityLabel: "Search exercise library",
                        style: styles.input,
                        placeholder: "Search exercises\u2026",
                        placeholderTextColor: COLORS.muted,
                        value: search,
                        onChangeText: setSearch,
                        autoCapitalize: "none",
                        autoCorrect: false,
                        clearButtonMode: "while-editing"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.ScrollView, {
                        horizontal: true,
                        showsHorizontalScrollIndicator: false,
                        contentContainerStyle: styles.pills,
                        children: equipmentOptions.map(e => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Pill, {
                            label: e,
                            selected: equipment === e,
                            onPress: () => setEquipment(e)
                        }, e))
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                        style: styles.small,
                        children: [filtered.length, " of ", _srcSharedTraining.exercises.length + state.custom.length, " exercises \xB7 ", Object.keys(_srcContent.guides).length, " detailed guides"]
                    })]
            }),
                data: filtered,
                keyExtractor: x => x.id,
                contentContainerStyle: [styles.content, {
                        paddingTop: 4
                    }],
                keyboardShouldPersistTaps: "handled",
                keyboardDismissMode: "on-drag",
                initialNumToRender: 15,
                ListEmptyComponent: /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.sectionTitle,
                            children: "No matches yet."
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.body,
                            children: "Try a shorter name or choose All equipment."
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            label: "Clear filters",
                            secondary: true,
                            onPress: () => {
                                setSearch('');
                                setEquipment('All');
                            }
                        })]
                }),
                renderItem: ({ item }) => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(GrizzlyPressable, {
                    accessibilityRole: "button",
                    accessibilityLabel: `Open ${item.name} guide`,
                    onPress: () => setExercise(item),
                    style: styles.exerciseRow,
                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                            style: styles.flex,
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.rowTitle,
                                    children: item.name
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.small,
                                    children: [item.equipment, " \xB7 ", item.pattern]
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.guideLabel,
                                    children: _srcContent.guides[item.id] ? 'STEP-BY-STEP GUIDE' : 'QUICK CUES'
                                })]
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.arrow,
                            children: "\u2197"
                        })]
                })
    });
    var profileView = h(_react.Fragment,null,
h(NativeSettingsRow, {label:sampleMode?"Return to my profile":"Explore a sample plan", onPress:()=>{void switchDataset(!sampleMode);},value:sampleMode?'Sample profile · synthetic':'My profile · encrypted'}),
(0, _reactJsxRuntime.jsx)(NativeEquipmentLimit, {
                        state: state,
                        onSave: persistChange
                    }),
(0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "Your device profile"
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "Your phone saves independently. Optional account backups can be opened from Settings when the service is configured."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.small,
                                children: "Choose pounds or kilograms. Finish or discard your active workout before changing units."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.View, {
                                style: styles.pills,
                                children: ['lb', 'kg'].map(unit => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Pill, {
                                    label: unit,
                                    selected: state.profile.units === unit,
                                    onPress: async () => active ? setError('Finish or discard the workout before changing units.') : await persistChange(s => ({
                                        ...s,
                                        profile: {
                                            ...s.profile,
                                            units: unit
                                        }
                                    }))
                                }, unit))
                            }), sampleMode && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Reset sample data",
                                secondary: true,
                                onPress: () => setConfirm({
                                    title: 'Restore the sample profile?',
                                    message: 'This restores synthetic sample workouts. Your private profile and active timer are kept.',
                                    label: 'Restore sample profile',
                                    action: () => {
                                        void reset();
                                    }
                                })
                            })]
                    }));
    var historyView = h(NativeFlowScreen,{title:historySection==='progress'?'Progress':'Session history',children:historySection==='progress'?h(_srcProgress.NativeProgress,{state}):[h(NativeSettingsRow, {label:"Progress", onPress:()=>{setHistorySection('progress');}}),
(0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                        style: styles.stats,
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                                grow: true,
                                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.statNumber,
                                        children: state.history.length
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.small,
                                        children: "saved workouts"
                                    })]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                                grow: true,
                                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.statNumber,
                                        children: state.history.reduce((n, w) => n + w.sets.filter(x => x.done).length, 0)
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.small,
                                        children: "completed sets"
                                    })]
                            })]
                    }),
!state.history.length && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.sectionTitle,
                                children: "Your story starts with one session."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: "Choose a plan, enter what you actually do, and save your first workout."
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                label: "Back to Today",
                                onPress: () => setTab('Today')
                            })]
                    }),
(0,_srcSharedPresentation.newestFirstWorkouts)(state.history).slice(0, historyLimit).map(w => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(GrizzlyPressable, {
                        accessibilityRole: "button",
                        style: styles.exerciseRow,
                        onPress: () => {
                            setEditingHistory(false);
                            setHistoryItem(w);
                        },
                        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                                style: styles.flex,
                                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                        style: styles.rowTitle,
                                        children: (0, _srcSharedPresentation.workoutName)(w, state)
                                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                        style: styles.small,
                                        children: [(0, _srcSharedTraining.niceDate)(w.date), " \xB7 ", w.sets.filter(x => x.done).length, " sets \xB7 ", w.partial ? 'Partial' : 'Completed']
                                    })]
                            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.link,
                                children: "View \u2192"
                            })]
                    }, w.id)),
state.history.length > historyLimit && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: 'Show more saved workouts', secondary: true, onPress: () => setHistoryLimit(value => value + 20)
                    })]});
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNativeSafeAreaContext.SafeAreaView, {
        style: [styles.safe, _srcSharedBrand.isGrizzly && appearance.p.grizzlyStyle === 'wild' && !appearance.p.contrast && {backgroundColor: 'transparent'}],
        edges: ['top', 'bottom', 'left', 'right'],
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_expoStatusBar.StatusBar, {
                style: appearance.dark ? "light" : "dark"
            }), !(tab === 'Today' && phonePage === 'workout') && h(NativeWorkspaceHeader, {
                title:tab==='Plan'?'Plans':tab==='Library'?'Exercises':tab==='History'?(historySection==='progress'?'Progress':'Session history'):tab,
                sample:sampleMode,onMenu:()=>{if(!coachingTransition.current.waiting)setNavigationOpen(true);}
            }), error && !compactWorkout ? /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(GrizzlyPressable, {
                accessibilityRole: "button",
                onPress: () => setError(''),
                style: styles.error,
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.errorText,
                        children: error
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.small,
                        children: "Tap to dismiss"
                    })]
            }) : null, /*#__PURE__*/ null, resetting && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                accessibilityLiveRegion: "polite",
                style: styles.body,
                children: "Resetting local data\u2026"
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.KeyboardAvoidingView, {
                style: styles.flex,
                behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined,
                testID: 'native-primary-content',
                children: tab === 'Today' ? todayView : tab === 'Plan' ? planView : tab === 'Library' ? libraryView : tab === 'Coaching' ? coachingView : tab === 'Settings' ? /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcSettings.NativeSettings, {
                    reminderMessage: workoutReminderMessage,
                    profile: profileView,
                    children: !sampleMode && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcCloudAccount.NativeCloudAccount, {
                                state: state,
                                onRestore: (next, expected) => persistChange(s => {
                                    if (s !== expected || s.active || sampleRef.current)
                                        throw Error('The profile changed. Review the cloud backup again.');
                                    return next;
                                })
                            }),
                    footer: !sampleMode && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.sectionTitle,
                                    children: "Backup and recovery"
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.body,
                                    children: "Records use AES-GCM encryption. Keep a backup and a separate recovery key. Device uninstall, key loss or a new phone may make this device-only key unavailable."
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: "Erase private profile on this device",
                                    onPress: () => setConfirm({
                                        title: 'Erase this private profile?',
                                        message: 'This deletes only this device’s private plan, workout history, setup draft and vault keys. Export a backup and a separate recovery key first. Sample records and other devices are unaffected.',
                                        label: 'Erase private profile',
                                        action: () => {
                                            if (resettingRef.current || storeRef.current?.busy())
                                                return;
                                            resettingRef.current = true;
                                            backupGeneration.current++;
                                            void (0, _srcFileTransfer.cleanExportFiles)(true).then(() => (0, _srcStorage.erasePrivateProfile)()).then(() => {
                                                var initial = (0, _srcMobileEngine.emptyDemo)();
                                                storeRef.current = createStore(initial);
                                                commit(initial);
                                                personalState.current = null;
                                                setHistoryItem(null);
                                                setRecoveryKey('');
                                                setRecoveryInput('');
                                                setBackupInput('');
                                                setBackupPreview(null);
                                                setError('');
                                                setTab('Today');
                                                setSaveStatus('Private profile erased from this device.');
                                            }).catch(e => setError(e.message)).finally(() => {
                                                resettingRef.current = false;
                                            });
                                        }
                                    })
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: "Show recovery key",
                                    onPress: () => {
                                        var snapshot = stateRef.current;
                                        void (0, _srcStorage.localRecoveryKey)().then(key => {
                                            if (!resettingRef.current && !sampleRef.current && stateRef.current === snapshot)
                                                setRecoveryKey(key);
                                        }).catch(e => setError(e.message));
                                    }
                                }), recoveryKey && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                            selectable: true,
                                            style: styles.small,
                                            children: recoveryKey
                                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                            secondary: true,
                                            label: "Hide recovery key",
                                            onPress: () => setRecoveryKey('')
                                        })]
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: "Export encrypted backup",
                                    onPress: () => {
                                        var snapshot = stateRef.current;
                                        void (0, _srcStorage.encryptedStateBackup)(snapshot).then(raw => (0, _srcFileTransfer.shareJsonFile)(raw, 'encrypted-backup', () => !resettingRef.current && stateRef.current === snapshot)).catch(e => setError(e.message));
                                    }
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.sectionTitle,
                                    children: "Restore an encrypted backup"
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.small,
                                    children: "Export your current profile first. Older password-protected transfer files are also supported. Preview and explicitly accept a replacement. Sample data is kept."
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: "Choose encrypted backup file",
                                    onPress: () => {
                                        void chooseBackup();
                                    }
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                                    accessibilityLabel: "Encrypted backup contents",
                                    style: [styles.input, {
                                            minHeight: 80
                                        }],
                                    multiline: true,
                                    maxLength: _srcSharedLegacyTransfer.LEGACY_TRANSFER_MAX_BYTES,
                                    value: backupInput,
                                    onChangeText: changeBackupInput,
                                    autoCapitalize: "none",
                                    autoCorrect: false
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                                    accessibilityLabel: transferBackup ? "Older transfer file password" : "Backup recovery key",
                                    placeholder: transferBackup ? "Original transfer password" : "Separately saved recovery key",
                                    style: styles.input,
                                    secureTextEntry: true,
                                    maxLength: 2048,
                                    value: recoveryInput,
                                    onChangeText: changeRecoveryInput,
                                    autoCapitalize: "none",
                                    autoCorrect: false
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: "Preview backup restore",
                                    onPress: () => {
                                        void previewBackup();
                                    }
                                }), backupPreview && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                            style: styles.body,
                                            children: [backupPreview.state.history.length, " saved workouts \xB7 ", backupPreview.state.active ? 'active workout included' : 'no active workout', ". Accepting replaces this private profile."]
                                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                            disabled: !!active || resetting || backupPreview.expected !== state,
                                            label: "Replace private profile with this backup",
                                            onPress: () => {
                                                if (stateRef.current?.active || resettingRef.current || storeRef.current?.busy() || stateRef.current !== backupPreview.expected)
                                                    return;
                                                resettingRef.current = true;
                                                backupGeneration.current++;
                                                void storeRef.current?.flush().then(() => backupPreview.transfer ? (0, _srcStorage.restorePasswordTransfer)(backupPreview.state, backupPreview.expected) : (0, _srcStorage.restoreLocalBackup)(backupPreview.raw, backupPreview.key)).then(initial => {
                                                    if (initial) {
                                                        storeRef.current = createStore(initial);
                                                        commit(initial);
                                                        setBackupInput('');
                                                        setRecoveryInput('');
                                                        setRecoveryKey('');
                                                        setBackupPreview(null);
                                                        setSaveStatus('Restored encrypted backup on this device.');
                                                    }
                                                }).catch(e => setError(e.message)).finally(() => {
                                                    resettingRef.current = false;
                                                });
                                            }
                                        }), active && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                            style: styles.small,
                                            children: "Finish or discard the active workout before replacing the private profile."
                                        })]
                                })]
                        })
                }) : historyView
            }), !compactWorkout && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(GrizzlyPressable, {
                disabled: !saveStatus.startsWith('Save failed'),
                accessibilityRole: "button",
                accessibilityLabel: "Retry saving on this device",
                style: saveStatus.startsWith('Save failed') ? { minHeight: 48, justifyContent: 'center' } : undefined,
                onPress: async () => await persistChange(s => ({
                    ...s
                })),
                children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                    accessibilityLiveRegion: "polite",
                    style: styles.saveStatus,
                    children: sampleMode && !saveStatus.startsWith('Sample') ? 'Sample · ' + saveStatus : saveStatus
                })
            }), h(NativeWorkspaceMenu, {
                visible:navigationOpen,onClose:()=>setNavigationOpen(false),onDismiss:completeCoachingTransition,
                onSelect:selectDestination,state,sample:sampleMode,
                selected:tab==='Plan'?'plans':tab==='Library'?'exercises':tab==='History'?(historySection==='progress'?'progress':'history'):tab==='Settings'?'settings':tab==='Coaching'?'coaching':'today'
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: !!coachingCurrent,
                onDismiss: completeCoachingTransition,
                close: () => setCoaching(null),
                title: coaching?.phase === 'before' ? 'Before your workout' : 'Workout feedback',
                children: coachingCurrent && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(NativeWorkoutCoaching, {summary:coaching.summary}),
                        error && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {accessibilityRole:'alert',style:styles.errorText,children:error}),
                        coaching.phase === 'before' && coaching.base.plan?.sessions.some(s => s.id === coaching.sessionId && s.date === (0, _srcSharedTraining.day)() && !(0, _srcSharedTraining.eligibility)(coaching.base,s)) && !coaching.base.active && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            label:'Start reviewed workout',disabled:savingAction,onPress:() => { void startReviewedWorkout(coaching); }
                        }),
                        coaching.phase === 'after' && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            label:'View saved workout',secondary:true,onPress:() => {
                                var request = coaching;
                                setCoaching(null);
                                if (_reactNative.Platform.OS === 'ios') coachingTransition.current = {waiting:true,pending:{kind:'record',request}};
                                else {
                                    var record = stateRef.current?.history.find(w => w.id === request.workoutId);
                                    if(record){setEditingHistory(false);setHistoryItem(record);}
                                }
                            }
                        }),
                        /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {label:coaching.phase === 'before' ? 'Not now' : 'Done',secondary:true,onPress:() => setCoaching(null)})]
                })
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: scienceOpen,
                close: () => setScienceOpen(false),
                title: "Science and sources",
                children: scienceOpen && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcScience.NativeScienceLibrary, {})
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: calendarOpen,
                onDismiss: completeCoachingTransition,
                close: () => setCalendarOpen(false),
                title: "Calendar and commitments",
                children: calendarOpen && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcCalendar.NativeCalendar, {
                    initialDate: calendarDate,
                    state: state,
                    onChange: persistChange,
                    onProposal: async (p) => {
                        var saved = await stageChange(p);
                        if (saved)
                            setCalendarOpen(false);
                        return saved;
                    },
                    onStart: id => reviewBeforeWorkout(id, true),
                    onHistory: w => navigateAfterModal(()=>setCalendarOpen(false),()=>{
                        setEditingHistory(false);
                        setHistoryItem(w);
                    }),
                    onResume: () => {
                        setCalendarOpen(false);
                        setPhonePage('workout');
                        setFocusedExercise(stateRef.current?.active?.sets.find(x=>!x.done)?.exerciseId ?? stateRef.current?.active?.targets?.[0]?.exerciseId ?? null);
                        setTab('Today');
                    },
                    onEdit: id => navigateAfterModal(()=>setCalendarOpen(false),()=>{
                        if (state.plan?.profile.mode === 'app') setCustomizeSession(id);
                        else setTrackingSession(id);
                    })
                }, calendarDate)
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: !!customizeSession,
                close: () => setCustomizeSession(''),
                title: "Customize your plan",
                children: customizeSession && state.plan && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcPlanCustomizer.NativePlanCustomizer, {
                    state: state,
                    sessionId: customizeSession,
                    onChange: persistChange,
                    onSaved: () => setCustomizeSession('')
                }, customizeSession)
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: !!trackingSession,
                close: () => setTrackingSession(''),
                title: "Workout targets",
                children: trackingSession && state.plan?.sessions.some(x => x.id === trackingSession) && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcSessionEditor.SessionEditor, {
                    state: state,
                    sessionId: trackingSession,
                    onSave: async (edit) => {
                        var r = (0, _srcSharedTracking.applyTrackingEdit)(stateRef.current, edit);
                        if (r.error)
                            return r.error;
                        if (await persistChange(() => r.state)) {
                            setTrackingSession('');
                            return;
                        }
                        return 'This workout could not be saved.';
                    }
                }, trackingSession)
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: planImportOpen,
                close: () => setPlanImportOpen(false),
                title: "Import a saved plan",
                children: planImportOpen && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcPlanImport.NativePlanImporter, {
                    state: state,
                    onCancel: () => setPlanImportOpen(false),
                    onAccept: async (preview) => {
                        if (!sampleMode && state.profile.age < 18) {
                            setError('Personal youth use awaits verified consent and privacy safeguards.');
                            return false;
                        }
                        var saved = await persistChange(s => (0, _srcSharedPlanImport.acceptPlanImport)(s, preview));
                        if (saved) {
                            setPlanImportOpen(false);
                            setTab('Today');
                        }
                        return saved;
                    }
                })
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: personalSetup,
                scroll: false,
                compactChrome: viewport.height < 500,
                error: error,
                closeLabel: "Save & close",
                closeDisabled: savingAction,
                requestClose: () => { if(setupBack.current?.())return; void (0,_srcStorage.flushLocalSetup)(sampleMode).then(()=>{setPersonalSetup(false);setSourceChoice(undefined);setError('');}).catch(e=>setError(e.message)); },
                close: () => {
                    void (0, _srcStorage.flushLocalSetup)(sampleMode).then(() => {
                        setPersonalSetup(false);
                        setSourceChoice(undefined);
                        setError('');
                    }).catch(e => setError(e.message));
                },
                title: "Your plan setup",
                children: personalSetup && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcPlanSetup.PlanSetup, {
                    sourceChoice: sourceChoice,
                    onRegisterBack: handler=>{setupBack.current=handler;},
                    sample: sampleMode,
                    state: state,
                    onAccept: async (profile, plan, events) => {
                        if (!sampleMode && profile.age < 18)
                            return 'Youth plans are available in the sample profile. Personal youth use awaits verified consent and privacy safeguards.';
                        var r = (0, _srcSharedOnboarding.acceptSetup)(stateRef.current, profile, plan, events);
                        if (r.error)
                            return r.error;
                        if (await persistChange(() => r.state)) {
                            setPersonalSetup(false);
                            setSourceChoice(undefined);
                            setPhonePage('home');
                            setTab('Today');
                            return;
                        }
                        return 'This plan could not be saved. Check your entries.';
                    }
                })
            }), /*#__PURE__*/ h(ModalFrame, {
                visible: !!exercise, scroll:false, close:()=>setExercise(null),
                requestClose:()=>{if(!guideBack.current?.())setExercise(null);},
                title:"Exercise guide",
                children:exercise && h(NativeExerciseGuideScreen, {
                    key:exercise.id, exercise, guide, media:externalMedia, linkError,
                    onOpenUrl:url=>{void openUrl(url);},
                    onRegisterBack:handler=>{guideBack.current=handler;},
                    equipmentSettings:(0,_srcSharedTraining.isLoadTracked)(exercise)?h(NativeEquipmentLimit,{state,exercise,onSave:persistChange}):undefined
                })
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: !!preview,
                onDismiss: completeCoachingTransition,
                close: () => setPreview(null),
                title: "Plan preview",
                children: preview && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.title,
                            children: (0, _srcSharedPresentation.planName)(preview)
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                            style: styles.body,
                            children: [preview.sessions.length, " sessions \xB7 4 weeks \xB7 ", preview.profile.days.map(x => _srcSharedTraining.weekdays[x]).join(' / ')]
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.sectionTitle,
                                    children: "Review the sample assumptions"
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.body,
                                    children: ["Adult age 28 \xB7 ", preview.profile.experience, " \xB7 ", preview.profile.equipment, " \xB7 up to ", preview.profile.minutes, " minutes"]
                                }), preview.profile.runBase && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.body,
                                    children: `Assumes comfortable continuous running for 30 minutes, ${preview.profile.runDays} recent running days and ${preview.profile.runMinutes} easy running minutes each week.`
                                }), preview.profile.jumpReady && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.body,
                                    children: "Assumes a clear landing area and already comfortable landing skill."
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.small,
                                    children: "The app has not assessed your readiness. These values are a demo configuration; Use Build my plan to enter your own choices."
                                })]
                        }), preview.notes.map((note, i) => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.body,
                            children: note
                        }, i)), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            secondary: true,
                            label: previewAll ? 'Show first week' : 'Show every workout',
                            onPress: () => setPreviewAll(!previewAll)
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.sectionTitle,
                            children: previewAll ? 'Complete schedule' : 'Week one'
                        }), preview.sessions.filter(s => previewAll || s.week === 1).map(s => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.sectionTitle,
                                    children: (0, _srcSharedPresentation.sessionName)(s, preview)
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.small,
                                    children: [(0, _srcSharedTraining.niceDate)(s.date), " \xB7 ", (0, _srcSharedSessionDuration.durationText)(s, state.custom)]
                                }), s.items.map(item => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.body,
                                    children: [(0, _srcSharedTraining.exFor)(item.exerciseId, state.custom).name, " \xB7 ", item.sets, " \xD7 ", (0, _srcSharedTraining.targetText)(item), " ", (0, _srcSharedTraining.exFor)(item.exerciseId, state.custom).metric]
                                }, item.exerciseId))]
                        }, s.id)), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcScience.NativePlanEvidence, {
                            plan: preview
                        }, preview.id), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.body,
                            children: (0, _srcSharedPresentation.trainingCopy)(preview.progression)
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            disabled: !!active,
                            label: sampleMode ? state.plan ? 'Use this sample plan · keep history' : 'Use this sample plan' : 'Build this plan for me',
                            onPress: async () => {
                                if (!sampleMode) {
                                    var choice={id:preview.profile.programId || '',goal:preview.profile.goal};
                                    navigateAfterModal(()=>setPreview(null),()=>{setSourceChoice(choice);setPersonalSetup(true);});
                                    return;
                                }
                                if (await persistChange(s => (0, _srcMobileEngine.adoptPlan)(s, preview))) {
                                    setPreview(null);
                                    setTab('Today');
                                }
                            }
                        }), active && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.small,
                            children: "Finish or discard your active workout first."
                        })]
                })
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: !!historyItem,
                onDismiss: completeCoachingTransition,
                close: () => setHistoryItem(null),
                title: "Workout record",
                children: historyItem && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                    children: [editingHistory ? /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcHistoryEditor.NativeHistoryEditor, {
                            state: state,
                            id: historyItem.id,
                            onCancel: () => setEditingHistory(false),
                            onSave: async (edit) => {
                                var saved = await persistChange(s => (0, _srcSharedHistoryEdit.applyHistoryEdit)(s, edit));
                                if (saved) {
                                    setEditingHistory(false);
                                    setHistoryItem(stateRef.current.history.find(w => w.id === edit.draft.id) || null);
                                }
                                return saved;
                            }
                        }) : /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            secondary: true,
                            label: "Edit saved workout",
                            onPress: () => setEditingHistory(true)
                        }), !editingHistory && appearance.p.coaching !== 'off' && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            label:'Review workout feedback',secondary:true,onPress:() => reviewAfterWorkout(historyItem.id)
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.title,
                            children: (0, _srcSharedPresentation.workoutName)(historyItem, state)
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                            style: styles.body,
                            children: [(0, _srcSharedTraining.niceDate)(historyItem.date), " \xB7 ", historyItem.partial ? 'Partial workout' : 'Completed workout']
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.small,
                            children: "Saved on this device. The app cannot assess your form or fitness from this record."
                        }), Array.from(new Set(historyItem.sets.map(x => x.exerciseId))).map(id => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(Card, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.sectionTitle,
                                    children: (0, _srcSharedTraining.exFor)(id, state.custom).name
                                }), historyItem.sets.filter(x => x.exerciseId === id).map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                                    style: {
                                        gap: 5
                                    },
                                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                            style: styles.body,
                                            children: ["Set ", x.set, ": ", x.done ? `${x.reps} ${(0, _srcSharedTraining.exFor)(id, state.custom).metric}${(0, _srcSharedTraining.isLoadTracked)((0, _srcSharedTraining.exFor)(id, state.custom)) ? ` · ${x.kg === null ? 'Load unknown' : (0, _srcSharedTraining.displayLoad)(x.kg, state.profile.units)}` : ''}` : 'Not completed']
                                        }), x.done && (0, _srcSharedTraining.exFor)(id, state.custom).metric === 'reps' && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                            style: styles.small,
                                            children: ["RIR: ", (0, _srcSharedTraining.rirText)(x.rir)]
                                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(RecordedMetrics, {
                                            metrics: x.metrics
                                        })]
                                }, x.set)), historyItem.rir?.[id] != null && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.small,
                                    children: ["Legacy exercise-level RIR: ", (0, _srcSharedTraining.rirText)(historyItem.rir[id]), ". Preserved from the older log; separate from individual set RIR."]
                                }), historyItem.loadContext?.[id] && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.small,
                                    children: ["Setup: ", historyItem.loadContext[id]]
                                })]
                        }, id))]
                })
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: !!changePreview,
                close: () => setChangePreview(null),
                title: "Review proposed change",
                children: changePreview && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.sectionTitle,
                            children: changePreview.title
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.body,
                            children: changePreview.reason
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                            style: styles.body,
                            children: ["Current: ", changePreview.before]
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                            style: styles.body,
                            children: ["Proposed: ", changePreview.after]
                        }), changePreview.changes?.map(c => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.body,
                                    children: [(0, _srcSharedTraining.niceDate)(state.plan.sessions.find(x => x.id === c.sessionId).date), c.patch.date ? ' → ' + (0, _srcSharedTraining.niceDate)(c.patch.date) : '', c.patch.minutes ? ' · ' + c.patch.minutes + ' min' : '']
                                }), c.patch.items?.map(i => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.small,
                                    children: [(0, _srcSharedTraining.exFor)(i.exerciseId, state.custom).name, " \xB7 ", i.sets, " \xD7 ", (0, _srcSharedTraining.targetText)(i)]
                                }, i.exerciseId))]
                        }, c.sessionId)), changePreview.warnings?.map((w, i) => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.body,
                            children: w
                        }, i)), error && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            accessibilityRole: "alert",
                            style: styles.errorText,
                            children: error
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            label: "Accept change",
                            onPress: async () => {
                                if (await persistChange(s => {
                                    var r = (0, _srcSharedTraining.applyProposal)(s, changePreview.id);
                                    if (r.error)
                                        throw new Error(r.error);
                                    return r.state;
                                }))
                                    setChangePreview(null);
                            }
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                            label: "Decline change",
                            secondary: true,
                            onPress: async () => {
                                if (await persistChange(s => ({
                                    ...s,
                                    proposals: s.proposals.map(p => p.id === changePreview.id ? {
                                        ...p,
                                        status: 'declined'
                                    } : p)
                                })))
                                    setChangePreview(null);
                            }
                        })]
                })
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(ModalFrame, {
                visible: !!substitution,
                close: () => setSubstitution(null),
                title: "Choose a substitute",
                children: substitution && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.sectionTitle,
                            children: (0, _srcSharedTraining.exFor)(substitution.from, state.custom).name
                        }), !substitution.to ? /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: showSubInventory ? 'Close equipment editor' : 'Update available equipment',
                                    onPress: () => setShowSubInventory(!showSubInventory)
                                }), showSubInventory && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcEquipmentSurvey.NativeEquipmentSurvey, {
                                    profile: {
                                        ...state.profile,
                                        inventory: substitution.inventory || state.profile.inventory
                                    },
                                    onChange: inventory => {
                                        setError('');
                                        setSubstitution({
                                            ...substitution,
                                            inventory
                                        });
                                    }
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.small,
                                    children: "Equipment changes are accepted with your substitute. Other workouts stay as recorded."
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.body,
                                    children: "Choose available equipment. These are practical alternatives; loads and results stay separate."
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.ScrollView, {
                                    horizontal: true,
                                    contentContainerStyle: styles.pills,
                                    children: ['All', ...new Set((0, _srcSharedSubstitutions.substitutionOptions)(substitution.from, {
                                            ...state.profile,
                                            inventory: substitution.inventory || state.profile.inventory
                                        }).map(e => e.equipment))].map(eq => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Pill, {
                                        label: eq,
                                        selected: subEquipment === eq,
                                        onPress: () => setSubEquipment(eq)
                                    }, eq))
                                }), !(0, _srcSharedSubstitutions.substitutionOptions)(substitution.from, {
                                    ...state.profile,
                                    inventory: substitution.inventory || state.profile.inventory
                                }).length && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.body,
                                    children: "No substitute for this movement fits your confirmed equipment. Review your equipment or use your own tracking plan."
                                }), (0, _srcSharedSubstitutions.substitutionOptions)(substitution.from, {
                                    ...state.profile,
                                    inventory: substitution.inventory || state.profile.inventory
                                }).filter(e => subEquipment === 'All' || e.equipment === subEquipment).map(e => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: e.name + ' · ' + e.equipment + ' · ' + (0, _srcSharedSubstitutions.substitutionReason)(e.id),
                                    onPress: () => {
                                        setError('');
                                        setSubstitution({
                                            ...substitution,
                                            to: e.id,
                                            setup: '',
                                            acknowledgeSpecificity: false,
                                            allowLonger: false
                                        });
                                    }
                                }, e.id))]
                        }) : /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                            children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.sectionTitle,
                                    children: ["Proposed: ", (0, _srcSharedTraining.exFor)(substitution.to, state.custom).name]
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.body,
                                    children: ["Record: ", (0, _srcSharedTraining.exFor)(substitution.to, state.custom).loadConvention]
                                }), substitutionPreview?.changes.map(c => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                                    style: styles.body,
                                    children: [(0, _srcSharedTraining.niceDate)(c.date), " \xB7 ", c.item.sets, " \xD7 ", (0, _srcSharedTraining.targetText)(c.item), " reps \xB7 ", c.item.rest, "s rest \xB7 ", c.before, " to ", c.after, " minutes"]
                                }, c.sessionId)), (0, _srcSharedTraining.exFor)(substitution.to, state.custom).requiresSetup && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                                    style: styles.input,
                                    accessibilityLabel: "Substitute machine setup",
                                    placeholder: "Machine, attachment and settings",
                                    maxLength: 200,
                                    value: substitution.setup,
                                    onChangeText: setup => setSubstitution({
                                        ...substitution,
                                        setup
                                    })
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: substitution.all ? 'Scope: future repeats of this workout' : 'Scope: this workout only',
                                    onPress: () => setSubstitution({
                                        ...substitution,
                                        all: !substitution.all
                                    })
                                }), substitutionPreview?.warnings.map(w => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    style: styles.body,
                                    children: w
                                }, w)), substitutionPreview?.specificity && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: substitution.acknowledgeSpecificity ? 'Confirmed: competition practice is replaced' : 'Confirm competition practice is replaced',
                                    onPress: () => setSubstitution({
                                        ...substitution,
                                        acknowledgeSpecificity: !substitution.acknowledgeSpecificity
                                    })
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: substitution.allowLonger ? 'Extra time allowed' : 'Allow extra session time if needed',
                                    onPress: () => setSubstitution({
                                        ...substitution,
                                        allowLonger: !substitution.allowLonger
                                    })
                                }), error && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                    accessibilityRole: "alert",
                                    style: styles.errorText,
                                    children: error
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    label: "Accept substitute",
                                    onPress: async () => {
                                        if (await persistChange(s => {
                                            var r = (0, _srcSharedSubstitutions.applySubstitution)(s, substitution);
                                            if (r.error)
                                                throw new Error(r.error);
                                            return r.state;
                                        }))
                                            setSubstitution(null);
                                    }
                                }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                                    secondary: true,
                                    label: "Choose another",
                                    onPress: () => {
                                        setError('');
                                        setSubstitution({
                                            ...substitution,
                                            to: ''
                                        });
                                    }
                                })]
                        })]
                })
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(ModalFrame, {
                visible: !!confirm,
                onDismiss: completeCoachingTransition,
                close: () => setConfirm(null),
                title: confirm?.title ?? '',
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: confirm?.message
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: confirm?.label ?? 'Continue',
                        onPress: () => {
                            var action = confirm?.action;
                            if (_reactNative.Platform.OS === 'ios') coachingTransition.current.waiting = true;
                            setConfirm(null);
                            action?.();
                        }
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(Button, {
                        label: "Keep editing",
                        secondary: true,
                        onPress: () => setConfirm(null)
                    })]
            })]
    });
}
function App() {
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNativeSafeAreaContext.SafeAreaProvider, {
        children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_srcAppearance.NativeAppearanceProvider, {
            children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(NativeWildernessShell, {children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(TrainingApp, {})})
        })
    });
}
var baseStyles = _reactNative.StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.bg
    },
    flex: {
        flex: 1
    },
    content: {
        padding: 14,
        gap: 10,
        paddingBottom: 20
    },
    brandBar: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomColor: COLORS.line,
        borderBottomWidth: 1
    },
    brand: {
        color: COLORS.ink,
        fontSize: 11,
        letterSpacing: 2.5,
        fontWeight: '800'
    },
    brandSub: {
        color: COLORS.ink,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    demoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: COLORS.pale,
        borderRadius: 20
    },
    demoText: {
        fontSize: 12,
        letterSpacing: 0.8,
        color: COLORS.green,
        fontWeight: '800'
    },
    heading: {
        gap: 3,
        marginTop: 0,
        marginBottom: 0
    },
    eyebrow: {
        color: COLORS.green,
        fontSize: 12,
        letterSpacing: 1.7,
        fontWeight: '800'
    },
    title: {
        fontSize: 28,
        lineHeight: 33,
        color: COLORS.ink,
        fontWeight: '800',
        letterSpacing: -1.1
    },
    body: {
        color: COLORS.ink,
        fontSize: 16,
        lineHeight: 22
    },
    small: {
        color: COLORS.muted,
        fontSize: 14,
        lineHeight: 21
    },
    footnote: {
        color: COLORS.muted,
        fontSize: 14,
        lineHeight: 21,
        marginTop: 8
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 14,
        gap: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.line
    },
    darkCard: {
        backgroundColor: COLORS.green,
        borderColor: COLORS.green,
        padding: 14
    },
    darkEyebrow: {
        color: '#D4E3C6',
        fontSize: 12,
        letterSpacing: 1.8,
        fontWeight: '800'
    },
    darkTitle: {
        fontSize: 25,
        lineHeight: 30,
        fontWeight: '800',
        color: COLORS.onAccent,
        letterSpacing: -0.7
    },
    darkBody: {
        color: '#E5ECDC',
        fontSize: 14,
        lineHeight: 22
    },
    sectionTitle: {
        fontSize: 19,
        lineHeight: 25,
        fontWeight: '700',
        color: COLORS.ink
    },
    button: {
        backgroundColor: COLORS.green,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12
    },
    secondaryButton: {
        backgroundColor: COLORS.pale
    },
    buttonText: {
        color: COLORS.onAccent,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
    },
    tools: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    profileBar: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    exerciseRow: {
        paddingVertical: 10,
        minHeight: 48,
        paddingHorizontal: 4,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.line
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 22,
        color: COLORS.ink,
        marginBottom: 2
    },
    link: {
        color: COLORS.green,
        fontSize: 14,
        fontWeight: '700'
    },
    arrow: {
        fontSize: 26,
        color: COLORS.green
    },
    guideLabel: {
        marginTop: 6,
        fontSize: 12,
        letterSpacing: 1,
        color: COLORS.green,
        fontWeight: '700'
    },
    input: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 48,
        color: COLORS.ink,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.line,
        borderRadius: 12,
        fontSize: 15
    },
    pills: {
        flexDirection: 'row',
        gap: 7,
        paddingVertical: 4
    },
    pill: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: COLORS.pale,
        minHeight: 48
    },
    pillSelected: {
        backgroundColor: COLORS.green
    },
    pillText: {
        color: COLORS.green,
        fontSize: 14,
        fontWeight: '700'
    },
    setBlock: {
        gap: 6,
        paddingBottom: 8,
        borderBottomColor: COLORS.line,
        borderBottomWidth: 1
    },
    detailsToggle: {
        minHeight: 48,
        justifyContent: 'center'
    },
    optionalFields: {
        gap: 12,
        padding: 12,
        borderRadius: 10,
        backgroundColor: COLORS.bg
    },
    setHeader: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6
    },
    setRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center'
    },
    numberInput: {
        flex: 1,
        minWidth: 54,
        minHeight: 48,
        borderWidth: 1,
        borderColor: COLORS.line,
        backgroundColor: COLORS.bg,
        borderRadius: 9,
        color: COLORS.ink,
        fontSize: 17,
        textAlign: 'center',
        padding: 8
    },
    check: {
        minWidth: 64,
        minHeight: 48,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.pale,
        borderRadius: 9
    },
    checkDone: {
        backgroundColor: COLORS.green
    },
    tabs: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.line,
        paddingHorizontal: 10,
        paddingTop: 6,
        paddingBottom: 4,
        backgroundColor: COLORS.white
    },
    tab: {
        flex: 1,
        minHeight: 55,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        borderRadius: 13
    },
    activeTab: {
        backgroundColor: '#EFF3E8'
    },
    tabIcon: {
        fontSize: 21,
        color: COLORS.muted
    },
    tabLabel: {
        fontSize: 12,
        color: COLORS.muted
    },
    saveStatus: {
        color: COLORS.muted,
        fontSize: 12,
        textAlign: 'center',
        paddingVertical: 4
    },
    modalHeader: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.line,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
    },
    modalTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.ink
    },
    source: {
        paddingVertical: 10,
        gap: 5
    },
    stats: {
        flexDirection: 'row',
        gap: 12
    },
    statNumber: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.green
    },
    error: {
        paddingHorizontal: 22,
        paddingVertical: 12,
        backgroundColor: '#F6E3DC'
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 13,
        lineHeight: 18
    }
});
export default App;
