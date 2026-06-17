export function createSectorState() {
  return {
    households: { deposits: 0, loans: 0, wageIncome: 0, transferIncome: 0, consumption: 0, taxPaid: 0, wealth: 0 },
    firms: { deposits: 0, loans: 0, revenue: 0, wageBill: 0, investment: 0, taxPaid: 0, inventory: 0, profit: 0 },
    government: { taxRevenue: 0, spending: 0, transfers: 0, deficit: 0, debt: 0 },
    banks: { deposits: 0, loans: 0, reserves: 0, interestIncome: 0, defaults: 0 },
    centralBank: { policyRate: 0, baseMoney: 0 },
    foreignSector: { exports: 0, imports: 0, exchangeRatePressure: 0, capitalFlow: 0 },
    assetMarket: { stockValue: 0, realEstateValue: 0, bondValue: 0, safeAssetValue: 0 }
  };
}

export function syncSectorStateFromSimulation(target, state) {
  if (!target || !state) return createSectorState();
  const consumers = state.consumers || [];
  const producers = state.producers || [];
  const metrics = state.metrics || {};
  const government = state.government || {};
  const financial = state.financialMarket || {};
  const external = state.external || {};
  const asset = state.assetMarket || {};
  const realEstate = state.realEstate || {};

  target.households.deposits = sumBy(consumers, "cash");
  target.households.loans = sumBy(consumers, "debt") + sumBy(consumers, "mortgageDebt");
  target.households.wealth = sumBy(consumers, "assetWealth") + sumBy(consumers, "housingWealth");
  target.households.wageIncome = metrics.wages || 0;
  target.households.transferIncome = metrics.governmentTransfers || 0;
  target.households.consumption = metrics.consumption || 0;
  target.households.taxPaid = metrics.householdIncomeTaxCollected || 0;

  target.firms.deposits = sumBy(producers, "cash");
  target.firms.loans = sumBy(producers, "debt") + sumBy(producers, "propertyDebt");
  target.firms.revenue = safeNumber(metrics.consumption, 0) + safeNumber(metrics.governmentProcurement, 0) + safeNumber(metrics.exportSales, 0);
  target.firms.wageBill = metrics.wages || 0;
  target.firms.investment = metrics.investment || 0;
  target.firms.taxPaid = metrics.corporateTaxCollected || 0;
  target.firms.inventory = metrics.totalInventory || 0;
  target.firms.profit = metrics.averageFirmProfit || 0;

  target.government.taxRevenue = metrics.totalTaxCollected || metrics.taxCollected || 0;
  target.government.spending = metrics.governmentSpendingActual || 0;
  target.government.transfers = metrics.governmentTransfers || 0;
  target.government.deficit = -(metrics.governmentBalance || 0);
  target.government.debt = metrics.governmentDebt || government.debt || 0;

  target.banks.deposits = target.households.deposits + target.firms.deposits;
  target.banks.loans = target.households.loans + target.firms.loans;
  target.banks.reserves = (financial.bankHealthIndex || 100) * 10;
  target.banks.interestIncome = metrics.bankNetInterestMargin || 0;
  target.banks.defaults = metrics.nonPerformingLoanRatio || 0;

  target.centralBank.policyRate = metrics.interestRatePercent || 0;
  target.centralBank.baseMoney = target.banks.reserves + target.banks.deposits * 0.04;

  target.foreignSector.exports = metrics.exportSales || 0;
  target.foreignSector.imports = safeNumber(metrics.importCost, safeNumber(metrics.imports, 0));
  target.foreignSector.exchangeRatePressure = external.exchangeRateIndex || metrics.exchangeRateIndex || 100;
  target.foreignSector.capitalFlow = metrics.foreignCapitalFlow || 0;

  target.assetMarket.stockValue = asset.stockIndexPoints || metrics.stockIndexPoints || 2500;
  target.assetMarket.realEstateValue = realEstate.collateralValueIndex || metrics.collateralValueIndex || 100;
  target.assetMarket.bondValue = financial.longBondPriceIndex || metrics.longBondPriceIndex || 100;
  target.assetMarket.safeAssetValue = (financial.goldIndex || 100) + (financial.silverIndex || 100);
  return target;
}

function sumBy(items, key) {
  return items.reduce((total, item) => total + safeNumber(item?.[key], 0), 0);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
