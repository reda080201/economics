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
  const dataConfidence = total ? loaded / total : 0;
  if (els.liquidityScoreValue) els.liquidityScoreValue.textContent = `${helpers.round(score.totalScore, 0).toFixed(0)}/100`;
  if (els.liquidityRegimeValue) els.liquidityRegimeValue.textContent = `${regime.regime} · ${regime.label}`;
  if (els.fedNetLiquidityValue) els.fedNetLiquidityValue.textContent = formatLiquidityValue(metrics.fedNetLiquidity, fedNetLiquidityConfig(), helpers, { compact: true });
  if (els.liquiditySubScoreValue) {
    els.liquiditySubScoreValue.textContent = `현금 ${helpers.round(score.cashScore, 0).toFixed(0)} / 신용 ${helpers.round(score.creditScore, 0).toFixed(0)} / 자산 ${helpers.round(score.assetScore, 0).toFixed(0)}`;
  }
  if (els.liquidityRadarStatusValue) {
    helpers.setHtmlIfChanged(
      els.liquidityRadarStatusValue,
      `FRED ${loaded}/${total}개 · Data Confidence ${helpers.round(dataConfidence * 100, 0).toFixed(0)}% · fallback ${fallback}개${dataset.proxyUsed ? " · proxy 사용" : ""} · ${helpers.escapeHtml(regime.tone)}`
    );
  }
  if (els.liquiditySeriesTableValue) {
    helpers.setHtmlIfChanged(els.liquiditySeriesTableValue, renderSeriesTable(metrics, helpers));
  }
  helpers.setHtmlIfChanged(els.liquidityRadarResult, `
    <strong>Liquidity Radar 결과</strong><br>
    ${renderFallbackBanner(dataset, helpers)}
    ${renderDataConfidence(dataset, helpers)}
    Regime: ${helpers.escapeHtml(regime.regime)} (${helpers.escapeHtml(regime.label)})<br>
    Liquidity Score: ${helpers.round(score.totalScore, 0).toFixed(0)}/100 · Data Confidence: ${loaded}/${total} · 현금 ${helpers.round(score.cashScore, 0).toFixed(0)} · 신용 ${helpers.round(score.creditScore, 0).toFixed(0)} · 자산 ${helpers.round(score.assetScore, 0).toFixed(0)}<br>
    ${renderFedNetLiquidityBreakdown(metrics, helpers)}
    공식 데이터 사용률: ${loaded}/${total}개 지표 / 샘플 보완 ${fallback}개<br>
    관측 해석: ${helpers.escapeHtml(regime.explanation)}<br>
    주의: 이 패널은 FRED 기반 유동성 관측 신호를 교육용으로 요약하며 투자 추천을 제공하지 않습니다.
    ${dataset.warnings?.length ? `<br>경고: ${helpers.escapeHtml(dataset.warnings.slice(0, 3).join(" / "))}` : ""}
    ${renderScoreExplanation()}
  `);
}

