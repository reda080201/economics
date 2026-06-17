export function calculateConsumption(input, parameters) {
  const p = parameters.consumption;
  return (
    p.incomeWeight * n(input.disposableIncome) +
    p.wealthWeight * n(input.wealth) +
    p.confidenceWeight * n(input.confidence) +
    p.rateWeight * n(input.interestRate) +
    p.debtWeight * n(input.debtBurden)
  );
}

export function calculateInvestment(input, parameters) {
  const p = parameters.investment;
  return (
    p.demandWeight * n(input.expectedDemand) +
    p.profitWeight * n(input.profit) +
    p.capacityWeight * n(input.capacityUtilization) +
    p.rateWeight * n(input.interestRate) +
    p.uncertaintyWeight * n(input.uncertainty)
  );
}

export function calculateInflationPressure(input, parameters) {
  const p = parameters.inflation;
  return (
    p.demandGapWeight * n(input.demandGap) +
    p.wagePressureWeight * n(input.wagePressure) +
    p.importPriceShockWeight * n(input.importPriceShock) +
    p.expectationWeight * n(input.inflationExpectation)
  );
}

export function calculateUnemploymentChange(input, parameters) {
  const p = parameters.unemployment;
  return (
    p.outputGapWeight * n(input.outputGap) +
    p.wageRigidityWeight * n(input.wageRigidity) +
    p.firmStressWeight * n(input.firmStress) +
    p.hiringMomentumWeight * n(input.hiringMomentum)
  );
}

function n(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
