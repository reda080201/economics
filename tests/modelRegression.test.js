import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateConsumption, calculateInvestment } from "../src/economy/responseFunctions.js";
import { computeGDP } from "../src/economy/macroMetrics.js";
import { runBacktest } from "../src/core/backtest.js";
import { defaultModelParameters } from "../src/core/modelParameters.js";
import { createSeededRandom } from "../src/core/seededRandom.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("response functions keep rate, debt, and uncertainty channels directional", () => {
  const lowRate = calculateConsumption({ disposableIncome: 1, wealth: 0, confidence: 0, interestRate: 0.02, debtBurden: 0.1 }, defaultModelParameters);
  const highRate = calculateConsumption({ disposableIncome: 1, wealth: 0, confidence: 0, interestRate: 0.08, debtBurden: 0.1 }, defaultModelParameters);
  const lowDebt = calculateConsumption({ disposableIncome: 1, wealth: 0, confidence: 0, interestRate: 0.02, debtBurden: 0.1 }, defaultModelParameters);
  const highDebt = calculateConsumption({ disposableIncome: 1, wealth: 0, confidence: 0, interestRate: 0.02, debtBurden: 0.4 }, defaultModelParameters);
  const lowUncertainty = calculateInvestment({ expectedDemand: 0, profit: 0, capacityUtilization: 0, interestRate: 0.02, uncertainty: 0.1 }, defaultModelParameters);
  const highUncertainty = calculateInvestment({ expectedDemand: 0, profit: 0, capacityUtilization: 0, interestRate: 0.02, uncertainty: 0.8 }, defaultModelParameters);

  assert.ok(highRate < lowRate, "금리 상승은 소비 신호를 낮춰야 합니다.");
  assert.ok(highDebt < lowDebt, "부채 부담 상승은 소비 신호를 낮춰야 합니다.");
  assert.ok(highUncertainty < lowUncertainty, "불확실성 상승은 투자 신호를 낮춰야 합니다.");
});

test("GDP uses current expenditure components and net exports", () => {
  const state = { metrics: { consumption: 100, investment: 40, governmentGDPSpending: 30, exportSales: 25, importCosts: 15 } };
  assert.equal(computeGDP(state), 180);
});

test("backtest produces a recursive, finite, non-copied path", () => {
  const dates = Array.from({ length: 8 }, (_, index) => `2020-0${index + 1}`);
  const series = (values) => values.map((value, index) => ({ date: dates[index], value }));
  const dataset = {
    gdp: series([100, 101, 102, 103, 104, 105, 106, 107]),
    cpi: series([100, 100.5, 101, 101.5, 102, 102.5, 103, 103.5]),
    unemployment: series([6, 6.1, 6.2, 6.1, 6, 5.9, 5.8, 5.7]),
    policyRate: series([3, 3, 4, 5, 5, 4, 3, 3]),
    governmentDebt: series([50, 50, 51, 52, 53, 53, 52, 52]),
    householdDebt: series([70, 70, 72, 74, 75, 74, 73, 72]),
    exchangeRate: series([100, 101, 102, 104, 103, 102, 101, 100]),
    exports: series([100, 101, 103, 102, 104, 106, 107, 108]),
    imports: series([100, 101, 102, 104, 105, 106, 108, 109])
  };
  const result = runBacktest(dataset);
  assert.equal(result.leakageCheckPassed, true);
  assert.equal(result.method, "recursive_response_function_simulation");
  assert.ok(Number.isFinite(result.averageRmse));
  assert.ok(result.simulated.gdp.some((value, index) => value !== result.actual.gdp[index]));
  assert.ok(result.simulated.unemployment.every(Number.isFinite));
});

test("seeded random sequences are reproducible", () => {
  const first = createSeededRandom(42);
  const second = createSeededRandom(42);
  const a = Array.from({ length: 12 }, () => first());
  const b = Array.from({ length: 12 }, () => second());
  assert.deepEqual(a, b);
});

test("developer validation uses total tax once", () => {
  const source = fs.readFileSync(path.join(root, "src", "analysis", "developerValidation.js"), "utf8");
  assert.match(source, /taxRevenue:\s*safeNumber\(m\.totalTaxCollected,\s*0\)/);
  assert.doesNotMatch(source, /taxRevenue:\s*safeNumber\(m\.taxCollected,\s*0\)\s*\+/);
});
