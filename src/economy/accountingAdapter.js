import { closeAccountingPeriod, createFlowLedger, recordEconomicFlow } from "../core/flowLedger.js";
import { createSectorState, syncSectorStateFromSimulation } from "../core/sectorState.js";

export function updateSfcAccountingLayer(state) {
  if (!state.sectorState) state.sectorState = createSectorState();
  if (!state.flowLedger) state.flowLedger = createFlowLedger();
  syncSectorStateFromSimulation(state.sectorState, state);
  const validation = closeAccountingPeriod(state.flowLedger, state);
  state.metrics.accountingStatus = validation.status;
  state.metrics.accountingSummary = validation.summary;
  if (state.modelReliability) {
    state.metrics.calibrationLoss = state.modelReliability.calibrationLoss;
    state.metrics.backtestDirectionHitRate = state.modelReliability.backtestDirectionHitRate;
    state.metrics.modelReliabilityLevel = state.modelReliability.level;
  }
  return validation;
}

export function recordLedgerFlowFromUiFlow(state, flow) {
  if (!state.flowLedger) state.flowLedger = createFlowLedger();
  recordEconomicFlow(state.flowLedger, {
    period: state.tick,
    from: { type: flow.fromType, id: flow.fromId },
    to: { type: flow.toType, id: flow.toId },
    amount: flow.amount,
    kind: flow.kind,
    description: `${flow.fromType}→${flow.toType}`
  });
}
