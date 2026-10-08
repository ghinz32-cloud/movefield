import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNativeAppearance, useThemedStyles } from './appearance';
import { barWeights, personalBests, platesForLoad, warmupLadder, weeklyReview, type LoadUnit, type PlateResult } from './shared/training-tools';
import { displayLoad, niceDate, type State } from './shared/training';

// Plate calculator, warm-up ladder and weekly review. They calculate from entered or logged numbers only,
// and they change nothing in the saved workout log.
const baseStyles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dce1d7', borderRadius: 16, padding: 18, gap: 12 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: '#66746b' },
  title: { fontSize: 24, fontWeight: '700', color: '#19362d' },
  sub: { fontSize: 16, lineHeight: 23, color: '#66746b' },
  body: { fontSize: 16, lineHeight: 23, color: '#19362d' },
  small: { fontSize: 13, lineHeight: 18, color: '#66746b' },
  label: { fontSize: 14, fontWeight: '700', color: '#19362d' },
  input: { minHeight: 49, borderWidth: 1, borderColor: '#dce1d7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#19362d', backgroundColor: '#ffffff' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#dce1d7', backgroundColor: '#ffffff' },
  choiceOn: { borderColor: '#214d3a', backgroundColor: '#e6eddd' },
  choiceText: { fontSize: 15, fontWeight: '600', color: '#19362d' },
  warn: { padding: 12, borderRadius: 12, backgroundColor: '#f6e3dc' },
  warnText: { fontSize: 15, lineHeight: 21, color: '#933c2d' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#dce1d7' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 2 },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#19362d' },
});
type Styles = typeof baseStyles;

const parse = (value: string): number | null => value.trim() === '' ? null : Number(value.trim().replace(',', '.'));
const fmt = (n: number) => String(Math.round(n * 100) / 100);

function Choice<T extends string | number>({ styles, label, options, value, onChange, render }: { styles: Styles; label: string; options: readonly T[]; value: T; onChange: (v: T) => void; render: (v: T) => string }) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: 6 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.choiceRow}>{options.map(option => <Pressable key={String(option)} accessibilityRole="radio" accessibilityState={{ selected: option === value }} onPress={() => onChange(option)} style={[styles.choice, option === value && styles.choiceOn]}><Text style={styles.choiceText}>{render(option)}</Text></Pressable>)}</View>
  </View>;
}

function PlateLines({ styles, result }: { styles: Styles; result: PlateResult }) {
  if (result.status === 'unknown') return <Text style={styles.sub}>Enter a total load to see the plates for each side.</Text>;
  if (result.status === 'error') return <View style={styles.warn}><Text accessibilityRole="alert" style={styles.warnText}>{result.message}</Text></View>;
  const perSide = result.perSide.length ? result.perSide.map(p => `${p.count} × ${fmt(p.weight)} ${result.unit}`).join(' + ') : 'No plates. The bar alone.';
  return <View accessibilityLiveRegion="polite" style={{ gap: 6 }}>
    <Text style={styles.body}>Per side: {perSide}</Text>
    <Text style={styles.body}>{result.exact ? `Exact total: ${fmt(result.achieved)} ${result.unit}.` : `Highest loadable total at or below your entry: ${fmt(result.achieved)} ${result.unit}, which is ${fmt(result.shortBy)} ${result.unit} less.`}</Text>
    <Text style={styles.small}>Uses standard plates. Collars and clips are not counted; weigh the bar if it matters.</Text>
  </View>;
}

