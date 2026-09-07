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
    <Text style={styles.body}>{step.explanation}</Text>
    <View style={styles.cells}>{step.values.map((value, i) => <View key={i} style={[styles.cell, i === step.activeIndex && styles.active]}>
      <Text style={styles.index}>index {i}</Text><Text style={styles.value}>{value}</Text>
    </View>)}</View>
    {['array_traversal', 'sliding_window'].includes(step.type) && <Text style={styles.body}>Running total: {step.sum}</Text>}
    {step.type === 'bfs' && Array.isArray(state.edgesFrom) && Array.isArray(state.edgesTo) &&
      <Text style={styles.body}>Graph edges: {state.edgesFrom.map((from, i) => `${from} → ${(state.edgesTo as readonly number[])[i]}`).join('   ')}</Text>}
    {Object.entries(state).filter(([key]) => key in labels).map(([key, value]) => <View key={key} style={styles.row}>
      <Text style={styles.label}>{step.type === 'bst_search' && ['left','right'].includes(key) ? `${key} child by node index` : labels[key]}</Text>
      <Text style={styles.body}>{Array.isArray(value) ? value.length ? value.map(v => v === null ? '—' : String(v)).join('  |  ') : '(empty)' : value === null ? '—' : String(value)}</Text>
    </View>)}
    <Text style={styles.index}>Step {step.step} of {step.stepCount}</Text>
  </View>;
}
const styles = StyleSheet.create({
  root: { gap: 14 }, body: { color: '#303030', fontSize: 16, lineHeight: 24 }, cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { padding: 10, minWidth: 62, borderWidth: 1, borderColor: '#A0B4D8', borderRadius: 14, backgroundColor: '#F5F5F5' },
  active: { backgroundColor: '#C9E5FF', borderColor: '#2563B8', borderWidth: 2 }, value: { fontSize: 22, color: '#303030', textAlign: 'center' },
  index: { fontSize: 12, color: '#516788' }, row: { gap: 4 }, label: { color: '#303030', fontWeight: '600' },
});
