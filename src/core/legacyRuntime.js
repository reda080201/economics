import { createLegacyRuntimeImpl } from "../runtime/legacyRuntimeImpl.js";

// Compatibility facade: keep the public core import stable while the legacy runtime
// implementation is split out of the core layer.
export function createLegacyRuntime(context) {
  return createLegacyRuntimeImpl(context);
}
