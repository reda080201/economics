export function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clamp(value, min, max) {
  const number = safeNumber(value, min);
  return Math.min(max, Math.max(min, number));
}

export function smoothValue(oldValue, nextValue, alpha = 0.15) {
  const a = clamp(alpha, 0, 1);
  return safeNumber(oldValue, nextValue) * (1 - a) + safeNumber(nextValue, oldValue) * a;
}

export function sum(values) {
  return values.reduce((total, value) => total + safeNumber(value, 0), 0);
}

export function average(values) {
  return values.length ? sum(values) / values.length : 0;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