export function NativeTrainingTools({ units, adult }: { units: LoadUnit; adult: boolean }) {
  const styles = useThemedStyles(baseStyles);
  const { colors: c } = useNativeAppearance();
  const [total, setTotal] = useState('');
  const [bar, setBar] = useState<number | null>(null);
  const [working, setWorking] = useState('');
  const [kind, setKind] = useState<'barbell' | 'dumbbell'>('barbell');
  const bars = barWeights[units];
  const barValue = bar !== null && bars.includes(bar) ? bar : bars[0];
  const plates = platesForLoad(parse(total), units, barValue);
  const warm = warmupLadder(parse(working), { unit: units, kind, bar: kind === 'barbell' ? barValue : 0, adult });
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>LOADING</Text>
    <Text style={styles.title}>Plate calculator</Text>
    <Text style={styles.sub}>Enter the total barbell load, including the bar.</Text>
    <Text style={styles.label}>Total load ({units})</Text>
    <TextInput accessibilityLabel={`Total barbell load in ${units}`} keyboardType="decimal-pad" style={styles.input} value={total} onChangeText={setTotal} placeholder={units === 'kg' ? 'e.g. 100' : 'e.g. 225'} placeholderTextColor={c.muted} />
    <Choice styles={styles} label="Bar" options={bars} value={barValue} onChange={setBar} render={b => `${b} ${units}`} />
    <PlateLines styles={styles} result={plates} />
    <Text style={styles.title}>Warm-up ladder</Text>
    {!adult ? <View style={styles.warn}><Text style={styles.warnText}>For people under 18, your supervisor chooses warm-up loads. Use the warm-up in your plan.</Text></View> : <>
      <Text style={styles.sub}>Four sets at 40%, 60%, 75% and 85% of your working load, rounded to loadable steps.</Text>
      <Text style={styles.label}>Working load ({units}{kind === 'dumbbell' ? ' per hand' : ''})</Text>
      <TextInput accessibilityLabel={`Working load in ${units}`} keyboardType="decimal-pad" style={styles.input} value={working} onChangeText={setWorking} placeholder={units === 'kg' ? 'e.g. 100' : 'e.g. 225'} placeholderTextColor={c.muted} />
      <Choice styles={styles} label="Equipment" options={['barbell', 'dumbbell'] as const} value={kind} onChange={setKind} render={k => k === 'barbell' ? 'Barbell' : 'Dumbbell'} />
      {warm.status === 'unknown' && <Text style={styles.sub}>Enter your working load to see the warm-up sets.</Text>}
      {warm.status === 'error' && <View style={styles.warn}><Text accessibilityRole="alert" style={styles.warnText}>{warm.message}</Text></View>}
      {warm.status === 'ok' && <View accessibilityLiveRegion="polite">
        {warm.rows.map(row => <View key={row.percent} style={styles.row}><Text style={styles.body}>{row.percent}% × {row.reps} {row.reps === 1 ? 'rep' : 'reps'}</Text><Text style={[styles.body, { fontWeight: '700' }]}>{fmt(row.load)} {warm.unit}{kind === 'dumbbell' ? ' each hand' : ''}{row.barOnly ? ' · bar only' : ''}</Text></View>)}
        <Text style={styles.small}>Steps of {fmt(warm.step)} {warm.unit}.</Text>
      </View>}
    </>}
  </View>;
}

// The last seven days from the active plan and any new estimated bests from those days. Counts only.
export function NativeWeeklyReview({ state, today, units }: { state: State; today: string; units: LoadUnit }) {
  const styles = useThemedStyles(baseStyles);
  const review = weeklyReview(state, today);
  const bests = review ? state.history.filter(w => w.finishedAt && w.date >= review.start && w.date <= review.end).flatMap(w => personalBests(state, w.id)) : [];
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>LAST 7 DAYS</Text>
    <Text style={styles.title}>Weekly review</Text>
    {!review ? <Text style={styles.sub}>Choose a plan to see planned, completed and missed sessions here.</Text> : <>
      <Text style={styles.small}>{niceDate(review.start)} – {niceDate(review.end)}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statNumber}>{review.completed}</Text><Text style={styles.small}>of {review.planned} planned done</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>{review.missed}</Text><Text style={styles.small}>{review.paused ? 'missed (plan paused)' : 'missed'}</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>{review.setsLogged}</Text><Text style={styles.small}>sets logged</Text></View>
      </View>
      <Text style={styles.small}>{[review.partial ? `${review.partial} partial` : '', review.otherWorkouts ? `${review.otherWorkouts} logged outside this plan` : '', review.streak === null ? 'Plan paused, so no streak is counted' : `${review.streak} planned in a row`].filter(Boolean).join(' · ')}</Text>
      {bests.slice(0, 4).map(b => <View key={b.workoutId + b.exerciseId} style={styles.row}><View style={{ flex: 1, minWidth: 160 }}><Text style={styles.body}>New estimated best · {b.name}</Text><Text style={styles.small}>was {displayLoad(b.previous, units)}</Text></View><Text style={[styles.body, { fontWeight: '700' }]}>{displayLoad(b.estimate, units)}</Text></View>)}
      {bests.length > 0 && <Text style={styles.small}>Estimates come from rated sets. They are approximate, not tested maximums.</Text>}
    </>}
  </View>;
}
