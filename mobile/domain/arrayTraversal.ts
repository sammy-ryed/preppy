// Pure visualization state: no drawing, clocks, or UI dependencies.
export interface ArrayTraversalStep {
  readonly values: readonly number[];
  readonly activeIndex: number | null;
  readonly visitedCount: number;
  readonly sum: number;
}
export function arrayTraversalSteps(values: readonly number[]) {
  if (values.length < 1 || values.length > 20 || !values.every(Number.isSafeInteger)) throw new Error('Use 1-20 safe integers');
  let sum = 0;
  const items = Object.freeze([...values]);
  const steps: ArrayTraversalStep[] = [Object.freeze({ values: items, activeIndex: null, visitedCount: 0, sum: 0 })];
  values.forEach((value, activeIndex) => {
    sum += value;
    if (!Number.isSafeInteger(sum)) throw new Error('Array sum exceeds supported range');
    steps.push(Object.freeze({ values: items, activeIndex, visitedCount: activeIndex + 1, sum }));
  });
  return Object.freeze(steps);
}
