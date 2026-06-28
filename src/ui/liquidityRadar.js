import { getApiKey } from "../data/apiKeyStore.js";
import { loadLiquidityRadarDataset, computeLiquidityMetrics } from "../liquidity/liquidityEngine.js";
import { liquiditySeriesMap } from "../liquidity/liquiditySeriesMap.js";
import { computeLiquidityScore } from "../liquidity/liquidityScore.js";
import { classifyLiquidityRegime } from "../liquidity/liquidityRegime.js";

export async function runLiquidityRadarMode(context) {
  const { els, state, helpers } = context;
  if (!els.liquidityRadarResult) return;
  try {
    helpers.setHtmlIfChanged(els.liquidityRadarResult, "<strong>Liquidity Radar</strong><br>FRED live/fallback 유동성 데이터를 불러오는 중...");
    const dataset = await loadLiquidityRadarDataset({
      apiKey: (els.fredApiKeyInput?.value || getApiKey("fred") || "").trim(),
      proxyUrl: (els.fredProxyUrlInput?.value || "").trim(),
      startDate: els.dataStartDateInput?.value || "2019-01",
      endDate: els.dataEndDateInput?.value || "2024-12"
    });
    const metrics = computeLiquidityMetrics(dataset);
    const score = computeLiquidityScore(metrics);
    const regime = classifyLiquidityRegime({ metrics, score });
    const result = { dataset, metrics, score, regime };
    state.liquidityRadar = result;
    renderLiquidityRadar(context, result);
  } catch (error) {
    helpers.recordRuntimeError(error, "Liquidity Radar 오류", "유동성 레이더 실행 중 오류가 감지되었습니다.");
    helpers.setHtmlIfChanged(els.liquidityRadarResult, `<strong>Liquidity Radar 오류</strong><br>${helpers.escapeHtml(error?.message || String(error))}`);
  }
}

export function renderLiquidityRadar(context, result) {
  const { els, helpers } = context;
  const { dataset, metrics, score, regime } = result;
  const loaded = dataset.loadedSeries?.length || 0;
  const fallback = dataset.fallbackSeries?.length || 0;
  const total = loaded + fallback;
  if (els.liquidityScoreValue) els.liquidityScoreValue.textContent = `${helpers.round(score.totalScore, 0).toFixed(0)}/100`;
  if (els.liquidityRegimeValue) els.liquidityRegimeValue.textContent = `${regime.regime} · ${regime.label}`;
  if (els.fedNetLiquidityValue) els.fedNetLiquidityValue.textContent = formatLarge(metrics.fedNetLiquidity, helpers);
  if (els.liquiditySubScoreValue) {
    els.liquiditySubScoreValue.textContent = `현금 ${helpers.round(score.cashScore, 0).toFixed(0)} / 신용 ${helpers.round(score.creditScore, 0).toFixed(0)} / 자산 ${helpers.round(score.assetScore, 0).toFixed(0)}`;
  }
  if (els.liquidityRadarStatusValue) {
    helpers.setHtmlIfChanged(
      els.liquidityRadarStatusValue,
      `FRED ${loaded}/${total}개 · fallback ${fallback}개${dataset.proxyUsed ? " · proxy 사용" : ""} · ${helpers.escapeHtml(regime.tone)}`
    );
  }
  if (els.liquiditySeriesTableValue) {
    helpers.setHtmlIfChanged(els.liquiditySeriesTableValue, renderSeriesTable(metrics, helpers));
  }
  helpers.setHtmlIfChanged(els.liquidityRadarResult, `
    <strong>Liquidity Radar 결과</strong><br>
    Regime: ${helpers.escapeHtml(regime.regime)} (${helpers.escapeHtml(regime.label)})<br>
    Liquidity Score: ${helpers.round(score.totalScore, 0).toFixed(0)}/100 · 현금 ${helpers.round(score.cashScore, 0).toFixed(0)} · 신용 ${helpers.round(score.creditScore, 0).toFixed(0)} · 자산 ${helpers.round(score.assetScore, 0).toFixed(0)}<br>
    Fed 순유동성: ${formatLarge(metrics.fedNetLiquidity, helpers)} / 3개월 변화 ${formatSignedPercent(metrics.series.fedNetLiquidity.changes.m3, helpers)}<br>
    공식 데이터 사용률: ${loaded}/${total}개 지표 / 샘플 보완 ${fallback}개<br>
    관측 해석: ${helpers.escapeHtml(regime.explanation)}<br>
    주의: 이 패널은 FRED 기반 유동성 관측 신호를 교육용으로 요약하며 투자 추천을 제공하지 않습니다.
    ${dataset.warnings?.length ? `<br>경고: ${helpers.escapeHtml(dataset.warnings.slice(0, 3).join(" / "))}` : ""}
  `);
}

function renderSeriesTable(metrics, helpers) {
  const rows = [
    ["fedNetLiquidity", "Fed 순유동성"],
    ...Object.entries(liquiditySeriesMap).map(([key, config]) => [key, config.label])
  ];
  return `
    <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:11px;">
      <thead><tr><th align="left">지표</th><th align="right">최신</th><th align="right">3개월</th><th align="right">z</th><th align="right">낙폭</th><th align="left">출처</th></tr></thead>
      <tbody>
        ${rows.map(([key, label]) => {
          const item = metrics.series[key] || {};
          const source = metrics.sourceMap?.[key] || "확인";
          const status = metrics.statusMap?.[key] || "";
          return `<tr>
            <td>${helpers.escapeHtml(label)}</td>
            <td align="right">${formatLarge(item.latest, helpers)}</td>
            <td align="right">${formatSignedPercent(item.changes?.m3, helpers)}</td>
            <td align="right">${helpers.round(item.zScore || 0, 2).toFixed(2)}</td>
            <td align="right">${formatSignedPercent(item.drawdown, helpers)}</td>
            <td>${helpers.escapeHtml(`${source}${status ? ` · ${status}` : ""}`)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function formatLarge(value, helpers) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "확인 필요";
  const abs = Math.abs(numeric);
  if (abs >= 1000000) return `${helpers.round(numeric / 1000000, 2).toFixed(2)}M`;
  if (abs >= 1000) return `${helpers.round(numeric / 1000, 2).toFixed(2)}K`;
  return helpers.round(numeric, 2).toFixed(2);
}

function formatSignedPercent(value, helpers) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.0%";
  const percent = numeric * 100;
  return `${percent >= 0 ? "+" : ""}${helpers.round(percent, 1).toFixed(1)}%`;
}
