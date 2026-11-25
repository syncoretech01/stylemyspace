/**
 * Real asset-progress store for the preloader. Anything that matters to the first paint
 * (fonts, the LCP image, the hero WebGL chunk) registers a weighted promise here.
 */
type Listener = (progress: number) => void;

const items: { weight: number; done: boolean }[] = [];
const listeners = new Set<Listener>();

function progress() {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (!total) return 0;
  return items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0) / total;
}

function emit() {
  const p = progress();
  listeners.forEach((l) => l(p));
}

export function track<T>(promise: Promise<T>, weight: number): Promise<T> {
  const item = { weight, done: false };
  items.push(item);
  emit();
  const finish = () => {
    item.done = true;
    emit();
  };
  promise.then(finish, finish);
  return promise;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(progress());
  return () => listeners.delete(listener);
}

/** The curtain has started to lift; `preloader:done` follows when it is gone. */
export const PRELOADER_LIFT_EVENT = "preloader:lift";
export const PRELOADER_DONE_EVENT = "preloader:done";

export function isPreloaderPending() {
  return typeof document !== "undefined" && document.documentElement.dataset.preloader === "pending";
}

export function markPreloaderDone() {
  document.documentElement.dataset.preloader = "done";
  document.documentElement.dataset.preloaderDone = "true";
  window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
}

export function markPreloaderLifting() {
  document.documentElement.dataset.preloaderLifting = "true";
  window.dispatchEvent(new Event(PRELOADER_LIFT_EVENT));
}

/** Run `cb` as the curtain starts to lift (immediately if it already has, or never ran). Returns an unsubscribe. */
export function onPreloaderLift(cb: () => void) {
  if (!isPreloaderPending() || document.documentElement.dataset.preloaderLifting) {
    cb();
    return () => {};
  }
  window.addEventListener(PRELOADER_LIFT_EVENT, cb, { once: true });
  return () => window.removeEventListener(PRELOADER_LIFT_EVENT, cb);
}

/** Run `cb` once the preloader has finished (immediately if it never ran). Returns an unsubscribe. */
export function onPreloaderDone(cb: () => void) {
  if (!isPreloaderPending()) {
    cb();
    return () => {};
  }
  window.addEventListener(PRELOADER_DONE_EVENT, cb, { once: true });
  return () => window.removeEventListener(PRELOADER_DONE_EVENT, cb);
}
