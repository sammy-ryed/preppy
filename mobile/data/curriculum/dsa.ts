import { q, type SectionDraft } from './authoring';

export const dsa: readonly SectionDraft[] = [
  {
    title: 'Arrays and traversal', skillId: 'arrays',
    concepts: ['An array stores an ordered sequence; these examples use zero-based indices.', 'For n items, valid indices are 0 through n-1. Values and positions are different.', 'A traversal visits each item once. Summation uses a running total initialized to zero and takes O(n) time with O(1) auxiliary space.'],
    example: ['Find the sum of [3, 7, 2].', 'Start total=0 at index 0; add 3 to obtain 3.', 'At index 1 add 7, giving 10; at index 2 add 2, giving 12.', 'Stop before index 3, which is outside this three-item array.'],
    visualization: { type: 'array_traversal', values: [3, 7, 2] },
    quiz: [
      q('Which loop condition visits every item of an n-element array starting at i=0 and incrementing i?', 'i < n', 'i <= n', 'i < n-1', 'The final valid index is n-1, so stop when i reaches n.', 'Count n indices starting from zero.', 'This permits index n, one beyond the array.', 'This misses the item at index n-1.'),
      q('While summing an array, what should be added at index i?', 'The stored value a[i]', 'The index i', 'The array length each time', 'The total must accumulate values, not positions or the number of items.', 'An index locates a value; it is not that value.', 'Adding indices computes a different sum.', 'Adding n repeatedly gives n² regardless of the stored values.'),
      q('What is the sum of [4, 1, 8, 2]?', '15', '13', '6', '4+1=5, then +8=13, then +2=15.', 'Include the final element.', '13 is the total before the final 2 is visited.', '6 is the sum of indices 0+1+2+3, not values.'),
    ],
  },
  {
    title: 'Linear search', skillId: 'arrays',
    concepts: ['Linear search checks items one by one and works on unsorted arrays.', 'Return when the first matching value is found; return -1 if no match exists.', 'Worst-case time is O(n), best-case time O(1), and auxiliary space O(1).'],
    example: ['Find the first index of 9 in [5, 9, 2, 9].', 'Compare index 0: value 5 is not 9.', 'Compare index 1: value 9 matches.', 'Return 1 immediately; the later 9 does not change the first match.'],
    visualization: { type: 'linear_search', values: [5, 9, 2, 9], target: 9 },
    quiz: [
      q('Why can linear search be used on an unsorted array?', 'It explicitly checks candidates instead of discarding a half by order', 'It sorts the array automatically', 'It assumes the target is near the middle', 'Every candidate can be checked without relying on an ordering invariant.', 'Consider how candidates are eliminated.', 'Sorting is not part of the linear-search procedure.', 'No midpoint assumption is required.'),
      q('To return the first matching index, what should happen after the first match?', 'Return immediately', 'Continue and overwrite the index on every match', 'Return the array length', 'The earliest visited match is the first because traversal is left to right.', 'Later matches have larger indices.', 'Overwriting produces the last matching index.', 'Length is not a valid zero-based match index.'),
      q('Searching left to right for 6 in [2, 4, 8, 6, 1], how many value comparisons are made?', '4', '3', '5', 'Compare 2, 4, 8, then 6; stop at the fourth comparison.', 'Index and comparison count differ by one here.', '3 is the matching index, not the number of comparisons.', 'The final 1 is not examined after a match.'),
    ],
  },
  {
    title: 'Prefix sums', skillId: 'arrays',
    concepts: ['Define prefix[0]=0 and prefix[i+1]=prefix[i]+a[i].', 'The inclusive range sum a[l..r] is prefix[r+1]-prefix[l].', 'Build in O(n) time and O(n) extra space; each static range query is O(1). Changing an array item can invalidate later prefix values.'],
    example: ['For [2, 5, 3, 4], find the inclusive sum from index 1 to 3.', 'Build prefix=[0, 2, 7, 10, 14].', 'The prefix through index 3 is prefix[4]=14.', 'Remove the part before index 1: 14-prefix[1]=14-2=12.'],
    visualization: { type: 'prefix_sums', values: [2, 5, 3, 4] },
    quiz: [
      q('With prefix[0]=0, which formula sums inclusive indices l through r?', 'prefix[r+1] - prefix[l]', 'prefix[r] - prefix[l]', 'prefix[r+1] - prefix[l+1]', 'The first prefix includes index r; subtract only elements before l.', 'Translate each prefix index into the number of included items.', 'prefix[r] excludes a[r].', 'Subtracting prefix[l+1] also removes a[l].'),
      q('Why store prefix[0]=0?', 'It represents the empty prefix and handles ranges starting at zero uniformly', 'It stores the first array element', 'It makes preprocessing O(1)', 'For l=0, subtracting the empty-prefix total requires no special case.', 'What sum precedes the first element?', 'The first element is represented in prefix[1].', 'All elements must still be processed once.'),
      q('For [3, 1, 4, 2], what is the inclusive sum from index 1 to 2?', '5', '8', '7', 'The range contains 1 and 4, totaling 5; equivalently prefix[3]-prefix[1]=8-3.', 'Select exactly the two requested indices.', '8 includes index 0 as well.', '7 includes the final 2 beyond the requested range.'),
    ],
  },
  {
    title: 'Binary search', skillId: 'binary_search',
    concepts: ['Binary search requires sorted data or an equivalent monotonic decision rule.', 'Using inclusive bounds, choose mid=floor((low+high)/2); discard mid with low=mid+1 or high=mid-1 after a mismatch.', 'The interval shrinks by roughly half, giving O(log n) comparisons and O(1) iterative auxiliary space.'],
    example: ['Find 14 in [2, 6, 10, 14, 18].', 'Start low=0, high=4, mid=2. Value 10 is smaller than 14.', 'Set low=3. New mid=floor((3+4)/2)=3.', 'Value 14 matches at index 3.'],
    visualization: { type: 'binary_search', values: [2, 6, 10, 14, 18], target: 14 },
    quiz: [
      q('In ascending data, a[mid] is smaller than the target. What is the next inclusive lower bound?', 'mid + 1', 'mid', 'mid - 1', 'Neither mid nor anything to its left can match the larger target.', 'Exclude the midpoint already proved too small.', 'Keeping mid can prevent progress in a one-element interval.', 'Moving left retains impossible smaller values.'),
      q('Why is ordinary binary search invalid on arbitrary unsorted data?', 'Comparison at mid cannot establish which half is safe to discard', 'An unsorted array has no indices', 'Its time always becomes O(1)', 'Without order, the target could be on either side regardless of the middle value.', 'What fact justifies discarding half the candidates?', 'Unsorted arrays still support indexing.', 'Incorrect elimination does not guarantee a correct constant-time search.'),
      q('Using inclusive bounds and floor midpoint, how many comparisons find 13 in [1, 3, 5, 7, 9, 11, 13]?', '3', '2', '7', 'Compare 7 at index 3, then 11 at index 5, then 13 at index 6.', 'Write low, high, and mid after each mismatch.', 'After two comparisons the search has only narrowed to index 6.', 'Seven comparisons describe scanning all items, not binary search.'),
    ],
  },
  {
    title: 'Bubble sort and invariants', skillId: 'sorting',
    concepts: ['Bubble sort compares adjacent elements and swaps an inverted pair.', 'After a full left-to-right pass, the largest item in the unsorted prefix is at its end.', 'Worst-case time is O(n²), auxiliary space O(1); an early-stop flag gives O(n) best-case time. Swapping only strict inversions preserves equal-item order.'],
    example: ['Sort [4, 1, 3] using left-to-right bubble passes.', 'Compare 4 and 1, swap: [1, 4, 3].', 'Compare 4 and 3, swap: [1, 3, 4]; the final 4 is fixed.', 'The next pass compares 1 and 3 with no swap, so stop.'],
    visualization: { type: 'bubble_sort', values: [4, 1, 3] },
    quiz: [
      q('What is guaranteed after the first full left-to-right bubble pass?', 'A largest element is at the last position', 'The smallest element is always first', 'The entire array is sorted', 'Successive adjacent swaps move a maximum to the rightmost position.', 'Follow a maximum through the comparisons.', 'For [3,2,1], the first pass ends [2,1,3], so the minimum is not first.', 'The remaining prefix can still be unsorted.'),
      q('When may an optimized bubble sort stop early?', 'After a complete pass with no swaps', 'After one comparison with no swap', 'After the first swap', 'A whole pass without swaps proves every adjacent pair is ordered.', 'The condition must cover every relevant adjacent pair.', 'One ordered pair does not imply all pairs are ordered.', 'A swap proves that an inversion existed, not that sorting is finished.'),
      q('What array remains after ONE full left-to-right pass on [3, 2, 1]?', '[2, 1, 3]', '[1, 2, 3]', '[2, 3, 1]', 'Swap 3 and 2 to get [2,3,1], then swap 3 and 1 to get [2,1,3].', 'Continue the pass after the first swap.', 'A second pass is required to swap 2 and 1.', 'This is the intermediate state after only the first comparison.'),
    ],
  },
  {
    title: 'Two pointers on sorted arrays', skillId: 'two_pointers',
    concepts: ['For pair sum in sorted data, start one pointer at each end.', 'If the sum is too small, advance the left pointer; if too large, retreat the right pointer.', 'Require left<right to use distinct indices. Each pointer moves at most n times, giving O(n) time after sorting.'],
    example: ['Find a pair summing to 10 in [1, 3, 4, 7, 9].', 'Start at 1 and 9; their sum is 10.', 'Return indices 0 and 4, which are distinct.', 'If this sum had been below 10, advancing left would be the only useful direction.'],
    visualization: { type: 'two_pointers', values: [1, 2, 4, 7, 11], target: 9 },
    quiz: [
      q('For ascending values, the current end-pair sum is below target. Which move is justified?', 'Increase left', 'Decrease right', 'Move both pointers inward unconditionally', 'With the current smallest value, no smaller right endpoint can increase the sum enough.', 'The next pair needs a potentially larger sum.', 'This reduces or preserves the sum, so it cannot fix a sum that is too small.', 'Moving both can skip a valid pair.'),
      q('Why must a pair-sum loop require left < right?', 'To avoid using the same array element twice', 'To guarantee all values are positive', 'To force the target to be even', 'Pair selection requires two distinct positions, regardless of equal values.', 'Positions, not just values, must be distinct.', 'The method also works with sorted negative values.', 'Targets may be odd or even.'),
      q('Using end pointers on [1, 2, 4, 7, 11] with target 9, which pair is found?', '2 and 7', '1 and 11', '4 and 4', '1+11 is high, so move right to 7; 1+7 is low, so move left to 2; 2+7=9.', 'Follow one justified move at a time.', '1+11=12, not 9.', 'There is only one 4, and 4+4 is 8 anyway.'),
    ],
  },
  {
    title: 'Fixed-size sliding window', skillId: 'sliding_window',
    concepts: ['Adjacent fixed-size windows share all but one outgoing and one incoming element.', 'Maintain their sum by subtracting the outgoing value and adding the incoming value.', 'Initialize the maximum from the first actual window, not zero, so all-negative inputs work. Total time is O(n), auxiliary space O(1).'],
    example: ['Find the maximum sum of a length-3 window in [2, 1, 5, 1, 3].', 'First window sum=2+1+5=8.', 'Slide: 8-2+1=7; then 7-1+3=9.', 'The maximum is 9 from [5,1,3].'],
    visualization: { type: 'sliding_window', values: [2, 1, 5, 1, 3], width: 3 },
    quiz: [
      q('When a width-k window shifts right to include a[r], which update is correct?', 'sum - a[r-k] + a[r]', 'sum + a[r-k] + a[r]', 'sum - a[r] + a[r-k]', 'Index r-k leaves the window and index r enters it.', 'Identify the outgoing and incoming positions.', 'This keeps the outgoing item and counts it again.', 'The signs are reversed.'),
      q('Why initialize bestSum from the first full window instead of zero?', 'Every valid window sum may be negative', 'Window sums are always positive', 'Zero initialization changes the array length', 'If every window is negative, zero is not a valid candidate result.', 'Test the algorithm on [-5,-2,-3].', 'Negative array values can create negative window sums.', 'Initialization does not affect array length.'),
      q('What is the maximum length-2 window sum in [4, -1, 2, 6, -3]?', '8', '10', '11', 'Window sums are 3,1,8,3; the largest is 8 from [2,6].', 'Only adjacent pairs of exactly two items qualify.', '4+6=10 uses nonadjacent elements.', '11 is the sum of [4,-1,2,6], a window of the wrong size.'),
    ],
  },
  {
    title: 'Hash maps and frequency counting', skillId: 'hash_maps',
    concepts: ['A frequency map associates each value with the number of times seen.', 'For each item, update count[value]=(existing count or zero)+1.', 'With expected O(1) hash operations, counting n values takes expected O(n) time and O(k) space for k distinct keys. Hash collisions do not mean keys are equal.'],
    example: ['Count frequencies in [2, 1, 2, 3, 1, 2].', 'Read 2 then 1: counts are {2:1,1:1}.', 'The next 2 increments its count; 3 creates a new key.', 'The final table is {2:3,1:2,3:1}; counts sum to six.'],
    visualization: { type: 'frequency_count', values: [2, 1, 2, 3, 1, 2] },
    quiz: [
      q('How should the first occurrence of a missing key be counted?', 'Treat its previous count as zero, then add one', 'Ignore it until it repeats', 'Set its count to its numeric value', 'The first occurrence contributes one regardless of the key itself.', 'A count records occurrences, not magnitude.', 'Ignoring the first occurrence undercounts every key.', 'A key of 9 seen once still has count 1.'),
      q('What invariant holds after processing i items?', 'The sum of frequency counts is i', 'The number of distinct keys is always i', 'Every count is either zero or one', 'Each processed item increments exactly one frequency by one.', 'Track the total number of increments.', 'Repeated items do not create new keys.', 'Repeated keys can have counts greater than one.'),
      q('How many times does 4 occur in [4, 2, 4, 4, 2, 7]?', '3', '2', '4', 'The value 4 appears at indices 0,2,3, so its frequency is 3.', 'Count matching values, not unique values or indices.', '2 is the frequency of the value 2.', '4 is the value being counted, not its frequency.'),
    ],
  },
  {
    title: 'Stacks and balanced brackets', skillId: 'stacks',
    concepts: ['A stack is last-in, first-out: the most recent opener must match the next closer.', 'Push opening brackets; on a closer, require a nonempty stack and a matching top, then pop.', 'Reject a mismatch immediately and reject leftover openers at the end. Validation takes O(n) time and O(n) worst-case space.'],
    example: ['Check whether ([{}]) is balanced.', 'Push (, then [, then {.', 'Read }: it matches {, so pop; ] then matches [, and ) matches (. ', 'The stack is empty at the end, so the string is balanced.'],
    visualization: { type: 'brackets', text: '([{}])' },
    quiz: [
      q('Which opener must a closing bracket match?', 'The most recently unmatched opener', 'The earliest opener anywhere', 'Any opener of the same type anywhere', 'Nested structure closes in reverse opening order, exactly matching stack behavior.', 'Think about which nested block closes first.', 'Matching the earliest opener uses queue-like order and breaks nesting.', 'Finding a matching type elsewhere ignores improperly crossed brackets.'),
      q('Why is an empty stack required after the final character?', 'Any remaining opener has no matching closer', 'Every valid string must contain no openers', 'It proves the input length was odd', 'All pushed opening brackets must have been matched and removed.', 'What does each remaining stack entry represent?', 'Valid nonempty bracket strings contain openers, but they are eventually popped.', 'Balanced bracket strings have even length, and emptiness does not imply odd length.'),
      q('Is ([)] balanced?', 'No: ) mismatches the top [', 'Yes: it has equal counts of openers and closers', 'No: it contains an odd number of characters', 'At the third character, the latest unmatched opener is [, but the closer is ).', 'Check nesting order, not just counts.', 'Equal counts are necessary but insufficient.', 'The string has four characters, which is even.'),
    ],
  },
  {
    title: 'Queues and breadth-first search', skillId: 'graphs',
    concepts: ['A queue is first-in, first-out; BFS uses it to expand vertices in discovery order.', 'Mark a vertex discovered when enqueuing it, preventing duplicate queue entries through multiple incoming edges.', 'In an unweighted graph, BFS first discovers a vertex at minimum edge distance. Adjacency-list traversal is O(V+E).'],
    example: ['BFS from 0 in a graph with adjacency lists 0:[1,2], 1:[3], 2:[3], 3:[].', 'Queue=[0], distance[0]=0. Pop 0 and enqueue 1,2 with distance 1.', 'Pop 1 and enqueue 3 with distance 2; pop 2 but do not enqueue 3 again.', 'Visit order is 0,1,2,3 and distance to 3 is 2 edges.'],
    visualization: { type: 'bfs', edges: [[1, 2], [3], [3], []], start: 0, target: 3 },
    quiz: [
      q('When should ordinary BFS mark a vertex discovered?', 'When it is first enqueued', 'Only after all its outgoing edges are processed', 'Every time it is encountered', 'Marking at enqueue prevents multiple predecessors from enqueueing the same vertex.', 'Two frontier vertices may point to the same neighbour.', 'Delaying the mark permits duplicate pending queue entries.', 'A discovered vertex should not be reset or enqueued repeatedly.'),
      q('Why does BFS find minimum-edge paths in an unweighted graph?', 'FIFO expansion processes distance layers in order', 'It always visits the largest vertex label first', 'A stack forces shortest paths', 'All distance-d vertices are expanded before newly discovered distance-(d+1) vertices.', 'The proof depends on queue order, not labels.', 'Vertex labels have no relation to path length.', 'A stack gives depth-first behavior without the same shortest-path guarantee.'),
      q('For 0:[1,2], 1:[3], 2:[3], 3:[], what is the BFS distance from 0 to 3?', '2', '3', '1', 'A shortest path is 0→1→3 or 0→2→3, each with two edges.', 'Count edges rather than vertices.', 'Three counts the vertices in a shortest path.', 'There is no direct edge from 0 to 3.'),
    ],
  },
  {
    title: 'Reversing a linked list', skillId: 'linked_lists',
    concepts: ['A singly linked node stores a value and a next reference; it does not provide constant-time indexing.', 'To reverse in place, preserve next, redirect current.next to previous, then advance previous and current.', 'The reversed prefix grows until current is null; previous becomes the new head. Time O(n), auxiliary space O(1).'],
    example: ['Reverse 10→20→30→null.', 'At 10, save 20 and set 10.next=null; previous becomes 10.', 'At 20, save 30 and set 20.next=10; then at 30 set 30.next=20.', 'Current is null; return previous, giving 30→20→10→null.'],
    visualization: { type: 'linked_list_reverse', values: [10, 20, 30] },
    quiz: [
      q('Why save current.next before redirecting it?', 'Otherwise the remaining unreversed suffix may become unreachable', 'It sorts the values automatically', 'It removes the need for a previous pointer', 'Overwriting the only next reference without saving it loses the path to unprocessed nodes.', 'Which reference leads to the rest of the list?', 'Link reversal does not compare or sort values.', 'Previous is still needed as the new next target.'),
      q('When iterative reversal ends with current=null, which pointer is the new head?', 'previous', 'The original head', 'The saved next pointer, which is null', 'Previous points to the last processed node, formerly the tail.', 'The original tail becomes first.', 'The original head becomes the new tail.', 'Null terminates the list and cannot identify a nonempty new head.'),
      q('Reverse 5→8→2→null. What is the new head value?', '2', '5', '8', 'Reversal yields 2→8→5→null, so the new head holds 2.', 'Follow what happens to the original tail.', '5 was the original head and becomes the tail.', '8 remains the middle node in this three-node list.'),
    ],
  },
  {
    title: 'Recursion and subset backtracking', skillId: 'backtracking',
    concepts: ['Subset generation makes two decisions for each distinct input item: exclude or include.', 'At the base case, output a copy of the current selection, including the empty subset.', 'Undo an inclusion after returning so sibling branches do not inherit it. There are 2^n subsets; materializing them costs O(n2^n) total output work.'],
    example: ['Generate subsets of [1,2], taking exclusion before inclusion.', 'Exclude 1; excluding then including 2 yields [] and [2].', 'Include 1; excluding then including 2 yields [1] and [1,2].', 'Undo each inclusion when its recursive branch returns. Four subsets are produced.'],
    visualization: { type: 'subsets', values: [1, 2, 3] },
    quiz: [
      q('Why pop an included item after its recursive branch returns?', 'To restore the parent selection before exploring another branch', 'To delete that item from the original input', 'To reduce the number of valid subsets', 'Backtracking restores local choice state so sibling branches remain independent.', 'Each branch should start from the parent’s state.', 'The input can remain unchanged; only the temporary selection is updated.', 'Undoing prevents incorrect extra elements rather than removing valid outcomes.'),
      q('Why store a copy of the selection at a subset leaf?', 'Later mutations of the working selection must not alter earlier outputs', 'A reference automatically freezes its target', 'Copying makes the number of subsets linear', 'A shared mutable selection changes during backtracking; snapshots preserve each emitted subset.', 'Outputs must survive subsequent push/pop operations.', 'References alone do not make mutable objects immutable.', 'There are still 2^n subsets, regardless of storage technique.'),
      q('How many subsets, including empty and full, does a set of four distinct items have?', '16', '8', '24', 'Each of four items has two choices, so 2^4=16.', 'Multiply two independent choices per item.', '8 is the count for three items.', '24 is 4!, the number of permutations of all four items.'),
    ],
  },
  {
    title: 'Binary search trees', skillId: 'trees',
    concepts: ['With distinct keys, every key in a node’s left subtree is smaller and every key in its right subtree is larger.', 'Search follows one child according to the comparison; insertion attaches a new key at the first null child reached by that search.', 'Operations take O(h) time for height h: O(log n) when balanced but O(n) for a skewed tree. An inorder traversal yields sorted keys.'],
    example: ['Insert 6 into the BST built from [8,3,10,1,5].', '6<8, so move to 3; 6>3, so move to 5.', '6>5 and the right child of 5 is null.', 'Attach 6 there as the right child of 5.'],
    visualization: { type: 'bst_search', values: [8, 3, 10, 1, 5, 6], target: 6 },
    quiz: [
      q('At BST key 12, the search target is 9. Which subtree can contain it?', 'Left subtree', 'Right subtree', 'Either subtree regardless of ordering', 'All right-subtree keys exceed 12, so a smaller target can only be left.', 'Use the subtree ordering invariant.', '9 is smaller than the current key, not larger.', 'The BST invariant is precisely what eliminates one subtree.'),
      q('Why is BST lookup not always O(log n)?', 'Insertion order can create a chain with height O(n)', 'All BST nodes have equal keys', 'A BST always searches both subtrees', 'An unbalanced BST can have one child at each level, requiring n comparisons.', 'Consider inserting already sorted distinct keys.', 'This curriculum uses distinct keys; duplicates are not the cause.', 'Lookup follows one path, but that path can be long.'),
      q('Insert 6 into the BST built by inserting 8,3,10,1,5 in that order. Where does 6 attach?', 'Right child of 5', 'Left child of 10', 'Left child of 5', 'Follow 8 left to 3, then right to 5, then right to its null child.', 'Compare with each ancestor on the path.', 'Although 6<10, it also must be in the left subtree of 8.', '6 exceeds 5, so it cannot be its left child.'),
    ],
  },
  {
    title: 'Dynamic programming: minimum coins', skillId: 'dynamic_programming',
    concepts: ['Let dp[a] be the fewest coins forming amount a; dp[0]=0 and unreachable states have no finite value.', 'With unlimited positive denominations, dp[a]=min(dp[a-c]+1) over usable coins c and reachable previous states.', 'Compute smaller amounts first. Time O(amount×number of denominations), space O(amount). Greedy largest-first is not correct for arbitrary coin systems.'],
    example: ['Make amount 6 with unlimited coins [1,3,4].', 'dp[0..3]=[0,1,2,1], and dp[4]=1.', 'dp[5]=2, using 4+1.', 'For 6, using coin 3 gives dp[3]+1=2: choose 3+3. Greedy 4+1+1 uses three coins.'],
    visualization: { type: 'min_coins', values: [1, 3, 4], amount: 6 },
    quiz: [
      q('What does dp[a-c]+1 mean in the minimum-coin recurrence?', 'An optimal solution for the smaller amount plus one coin c', 'The number of denominations smaller than a', 'The monetary value of all chosen coins plus one rupee', 'Choosing the last coin c leaves amount a-c, which must already be reachable.', 'The DP value counts coins, not money.', 'Denomination count is not a solution size.', 'The added 1 counts one coin of value c, not one rupee.'),
      q('Why can largest-coin-first fail for coins [1,3,4] and amount 6?', '4+1+1 uses more coins than 3+3', 'A coin of value 4 is never usable', 'Dynamic programming forbids repeated denominations', 'The locally largest coin leads to three coins, while another first choice yields two.', 'Compare the complete solutions after the first choice.', '4 is optimal for amount 4 and valid for many amounts.', 'This problem explicitly permits unlimited repetitions.'),
      q('With unlimited coins [2,5], what is the minimum number of coins making 11?', '4', '3', 'Unreachable', '5+2+2+2=11 uses four coins. Three coins can total 6,9,12,15, never 11; two coins cannot make 11 either.', 'Try the feasible counts of 5-value coins.', 'No three-coin combination of 2 and 5 totals 11.', '5+2+2+2 is a valid construction.'),
    ],
  },
  {
    title: 'Mixed DSA assessment: shortest paths and algorithm choice', skillId: 'graphs',
    concepts: ['Choose algorithms by assumptions: BFS minimizes edge count in unweighted graphs; unequal nonnegative edge weights generally require Dijkstra instead.', 'A parent array recorded on first discovery reconstructs a shortest BFS path by walking backwards from the target.', 'An unreachable vertex retains no distance or parent. Cycles require discovery tracking, and multiple shortest paths can exist.'],
    example: ['Find a shortest path from 0 to 5 with edges 0:[1,2], 1:[3], 2:[3,4], 3:[5], 4:[5], 5:[].', 'BFS discovers 1 and 2 at distance 1, then 3 and 4 at distance 2.', 'Vertex 5 is first discovered from 3 at distance 3.', 'Follow parents 5←3←1←0 and reverse to obtain 0→1→3→5. Other length-3 paths can also be shortest.'],
    visualization: { type: 'bfs', edges: [[1, 2], [3], [3, 4], [5], [5], []], start: 0, target: 5 },
    quiz: [
      q('A graph has edges with unequal nonnegative travel times. Which algorithm generally finds minimum total travel time?', 'Dijkstra’s algorithm', 'Ordinary FIFO BFS ignoring weights', 'Binary search directly on vertex labels', 'Dijkstra prioritizes tentative total distance; ordinary BFS minimizes the number of edges instead.', 'Fewest roads need not mean least travel time.', 'Ignoring weights can prefer a short-edge-count but expensive route.', 'Vertex labels do not provide a monotonic path-cost search space.'),
      q('Why assign a BFS parent only when a vertex is first discovered?', 'It preserves the first shortest-layer discovery path', 'Later overwrites always make the path shorter', 'The parent should be the numerically smallest vertex', 'FIFO discovery establishes minimum edge distance; later encounters should not replace it arbitrarily.', 'Parent choice follows discovery, not labels.', 'Later edges can come from the same or a deeper layer and need not improve distance.', 'The smallest label need not lie on a shortest path.'),
      q('For 0:[1,2], 1:[3], 2:[3,4], 3:[5], 4:[5], 5:[], what is the minimum edge count from 0 to 5?', '3', '2', '4', 'A path 0→1→3→5 uses three edges. Vertex 5 has no predecessor reachable from 0 in just one edge, so two edges cannot suffice.', 'Build distance layers from vertex 0.', 'There is no edge from 1 or 2 directly to 5.', 'Four counts the vertices in a length-3 path.'),
    ],
  },
];
