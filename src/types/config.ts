import type { ActiveIOItem } from "./io";
import type { PortMapping } from "./port";

export interface Equipment {
  engineType: string;
  compressorModel: string;
  stages: number;
  coolerSections: number;
}

export interface HardwareConfig {
  brainPlusCount: 0 | 1 | 2;
}

export interface Configuration {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  equipment: Equipment;
  hardware: HardwareConfig;
  activeIO: ActiveIOItem[];
  mappings: PortMapping[];
}

export interface ConfigurationSummary {
  id: string;
  name: string;
  version: number;
  updatedAt: string;
}
