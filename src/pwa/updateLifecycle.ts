export type ServiceWorkerUpdateState = {
  available: boolean;
  activating: boolean;
};

type WaitingWorker = Pick<ServiceWorker, "postMessage">;

let waitingWorker: WaitingWorker | null = null;
let dismissed = false;
let activating = false;
let state: ServiceWorkerUpdateState = { available: false, activating: false };
const listeners = new Set<() => void>();

function emit(): void {
  state = { available: waitingWorker !== null && !dismissed, activating };
  listeners.forEach((listener) => listener());
}

export function getServiceWorkerUpdateState(): ServiceWorkerUpdateState {
  return state;
}

export function subscribeToServiceWorkerUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setWaitingServiceWorker(worker: WaitingWorker): void {
  waitingWorker = worker;
  dismissed = false;
  activating = false;
  emit();
}

export function dismissServiceWorkerUpdate(): void {
  dismissed = true;
  emit();
}

/** Starts activation only after the player has explicitly chosen Update now. */
export function requestServiceWorkerUpdate(): boolean {
  if (!waitingWorker || activating) return false;
  activating = true;
  waitingWorker.postMessage({ type: "FOLDWINK_SKIP_WAITING" });
  emit();
  return true;
}

export function isServiceWorkerUpdateActivationRequested(): boolean {
  return activating;
}

export function clearServiceWorkerUpdateForTests(): void {
  waitingWorker = null;
  dismissed = false;
  activating = false;
  state = { available: false, activating: false };
  listeners.clear();
}
