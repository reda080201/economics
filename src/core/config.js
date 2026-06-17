export const MAX_HISTORY = 160;
export const MAX_FLOWS = 20;
export const TARGET_INFLATION = 2.0;
export const TARGET_UNEMPLOYMENT = 5.6;
export const NEUTRAL_INTEREST_RATE = 3.0;
export const TICKS_PER_MONTH = 8;
export const MAX_PRICE_CHANGE_PER_TICK = 0.03;
export const MAX_WAGE_CHANGE_PER_TICK = 0.015;
export const HOUSEHOLD_DEBT_SERVICE_SCALE = 0.030;
export const FIRM_DEBT_SERVICE_SCALE = 0.026;
export const GOVERNMENT_DEBT_SERVICE_SCALE = 0.010;
export const STOCK_RETURN_LIMIT = 0.08 / TICKS_PER_MONTH;
export const HOUSING_RETURN_LIMIT = 0.04 / TICKS_PER_MONTH;
export const BOND_PRICE_RETURN_LIMIT = 0.05 / TICKS_PER_MONTH;
export const GOLD_RETURN_LIMIT = 0.06 / TICKS_PER_MONTH;
export const SILVER_RETURN_LIMIT = 0.10 / TICKS_PER_MONTH;

export const CALIBRATION = {
  sentimentWeight: 0.90,
  wealthEffectWeight: 0.72,
  creditChannelWeight: 0.68,
  housingChannelWeight: 0.82,
  stockChannelWeight: 0.70,
  fiscalMultiplierWeight: 0.92,
  externalShockWeight: 0.78,
  bankStressWeight: 0.58,
  behavioralBiasWeight: 0.72,
  priceStickiness: 0.88,
  wageStickiness: 0.90,
  hiringFriction: 1.08,
  investmentFriction: 1.12
};

export const POLICY_META = {
  interest: { target: "interestTarget", delayed: "interestDelayedTarget", effective: "interestEffective", delayMin: 5, delayMax: 10, speed: 0.025, tolerance: 0.00005 },
  tax: { target: "taxTarget", delayed: "taxDelayedTarget", effective: "taxEffective", delayMin: 4, delayMax: 8, speed: 0.025, tolerance: 0.00005 },
  corporateTax: { target: "corporateTaxTarget", delayed: "corporateTaxDelayedTarget", effective: "corporateTaxEffective", delayMin: 4, delayMax: 8, speed: 0.025, tolerance: 0.00005 },
  vat: { target: "vatTarget", delayed: "vatDelayedTarget", effective: "vatEffective", delayMin: 3, delayMax: 7, speed: 0.030, tolerance: 0.00005 },
  spending: { target: "spendingTarget", delayed: "spendingDelayedTarget", effective: "spendingEffective", delayMin: 2, delayMax: 5, speed: 0.025, tolerance: 0.5 },
  wage: { target: "wageTarget", delayed: "wageDelayedTarget", effective: "wageEffective", delayMin: 8, delayMax: 16, speed: 0.025, tolerance: 0.02 }
};
