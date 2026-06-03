import type { PortType } from "./io";

export type HardwareDevice = "BRAIN" | "BRAIN+";
export type BrainPlusSlot = "P1" | "P2";

export interface Port {
  /** Logical port identifier, e.g. "AI1", "DO7", "TC3", "MAG" */
  id: string;
  device: HardwareDevice;
  /** Only set for BRAIN+ ports */
  slot?: BrainPlusSlot;
  type: PortType;
  label: string;
  /** Physical terminal numbers on the module */
  pinNumbers: number[];
  /**
   * Only DO7 and DO8 on BRAIN are Form-C (NC contact).
   * Relay-NC signals can only map here.
   */
  isFormC: boolean;
  /** Configured thermocouple type for TC ports. K or J; undefined for non-TC ports. */
  tcType?: "K" | "J";
}

export interface PortMapping {
  ioId: string;
  portId: string;
  device: HardwareDevice;
  slot?: BrainPlusSlot;
}
