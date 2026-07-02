export function createEventActions(handlers) {
  return {
    simulation: {
      state: handlers.state,
      showToast: handlers.showToast,
      updateRunState: handlers.updateRunState,
      resetSimulation: handlers.resetSimulation,
      safeStepSimulation: handlers.safeStepSimulation,
      triggerRandomShock: handlers.triggerRandomShock,
      safeUpdateAllDisplays: handlers.safeUpdateAllDisplays,
      safeUpdateCharts: handlers.safeUpdateCharts,
      performanceNow: handlers.performanceNow
    },
    scenario: {
      initializeGameMode: handlers.initializeGameMode,
      getGameModeConfig: handlers.getGameModeConfig,
      syncLivePolicy: handlers.syncLivePolicy,
      handlePolicyChange: handlers.handlePolicyChange,
      applyScenario: handlers.applyScenario,
      startHistoricalScenarioTimeline: handlers.startHistoricalScenarioTimeline,
      pushEvent: handlers.pushEvent
    },
    ui: {
      updateControlLabels: handlers.updateControlLabels,
      activateControlTab: handlers.activateControlTab,
      handleControlPanelAction: handlers.handleControlPanelAction,
      safeRenderSimulation: handlers.safeRenderSimulation
    },
    canvas: {
      handleCanvasClick: handlers.handleCanvasClick,
      handleCanvasHover: handlers.handleCanvasHover,
      hideCanvasTooltip: handlers.hideCanvasTooltip
    },
    modelLab: {
      renderModelInputs: handlers.renderModelInputs,
      runSelectedEconomicModel: handlers.runSelectedEconomicModel,
      loadCurrentEconomyIntoModel: handlers.loadCurrentEconomyIntoModel
    },
    dataLab: {
      runBalanceQuickTest: handlers.runBalanceQuickTest,
      runScenarioValidation: handlers.runScenarioValidation,
      runPolicyComparison: handlers.runPolicyComparison,
      saveDataApiKeys: handlers.saveDataApiKeys,
      clearDataApiKeys: handlers.clearDataApiKeys,
      runLiveDataLoadMode: handlers.runLiveDataLoadMode,
      runDataCalibrationMode: handlers.runDataCalibrationMode,
      runBacktestMode: handlers.runBacktestMode,
      runMonteCarloMode: handlers.runMonteCarloMode,
      runLiquidityRadarMode: handlers.runLiquidityRadarMode,
      runDeveloperValidationMode: handlers.runDeveloperValidationMode
    }
  };
}

export function flattenEventActions(actions = {}) {
  return {
    ...(actions.simulation || {}),
    ...(actions.scenario || {}),
    ...(actions.ui || {}),
    ...(actions.canvas || {}),
    ...(actions.modelLab || {}),
    ...(actions.dataLab || {})
  };
}
