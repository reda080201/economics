export function initializeAppShell({
  cacheElements,
  hydrateScenarioSelect,
  scenarioSelect,
  scenarioSelectGroups,
  setupCharts,
  enhanceControlPanel,
  enhanceDetailedMetricsPanel,
  enhanceInspectorHierarchy,
  setupEvents,
  updateControlLabels,
  resetSimulation,
  animationLoop,
  requestAnimationFrame
}) {
  cacheElements();
  hydrateScenarioSelect(scenarioSelect, scenarioSelectGroups);
  setupCharts();
  enhanceControlPanel();
  enhanceDetailedMetricsPanel();
  enhanceInspectorHierarchy();
  setupEvents();
  updateControlLabels();
  resetSimulation();
  requestAnimationFrame(animationLoop);
}
