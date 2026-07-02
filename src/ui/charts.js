// Chart.js dashboard wiring. Economic calculations stay outside this UI module.
export function setupCharts(context) {
  const { state, documentRef, windowRef, helpers = {}, callbacks = {} } = context;
  const ChartCtor = windowRef?.Chart;
  if (!ChartCtor) {
    if (!state.ui) state.ui = helpers.createInitialUiState ? helpers.createInitialUiState() : {};
    state.ui.chartsAvailable = false;
    state.charts = {};
    showChartFallback(context, "Chart.js를 불러오지 못해 차트가 비활성화되었습니다.");
    callbacks.pushEvent?.("Chart.js를 불러오지 못해 차트 없이 시뮬레이션을 실행합니다.");
    return;
  }

  state.ui.chartsAvailable = true;
  registerEventMarkerPlugin(context);
  const baseOptions = createBaseChartOptions(helpers);

  state.charts.gdp = new ChartCtor(documentRef.getElementById("gdpChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("GDP형 지출", "#247173"),
        makeDataset("생산가치", "#d88931"),
        makeDataset("정부지출(G)", "#6bb58e")
      ]
    },
    options: cloneOptions(baseOptions, "GDP와 생산")
  });

  state.charts.demand = new ChartCtor(documentRef.getElementById("demandChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("소비", "#407ca8"),
        makeDataset("투자", "#c85f32"),
        makeDataset("정책 금리 %", "#c8483f", "y1", [6, 4])
      ]
    },
    options: cloneOptions(baseOptions, "소비와 투자")
  });

  state.charts.unemployment = new ChartCtor(documentRef.getElementById("unemploymentChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("실업률 %", "#c8483f"),
        makeDataset("정책 금리 %", "#247173", "y1", [6, 4])
      ]
    },
    options: cloneOptions(baseOptions, "실업률")
  });

  state.charts.price = new ChartCtor(documentRef.getElementById("priceChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("평균 가격", "#247173"),
        makeDataset("물가상승률 %", "#d88931"),
        makeDataset("평균 임금", "#407ca8"),
        makeDataset("임금상승률 %", "#c8483f", "y1", [4, 3])
      ]
    },
    options: cloneOptions(baseOptions, "가격과 물가")
  });

  state.charts.government = new ChartCtor(documentRef.getElementById("governmentChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("재정수지", "#247173"),
        makeDataset("세금 수입", "#407ca8"),
        makeDataset("정부 지출", "#c85f32"),
        makeDataset("평균 기업이윤", "#d88931"),
        makeDataset("가계부채", "#6bb58e", "y1", [5, 3]),
        makeDataset("기업부채", "#8b6f47", "y1", [2, 3])
      ]
    },
    options: cloneOptions(baseOptions, "정부 재정")
  });

  state.charts.asset = new ChartCtor(documentRef.getElementById("assetChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("주가지수(pt)", "#247173"),
        makeDataset("주거용 부동산", "#d88931"),
        makeDataset("상업용 부동산", "#407ca8")
      ]
    },
    options: cloneOptions(baseOptions, "자산시장")
  });

  state.charts.firmStock = new ChartCtor(documentRef.getElementById("firmStockChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("평균 기업 주가", "#247173"),
        makeDataset("기업 주가 변동성 %", "#c85f32", "y1")
      ]
    },
    options: cloneOptions(baseOptions, "기업 주식")
  });

  state.charts.financial = new ChartCtor(documentRef.getElementById("financialChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("국채금리 %", "#247173"),
        makeDataset("신용스프레드 %p", "#c85f32"),
        makeDataset("은행건전성지수", "#407ca8", "y1")
      ]
    },
    options: cloneOptions(baseOptions, "금융시장")
  });

  state.charts.safeAsset = new ChartCtor(documentRef.getElementById("safeAssetChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("금 가격지수", "#d88931"),
        makeDataset("은 가격지수", "#8b6f47")
      ]
    },
    options: cloneOptions(baseOptions, "안전자산")
  });

  state.charts.sentiment = new ChartCtor(documentRef.getElementById("sentimentChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("소비심리", "#247173"),
        makeDataset("기업심리", "#407ca8"),
        makeDataset("침체우려", "#c85f32")
      ]
    },
    options: cloneOptions(baseOptions, "심리 및 기대")
  });

  state.charts.model = new ChartCtor(documentRef.getElementById("modelChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        makeDataset("모형 결과", "#247173"),
        makeDataset("기준선", "#d88931", "y", [5, 4])
      ]
    },
    options: cloneOptions(baseOptions, "모형 결과")
  });
}

