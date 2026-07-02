// Canvas renderer for the agent network. This module reads simulation state but
// does not mutate economic variables.
export function safeRenderSimulation(context, timestamp) {
  try {
    renderSimulation(context, timestamp);
  } catch (error) {
    context.callbacks?.recordRuntimeError?.(error, "렌더링 오류", "캔버스 렌더링 오류를 건너뛰었습니다.");
  }
}

export function renderSimulation(context, timestamp) {
  const { state, els, windowRef, helpers = {} } = context;
  helpers.syncUiPerformanceState?.();
  if (state.ui) state.ui.lastCanvasRenderTick = state.tick;
  const canvas = els.simCanvas;
  const rect = canvas.getBoundingClientRect();
  const ratio = windowRef.devicePixelRatio || 1;
  const width = Math.max(320, rect.width);
  const height = Math.max(260, rect.height);

  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (state.ui) state.ui.canvasPositionCacheKey = "";
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  drawCanvasBackdrop(context, ctx, width, height);
  const positionCacheKey = helpers.getCanvasPositionCacheKey(width, height, ratio);
  if (!state.ui || state.ui.canvasPositionCacheKey !== positionCacheKey) {
    computeNodePositions(context, width, height);
    if (state.ui) state.ui.canvasPositionCacheKey = positionCacheKey;
  }
  drawFlows(context, ctx, timestamp);
  drawGovernment(context, ctx);
  drawProducers(context, ctx);
  drawConsumers(context, ctx);
  drawCanvasLabels(context, ctx, width, height);
}

export function handleCanvasClick(context, event) {
  const { state, els, windowRef, callbacks = {} } = context;
  const rect = els.simCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  state.selected = findAgentAtPoint(context, x, y);
  callbacks.updateInspector?.();
  safeRenderSimulation(context, windowRef.performance.now());
}

export function handleCanvasHover(context, event) {
  const { state, els, windowRef } = context;
  const rect = els.simCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  state.hovered = findAgentAtPoint(context, x, y);

  if (state.hovered) {
    showCanvasTooltip(context, event.clientX - rect.left, event.clientY - rect.top, getAgentTooltip(context, state.hovered));
  } else {
    hideCanvasTooltip(context);
  }
  safeRenderSimulation(context, windowRef.performance.now());
}

export function hideCanvasTooltip(context) {
  context.els.canvasTooltip.classList.remove("visible");
}

function drawCanvasBackdrop(context, ctx, width, height) {
  const { roundedRect } = context.helpers;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(255, 250, 240, 0.72)");
  gradient.addColorStop(1, "rgba(231, 242, 228, 0.78)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = "rgba(107, 181, 142, 0.10)";
  roundedRect(ctx, 14, 86, width * 0.48, height - 114, 18);
  ctx.fill();
  ctx.fillStyle = "rgba(64, 124, 168, 0.10)";
  roundedRect(ctx, width * 0.58, 86, width * 0.39, height - 114, 18);
  ctx.fill();
  ctx.fillStyle = "rgba(216, 137, 49, 0.12)";
  roundedRect(ctx, width * 0.38, 16, width * 0.24, 70, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(22, 48, 46, 0.10)";
  ctx.lineWidth = 1;
  roundedRect(ctx, 14, 86, width * 0.48, height - 114, 18);
  ctx.stroke();
  roundedRect(ctx, width * 0.58, 86, width * 0.39, height - 114, 18);
  ctx.stroke();
  roundedRect(ctx, width * 0.38, 16, width * 0.24, 70, 20);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#16302e";
  ctx.font = "900 34px Pretendard, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("가계", 34, height - 52);
  ctx.textAlign = "right";
  ctx.fillText("기업", width - 34, height - 52);
  ctx.textAlign = "center";
  ctx.fillText("정부", width / 2, 72);
  ctx.restore();
}

function computeNodePositions(context, width, height) {
  const { state, helpers = {} } = context;
  const { clamp } = helpers;
  state.positions.consumers = [];
  state.positions.producers = [];
  state.positions.government = { x: width * 0.50, y: 54, r: 28 };

  const consumerAreaWidth = width * 0.47;
  const consumerTop = 110;
  const consumerBottom = height - 28;
  const consumerRows = Math.max(2, Math.floor((consumerBottom - consumerTop) / 24));
  const consumerCols = Math.max(1, Math.ceil(state.consumers.length / consumerRows));
  const consumerSpacingX = Math.min(24, (consumerAreaWidth - 42) / Math.max(1, consumerCols));
  const consumerSpacingY = Math.min(24, (consumerBottom - consumerTop) / Math.max(1, consumerRows - 1));

  state.consumers.forEach((consumer, index) => {
    const col = Math.floor(index / consumerRows);
    const row = index % consumerRows;
    state.positions.consumers[consumer.id] = {
      x: 30 + col * consumerSpacingX + (row % 2) * 3,
      y: consumerTop + row * consumerSpacingY,
      r: clamp(4.3 + consumer.cash / 700, 4.5, 8.2)
    };
  });

  const producerCols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(state.producers.length))));
  const producerRows = Math.ceil(state.producers.length / producerCols);
  const startX = width * 0.62;
  const startY = 128;
  const areaW = width * 0.34;
  const areaH = height - 166;
  const gapX = areaW / Math.max(1, producerCols);
  const gapY = areaH / Math.max(1, producerRows);

  state.producers.forEach((producer, index) => {
    const col = index % producerCols;
    const row = Math.floor(index / producerCols);
    state.positions.producers[producer.id] = {
      x: startX + col * gapX + gapX * 0.5 + producer.layoutJitterX,
      y: startY + row * gapY + gapY * 0.45 + producer.layoutJitterY,
      w: clamp(54 + producer.productionCapacity * 0.6, 58, 94),
      h: 38
    };
  });
}

