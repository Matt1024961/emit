import type { Equipment } from "@/types/config";

export interface SetupValues {
  configName: string;
  equipment: Equipment;
}

export interface SetupErrors {
  configName?: string;
  compressorModel?: string;
  engineType?: string;
  stages?: string;
}

/**
 * Validates the Step 1 setup form. Returns a per-field map of custom,
 * user-facing messages — empty object means the form is valid.
 */
export function validateSetup({ configName, equipment }: SetupValues): SetupErrors {
  const errors: SetupErrors = {};
  if (!configName.trim()) {
    errors.configName = "Configuration name is required.";
  }
  if (!equipment.compressorModel) {
    errors.compressorModel = "Select a compressor model to continue.";
  }
  if (!equipment.engineType) {
    errors.engineType = "Select an engine type to continue.";
  }
  if (!equipment.stages || equipment.stages < 1) {
    errors.stages = "Enter at least one compressor stage.";
  }
  return errors;
}

/** True when the setup form has at least one validation error. */
export function hasSetupErrors(errors: SetupErrors): boolean {
  return Object.keys(errors).length > 0;
}
