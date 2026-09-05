const KEY = "foldwink:supporter";
const THANK_YOU_KEY = "foldwink:supporter:thanks-pending";
const URL_PARAM = "supporter";
const URL_VALUE = "success";

export function isSupporter(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSupporter(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSupporter(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(THANK_YOU_KEY);
  } catch {
    /* ignore */
  }
}

function markSupporterThankYouPending(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(THANK_YOU_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasPendingSupporterThankYou(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(THANK_YOU_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissSupporterThankYou(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(THANK_YOU_KEY);
  } catch {
    /* ignore */
  }
}

export function consumeSupporterReturnUrl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get(URL_PARAM);
    if (!value || value.toLowerCase() !== URL_VALUE) return false;

    setSupporter();
    markSupporterThankYouPending();

    url.searchParams.delete(URL_PARAM);
    const query = url.searchParams.toString();
    const cleaned = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
    window.history.replaceState({}, "", cleaned);
    return true;
  } catch {
    return false;
  }
}
