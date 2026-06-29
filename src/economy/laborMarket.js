export function fireShareOfWorkers(context, share) {
  const { state, shuffle } = context;
  const employedConsumers = shuffle(state.consumers.filter((consumer) => consumer.employed));
  const fireCount = Math.floor(employedConsumers.length * share);
  for (let i = 0; i < fireCount; i += 1) {
    const consumer = employedConsumers[i];
    const producer = state.producers[consumer.employerId];
    if (producer) fireConsumer(context, producer, consumer);
  }
}

// 기업은 예상 수요, 재고, 현금, 금리를 보고 고용 목표를 조정한다.
export function updateLaborMarket(context) {
  const {
    state,
    TICKS_PER_MONTH,
    MAX_WAGE_CHANGE_PER_TICK,
    applyEquilibriumGravity,
    applyInertia,
    calculateUnemploymentRate,
    clamp,
    computeLaborResponseSignal,
    createInitialSentimentState,
    effectiveBaseWage,
    rand,
    safeNumber,
    shuffle,
    smoothValue
  } = context;
  const unemploymentRate = calculateUnemploymentRate() / 100;
  const availableWorkers = () => shuffle(state.consumers.filter((consumer) => !consumer.employed));
  const equilibriumGravity = applyEquilibriumGravity();
  const isMonthlyDecision = state.tick % TICKS_PER_MONTH === 0;
  const recoveryUnemployment = unemploymentRate > 0.075;
  const highUnemployment = unemploymentRate > 0.20;
  const severeUnemployment = unemploymentRate > 0.35;
  const veryTightLabor = unemploymentRate < 0.075;
  const sentiment = state.sentiment || createInitialSentimentState();

  state.producers.forEach((producer) => {
    // 진동 완화: 고용은 현재 틱 판매가 아니라 지연된 기대수요에 반응하므로 과잉 고용/해고가 줄어든다.
    const targetDemandSignal = producer.expectedDemand * state.shock.demandMultiplier * equilibriumGravity.demandAdjustment;
    producer.laggedDemandSignal = applyInertia(safeNumber(producer.laggedDemandSignal, targetDemandSignal), targetDemandSignal);
    const demandSignal = producer.laggedDemandSignal;
    const stockTarget = Math.max(8, producer.expectedDemand * 1.9);
    const inventoryRatio = producer.inventory / Math.max(1, stockTarget);
    const profitTrend = 0.72 * producer.profitTrend + 0.28 * producer.lastProfit;
    const profitHiringSignal = clamp(0.86 + profitTrend / 520, 0.58, 1.18);
    if (isMonthlyDecision) {
      producer.excessInventoryMonths = inventoryRatio > 2.05 ? (producer.excessInventoryMonths || 0) + 1 : Math.max(0, (producer.excessInventoryMonths || 0) - 1);
      producer.weakDemandMonths = producer.unitsSoldTick < producer.expectedDemand * 0.62 ? (producer.weakDemandMonths || 0) + 1 : Math.max(0, (producer.weakDemandMonths || 0) - 1);
      producer.negativeProfitMonths = producer.lastProfit < -45 ? (producer.negativeProfitMonths || 0) + 1 : Math.max(0, (producer.negativeProfitMonths || 0) - 1);
      producer.deepLossMonths = producer.lastProfit < -180 ? (producer.deepLossMonths || 0) + 1 : Math.max(0, (producer.deepLossMonths || 0) - 1);
    }
    const excessInventoryDrag = inventoryRatio > 1.45 ? clamp(1.35 / inventoryRatio, 0.70, 0.98) : 1.04;
    const lowInventoryBoost = inventoryRatio < 0.7 ? 1.12 : excessInventoryDrag;
    const outlookHiringSignal = clamp((producer.businessOutlook * 0.70 + safeNumber(producer.businessConfidence, sentiment.businessConfidence) * 0.30), 0.50, 1.18);
    const sentimentHiringDrag = clamp(1 - safeNumber(producer.hiringCaution, 0.25) * 0.18 - sentiment.recessionFear * 0.08 - sentiment.policyUncertainty * 0.05, 0.72, 1.04);
    const stressMemory = clamp(producer.stressMemory || producer.debtStress, 0, 1.5);
    const payrollNeed = producer.wageOffered * Math.max(1, producer.employees.length);
    if (producer.lastProfit > 0 && producer.cash > payrollNeed) {
      producer.hiringFreezeTicks = Math.max(0, safeNumber(producer.hiringFreezeTicks, 0) - 2);
      producer.financiallyStressed = producer.stressMemory > 1.30 && producer.cash < payrollNeed;
    }
    const debtHiringDrag = stressMemory > 1.25 ? clamp(0.78 - Math.max(0, stressMemory - 1.25) * 0.50, 0.55, 0.78) : clamp(1 - producer.debtStress * 0.10, 0.86, 1);
    producer.desiredProduction = clamp(
      applyInertia(safeNumber(producer.desiredProduction, demandSignal), demandSignal * lowInventoryBoost * outlookHiringSignal * sentimentHiringDrag * clamp(producer.activityDrag || 1, 0.35, 1.04)),
      0,
      producer.productionCapacity
    );

    // 차입비용이 높아지면 같은 수요에도 신규 고용과 확장이 보수적으로 변한다.
    const interestHiringDrag = clamp(1 - state.government.interestRate * 1.05 - (producer.debt / 12000) * state.government.interestRate, 0.72, 1.02);
    const cashCapacity = Math.floor(producer.cash / Math.max(1, producer.wageOffered * 1.95));
    const productiveLimit = Math.ceil(producer.productionCapacity / Math.max(0.6, producer.productivity));
    const partialHiringAllowed = producer.hiringFreezeTicks > 0 && producer.lastProfit > 0 && inventoryRatio < 0.95 && producer.cash > payrollNeed * 1.8;
    const hiringFrozen = producer.hiringFreezeTicks > 0 && !partialHiringAllowed;
    const minimumEmployees = clamp(Math.floor(producer.productionCapacity / 8), 1, 8);
    const demandBasedTarget = Math.round(demandSignal / Math.max(1.5, producer.productivity * 2.15));
    const naturalUnemploymentFriction = unemploymentRate < 0.04
      ? 0.72
      : unemploymentRate < 0.06
        ? 0.84
        : 1;
    const employmentAnchor = recoveryUnemployment && inventoryRatio < 2.15 && producer.lastProfit > -180
      ? clamp(Math.floor(producer.productionCapacity / 1.80), minimumEmployees, 22)
      : minimumEmployees;
    const recoveryHiringBoost = recoveryUnemployment && inventoryRatio < 1.9 && producer.cash > producer.wageOffered * Math.max(2, minimumEmployees) * 1.35
      ? (severeUnemployment ? 1.30 : highUnemployment ? 1.18 : 1.08)
      : 1;
    const dragAverage = (
      lowInventoryBoost * 0.24 +
      profitHiringSignal * 0.22 +
      outlookHiringSignal * 0.22 +
      interestHiringDrag * 0.16 +
      debtHiringDrag * 0.16
    );
    const responseLaborMultiplier = computeLaborResponseSignal(producer, unemploymentRate);
    const canFallBelowMinimum = producer.cash < producer.wageOffered * 0.45 || stressMemory > 1.60 || (producer.deepLossMonths || 0) >= 8;
    const lowerBoundEmployees = canFallBelowMinimum ? 0 : Math.min(employmentAnchor, producer.employees.length + (isMonthlyDecision ? 1 : 0));
    let rawTargetEmployees = clamp(
      Math.round(demandBasedTarget * clamp(dragAverage * responseLaborMultiplier * recoveryHiringBoost * naturalUnemploymentFriction, 0.62, 1.12)),
      lowerBoundEmployees,
      Math.min(34, cashCapacity, productiveLimit)
    );
    if (hiringFrozen) rawTargetEmployees = Math.min(rawTargetEmployees, producer.employees.length);
    if (!canFallBelowMinimum) rawTargetEmployees = Math.max(rawTargetEmployees, Math.min(employmentAnchor, Math.min(cashCapacity, productiveLimit)));
    producer.smoothedTargetEmployees = clamp(
      smoothValue(safeNumber(producer.smoothedTargetEmployees, producer.employees.length), rawTargetEmployees, isMonthlyDecision ? 0.30 : 0.08),
      lowerBoundEmployees,
      Math.min(34, cashCapacity, productiveLimit)
    );
    const targetEmployees = Math.round(producer.smoothedTargetEmployees);

    const laborTightness = clamp(1 - unemploymentRate, 0.1, 0.96);
    const profitSignal = clamp(profitTrend / 800, -0.10, 0.12);
    producer.wageInflationMemory = applyInertia(safeNumber(producer.wageInflationMemory, Math.max(0, state.smoothedInflation)), Math.max(0, state.smoothedInflation));
    // 임금-가격 나선 강화: 지속된 인플레이션 기억이 임금 요구로 남아 가격 압력에 다시 전달된다.
    const inflationWagePush = clamp((state.smoothedInflation / 100) * 0.4 + (producer.wageInflationMemory / 100) * 0.16, -0.006, 0.013);
    const desiredWage = effectiveBaseWage() * (0.88 + producer.productivity * 0.08 + laborTightness * 0.18 + profitSignal) * (1 + inflationWagePush);
    const anchoredWage = clamp(
      smoothValue(producer.wageOffered, desiredWage, 0.018),
      producer.wageOffered * (1 - MAX_WAGE_CHANGE_PER_TICK * 0.45),
      producer.wageOffered * (1 + MAX_WAGE_CHANGE_PER_TICK * 0.45)
    );
    producer.wageOffered = clamp(anchoredWage, effectiveBaseWage() * 0.62, effectiveBaseWage() * 1.78);

    const gap = targetEmployees - producer.employees.length;
    const shouldFireForInventory = (producer.excessInventoryMonths || 0) >= 5 && (producer.weakDemandMonths || 0) >= 3 && producer.lastProfit < -60;
    const shouldFireForLosses = (producer.negativeProfitMonths || 0) >= 3 && (producer.lastProfit < -140 || producer.profitTrend < -210);
    // 자연실업 앵커: 노동시장이 지나치게 타이트할 때는 대량해고 대신 소규모 자연 이직과 채용 마찰로 5~6% 균형에 천천히 접근한다.
    let naturalSeparation = false;
    if (isMonthlyDecision && unemploymentRate < 0.065 && producer.employees.length > minimumEmployees + 1) {
      const separationChance = unemploymentRate < 0.03 ? 0.46 : unemploymentRate < 0.045 ? 0.36 : 0.24;
      if (Math.random() < separationChance) {
        const workerId = producer.employees[producer.employees.length - 1];
        const worker = state.consumers[workerId];
        if (worker) {
          fireConsumer(context, producer, worker);
          producer.firingCooldownTicks = Math.max(producer.firingCooldownTicks || 0, TICKS_PER_MONTH);
          naturalSeparation = true;
        }
      }
    }
    const canHire = !naturalSeparation && gap > 0 && !hiringFrozen && producer.lastProfit > -95 && inventoryRatio < 2.60;
    let monthlyHireAllowance = isMonthlyDecision ? (severeUnemployment ? 4 : highUnemployment ? 3 : recoveryUnemployment ? 2 : 1) : (highUnemployment ? 1 : 0);
    if (partialHiringAllowed) monthlyHireAllowance = Math.max(monthlyHireAllowance, 1);
    if (unemploymentRate < 0.065) monthlyHireAllowance = Math.min(monthlyHireAllowance, unemploymentRate < 0.045 ? 0 : 1);
    if (veryTightLabor && producer.employees.length > minimumEmployees) monthlyHireAllowance = 0;

    if (canHire && monthlyHireAllowance > 0) {
      const workers = availableWorkers();
      const wageAttractiveness = clamp(producer.wageOffered / Math.max(1, state.metrics.averageWage || effectiveBaseWage()), 0.72, 1.35);
      const matchingNoise = rand(0.78, 1.08);
      const matchEfficiency = clamp((0.40 + unemploymentRate * 0.16 + producer.businessOutlook * 0.08 + (wageAttractiveness - 1) * 0.18 - (state.financialConditionIndex || 0) * 0.006 - safeNumber(producer.hiringCaution, 0.25) * 0.10 + safeNumber(state.sentiment?.businessConfidence, 0.8) * 0.04) * matchingNoise, 0.18, 0.76);
      const vacancies = Math.ceil(Math.min(gap, monthlyHireAllowance + producer.employees.length * 0.08 + rand(0, 1.2)));
      const rawHires = Math.min(vacancies, Math.floor(workers.length * matchEfficiency), Math.ceil(rand(1, 3)));
      producer.hireDecision = applyInertia(safeNumber(producer.hireDecision, 0), rawHires);
      const hires = Math.min(rawHires, Math.max(0, Math.floor(producer.hireDecision) || (producer.hireDecision > 0.74 ? 1 : 0)));
      for (let i = 0; i < hires; i += 1) {
        hireConsumer(context, producer, workers[i]);
      }
    } else if (isMonthlyDecision && (gap < 0 || shouldFireForInventory || shouldFireForLosses) && (producer.firingCooldownTicks || 0) <= 0) {
      const pressureFires = shouldFireForInventory || shouldFireForLosses ? 1 : 0;
      const stabilizerFireBrake = severeUnemployment ? 0.10 : highUnemployment ? 0.28 : recoveryUnemployment ? 0.15 : 1;
      const maxFires = 1;
      const fireableEmployees = canFallBelowMinimum ? producer.employees.length : Math.max(0, producer.employees.length - employmentAnchor);
      const rawFires = Math.min(Math.ceil((Math.abs(gap) + pressureFires) * stabilizerFireBrake), maxFires, fireableEmployees);
      producer.fireDecision = applyInertia(safeNumber(producer.fireDecision, 0), rawFires);
      const fires = Math.min(rawFires, Math.max(0, Math.floor(producer.fireDecision) || (producer.fireDecision > 0.78 ? 1 : 0)));
      for (let i = 0; i < fires; i += 1) {
        const employeeId = producer.employees[Math.floor(rand(0, producer.employees.length))];
        if (employeeId !== undefined) fireConsumer(context, producer, state.consumers[employeeId]);
      }
      if (fires > 0) producer.firingCooldownTicks = TICKS_PER_MONTH;
    }
    if (producer.hiringFreezeTicks > 0) {
      const thawSpeed = producer.lastProfit > 0 && producer.cash > payrollNeed ? 3 : 1;
      producer.hiringFreezeTicks = Math.max(0, producer.hiringFreezeTicks - thawSpeed);
    }
    producer.firingCooldownTicks = Math.max(0, safeNumber(producer.firingCooldownTicks, 0) - 1);

    // 자연 실업 앵커: 완전고용에 가까워지면 이직/구직 마찰이 조금 생겨 실업률이 0%로 붙지 않는다.
    if (isMonthlyDecision && veryTightLabor && producer.employees.length > minimumEmployees + 1 && Math.random() < (unemploymentRate < 0.04 ? 0.46 : 0.28)) {
      const employeeId = producer.employees[Math.floor(rand(0, producer.employees.length))];
      if (employeeId !== undefined) {
        fireConsumer(context, producer, state.consumers[employeeId]);
        state.consumers[employeeId].confidence = clamp(state.consumers[employeeId].confidence + 0.03, 0.18, 1.35);
      }
    }
  });

  if (isMonthlyDecision) {
    const currentUnemployment = calculateUnemploymentRate() / 100;
    if (currentUnemployment < 0.060) {
      const neededSeparations = Math.min(5, Math.ceil((0.060 - currentUnemployment) * state.consumers.length));
      const employedConsumers = shuffle(state.consumers.filter((consumer) => consumer.employed));
      let separated = 0;
      for (let i = 0; i < employedConsumers.length && separated < neededSeparations; i += 1) {
        const consumer = employedConsumers[i];
        const producer = state.producers[consumer.employerId];
        if (!producer) {
          consumer.employed = false;
          consumer.employerId = null;
          separated += 1;
          continue;
        }
        const minimumEmployees = clamp(Math.floor(producer.productionCapacity / 8), 1, 8);
        if (producer.employees.length <= minimumEmployees + 1) continue;
        fireConsumer(context, producer, consumer);
        consumer.confidence = clamp(consumer.confidence + 0.04, 0.18, 1.35);
        separated += 1;
      }
    }
  }
}

