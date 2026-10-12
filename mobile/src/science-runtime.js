// Recovered executed implementation; typed public contract is in the adjacent declaration.
import * as __dependency0 from "react";
import * as __dependency1 from "react-native";
import * as __dependency2 from "./appearance";
import * as __dependency3 from "./shared/evidence-sources";
import * as __dependency4 from "./shared/program-science";
import * as __dependency5 from "./shared/program-catalog";
import * as __dependency6 from "react/jsx-runtime";
var _react = __dependency0;
var _reactNative = __dependency1;
var _appearance = __dependency2;
var _sharedEvidenceSources = __dependency3;
var _sharedProgramScience = __dependency4;
var _sharedProgramCatalog = __dependency5;
var _reactJsxRuntime = __dependency6;
var baseStyles = _reactNative.StyleSheet.create({
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: '#19362D'
    },
    heading: {
        fontSize: 22,
        fontWeight: '700',
        color: '#19362D'
    },
    button: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: '#DCE1D7',
        borderRadius: 8,
        padding: 12,
        justifyContent: 'center'
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: '#DCE1D7',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#19362D'
    }
});
function References({ ids }) {
    var styles = (0, _appearance.useThemedStyles)(baseStyles), { colors: c } = (0, _appearance.useNativeAppearance)(), [error, setError] = (0, _react.useState)('');
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: {
            gap: 12
        },
        children: [ids.map(id => {
                var source = _sharedEvidenceSources.evidenceLinks[id];
                return source ? /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                    style: {
                        gap: 6
                    },
                    children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Pressable, {
                            accessibilityRole: "link",
                            style: styles.button,
                            onPress: () => void _reactNative.Linking.openURL(source.url).catch(() => setError('The reference could not be opened. Your workout is kept.')),
                            children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                                style: styles.body,
                                children: source.name
                            })
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                            style: styles.body,
                            children: source.summary
                        }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                            style: styles.body,
                            children: [(0, _sharedEvidenceSources.evidenceReview)(id), id === 'ACSM-2009' ? ' Historical source.' : '']
                        })]
                }, id) : null;
            }), error && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                accessibilityRole: "alert",
                style: [styles.body, {
                        color: c.danger
                    }],
                children: error
            })]
    });
}
function NativePlanEvidence({ plan }) {
    var styles = (0, _appearance.useThemedStyles)(baseStyles), [open, setOpen] = (0, _react.useState)(false), ref = _sharedProgramCatalog.programReferences.find(r => r.id === plan.profile.programId), science = (0, _sharedProgramScience.programScience)(plan);
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: {
            gap: 12
        },
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Pressable, {
                accessibilityRole: "button",
                accessibilityState: {
                    expanded: open
                },
                style: styles.button,
                onPress: () => setOpen(!open),
                children: /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                    style: styles.body,
                    children: "Why this plan?"
                })
            }), open && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactJsxRuntime.Fragment, {
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        accessibilityRole: "header",
                        style: styles.heading,
                        children: "Program source and support"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: plan.profile.mode === 'app' && science.creator ? `Preloaded public routine by ${science.creator}. ${science.sourceVersion}. ${science.scope}` : plan.profile.mode === 'app' ? 'This original app plan uses your selected goal, time, equipment and availability. Exact exercises, doses and progression policies are app choices; supporting principles do not clinically validate the whole routine.' : 'These are your or your coach’s tracking targets. The app records work and does not replace the credited source’s progression.'
                    }), ref && /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                        style: styles.body,
                        children: ["Program reference: ", ref.name, " by ", ref.author, ". The named routine is not preloaded; its exact source edition and current permissions remain to be verified."]
                    }), plan.notes.filter(n => n.startsWith('Creator/source')).map(n => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: n
                    }, n)), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                        style: styles.body,
                        children: [science.label, ". ", science.recipeTrial]
                    }), science.principles.map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: x
                    }, x)), science.limits.map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: x
                    }, x)), science.implementationChoices.map(x => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: x
                    }, x)), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        accessibilityRole: "header",
                        style: styles.heading,
                        children: "Primary / secondary weekly work"
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: science.work.periodWeeks > 1 ? `Average across ${science.work.periodWeeks} source weeks` : `Week ${science.work.firstWeek}`
                    }), science.work.rows.map(r => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                        style: styles.body,
                        children: [r.name, ": ", Math.round(r.primarySets * 10) / 10, " primary sets, ", Math.round(r.secondarySets * 10) / 10, " secondary sets \xB7 ", Math.round(r.primaryDays * 10) / 10, " primary days"]
                    }, r.name)), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: science.work.scope
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        accessibilityRole: "header",
                        style: styles.heading,
                        children: "Relevant references"
                    }), plan.evidence.length ? /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(References, {
                        ids: [...new Set([...plan.evidence, ...science.references])]
                    }) : /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "No qualified scientific support is attached to these user-entered targets."
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        style: styles.body,
                        children: "Review depth is shown per source. Full-paper and exact-routine validation remain incomplete; author credit is separate."
                    })]
            })]
    });
}
function NativeScienceLibrary() {
    var [query, setQuery] = (0, _react.useState)(''), [kind, setKind] = (0, _react.useState)('all'), [error, setError] = (0, _react.useState)('');
    var styles = (0, _appearance.useThemedStyles)(baseStyles), q = query.trim().toLowerCase();
    var ids = Object.keys(_sharedEvidenceSources.evidenceLinks).filter(id => (kind === 'all' || (kind === 'programs' ? (0, _sharedEvidenceSources.isProgramSource)(id) : !(0, _sharedEvidenceSources.isProgramSource)(id))) && (_sharedEvidenceSources.evidenceLinks[id].name + ' ' + _sharedEvidenceSources.evidenceLinks[id].summary).toLowerCase().includes(q));
    var refs = kind === 'research' ? [] : _sharedProgramCatalog.programReferences.filter(p => !_sharedEvidenceSources.evidenceLinks[p.id.replace(/^ref-/, 'src-')] && (p.name + ' ' + p.author + ' ' + p.goal).toLowerCase().includes(q));
    return /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
        style: {
            gap: 16
        },
        children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                accessibilityRole: "header",
                style: styles.heading,
                children: "Science and source library"
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.TextInput, {
                accessibilityLabel: "Search science references",
                style: styles.input,
                placeholder: "Search title, creator or topic",
                value: query,
                onChangeText: setQuery,
                maxLength: 200
            }), [['all', 'All sources'], ['research', 'Research references'], ['programs', 'Program sources']].map(([value, label]) => /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Pressable, {
                accessibilityRole: "button",
                accessibilityState: {
                    selected: kind === value
                },
                style: styles.button,
                onPress: () => setKind(value),
                children: /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                    style: styles.body,
                    children: [label, kind === value ? ' · selected' : '']
                })
            }, value)), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                style: styles.body,
                children: [ids.length + refs.length, " linked references. Program sources and research references do not certify the app\u2019s exact prescriptions."]
            }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(References, {
                ids: ids
            }), refs.map(p => /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.View, {
                style: {
                    gap: 10
                },
                children: [/*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                        accessibilityRole: "header",
                        style: styles.heading,
                        children: p.name
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                        style: styles.body,
                        children: ["By ", p.author, ". Named-source reference only; the full routine is not preloaded. Check the original edition, requirements and rights before importing your own copy."]
                    }), /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Pressable, {
                        accessibilityRole: "link",
                        style: styles.button,
                        onPress: () => void _reactNative.Linking.openURL(p.url).catch(() => setError('The program source could not be opened. Your workout is kept.')),
                        children: /*#__PURE__*/ (0, _reactJsxRuntime.jsxs)(_reactNative.Text, {
                            style: styles.body,
                            children: ["Open ", p.author, "\u2019s program source"]
                        })
                    })]
            }, p.id)), error && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                accessibilityRole: "alert",
                style: styles.body,
                children: error
            }), !ids.length && !refs.length && /*#__PURE__*/ (0, _reactJsxRuntime.jsx)(_reactNative.Text, {
                style: styles.body,
                children: "No matching references. Try another title or creator."
            })]
    });
}
export { NativePlanEvidence };
export { NativeScienceLibrary };
