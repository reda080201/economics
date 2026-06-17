const API_KEY_PREFIX = "agent_macro_lab_api_key_";

export function getApiKey(provider) {
  if (!canUseLocalStorage()) return "";
  return localStorage.getItem(storageKey(provider)) || "";
}

export function setApiKey(provider, key) {
  if (!canUseLocalStorage()) return false;
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) {
    clearApiKey(provider);
    return false;
  }
  localStorage.setItem(storageKey(provider), normalizedKey);
  return true;
}

export function clearApiKey(provider) {
  if (!canUseLocalStorage()) return false;
  localStorage.removeItem(storageKey(provider));
  return true;
}

export function hasApiKey(provider) {
  return Boolean(getApiKey(provider));
}

function storageKey(provider) {
  return `${API_KEY_PREFIX}${String(provider || "").toLowerCase()}`;
}

function canUseLocalStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}
