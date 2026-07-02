import { TARGET_INFLATION } from "../core/config.js";
import { clamp, round, safeNumber } from "../core/mathUtils.js";

function money(value, digits = 0) {
  const safe = safeNumber(value, 0);
  return `₩${safe.toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  })}`;
}

function percent(value, digits = 1) {
  return `${safeNumber(value, 0).toFixed(digits)}%`;
}

function formatSigned(value, digits = 1) {
  const safe = safeNumber(value, 0);
  const sign = safe > 0 ? "+" : "";
  return `${sign}${safe.toFixed(digits)}`;
}

function signedPercent(value) {
  const safe = safeNumber(value, 0);
  const sign = safe > 0 ? "+" : "";
  return `${sign}${safe.toFixed(2)}%`;
}

export function runKeynesianModel(inputs, economy) {
      const mpc = clamp(inputs.mpc, 0.05, 0.95);
      const spendingMultiplier = 1 / (1 - mpc);
      const taxMultiplier = -mpc / (1 - mpc);
      const incomeTaxEffect = inputs.deltaIncomeTax * taxMultiplier * Math.max(12, economy.consumption * 0.012);
      const corporateTaxDrag = -Math.max(0, inputs.deltaCorporateTax) * Math.max(4, economy.investment * 0.018);
      const spendingEffect = inputs.deltaG * spendingMultiplier;
      const investmentEffect = inputs.autonomousInvestment + corporateTaxDrag;
      const gdpChange = spendingEffect + incomeTaxEffect + investmentEffect + inputs.nx;
      const fiscalDemandEffect = Math.abs(inputs.deltaG) < 1
        ? "정부지출 변화가 작아 수요 효과는 제한적입니다."
        : spendingMultiplier >= 2.8
          ? "재정지출의 수요 효과가 강합니다."
          : "재정지출의 수요 효과가 약합니다.";
      const creditLine = economy.creditSupplyIndex < 75 || economy.creditSpread > 5.5
        ? " 다만 신용여건이 긴축적이면 재정승수는 일부 약해질 수 있습니다."
        : economy.bankHealthIndex > 85
          ? " 은행 건전성이 양호하면 수요 부양이 민간 신용경로로 더 잘 전달됩니다."
          : "";
      return {
        title: "케인즈 승수 모형",
        summary: `지출승수 ${round(spendingMultiplier, 2)} · 조세승수 ${round(taxMultiplier, 2)} · 총수요 충격 ${money(gdpChange)}`,
        policyLine: fiscalDemandEffect,
        interpretation: `소득세는 가처분소득을 통해 소비를 낮추고, 법인세는 순이익과 투자 여력을 통해 수요를 약화시킵니다.${creditLine}`,
        chart: {
          labels: ["정부지출", "소득세", "법인세/투자", "순수출", "합계"],
          series: [spendingEffect, incomeTaxEffect, investmentEffect, inputs.nx, gdpChange],
          reference: [0, 0, 0, 0, 0]
        }
      };
    }

export function runISLMModel(inputs, economy) {
      const rateDrag = inputs.interestRate * inputs.investmentSensitivity * 0.55;
      const fiscalBoost = inputs.fiscalStance / Math.max(100, economy.gdp || 100) * 28;
      const demandBoost = (inputs.demandStrength - 1) * 22;
      const outputPressure = clamp(demandBoost + fiscalBoost - rateDrag, -40, 40);
      const interestPressure = clamp(inputs.moneyTightness * 10 + inputs.demandStrength * 2 - fiscalBoost * 0.08, -10, 24);
      const zone = outputPressure > 8 && interestPressure < 14 ? "확장 압력"
        : outputPressure < -8 && interestPressure > 10 ? "유동성 스트레스"
          : outputPressure < -5 ? "긴축 압력"
            : outputPressure > 12 ? "과열" : "균형 근처";
      return {
        title: "IS-LM",
        summary: `산출 압력 ${formatSigned(outputPressure, 1)} · ${zone}`,
        interpretation: `금리가 높으면 투자 수요가 줄고 긴축적 금융 여건이 금리 압력을 높입니다.`,
        chart: {
          labels: ["수요", "재정", "금리 부담", "산출", "금리 압력"],
          series: [demandBoost, fiscalBoost, -rateDrag, outputPressure, interestPressure],
          reference: [0, 0, 0, 0, 0]
        }
      };
    }

export function runADASModel(inputs) {
      const outputGap = clamp((inputs.demandPressure - inputs.supplyCapacity) * 100 / Math.max(1, inputs.supplyCapacity), -60, 60);
      const inflationPressure = clamp((inputs.demandPressure - 1) * 3 + (inputs.wagePressure - 1) * 4 + inputs.expectedInflation * 0.35 - (inputs.productivity - 1) * 2, -8, 12);
      const costPush = inputs.wagePressure > 1.08 || inputs.productivity < 0.9;
      const demandPull = inputs.demandPressure > inputs.supplyCapacity;
      const diagnosis = demandPull && costPush ? "스태그플레이션 위험"
        : demandPull ? "수요견인 압력"
          : costPush ? "비용상승 압력" : "AD-AS 균형";
      return {
        title: "AD-AS",
        summary: `산출갭 ${formatSigned(outputGap, 1)}% · ${diagnosis}`,
        interpretation: `수요가 공급을 넘으면 실질 산출보다 물가 압력이 먼저 커집니다.`,
        chart: {
          labels: ["수요", "공급", "임금", "기대물가", "물가 압력"],
          series: [inputs.demandPressure, inputs.supplyCapacity, inputs.wagePressure, inputs.expectedInflation / 2, inflationPressure],
          reference: [1, 1, 1, TARGET_INFLATION / 2, 0]
        }
      };
    }

