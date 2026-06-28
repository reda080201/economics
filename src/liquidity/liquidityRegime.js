import { safeNumber } from "../core/mathUtils.js";

export function classifyLiquidityRegime({ metrics = {}, score = {} } = {}) {
  const series = metrics.series || {};
  const z = (key) => safeNumber(series[key]?.zScore, 0);
  const change = (key, horizon) => safeNumber(series[key]?.changes?.[horizon], 0);
  const drawdown = Math.abs(Math.min(0, safeNumber(series.sp500?.drawdown, 0)));
  const totalScore = safeNumber(score.totalScore, 50);

  if (
    safeNumber(score.stressPressure, 0) >= 68
    || z("highYieldOas") > 1.1
    || z("bbbOas") > 1.1
    || change("highYieldOas", "m3") > 0.18
  ) {
    return {
      regime: "Credit Stress",
      label: "신용 스트레스",
      tone: "위험",
      explanation: "회사채 스프레드 확대와 위험자산 약세가 동시에 관측되어 신용 유동성이 위축되는 국면입니다."
    };
  }

  if (
    safeNumber(score.drainPressure, 0) >= 66
    || (z("fedNetLiquidity") < -0.8 && (z("tga") > 0.7 || z("rrp") > 0.7))
    || (change("fedNetLiquidity", "m3") < -0.08 && z("dollarIndex") > 0.6)
  ) {
    return {
      regime: "Liquidity Drain",
      label: "유동성 흡수",
      tone: "주의",
      explanation: "Fed 순유동성이 줄고 재무부 계정·역레포·달러 강세가 유동성을 흡수하는 신호로 나타납니다."
    };
  }

  if (
    safeNumber(score.cashParkingPressure, 0) >= 68
    || (z("moneyMarketFunds") > 0.9 && (z("rrp") > 0.5 || drawdown > 0.06))
  ) {
    return {
      regime: "Cash Parking",
      label: "현금 대기",
      tone: "주의",
      explanation: "머니마켓펀드·역레포 등 안전한 현금성 자산에 자금이 머무르는 신호가 강합니다."
    };
  }

  if (
    totalScore >= 63
    && safeNumber(score.creditScore, 0) >= 58
    && change("sp500", "m3") > 0.02
    && z("highYieldOas") < 0.7
  ) {
    return {
      regime: "Risk-On",
      label: "위험선호",
      tone: "안정",
      explanation: "신용 스프레드가 안정적이고 주식·현금 유동성 신호가 함께 개선되는 국면입니다."
    };
  }

  return {
    regime: "Mixed / Unclear",
    label: "혼재",
    tone: "중립",
    explanation: "현금, 신용, 자산시장 신호가 한 방향으로 충분히 정렬되지 않았습니다."
  };
}
