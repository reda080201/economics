export function createSeededRandom(seed = 12345) {
  let value = Number(seed) >>> 0;
  const seededRandom = function seededRandom() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
  seededRandom.getState = () => value;
  seededRandom.setState = (nextValue) => {
    value = Number(nextValue) >>> 0;
  };
  return seededRandom;
}
