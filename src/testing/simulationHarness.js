import { createApp } from "../app/createApp.js";

const noop = () => {};

function createCanvasContext() {
  return new Proxy({}, {
    get(_target, key) {
      if (key === "measureText") return () => ({ width: 1 });
      if (key === "createLinearGradient") return () => ({ addColorStop: noop });
      return noop;
    },
    set() {
      return true;
    }
  });
}

function createHeadlessDom({ consumerCount, producerCount, interestRate, educationalStabilizersEnabled }) {
  const values = {
    speedSlider: "8",
    performanceModeSelect: "light",
    consumerSlider: String(consumerCount),
    producerSlider: String(producerCount),
    interestSlider: String(interestRate),
    taxSlider: "16",
    corporateTaxSlider: "18",
    vatSlider: "10",
    spendingSlider: "640",
    wageSlider: "12",
    inflationSlider: "0.65",
    gameModeSelect: "sandbox",
    scenarioSelect: "stableGrowth"
  };
  const canvasContext = createCanvasContext();
  const elements = new Map();
  const createElement = (id = "") => ({
    id,
    value: values[id] ?? "",
    checked: id === "educationalStabilizersToggle" ? educationalStabilizersEnabled : false,
    textContent: "",
    innerHTML: "",
    dataset: {},
    style: { setProperty: noop },
    classList: { add: noop, remove: noop, toggle: noop },
    children: [],
    addEventListener: noop,
    appendChild(node) { this.children.push(node); return node; },
    insertBefore(node) { this.children.push(node); return node; },
    insertAdjacentElement: noop,
    closest: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute: noop,
    getAttribute: () => null,
    focus: noop,
    scrollIntoView: noop,
    remove: noop,
    getContext: () => canvasContext,
    getBoundingClientRect: () => ({ width: 800, height: 500, left: 0, top: 0 })
  });
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement(id));
      return elements.get(id);
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => createElement(),
    addEventListener: noop
  };
  const window = {
    performance: { now: () => 0 },
    requestAnimationFrame: noop,
    addEventListener: noop,
    devicePixelRatio: 1
  };
  return { document, window };
}

export function createSimulationHarness(options = {}) {
  const settings = {
    seed: options.seed ?? 12345,
    consumerCount: options.consumerCount ?? 40,
    producerCount: options.producerCount ?? 12,
    interestRate: options.interestRate ?? 4.5,
    educationalStabilizersEnabled: options.educationalStabilizersEnabled ?? true
  };
  const dom = createHeadlessDom(settings);
  const app = createApp({ ...dom, testMode: true });
  app.init();
  const state = app.testing.getState();
  state.seed = settings.seed;
  app.testing.reset();
  state.debug.suppressVisualUpdates = true;

  return {
    state,
    step(count = 1) {
      for (let index = 0; index < count; index += 1) app.testing.step();
      return this;
    },
    signature() {
      const metrics = state.metrics;
      return {
        tick: state.tick,
        gdp: metrics.gdp,
        inflation: metrics.inflation,
        unemployment: metrics.unemploymentRate,
        consumption: metrics.consumption,
        investment: metrics.investment,
        imports: metrics.importCosts,
        exports: metrics.exportSales,
        creditSupply: metrics.creditSupplyIndex,
        stockIndex: metrics.stockIndexPoints,
        housingIndex: metrics.housingIndex,
        errors: state.debug.errors.length
      };
    }
  };
}

export function hasFiniteCoreMetrics(state) {
  const metrics = state.metrics || {};
  return [
    metrics.gdp,
    metrics.inflation,
    metrics.unemploymentRate,
    metrics.consumption,
    metrics.investment,
    metrics.importCosts,
    metrics.exportSales,
    metrics.creditSupplyIndex,
    metrics.stockIndexPoints,
    metrics.housingIndex
  ].every(Number.isFinite);
}
