import type { Visualization } from '../types/content';
import { arrayTraversalSteps } from './arrayTraversal';

export interface VisualizationStep {
  readonly type: Visualization['type'];
  readonly explanation: string;
  readonly values: readonly number[];
  readonly activeIndex: number | null;
  readonly visitedCount: number;
  readonly sum: number;
  readonly state: Readonly<Record<string, string | number | boolean | null | readonly (number | string | null)[]>>;
}

// Bounded deterministic traces, independent of rendering and clocks.
export function visualizationSteps(config: Visualization): readonly VisualizationStep[] {
  const steps: VisualizationStep[] = [];
  const values = 'values' in config ? [...config.values] : [];
  const integer = (n: number) => Number.isSafeInteger(n) && Math.abs(n) <= 10000;
  if ('values' in config && (values.length < 1 || values.length > 20 || !values.every(integer))) throw new Error('Use 1-20 bounded integers');
  if ('target' in config && !integer(config.target)) throw new Error('Invalid target');
  const emit = (explanation: string, state: VisualizationStep['state'], activeIndex: number | null = null, visitedCount = 0, sum = 0) => {
    const topology = config.type === 'bfs' ? {
      edgesFrom: config.edges.flatMap((row, from) => row.map(() => from)),
      edgesTo: config.edges.flatMap(row => [...row]),
    } : config.type === 'brackets' ? { text: config.text } : {};
    const copy = Object.fromEntries(Object.entries({ ...topology, ...state }).map(([key, value]) => [key, Array.isArray(value) ? Object.freeze([...value]) : value]));
    steps.push(Object.freeze({ type: config.type, explanation, state: Object.freeze(copy),
      values: Object.freeze([...values]), activeIndex, visitedCount, sum }));
  };
  const sorted = () => { if (values.some((v, i) => i > 0 && v < values[i - 1]!)) throw new Error('Sorted values required'); };
  switch (config.type) {
    case 'array_traversal':
      for (const s of arrayTraversalSteps(values)) emit(s.activeIndex === null ? 'Start the total at zero.' : `Add values[${s.activeIndex}] = ${values[s.activeIndex]}; total becomes ${s.sum}.`, {}, s.activeIndex, s.visitedCount, s.sum);
      break;
    case 'linear_search': {
      emit('Start at the first element.', { target: config.target, foundIndex: null });
      let found = -1;
      for (let i = 0; i < values.length; i++) {
        emit(`Compare ${values[i]} with ${config.target}.`, { target: config.target, foundIndex: values[i] === config.target ? i : null }, i, i + 1);
        if (values[i] === config.target) { found = i; break; }
      }
      emit(found < 0 ? 'All elements checked: target absent.' : `Target found at index ${found}.`, { foundIndex: found }); break;
    }
    case 'prefix_sums': {
      const prefix = [0]; emit('Begin with an empty-prefix total of zero.', { prefix });
      values.forEach((v, i) => { prefix.push(prefix[i]! + v); emit(`prefix[${i + 1}] = ${prefix[i]} + ${v}.`, { prefix }, i, i + 1, prefix[i + 1]); });
      emit('The inclusive range [1, last] is prefix[n] - prefix[1] (zero for a one-item array).', { prefix, rangeSum: prefix.at(-1)! - prefix[1]! }); break;
    }
    case 'binary_search': {
      sorted(); let low = 0; let high = values.length - 1; let found = -1;
      emit('Search a sorted array with inclusive bounds.', { low, high, target: config.target });
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        emit(`Compare middle value ${values[mid]} with ${config.target}.`, { low, high, mid }, mid);
        if (values[mid] === config.target) { found = mid; break; }
        if (values[mid]! < config.target) low = mid + 1; else high = mid - 1;
        emit('Discard the half that cannot contain the target.', { low, high });
      }
      emit(found < 0 ? 'Search interval empty: target absent.' : 'Target found.', { foundIndex: found }); break;
    }
    case 'bubble_sort': {
      emit('Compare adjacent items; swap only when out of order.', { sortedFrom: values.length });
      for (let end = values.length - 1; end > 0; end--) {
        let swapped = false;
        for (let i = 0; i < end; i++) {
          emit(`Compare indices ${i} and ${i + 1}.`, { compared: [i, i + 1], sortedFrom: end + 1 }, i);
          if (values[i]! > values[i + 1]!) {
            [values[i], values[i + 1]] = [values[i + 1]!, values[i]!]; swapped = true;
            emit('Swap the inverted pair.', { swapped: [i, i + 1], sortedFrom: end + 1 }, i);
          }
        }
        emit(`The suffix starting at ${end} is sorted.`, { sortedFrom: end });
        if (!swapped) break;
      }
      emit('The entire array is sorted.', { sortedFrom: 0 }); break;
    }
    case 'two_pointers': {
      sorted(); let left = 0; let right = values.length - 1; let found = false;
      emit('Place pointers at opposite ends of the sorted array.', { left, right, target: config.target });
      while (left < right) {
        const total = values[left]! + values[right]!;
        emit(`Pair sum is ${total}; compare with ${config.target}.`, { left, right, pairSum: total });
        if (total === config.target) { found = true; break; }
        if (total < config.target) left++; else right--;
      }
      emit(found ? 'A pair with distinct indices was found.' : 'Pointers met: no pair exists.', { left, right, found }); break;
    }
    case 'sliding_window': {
      const k = config.width;
      if (!Number.isSafeInteger(k) || k < 1 || k > values.length) throw new Error('Invalid window width');
      let sum = values.slice(0, k).reduce((a, b) => a + b, 0); let best = sum;
      emit('Sum the first full window.', { left: 0, right: k - 1, best }, null, k, sum);
      for (let right = k; right < values.length; right++) {
        sum += values[right]! - values[right - k]!; best = Math.max(best, sum);
        emit('Subtract the outgoing value and add the incoming value.', { left: right - k + 1, right, best }, right, right + 1, sum);
      }
      emit('All fixed-size windows examined.', { best }, null, values.length, sum); break;
    }
    case 'frequency_count': {
      const counts = new Map<number, number>(); emit('Start with an empty frequency table.', { keys: [], counts: [] });
      values.forEach((v, i) => { counts.set(v, (counts.get(v) ?? 0) + 1); emit(`Increment the count of ${v}.`, { keys: [...counts.keys()], counts: [...counts.values()] }, i, i + 1); }); break;
    }
    case 'brackets': {
      if (!config.text.length || config.text.length > 40 || /[^()[\]{}]/.test(config.text)) throw new Error('Invalid bracket string');
      const stack: string[] = []; const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }; let valid = true;
      emit('Use a stack to remember unmatched opening brackets.', { text: config.text, stack });
      for (let i = 0; i < config.text.length; i++) {
        const char = config.text[i]!;
        if ('([{'.includes(char)) stack.push(char); else if (stack.pop() !== pairs[char]) valid = false;
        emit(valid ? `Process ${char}.` : `Closing ${char} does not match the latest opener.`, { text: config.text, stack, valid }, i, i + 1);
        if (!valid) break;
      }
      valid = valid && stack.length === 0; emit(valid ? 'All brackets matched.' : 'The string is not balanced.', { stack, valid }); break;
    }
    case 'bfs': {
      const n = config.edges.length;
      if (n < 1 || n > 20 || !Number.isInteger(config.start) || config.start < 0 || config.start >= n || config.target < 0 || config.target >= n
        || config.edges.some(row => new Set(row).size !== row.length || row.some(v => !Number.isInteger(v) || v < 0 || v >= n))) throw new Error('Invalid graph');
      const distance: (number | null)[] = Array(n).fill(null); const parent: (number | null)[] = Array(n).fill(null);
      const queue = [config.start]; distance[config.start] = 0;
      emit('Enqueue the start and mark it discovered.', { queue, distance, parent });
      while (queue.length) {
        const u = queue.shift()!;
        emit(`Dequeue vertex ${u}.`, { queue, distance, parent }, u);
        for (const v of config.edges[u]!) if (distance[v] === null) {
          distance[v] = distance[u]! + 1; parent[v] = u; queue.push(v);
          emit(`Discover ${v} at distance ${distance[v]} and enqueue it once.`, { queue, distance, parent }, v);
        }
      }
      const path: number[] = [];
      if (distance[config.target] !== null) for (let u: number | null = config.target; u !== null; u = parent[u]!) path.unshift(u);
      emit('BFS is complete. Distances count edges in this unweighted graph.', { queue, distance, parent, path, target: config.target }); break;
    }
    case 'linked_list_reverse': {
      const next: (number | null)[] = values.map((_, i) => i + 1 < values.length ? i + 1 : null);
      let prev: number | null = null; let current: number | null = 0;
      emit('Pointers are node indices; preserve the next link before reversing it.', { next, prev, current });
      while (current !== null) {
        const following: number | null = next[current]!; next[current] = prev;
        emit(`Point node ${current} toward the previous node.`, { next, prev, current, following }, current);
        prev = current; current = following;
      }
      emit('The former tail is the new head.', { next, head: prev }); break;
    }
    case 'subsets': {
      if (values.length > 6 || new Set(values).size !== values.length) throw new Error('Use at most six distinct values');
      const chosen: number[] = []; let count = 0;
      const visit = (index: number) => {
        if (index === values.length) { count++; emit('Emit the current subset, including the empty subset.', { chosen, count, index }); return; }
        emit(`Exclude ${values[index]} and recurse.`, { chosen, index }); visit(index + 1);
        chosen.push(values[index]!); emit(`Include ${values[index]} and recurse.`, { chosen, index }); visit(index + 1);
        chosen.pop(); emit('Undo the choice before returning.', { chosen, index });
      };
      visit(0); emit('All subsets generated.', { count, chosen }); break;
    }
    case 'bst_search': {
      if (new Set(values).size !== values.length) throw new Error('Use distinct BST keys');
      const left: (number | null)[] = values.map(() => null); const right = [...left];
      emit('Insert the first key as the root.', { left, right, insertedIndex: 0 }, 0);
      for (let i = 1; i < values.length; i++) {
        let u = 0;
        while (true) { const branch = values[i]! < values[u]! ? left : right; if (branch[u] === null) { branch[u] = i; break; } u = branch[u]!; }
        emit(`Insert key ${values[i]} at the first null child on its comparison path.`, { left, right, insertedIndex: i }, i);
      }
      emit('Build the BST in the supplied insertion order; child references are indices.', { left, right, target: config.target });
      let u: number | null = 0;
      while (u !== null) { emit(`Compare target with key ${values[u]}.`, { left, right, target: config.target }, u); if (values[u] === config.target) break; u = config.target < values[u]! ? left[u]! : right[u]!; }
      emit(u === null ? 'A null child proves absence.' : 'Target found.', { left, right, foundIndex: u ?? -1 }); break;
    }
    case 'min_coins': {
      if (!Number.isInteger(config.amount) || config.amount < 0 || config.amount > 50 || values.some(v => v <= 0) || new Set(values).size !== values.length) throw new Error('Invalid coin problem');
      const dp: (number | null)[] = Array(config.amount + 1).fill(null); dp[0] = 0;
      emit('Zero coins make amount zero; null means unreachable.', { dp });
      for (let amount = 1; amount <= config.amount; amount++) {
        for (const coin of values) if (coin <= amount && dp[amount - coin] !== null) {
          const candidate = dp[amount - coin]! + 1;
          if (dp[amount] === null || candidate < dp[amount]!) dp[amount] = candidate;
        }
        emit(`Compute dp[${amount}] from smaller reachable amounts.`, { dp, amount }, amount);
      }
      emit('Minimum coin count computed using unlimited copies of each denomination.', { dp, minimum: dp[config.amount]! }); break;
    }
    default: throw new Error('Unsupported visualization');
  }
  return Object.freeze(steps);
}
