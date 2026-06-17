const SECTOR_MAP = {
  consumer: "households",
  producer: "firms",
  government: "government",
  bank: "banks",
  centralBank: "centralBank",
  foreign: "foreignSector",
  assetMarket: "assetMarket"
};

export function createFlowLedger() {
  return {
    period: 0,
    flows: [],
    lastValidation: { ok: true, status: "PASS", errors: [], warnings: [], summary: "회계 검증 대기" }
  };
}

export function recordEconomicFlow(ledger, flow) {
  if (!ledger || !Number.isFinite(flow?.amount) || flow.amount <= 0) return;
  ledger.flows.push({
    period: flow.period || 0,
    from: normalizeSector(flow.from),
    to: normalizeSector(flow.to),
    amount: flow.amount,
    kind: flow.kind || "other",
    description: flow.description || ""
  });
  if (ledger.flows.length > 1200) ledger.flows.splice(0, ledger.flows.length - 1200);
}

export function closeAccountingPeriod(ledger, state) {
  if (!ledger) return { ok: true, status: "PASS", errors: [], warnings: [], summary: "회계 검증 없음" };
  const validation = validateAccountingIdentity(state, ledger.flows);
  ledger.lastValidation = validation;
  ledger.period += 1;
  return validation;
}

export function validateAccountingIdentity(state, flows) {
  const errors = [];
  const warnings = [];
  const periodFlows = flows.filter((flow) => flow.period === (state?.tick || 0));
  const byKind = sumByKind(periodFlows);
  const metrics = state?.metrics || {};
  const tolerance = Math.max(1, Object.values(byKind).reduce((a, b) => a + b, 0) * 0.005);

  compare("가계 소비 flow", byKind.trade, metrics.consumption, tolerance, warnings);
  compare("정부 세입 flow", byKind.tax, metrics.totalTaxCollected || metrics.taxCollected, tolerance, warnings);
  compare("정부 지출 flow", byKind.spending, metrics.governmentSpendingActual, tolerance, warnings);
  compare("기업 투자 flow", byKind.investment, metrics.investment, Math.max(tolerance, 5), warnings);

  const householdDebt = metrics.householdDebt || 0;
  const firmDebt = metrics.firmDebt || 0;
  if (householdDebt < 0 || firmDebt < 0) errors.push("민간 부채가 음수입니다.");
  if (!Number.isFinite(metrics.gdp || 0)) errors.push("GDP가 유효한 숫자가 아닙니다.");

  const status = errors.length ? "FAIL" : warnings.length ? "WARN" : "PASS";
  return {
    ok: errors.length === 0,
    status,
    errors,
    warnings,
    summary: status === "PASS" ? "주요 flow 회계가 허용오차 내에 있습니다." : [...errors, ...warnings].slice(0, 3).join(" / ")
  };
}

function normalizeSector(entry) {
  if (!entry) return "unknown";
  if (typeof entry === "string") return SECTOR_MAP[entry] || entry;
  return SECTOR_MAP[entry.type] || entry.sector || entry.type || "unknown";
}

function sumByKind(flows) {
  return flows.reduce((acc, flow) => {
    acc[flow.kind] = (acc[flow.kind] || 0) + flow.amount;
    return acc;
  }, {});
}

function compare(label, actual = 0, expected = 0, tolerance, warnings) {
  const a = Number(actual) || 0;
  const e = Number(expected) || 0;
  if (Math.abs(a - e) > tolerance) warnings.push(`${label} 차이 ${Math.abs(a - e).toFixed(1)}`);
}
