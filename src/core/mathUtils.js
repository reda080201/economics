let randomSource = () => Math.random();

export function setRandomSource(source) {
  randomSource = typeof source === "function" ? source : () => Math.random();
}

export function resetRandomSource() {
  randomSource = () => Math.random();
}

export function random() {
  return randomSource();
}

export function getRandomState() {
  return typeof randomSource.getState === "function" ? randomSource.getState() : null;
}

export function setRandomState(value) {
  if (typeof randomSource.setState === "function" && Number.isFinite(value)) randomSource.setState(value);
}

export function rand(min, max) {
  return random() * (max - min) + min;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, safeNumber(value, min)));
}

export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

export function smoothValue(oldValue, rawValue, alpha) {
  const safeOld = safeNumber(oldValue, rawValue);
  const safeRaw = safeNumber(rawValue, safeOld);
  const safeAlpha = clamp(alpha, 0, 1);
  return safeOld * (1 - safeAlpha) + safeRaw * safeAlpha;
}

export function applyInertia(oldDecision, targetDecision) {
  return safeNumber(oldDecision, targetDecision) * 0.7 + safeNumber(targetDecision, oldDecision) * 0.3;
}

export function computeNonlinearStress(debtRatio, serviceBurden = 0) {
  const ratio = Math.max(0, safeNumber(debtRatio, 0));
  const leverageStress = ratio <= 0.90
    ? ratio * 0.14
    : 0.126 + Math.pow(ratio - 0.90, 1.55) * 0.76;
  let stress = leverageStress + Math.max(0, serviceBurden - 0.060) * 1.55;
  if (ratio > 1.25) stress *= 1.28;
  if (ratio > 1.75) stress *= 1.62;
  return clamp(stress, 0, 1.5);
}

export function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(safeNumber(value, 0) * factor) / factor;
}

export function safeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function safeValue(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return value;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sum(values) {
  return values.reduce((total, value) => total + safeNumber(value, 0), 0);
}

export function average(values) {
  if (!values.length) return 0;
  return sum(values) / values.length;
}

export function unique(values) {
  return [...new Set(values)];
}

export function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function calculateGini(values) {
  const sorted = values.map((value) => Math.max(0, safeNumber(value, 0))).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  const total = sum(sorted);
  if (total <= 0) return 0;
  let weighted = 0;
  sorted.forEach((value, index) => {
    weighted += (index + 1) * value;
  });
  return clamp((2 * weighted) / (n * total) - (n + 1) / n, 0, 1);
}

export function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function quadraticPoint(x0, y0, x1, y1, x2, y2, t) {
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * x0 + 2 * oneMinusT * t * x1 + t * t * x2,
    y: oneMinusT * oneMinusT * y0 + 2 * oneMinusT * t * y1 + t * t * y2
  };
}
