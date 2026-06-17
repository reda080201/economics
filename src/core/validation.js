import { escapeHtml } from "./safety.js";

export function evaluateDirectionalValidation(cases) {
  return cases.map((testCase) => {
    const checks = testCase.checks.map((check) => {
      const delta = Number(check.after) - Number(check.before);
      const passed = check.direction === "down" ? delta < -check.tolerance : delta > check.tolerance;
      const weak = !passed && Math.abs(delta) <= check.tolerance * 2;
      return {
        label: check.label,
        status: passed ? "PASS" : weak ? "WARN" : "FAIL",
        delta
      };
    });
    return {
      label: testCase.label,
      checks
    };
  });
}

export function renderValidationReport(results) {
  const statusRank = { FAIL: 3, WARN: 2, PASS: 1 };
  const worst = results.reduce((max, group) => {
    const groupWorst = group.checks.reduce((inner, check) => Math.max(inner, statusRank[check.status] || 0), 0);
    return Math.max(max, groupWorst);
  }, 0);
  const headline = worst >= 3 ? "일부 방향성 검증 실패" : worst >= 2 ? "일부 반응이 약함" : "주요 방향성 통과";
  const rows = results.map((group) => {
    const checks = group.checks.map((check) => `[${check.status}] ${check.label}`).join("<br>");
    return `<tr><td>${escapeHtml(group.label)}</td><td>${checks}</td></tr>`;
  }).join("");
  return `
    <strong>검증 결과: ${headline}</strong><br>
    <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:11px;">
      <tbody>${rows}</tbody>
    </table>
  `;
}
