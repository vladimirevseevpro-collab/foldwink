import {
  clearServiceWorkerUpdateForTests,
  dismissServiceWorkerUpdate,
  getServiceWorkerUpdateState,
  requestServiceWorkerUpdate,
  setWaitingServiceWorker,
  subscribeToServiceWorkerUpdate,
} from "../updateLifecycle";

describe("service worker update lifecycle", () => {
  afterEach(() => clearServiceWorkerUpdateForTests());

  it("keeps an installed update waiting until the player asks to activate it (TEST-37)", () => {
    const postMessage = vi.fn();
    setWaitingServiceWorker({ postMessage });

    expect(getServiceWorkerUpdateState()).toEqual({ available: true, activating: false });
    expect(postMessage).not.toHaveBeenCalled();

    expect(requestServiceWorkerUpdate()).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: "FOLDWINK_SKIP_WAITING" });
    expect(getServiceWorkerUpdateState()).toEqual({ available: true, activating: true });
  });

  it("lets Later hide the prompt without activating or discarding the waiting worker", () => {
    const postMessage = vi.fn();
    const listener = vi.fn();
    const unsubscribe = subscribeToServiceWorkerUpdate(listener);
    setWaitingServiceWorker({ postMessage });

    dismissServiceWorkerUpdate();

    expect(getServiceWorkerUpdateState()).toEqual({ available: false, activating: false });
    expect(postMessage).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