// 기업은 고용된 소비자에게 임금을 지급하고, 정부는 임금세를 걷는다.
export function payWages(context) {
  const { state, TICKS_PER_MONTH, clamp, recordFlow, unique } = context;
  state.producers.forEach((producer) => {
    const remainingEmployees = [];

    producer.employees.forEach((consumerId) => {
      const consumer = state.consumers[consumerId];
      if (!consumer || !consumer.employed) return;

      const grossWage = producer.wageOffered;
      if (producer.cash < grossWage * 0.85) {
        const minimumEmployees = clamp(Math.floor(producer.productionCapacity / 8), 1, 8);
        const criticalCash = producer.cash < grossWage * 0.25 && producer.debtStress > 1.15;
        const canFireForPayroll = state.tick % TICKS_PER_MONTH === 0 && (producer.firingCooldownTicks || 0) <= 0 && (producer.employees.length > minimumEmployees || criticalCash);
        if (canFireForPayroll) {
          fireConsumer(context, producer, consumer);
          producer.firingCooldownTicks = TICKS_PER_MONTH;
          return;
        }
        const bridgeLoan = Math.min(grossWage - producer.cash, grossWage * 0.75, 180);
        if (bridgeLoan > 0 && producer.debtStress < 1.15) {
          producer.cash += bridgeLoan;
          producer.debt += bridgeLoan * (1 + state.government.interestRate * 0.10);
        }
        if (producer.cash < grossWage * 0.35) return;
      }

      const paidWage = Math.min(grossWage, producer.cash);
      const tax = paidWage * state.government.householdIncomeTaxRate;
      const netWage = paidWage - tax;
      producer.cash -= paidWage;
      producer.wageCostTick += paidWage;
      consumer.cash += netWage;
      consumer.grossIncomeTick += paidWage;
      consumer.disposableIncomeTick += netWage;
      consumer.income += netWage;
      consumer.lastTax += tax;
      state.government.taxCollectedTick += tax;
      state.government.householdIncomeTaxCollectedTick += tax;
      state.metrics.householdIncomeTaxCollected += tax;
      state.metrics.totalTaxCollected += tax;
      state.metrics.wages += paidWage;

      recordFlow("producer", producer.id, "consumer", consumer.id, paidWage, "wage");
      if (tax > 0.1) recordFlow("consumer", consumer.id, "government", 0, tax, "tax");
      remainingEmployees.push(consumerId);
    });

    producer.employees = unique(remainingEmployees);
  });
}

export function hireConsumer(context, producer, consumer) {
  const { unique } = context;
  if (!consumer || consumer.employed) return;
  consumer.employed = true;
  consumer.employerId = producer.id;
  producer.employees.push(consumer.id);
  producer.employees = unique(producer.employees);
}

export function fireConsumer(context, producer, consumer) {
  if (!consumer) return;
  producer.employees = producer.employees.filter((id) => id !== consumer.id);
  consumer.employed = false;
  consumer.employerId = null;
}