export function setupChartDatasetToggles(context) {
  const { state, documentRef, helpers = {} } = context;
  if (!helpers.isChartAvailable?.()) return;
  Object.values(state.charts).forEach((chart) => {
    const canvas = chart.canvas;
    const box = canvas && canvas.parentElement;
    if (!box || box.querySelector(".chart-toggles")) return;
    const toolbar = documentRef.createElement("div");
    toolbar.className = "chart-toggles";
    chart.data.datasets.forEach((dataset, index) => {
      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "chart-toggle";
      button.textContent = dataset.label;
      button.style.borderColor = dataset.borderColor;
      button.addEventListener("click", () => {
        const currentlyVisible = chart.isDatasetVisible(index);
        chart.setDatasetVisibility(index, !currentlyVisible);
        button.classList.toggle("off", currentlyVisible);
        chart.update();
      });
      toolbar.appendChild(button);
    });
    box.insertBefore(toolbar, canvas);
  });
}

export function clearCharts(context) {
  const { state, helpers = {} } = context;
  if (!helpers.isChartAvailable?.()) return;
  Object.values(state.charts).forEach((chart) => {
    if (!chart || !chart.data) return;
    chart.data.labels = [];
    chart.data.datasets.forEach((dataset) => {
      dataset.data = [];
    });
    chart.update("none");
  });
}

export function updateCharts(context, force = false) {
  const { state, helpers = {} } = context;
  const { round, safeNumber } = helpers;
  if (!helpers.isChartAvailable?.()) return;
  helpers.syncUiPerformanceState?.();
  const interval = helpers.isLargeEconomyMode?.() ? 24 : state.config.performanceMode === "light" ? 10 : 4;
  if (!force && state.tick > 0 && state.tick % interval !== 0 && state.history.length > 2) return;
  if (state.ui) state.ui.lastChartUpdateTick = state.tick;
  const labels = state.history.map((row) => row.tick);
  updateChartFromHistory(context, state.charts.gdp, labels, [
    (row) => round(row.gdp, 1),
    (row) => round(row.outputValue, 1),
    (row) => round(row.governmentGDPSpending, 1)
  ]);
  updateChartFromHistory(context, state.charts.demand, labels, [
    (row) => round(row.consumption, 1),
    (row) => round(row.investment, 1),
    (row) => round(row.interestRatePercent, 2)
  ]);
  updateChartFromHistory(context, state.charts.unemployment, labels, [
    (row) => round(row.unemploymentRate, 2),
    (row) => round(row.interestRatePercent, 2)
  ]);
  updateChartFromHistory(context, state.charts.price, labels, [
    (row) => round(row.averagePrice, 2),
    (row) => round(row.inflation, 2),
    (row) => round(row.averageWage, 2),
    (row) => round(row.wageGrowth, 2)
  ]);
  updateChartFromHistory(context, state.charts.government, labels, [
    (row) => round(row.governmentBalance, 1),
    (row) => round(row.taxCollected, 1),
    (row) => round(row.spendingActual, 1),
    (row) => round(row.averageFirmProfit, 1),
    (row) => round(row.householdDebt, 1),
    (row) => round(row.firmDebt, 1)
  ]);
  updateChartFromHistory(context, state.charts.asset, labels, [
    (row) => round(row.stockIndexPoints || row.stockIndex * 25, 0),
    (row) => round(safeNumber(row.residentialIndex, row.housingIndex), 1),
    (row) => round(safeNumber(row.commercialIndex, 100), 1)
  ]);
  updateChartFromHistory(context, state.charts.firmStock, labels, [
    (row) => round(safeNumber(row.averageFirmStockPrice, 100), 1),
    (row) => round(safeNumber(row.firmStockVolatility, 0), 2)
  ]);
  updateChartFromHistory(context, state.charts.financial, labels, [
    (row) => round(row.bondYield, 2),
    (row) => round(row.creditSpread, 2),
    (row) => round(row.bankHealthIndex, 1)
  ]);
  updateChartFromHistory(context, state.charts.safeAsset, labels, [
    (row) => round(row.goldIndex, 1),
    (row) => round(row.silverIndex, 1)
  ]);
  updateChartFromHistory(context, state.charts.sentiment, labels, [
    (row) => round(safeNumber(row.consumerSentiment, 0.8), 2),
    (row) => round(safeNumber(row.businessSentiment, 0.8), 2),
    (row) => round(safeNumber(row.recessionFear, 0.2), 2)
  ]);
}

