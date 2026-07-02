export function createRuntimeRegistry({
  createLegacyRuntime,
  createLegacyRuntimeContext,
  createAgentMacroRuntime,
  createAgentMacroContext,
  createExperimentRuntime,
  createExperimentContext,
  createDeveloperValidationRuntime,
  createDeveloperValidationContext
}) {
  return {
    createLegacyRuntimeInstance() {
      return createLegacyRuntime(createLegacyRuntimeContext());
    },
    createAgentMacroRuntimeInstance() {
      return createAgentMacroRuntime(createAgentMacroContext());
    },
    createExperimentRuntimeInstance() {
      return createExperimentRuntime(createExperimentContext());
    },
    createDeveloperValidationRuntimeInstance() {
      return createDeveloperValidationRuntime(createDeveloperValidationContext());
    }
  };
}
