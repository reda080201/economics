import { getRandomState, setRandomState } from "./mathUtils.js";

function readControlValue(els, key) {
  return els?.[key]?.value ?? "";
}

function writeControlValue(els, key, value) {
  if (els?.[key]) els[key].value = value;
}

export function captureSimulationSnapshot(state, els) {
  const charts = state.charts;
  const controls = {
    interest: readControlValue(els, "interestSlider"),
    tax: readControlValue(els, "taxSlider"),
    corporateTax: readControlValue(els, "corporateTaxSlider"),
    vat: readControlValue(els, "vatSlider"),
    spending: readControlValue(els, "spendingSlider"),
    wage: readControlValue(els, "wageSlider"),
    inflation: readControlValue(els, "inflationSlider"),
    scenario: readControlValue(els, "scenarioSelect")
  };
  return {
    json: JSON.stringify(state, (key, value) => key === "charts" ? undefined : value),
    charts,
    controls,
    randomState: getRandomState()
  };
}

export function restoreSimulationSnapshot(state, els, snapshot, updateControlLabels) {
  if (!snapshot) return;
  const restored = JSON.parse(snapshot.json);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, restored);
  state.charts = snapshot.charts || {};
  setRandomState(snapshot.randomState);
  if (snapshot.controls) {
    writeControlValue(els, "interestSlider", snapshot.controls.interest);
    writeControlValue(els, "taxSlider", snapshot.controls.tax);
    writeControlValue(els, "corporateTaxSlider", snapshot.controls.corporateTax);
    writeControlValue(els, "vatSlider", snapshot.controls.vat);
    writeControlValue(els, "spendingSlider", snapshot.controls.spending);
    writeControlValue(els, "wageSlider", snapshot.controls.wage);
    writeControlValue(els, "inflationSlider", snapshot.controls.inflation);
    writeControlValue(els, "scenarioSelect", snapshot.controls.scenario);
  }
  updateControlLabels?.();
}

export function captureCoreStateSignature(state, helpers) {
  const { round, safeNumber } = helpers;
  const m = state.metrics || {};
  return {
    tick: safeNumber(state.tick, 0),
    gdp: round(safeNumber(m.gdp, 0), 3),
    unemploymentRate: round(safeNumber(m.unemploymentRate, 0), 3),
    inflation: round(safeNumber(m.inflation, 0), 3),
    financialConditionIndex: round(safeNumber(m.financialConditionIndex, 0), 3),
    creditSupplyIndex: round(safeNumber(m.creditSupplyIndex, 100), 3),
    bankHealthIndex: round(safeNumber(m.bankHealthIndex, 100), 3),
    stockIndexPoints: round(safeNumber(m.stockIndexPoints, 2500), 3),
    residentialIndex: round(safeNumber(m.residentialIndex, safeNumber(m.housingIndex, 100)), 3)
  };
}

export function compareCoreStateSignature(before, after, safeNumber) {
  const tolerance = {
    tick: 0,
    gdp: 0.01,
    unemploymentRate: 0.01,
    inflation: 0.01,
    financialConditionIndex: 0.01,
    creditSupplyIndex: 0.01,
    bankHealthIndex: 0.01,
    stockIndexPoints: 0.05,
    residentialIndex: 0.01
  };
  return Object.keys(before || {}).filter((key) => {
    const allowed = tolerance[key] ?? 0.01;
    return Math.abs(safeNumber(before[key], 0) - safeNumber(after?.[key], 0)) > allowed;
  });
}
