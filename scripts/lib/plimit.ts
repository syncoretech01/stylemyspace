/** Minimal in-repo p-limit: run at most `concurrency` async tasks at once. */
export type Limit = <T>(fn: () => Promise<T>) => Promise<T>;

export function pLimit(concurrency: number): Limit {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`pLimit: concurrency must be a positive integer, got ${concurrency}`);
  }
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    active -= 1;
    const run = queue.shift();
    if (run) run();
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active += 1;
        fn().then(resolve, reject).finally(next);
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
