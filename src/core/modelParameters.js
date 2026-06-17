export const defaultModelParameters = {
  consumption: {
    incomeWeight: 0.58,
    wealthWeight: 0.025,
    confidenceWeight: 80,
    rateWeight: -18,
    debtWeight: -0.15
  },
  investment: {
    demandWeight: 0.18,
    profitWeight: 0.22,
    capacityWeight: 90,
    rateWeight: -24,
    uncertaintyWeight: -70
  },
  inflation: {
    demandGapWeight: 0.35,
    wagePressureWeight: 0.25,
    importPriceShockWeight: 0.25,
    expectationWeight: 0.15
  },
  unemployment: {
    outputGapWeight: -0.30,
    wageRigidityWeight: 0.22,
    firmStressWeight: 0.28,
    hiringMomentumWeight: -0.20
  }
};

export function cloneModelParameters(parameters = defaultModelParameters) {
  return JSON.parse(JSON.stringify(parameters));
}
