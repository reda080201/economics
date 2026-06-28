import { clamp, safeNumber } from "../core/mathUtils.js";

export function computeLiquidityScore(metrics = {}) {
  const z = (key) => safeNumber(metrics.series?.[key]?.zScore, 0);
  const change = (key, horizon) => safeNumber(metrics.series?.[key]?.changes?.[horizon], 0);
  const drawdown = (key) => Math.abs(Math.min(0, safeNumber(metrics.series?.[key]?.drawdown, 0)));

  const cashScore = clamp(
    50
      + z("fedNetLiquidity") * 12
      + z("m2") * 5
      + z("bankDeposits") * 4
      - z("tga") * 5
      - z("rrp") * 4
      - z("dollarIndex") * 3,
    0,
    100
  );

  const creditScore = clamp(
    68
      - z("highYieldOas") * 13
      - z("bbbOas") * 10
      - Math.max(0, change("highYieldOas", "m3")) * 140
      - Math.max(0, change("bbbOas", "m3")) * 120,
    0,
    100
  );

  const assetScore = clamp(
    52
      + z("sp500") * 8
      + z("housePrice") * 4
      + change("sp500", "m3") * 130
      + change("housePrice", "m6") * 70
      - drawdown("sp500") * 115
      - Math.max(0, z("dollarIndex")) * 5,
    0,
    100
  );

  const cashParkingPressure = clamp(
    35
      + z("moneyMarketFunds") * 12
      + z("rrp") * 10
      + z("tga") * 6
      - z("sp500") * 4
      + Math.max(0, change("moneyMarketFunds", "m3")) * 160,
    0,
    100
  );

  const drainPressure = clamp(
    34
      - z("fedNetLiquidity") * 12
      + z("tga") * 7
      + z("rrp") * 6
      + z("dollarIndex") * 8
      - change("fedNetLiquidity", "m3") * 180,
    0,
    100
  );

  const stressPressure = clamp(
    28
      + z("highYieldOas") * 13
      + z("bbbOas") * 10
      + Math.max(0, change("highYieldOas", "m1")) * 180
      + Math.max(0, change("bbbOas", "m1")) * 160
      + drawdown("sp500") * 95,
    0,
    100
  );

  const totalScore = clamp(cashScore * 0.40 + creditScore * 0.35 + assetScore * 0.25, 0, 100);

  return {
    totalScore,
    cashScore,
    creditScore,
    assetScore,
    cashParkingPressure,
    drainPressure,
    stressPressure
  };
}