function renderSeriesTable(metrics, helpers) {
  const rows = [
    ["fedNetLiquidity", "Fed 순유동성"],
    ...Object.entries(liquiditySeriesMap).map(([key, config]) => [key, config.label])
  ];
  return `
    <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:11px;">
      <thead><tr><th align="left">지표</th><th align="right">최신</th><th align="right">3개월</th><th align="right">z60/z36</th><th align="right">낙폭</th><th align="left">주기</th><th align="left">출처</th></tr></thead>
      <tbody>
        ${rows.map(([key, label]) => {
          const item = metrics.series[key] || {};
          const config = key === "fedNetLiquidity" ? fedNetLiquidityConfig() : liquiditySeriesMap[key];
          const source = metrics.sourceMap?.[key] || "확인";
          const status = metrics.statusMap?.[key] || "";
          return `<tr>
            <td>${helpers.escapeHtml(label)}</td>
            <td align="right">${formatLiquidityValue(item.latest, config, helpers)}</td>
            <td align="right">${formatSignedPercent(item.changes?.m3, helpers)}</td>
            <td align="right">${helpers.round(item.zScore60 || item.zScore || 0, 2).toFixed(2)} / ${helpers.round(item.zScore36 || 0, 2).toFixed(2)}</td>
            <td align="right">${formatSignedPercent(item.drawdown, helpers)}</td>
            <td>${helpers.escapeHtml(config?.frequencyLabel || "월별 정렬")}</td>
            <td>${helpers.escapeHtml(`${source}${status ? ` · ${status}` : ""}`)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderFallbackBanner(dataset, helpers) {
  const loaded = dataset.loadedSeries?.length || 0;
  const fallback = dataset.fallbackSeries?.length || 0;
  const total = loaded + fallback;
  if (!fallback) {
    return `<div style="margin:6px 0; padding:7px 9px; border-radius:10px; background:rgba(51,112,89,0.10); border:1px solid rgba(51,112,89,0.18);">FRED 관측값 ${loaded}/${total}개를 사용 중입니다.${dataset.proxyUsed ? " 호출 방식: backend proxy." : " 호출 방식: 브라우저 직접 호출."}</div>`;
  }
  if (!loaded) {
    return `<div style="margin:6px 0; padding:8px 10px; border-radius:10px; background:rgba(172,93,42,0.14); border:1px solid rgba(172,93,42,0.30);"><strong>샘플 데이터 경고</strong><br>현재 Liquidity Radar는 샘플 데이터 기반입니다. FRED API key 또는 proxy를 연결하면 실제 관측값으로 전환됩니다.<br>샘플 보완 지표가 많을수록 regime 판정 신뢰도는 낮습니다.</div>`;
  }
  return `<div style="margin:6px 0; padding:8px 10px; border-radius:10px; background:rgba(188,143,52,0.14); border:1px solid rgba(188,143,52,0.28);"><strong>혼합 데이터</strong><br>FRED 관측값 ${loaded}/${total}개와 샘플 보완 ${fallback}개를 함께 사용 중입니다. 샘플 보완 지표가 많을수록 regime 판정 신뢰도는 낮습니다.</div>`;
}

function renderDataConfidence(dataset, helpers) {
  const loaded = dataset.loadedSeries || [];
  const fallback = dataset.fallbackSeries || [];
  const total = loaded.length + fallback.length;
  const confidence = total ? loaded.length / total : 0;
  return `
    <details style="margin:6px 0;">
      <summary>데이터 신뢰도: ${loaded.length}/${total} (${helpers.round(confidence * 100, 0).toFixed(0)}%)</summary>
      <div class="subtle" style="margin-top:6px;">
        공식 데이터 기반: ${formatSeriesList(loaded, helpers)}<br>
        샘플 보완: ${formatSeriesList(fallback, helpers)}<br>
        모든 지표는 비교 가능성을 위해 월별 기준으로 정렬되며, 고빈도 지표는 월 내 최신 관측값 또는 forward-fill 값을 사용합니다.
      </div>
    </details>
  `;
}

function formatSeriesList(keys, helpers) {
  if (!keys.length) return "없음";
  return keys
    .map((key) => helpers.escapeHtml(liquiditySeriesMap[key]?.label || key))
    .join(", ");
}

function renderFedNetLiquidityBreakdown(metrics, helpers) {
  const fedNet = metrics.series.fedNetLiquidity || {};
  const walcl = metrics.series.walcl || {};
  const tga = metrics.series.tga || {};
  const rrp = metrics.series.rrp || {};
  return `
    Fed 순유동성: ${formatLiquidityValue(metrics.fedNetLiquidity, fedNetLiquidityConfig(), helpers)} / 3개월 변화 ${formatSignedPercent(fedNet.changes?.m3, helpers)}<br>
    <span class="subtle">구성: Fed 총자산 ${formatLiquidityValue(walcl.latest, liquiditySeriesMap.walcl, helpers, { compact: true })} - TGA ${formatLiquidityValue(tga.latest, liquiditySeriesMap.tga, helpers, { compact: true })} - RRP ${formatLiquidityValue(rrp.latest, liquiditySeriesMap.rrp, helpers, { compact: true })}</span><br>
  `;
}

function renderScoreExplanation() {
  return `
    <details style="margin-top:8px;">
      <summary>Liquidity Score 산식 설명</summary>
      <div class="subtle" style="margin-top:6px;">
        Liquidity Score는 Fed 순유동성, M2, 은행예금, 신용스프레드, 주식·주택가격 흐름을 가중한 휴리스틱 관측 신호입니다.
        현금 점수는 Fed 순유동성, M2, 상업은행 예금, 머니마켓펀드, 달러지수를 참고합니다.
        신용 점수는 하이일드 OAS와 BBB OAS 확대 여부를 반영합니다.
        자산 점수는 S&P 500, 주택가격, drawdown을 반영합니다.
        기본 z-score는 최근 60개월 기준이며, 표의 보조 z-score는 36개월 단기 기준입니다.
        Fed 순유동성 계산은 WALCL·TGA의 백만 달러 단위에 맞춰 RRPONTSYD를 십억 달러에서 백만 달러로 환산합니다.
        이 점수는 교육용 요약이며 투자 추천이나 시장 예측으로 사용하면 안 됩니다.
      </div>
    </details>
  `;
}

function fedNetLiquidityConfig() {
  return {
    label: "Fed 순유동성",
    unitLabel: "백만 달러",
    scaleHint: "trillionFromMillion",
    displayMode: "moneyMillionUsd"
  };
}

function formatLiquidityValue(value, config = {}, helpers, options = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "확인 필요";
  const unit = config.unitLabel || "";
  const compact = Boolean(options.compact);
  if (config.scaleHint === "trillionFromMillion") {
    const trillion = numeric / 1000000;
    return compact
      ? `약 ${helpers.round(trillion, 2).toFixed(2)}조 달러`
      : `${formatGroupedNumber(numeric, helpers)} ${unit} · 약 ${helpers.round(trillion, 2).toFixed(2)}조 달러`;
  }
  if (config.scaleHint === "trillionFromBillion") {
    const trillion = numeric / 1000;
    return compact
      ? `약 ${helpers.round(trillion, 2).toFixed(2)}조 달러`
      : `${formatGroupedNumber(numeric, helpers)} ${unit} · 약 ${helpers.round(trillion, 2).toFixed(2)}조 달러`;
  }
  if (config.displayMode === "spread") return `${helpers.round(numeric, 2).toFixed(2)}${unit}`;
  if (config.displayMode === "index") return `${helpers.round(numeric, 2).toFixed(2)} ${unit}`;
  return `${formatGroupedNumber(numeric, helpers)}${unit ? ` ${unit}` : ""}`;
}

function formatGroupedNumber(value, helpers) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "확인 필요";
  const abs = Math.abs(numeric);
  if (abs >= 1000) return Math.round(numeric).toLocaleString("ko-KR");
  return helpers.round(numeric, 2).toFixed(2);
}

function formatSignedPercent(value, helpers) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.0%";
  const percent = numeric * 100;
  return `${percent >= 0 ? "+" : ""}${helpers.round(percent, 1).toFixed(1)}%`;
}