function drawGovernment(context, ctx) {
  const { state, helpers = {} } = context;
  const { compactMoney, roundedRect } = helpers;
  const gov = state.positions.government;
  const active = (state.selected && state.selected.type === "government") || (state.hovered && state.hovered.type === "government");
  const scale = state.selected && state.selected.type === "government" ? 1.2 : active ? 1.08 : 1;
  const w = 116 * scale;
  const h = 54 * scale;
  ctx.save();
  ctx.shadowColor = active ? "rgba(216, 137, 49, 0.48)" : "rgba(216, 137, 49, 0.28)";
  ctx.shadowBlur = state.selected && state.selected.type === "government" ? 32 : active ? 24 : 14;
  ctx.fillStyle = "#d88931";
  roundedRect(ctx, gov.x - w / 2, gov.y - h / 2, w, h, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (active) {
    ctx.strokeStyle = "#fff4c8";
    ctx.lineWidth = scale > 1.1 ? 4 : 3;
    roundedRect(ctx, gov.x - w / 2, gov.y - h / 2, w, h, 18);
    ctx.stroke();
  }
  ctx.fillStyle = "#fffaf0";
  ctx.font = "800 13px Pretendard, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("정부", gov.x, gov.y - 2);
  ctx.font = "700 10px Pretendard, sans-serif";
  ctx.fillText(`수지 ${compactMoney(state.government.balance || 0)}`, gov.x, gov.y + 15);
  ctx.restore();
}

function drawProducers(context, ctx) {
  const { state, helpers = {} } = context;
  const { clamp, isLargeEconomyMode, money, roundedRect } = helpers;
  const maxRenderedProducers = isLargeEconomyMode() ? 36 : state.config.performanceMode === "light" ? 28 : 80;
  const step = Math.max(1, Math.ceil(state.producers.length / maxRenderedProducers));
  state.producers.forEach((producer) => {
    const pos = state.positions.producers[producer.id];
    if (!pos) return;

    const inventoryPressure = clamp(producer.inventory / Math.max(1, producer.expectedDemand * 2), 0, 2);
    const fill = inventoryPressure < 0.7 ? "#c85f32" : inventoryPressure > 1.45 ? "#407ca8" : "#247173";
    const selected = state.selected && state.selected.type === "producer" && state.selected.id === producer.id;
    const hovered = state.hovered && state.hovered.type === "producer" && state.hovered.id === producer.id;
    if (!selected && !hovered && producer.id % step !== 0) return;

    const producerWidth = clamp(54 + producer.productionCapacity * 0.6, 58, 94);
    const producerHeight = 38;
    const scale = selected ? 1.2 : hovered ? 1.08 : 1;
    ctx.save();
    ctx.shadowColor = selected || hovered ? "rgba(200, 95, 50, 0.38)" : "rgba(22, 48, 46, 0.18)";
    ctx.shadowBlur = selected ? 28 : hovered ? 20 : 10;
    ctx.fillStyle = fill;
    roundedRect(ctx, pos.x - (producerWidth * scale) / 2, pos.y - (producerHeight * scale) / 2, producerWidth * scale, producerHeight * scale, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = selected || hovered ? "#fff4c8" : "rgba(255, 250, 240, 0.42)";
    ctx.lineWidth = selected ? 4 : hovered ? 3 : 1.5;
    roundedRect(ctx, pos.x - (producerWidth * scale) / 2, pos.y - (producerHeight * scale) / 2, producerWidth * scale, producerHeight * scale, 10);
    ctx.stroke();
    ctx.fillStyle = "#fffaf0";
    ctx.font = "800 11px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`기업 ${producer.id + 1}`, pos.x, pos.y - 5);
    ctx.font = "700 9px Pretendard, sans-serif";
    ctx.fillText(`${money(producer.price, 1)} · ${producer.employees.length}명`, pos.x, pos.y + 10);
    ctx.restore();
  });
}

function drawConsumers(context, ctx) {
  const { state, helpers = {} } = context;
  const { clamp, isLargeEconomyMode } = helpers;
  const maxRenderedConsumers = isLargeEconomyMode() ? 48 : state.config.performanceMode === "light" ? 36 : 64;
  const step = Math.max(1, Math.ceil(state.consumers.length / maxRenderedConsumers));
  state.consumers.forEach((consumer) => {
    const pos = state.positions.consumers[consumer.id];
    if (!pos) return;

    const selected = state.selected && state.selected.type === "consumer" && state.selected.id === consumer.id;
    const hovered = state.hovered && state.hovered.type === "consumer" && state.hovered.id === consumer.id;
    if (!selected && !hovered && consumer.id % step !== 0) return;
    const baseRadius = clamp(4.3 + consumer.cash / 700, 4.5, 8.2);
    const radius = selected ? baseRadius * 1.2 + 3 : hovered ? baseRadius * 1.08 + 2 : baseRadius;
    ctx.save();
    if (selected || hovered) {
      ctx.shadowColor = selected ? "rgba(255, 244, 200, 0.72)" : "rgba(216, 137, 49, 0.42)";
      ctx.shadowBlur = selected ? 18 : 12;
    }
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = consumer.employed ? "#6bb58e" : "#c85f32";
    ctx.globalAlpha = clamp(consumer.confidence, 0.38, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = selected || hovered ? "#fff4c8" : "rgba(22, 48, 46, 0.18)";
    ctx.lineWidth = selected ? 4 : hovered ? 3 : 1;
    ctx.stroke();
    ctx.restore();
  });
}

function drawFlows(context, ctx, timestamp) {
  const { state, helpers = {} } = context;
  const { clamp, isLargeEconomyMode, quadraticPoint } = helpers;
  state.flows = state.flows.filter((flow) => timestamp - flow.born < flow.life);

  const maxRenderedFlows = isLargeEconomyMode() ? 8 : state.config.performanceMode === "light" ? 6 : 20;
  [...state.flows].sort((a, b) => b.amount - a.amount).slice(0, maxRenderedFlows).forEach((flow) => {
    const from = getNodePosition(context, flow.fromType, flow.fromId);
    const to = getNodePosition(context, flow.toType, flow.toId);
    if (!from || !to) return;

    const age = (timestamp - flow.born) / flow.life;
    const alpha = Math.pow(clamp(1 - age, 0, 1), 2.1);
    const color = flowColor(flow.kind);
    const curve = flow.kind === "investment" ? 16 : 38;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2 - curve;

    ctx.save();
    ctx.globalAlpha = alpha * 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = clamp(flow.amount / 180, 1, 3.2);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, midY, to.x, to.y);
    ctx.stroke();

    const dot = quadraticPoint(from.x, from.y, midX, midY, to.x, to.y, clamp(age, 0, 1));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, clamp(2.4 + flow.amount / 260, 2.4, 5.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawCanvasLabels(context, ctx, width, height) {
  const { state } = context;
  ctx.save();
  ctx.fillStyle = "rgba(22, 48, 46, 0.68)";
  ctx.font = "800 12px Pretendard, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`소비자 구역 · ${state.consumers.length}명 중 대표 노드 표시`, 28, 92);
  ctx.textAlign = "right";
  ctx.fillText(`생산자 구역 · ${state.producers.length}개 기업`, width - 28, 92);
  ctx.textAlign = "center";
  ctx.fillText("정부 정책 노드", width / 2, 24);

  ctx.fillStyle = "rgba(22, 48, 46, 0.50)";
  ctx.font = "700 11px Pretendard, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("상위 거래 흐름만 표시합니다. 노드에 마우스를 올리면 빠른 요약이 나타납니다.", width / 2, height - 13);
  ctx.restore();
}

function getNodePosition(context, type, id) {
  const { state } = context;
  if (type === "consumer") return state.positions.consumers[id];
  if (type === "producer") {
    const pos = state.positions.producers[id];
    return pos ? { x: pos.x, y: pos.y } : null;
  }
  if (type === "government") return state.positions.government;
  return null;
}

function findAgentAtPoint(context, x, y) {
  const { state, helpers = {} } = context;
  const { clamp } = helpers;
  let nearest = null;
  let nearestDistance = Infinity;

  state.positions.consumers.forEach((pos, id) => {
    if (!pos) return;
    const consumer = state.consumers[id];
    const radius = consumer ? clamp(4.3 + consumer.cash / 700, 4.5, 8.2) : pos.r;
    const distance = Math.hypot(pos.x - x, pos.y - y);
    if (distance < radius + 18 && distance < nearestDistance) {
      nearest = { type: "consumer", id };
      nearestDistance = distance;
    }
  });

  state.positions.producers.forEach((pos, id) => {
    if (!pos) return;
    const producer = state.producers[id];
    const width = producer ? clamp(54 + producer.productionCapacity * 0.6, 58, 94) : pos.w;
    const height = 38;
    const padding = 16;
    const inside = x >= pos.x - width / 2 - padding && x <= pos.x + width / 2 + padding && y >= pos.y - height / 2 - padding && y <= pos.y + height / 2 + padding;
    if (inside) {
      nearest = { type: "producer", id };
      nearestDistance = 0;
    }
  });

  const gov = state.positions.government;
  if (Math.abs(x - gov.x) < 74 && Math.abs(y - gov.y) < 44) {
    nearest = { type: "government", id: 0 };
  }

  return nearest;
}

function showCanvasTooltip(context, x, y, html) {
  const { els } = context;
  els.canvasTooltip.innerHTML = html;
  els.canvasTooltip.style.left = `${x}px`;
  els.canvasTooltip.style.top = `${y}px`;
  els.canvasTooltip.classList.add("visible");
}

function getAgentTooltip(context, agent) {
  const { state, helpers = {} } = context;
  const { compactMoney, money, percent, round, safeNumber } = helpers;
  if (agent.type === "consumer") {
    const consumer = state.consumers[agent.id];
    return `<strong>가계 ${agent.id + 1}</strong><br>${consumer.employed ? "고용" : "실업"} · 현금 ${compactMoney(consumer.cash)}<br>심리 ${round(consumer.confidence, 2)}`;
  }
  if (agent.type === "producer") {
    const producer = state.producers[agent.id];
    return `<strong>기업 ${agent.id + 1}</strong><br>가격 ${money(producer.price, 2)} · 고용 ${producer.employees.length}명<br>재고 ${round(producer.inventory, 1)}`;
  }
  return `<strong>정부</strong><br>금리 ${percent(state.government.interestRate * 100, 2)} · 소득세 ${percent(state.government.householdIncomeTaxRate * 100, 1)} · 법인세 ${percent(state.government.corporateTaxRate * 100, 1)} · 부가세 ${percent(safeNumber(state.government.valueAddedTaxRate, 0.10) * 100, 1)}<br>수지 ${compactMoney(state.government.balance)} · 재정여력 ${state.government.fiscalSpaceLabel || "충분함"}`;
}

function flowColor(kind) {
  if (kind === "wage") return "#2d8f61";
  if (kind === "tax") return "#c85f32";
  if (kind === "spending") return "#e5b949";
  if (kind === "investment") return "#247173";
  return "#407ca8";
}
