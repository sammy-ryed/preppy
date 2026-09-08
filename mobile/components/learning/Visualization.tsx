import { StyleSheet, Text, View } from 'react-native';
import type { QuestSessionView } from '../../types/questSession';
const labels: Record<string, string> = {
  prefix: 'Prefix totals', rangeSum: 'Range sum', low: 'Low', high: 'High', mid: 'Middle', target: 'Target', foundIndex: 'Found index',
  sortedFrom: 'Sorted suffix starts', compared: 'Comparing indices', swapped: 'Swapped indices', left: 'Left', right: 'Right',
  pairSum: 'Pair sum', found: 'Pair found', best: 'Best window sum', keys: 'Values counted', counts: 'Frequencies',
  stack: 'Stack (top at right)', valid: 'Balanced so far', queue: 'Queue (front at left)', distance: 'Distance by vertex',
  parent: 'Parent by vertex', path: 'Shortest path', next: 'Next node by index', prev: 'Previous node', current: 'Current node',
  following: 'Saved next node', head: 'New head', chosen: 'Current subset', count: 'Subsets emitted', index: 'Decision index',
  insertedIndex: 'Inserted node', dp: 'Minimum coins by amount', amount: 'Amount', minimum: 'Minimum coins', text: 'Bracket string',
};
export function Visualization({ step }: { step: NonNullable<QuestSessionView['visualization']> }) {
  const state = step.state;
  return <View style={styles.root}>
    <View style={styles.stepHeader}><Text style={styles.stepPill}>STEP {step.step} / {step.stepCount}</Text><Text style={styles.index}>{step.canContinue ? 'Trace complete ✓' : step.activeIndex === null ? 'Read the current state' : 'Follow the highlighted value'}</Text></View>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: step.stepCount, now: step.step }} style={styles.track}><View style={[styles.fill, { width: `${100 * step.step / step.stepCount}%` }]} /></View>
    <View style={styles.explanation}><Text style={styles.label}>What happens here</Text><Text accessibilityLiveRegion="polite" style={styles.body}>{step.explanation}</Text></View>
    <View style={styles.cells}>{step.values.map((value, i) => <View key={i} style={[styles.cell, i === step.activeIndex && styles.active]}>
      <Text style={styles.index}>{i === step.activeIndex ? `▼ index ${i}` : `index ${i}`}</Text><Text style={styles.value}>{value}</Text>
    </View>)}</View>
    {['array_traversal', 'sliding_window'].includes(step.type) && <Text style={styles.body}>Running total: {step.sum}</Text>}
    {step.type === 'bfs' && Array.isArray(state.edgesFrom) && Array.isArray(state.edgesTo) &&
      <Text style={styles.body}>Graph edges: {state.edgesFrom.map((from, i) => `${from} → ${(state.edgesTo as readonly number[])[i]}`).join('   ')}</Text>}
    {step.values.length > 0 && <Text style={styles.index}>Purple = current value · index = its position, starting at 0</Text>}
    {Object.entries(state).filter(([key]) => key in labels).map(([key, value]) => <View key={key} style={styles.row}>
      <Text style={styles.label}>{step.type === 'bst_search' && ['left','right'].includes(key) ? `${key} child by node index` : labels[key]}</Text>
      <Text style={styles.body}>{Array.isArray(value) ? value.length ? value.map(v => v === null ? '—' : String(v)).join('  |  ') : '(empty)' : value === null ? '—' : String(value)}</Text>
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  root: { gap: 14 }, body: { color: '#413D48', fontFamily: 'InstrumentSans_400Regular', fontSize: 15, lineHeight: 24 }, cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { padding: 10, minWidth: 62, borderWidth: 1, borderColor: '#D9CCE9', borderRadius: 14, backgroundColor: '#FAF8FF' },
  active: { backgroundColor: '#E2D4FA', borderColor: '#6947A5', borderWidth: 2 }, value: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 22, color: '#413547', textAlign: 'center' },
  index: { fontSize: 11, lineHeight: 17, color: '#746470' }, row: { gap: 6, padding: 12, borderRadius: 12, backgroundColor: '#F5F3F8' }, label: { color: '#6947A5', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 13 },
  stepHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  stepPill: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11, color: '#6947A5', backgroundColor: '#F1EBFF', padding: 8, borderRadius: 10 },
  explanation: { borderLeftWidth: 3, borderLeftColor: '#9471C9', padding: 14, backgroundColor: '#F7F2FF', borderRadius: 12, gap: 8 },
  track: { height: 5, backgroundColor: '#E9E1F4', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#9471C9' },
});