function createBaseChartOptions(helpers) {
  const { compactMoney, formatIndexPoint } = helpers;
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 180, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: {
          color: "#16302e",
          boxWidth: 10,
          usePointStyle: true,
          font: { size: 11, weight: "700" }
        }
      },
      tooltip: {
        backgroundColor: "rgba(22, 48, 46, 0.92)",
        padding: 10,
        displayColors: true,
        callbacks: {
          label(context) {
            const label = context.dataset.label || "";
            const value = Number(context.parsed.y || 0);
            const isPercent = label.includes("%") || label.includes("금리") || label.includes("실업") || label.includes("물가");
            const formatted = label.includes("(pt)")
              ? formatIndexPoint(value)
              : isPercent
                ? `${value.toFixed(2)}%`
                : compactMoney(value);
            return `${label}: ${formatted}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#63706b", maxTicksLimit: 8 },
        grid: { color: "rgba(22, 48, 46, 0.045)" }
      },
      y: {
        ticks: { color: "#63706b" },
        grid: { color: "rgba(22, 48, 46, 0.065)" },
        beginAtZero: true
      },
      y1: {
        position: "right",
        ticks: { color: "#c8483f" },
        grid: { drawOnChartArea: false },
        beginAtZero: true
      }
    }
  };
}

function showChartFallback(context, message) {
  const { documentRef } = context;
  documentRef.querySelectorAll(".chart-box canvas, .model-chart-box canvas").forEach((canvas) => {
    const box = canvas.closest(".chart-box, .model-chart-box");
    if (!box || box.querySelector(".chart-fallback")) return;
    canvas.style.display = "none";
    const fallback = documentRef.createElement("div");
    fallback.className = "chart-fallback";
    fallback.textContent = message;
    box.appendChild(fallback);
  });
}

function registerEventMarkerPlugin(context) {
  const { state, windowRef } = context;
  const ChartCtor = windowRef?.Chart;
  if (!ChartCtor) return;
  if (windowRef.__agentMacroEventMarkersRegistered) return;
  windowRef.__agentMacroEventMarkersRegistered = true;
  ChartCtor.register({
    id: "eventMarkers",
    afterDatasetsDraw(chart) {
      const active = chart.tooltip && chart.tooltip.getActiveElements ? chart.tooltip.getActiveElements() : [];
      if (!active.length) return;
      const area = chart.chartArea;
      const x = active[0].element.x;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = "rgba(22, 48, 46, 0.24)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(x, area.top);
      ctx.lineTo(x, area.bottom);
      ctx.stroke();
      ctx.restore();
    },
    afterDraw(chart) {
      if (!state.markers.length || !chart.data.labels.length) return;
      const xScale = chart.scales.x;
      const area = chart.chartArea;
      const visibleTicks = chart.data.labels.map(Number);
      const ctx = chart.ctx;

      state.markers.forEach((marker) => {
        const index = visibleTicks.indexOf(marker.tick);
        if (index < 0) return;
        const x = xScale.getPixelForValue(index);
        ctx.save();
        ctx.strokeStyle = marker.label === "충격" ? "rgba(200, 72, 63, 0.55)" : "rgba(36, 113, 115, 0.48)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, area.top);
        ctx.lineTo(x, area.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = "700 10px sans-serif";
        ctx.fillText(marker.label, x + 4, area.top + 12);
        ctx.restore();
      });
    }
  });
}

function makeDataset(label, color, yAxisID = "y", dash = []) {
  return {
    label,
    data: [],
    borderColor: color,
    backgroundColor: color + "22",
    borderWidth: 2.2,
    yAxisID,
    borderDash: dash,
    pointRadius: 0,
    pointHoverRadius: 3,
    tension: 0.32,
    fill: false
  };
}

function cloneOptions(baseOptions, title) {
  const options = JSON.parse(JSON.stringify(baseOptions));
  options.plugins.tooltip.callbacks = baseOptions.plugins.tooltip.callbacks;
  options.plugins.title = {
    display: true,
    text: title,
    color: "#16302e",
    align: "start",
    font: { size: 13, weight: "800" }
  };
  return options;
}

function updateChartFromHistory(context, chart, labels, accessors) {
  const { state, helpers = {} } = context;
  if (!helpers.shouldUpdateChartData?.(chart)) return;
  updateChart(context, chart, labels, accessors.map((accessor) => state.history.map(accessor)));
}

function updateChart(context, chart, labels, dataSeries) {
  const { helpers = {} } = context;
  if (!helpers.shouldUpdateChartData?.(chart)) return;
  const canvas = chart.canvas;
  if (!canvas) return;
  chart.data.labels = labels;
  dataSeries.forEach((series, index) => {
    chart.data.datasets[index].data = series;
  });
  chart.update("none");
}