export function runPhillipsModel(inputs, economy) {
      const unemploymentGap = inputs.unemployment - inputs.naturalUnemployment;
      const predictedInflation = inputs.expectedInflation - inputs.beta * unemploymentGap + inputs.supplyShock;
      const comparison = predictedInflation > economy.inflation + 0.5 ? "현재 물가보다 높습니다"
        : predictedInflation < economy.inflation - 0.5 ? "현재 물가보다 낮습니다" : "현재 물가와 비슷합니다";
      const diagnosis = unemploymentGap < -1 ? "과열 압력" : unemploymentGap > 2 ? "노동시장 여유" : "자연실업률 근처";
      const slackLine = unemploymentGap > 0.6
        ? "노동시장 여유가 물가를 낮추는 방향입니다."
        : unemploymentGap < -0.6
          ? "노동시장 과열이 물가를 올리는 방향입니다."
          : "노동시장은 물가에 거의 중립적입니다.";
      const taxWageLine = economy.householdIncomeTaxRate > 25
        ? "소득세 부담이 높으면 실질임금 체감과 임금 요구가 달라질 수 있습니다."
        : economy.bankingCrisisRiskScore > 0.55
          ? "은행 스트레스가 높아 현재 고용이 안정적이어도 실업이 뒤늦게 오를 수 있습니다."
          : slackLine;
      const labels = [];
      const series = [];
      for (let u = 2; u <= 14; u += 2) {
        labels.push(`${u}%`);
        series.push(inputs.expectedInflation - inputs.beta * (u - inputs.naturalUnemployment) + inputs.supplyShock);
      }
      return {
        title: "필립스 곡선",
        summary: `실업갭 ${formatSigned(unemploymentGap, 1)}%p · 예측 물가 ${signedPercent(predictedInflation)} · ${diagnosis}`,
        policyLine: taxWageLine,
        interpretation: `예측치는 ${comparison}. 실업률이 자연실업률보다 낮으면 임금 및 가격 상승 압력이 발생할 수 있습니다.`,
        chart: {
          labels,
          series,
          reference: labels.map(() => economy.inflation)
        }
      };
    }

export function runTaylorRuleModel(inputs, economy) {
      const inflationGap = inputs.currentInflation - inputs.targetInflation;
      const targetRate = inputs.neutralRate + inputs.inflationWeight * inflationGap + inputs.outputWeight * inputs.outputGap;
      const gap = economy.interestRate - targetRate;
      const stance = gap < -0.75 ? "과도한 완화" : gap > 0.75 ? "과도한 긴축" : "중립 근처";
      let rateLine = gap > 0.75
        ? "테일러 준칙 기준으로 현재 금리는 권장 수준보다 높아 경기 안정 관점에서는 긴축적입니다."
        : gap < -0.75
          ? "테일러 준칙 기준으로 현재 금리는 권장 수준보다 낮아 물가 안정 관점에서는 완화적입니다."
          : "테일러 준칙 기준으로 현재 금리는 권장 수준에 가깝습니다.";
      if (targetRate - economy.interestRate > 2 && (economy.debtToGdpRatio > 4 || economy.averageFirmDSCR < 1.4 || economy.averageHouseholdDebtBurden > 15)) {
        rateLine += " 다만 권고 금리가 크게 높으면 부채상환 부담이 빠르게 커질 수 있습니다.";
      }
      if (targetRate - economy.interestRate > 2 && economy.bankingCrisisRiskScore > 0.45) {
        rateLine += " 은행 스트레스가 있는 상황에서는 추가 금리 인상이 신용공급을 더 위축시킬 수 있습니다.";
      }
      return {
        title: "테일러 준칙",
        summary: `현재 유효 금리 ${percent(economy.interestRate, 2)} · 권고 금리 ${percent(targetRate, 2)} · ${stance}`,
        policyLine: rateLine,
        interpretation: `물가갭 ${formatSigned(inflationGap, 1)}%p와 산출갭 ${formatSigned(inputs.outputGap, 1)}%p를 기준으로 단순 적정 금리를 추정합니다.`,
        chart: {
          labels: ["현재 금리", "권고 금리", "중립 금리"],
          series: [economy.interestRate, targetRate, inputs.neutralRate],
          reference: [inputs.neutralRate, inputs.neutralRate, inputs.neutralRate]
        }
      };
    }

export function runSolowModel(inputs) {
      const alpha = clamp(inputs.alpha, 0.05, 0.95);
      const output = inputs.productivity * Math.pow(Math.max(1, inputs.capital), alpha) * Math.pow(Math.max(1, inputs.labor), 1 - alpha);
      const steadyCapitalHint = inputs.savingsRate / Math.max(0.01, inputs.depreciation);
      const diagnosis = inputs.productivity > 1.2 ? "생산성이 성장을 뒷받침"
        : inputs.savingsRate > inputs.depreciation ? "자본축적이 성장을 뒷받침" : "자본이 장기적으로 약해질 수 있음";
      const labels = [];
      const series = [];
      for (let k = 0.5; k <= 1.5; k += 0.25) {
        labels.push(`${round(k * 100, 0)}% K`);
        series.push(inputs.productivity * Math.pow(Math.max(1, inputs.capital * k), alpha) * Math.pow(Math.max(1, inputs.labor), 1 - alpha));
      }
      return {
        title: "솔로우 성장모형",
        summary: `잠재 산출 ${money(output)} · ${diagnosis}`,
        interpretation: `자본, 노동, 생산성이 장기 잠재 산출을 결정합니다.`,
        chart: {
          labels,
          series,
          reference: labels.map(() => output),
          extra: steadyCapitalHint
        }
      };
    }
