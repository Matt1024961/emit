/**
 * BRAIN (BRN1, p/n 20320) port definitions.
 * Derived from brain-pinouts.md. 127 physical terminals; these are the
 * user-assignable logical channels.
 */
import type { Port } from "../types/port";

/**
 * Builds the 24 BRAIN thermocouple ports (TC1–TC24).
 * Each channel ships wired for Type-K; pin pairs run 80/81…126/127
 * (pin = 80 + 2*(n-1) for TCn).
 */
function brainTcPorts(): Port[] {
  return Array.from({ length: 24 }, (_, i) => {
    const n = i + 1;
    const pin = 80 + 2 * i;
    return {
      id: `TC${n}`,
      device: "BRAIN" as const,
      type: "TC" as const,
      label: `TC ${n}`,
      pinNumbers: [pin, pin + 1],
      isFormC: false,
      tcType: "K" as const,
    };
  });
}

export const BRAIN_PORTS: Port[] = [
  // --- Analog Inputs (AI 1–12, pins 51–62) ---
  { id: "AI1", device: "BRAIN", type: "AI", label: "AI 1", pinNumbers: [51], isFormC: false },
  { id: "AI2", device: "BRAIN", type: "AI", label: "AI 2", pinNumbers: [52], isFormC: false },
  { id: "AI3", device: "BRAIN", type: "AI", label: "AI 3", pinNumbers: [53], isFormC: false },
  { id: "AI4", device: "BRAIN", type: "AI", label: "AI 4", pinNumbers: [54], isFormC: false },
  { id: "AI5", device: "BRAIN", type: "AI", label: "AI 5", pinNumbers: [55], isFormC: false },
  { id: "AI6", device: "BRAIN", type: "AI", label: "AI 6", pinNumbers: [56], isFormC: false },
  { id: "AI7", device: "BRAIN", type: "AI", label: "AI 7", pinNumbers: [57], isFormC: false },
  { id: "AI8", device: "BRAIN", type: "AI", label: "AI 8", pinNumbers: [58], isFormC: false },
  { id: "AI9", device: "BRAIN", type: "AI", label: "AI 9", pinNumbers: [59], isFormC: false },
  { id: "AI10", device: "BRAIN", type: "AI", label: "AI 10", pinNumbers: [60], isFormC: false },
  { id: "AI11", device: "BRAIN", type: "AI", label: "AI 11", pinNumbers: [61], isFormC: false },
  { id: "AI12", device: "BRAIN", type: "AI", label: "AI 12", pinNumbers: [62], isFormC: false },

  // --- Analog Outputs (AO 1, 2, 5, 6 — AO 3/4 only on BRAIN+) ---
  { id: "AO1", device: "BRAIN", type: "AO", label: "AO 1", pinNumbers: [76], isFormC: false },
  { id: "AO2", device: "BRAIN", type: "AO", label: "AO 2", pinNumbers: [78], isFormC: false },
  { id: "AO5", device: "BRAIN", type: "AO", label: "AO 5", pinNumbers: [79], isFormC: false },
  { id: "AO6", device: "BRAIN", type: "AO", label: "AO 6", pinNumbers: [41], isFormC: false },

  // --- Digital Inputs (DI 2–30, pins 12–40; DI 1 is E-STOP, not user-assignable) ---
  { id: "DI2", device: "BRAIN", type: "DI", label: "DI 2", pinNumbers: [12], isFormC: false },
  { id: "DI3", device: "BRAIN", type: "DI", label: "DI 3", pinNumbers: [13], isFormC: false },
  { id: "DI4", device: "BRAIN", type: "DI", label: "DI 4", pinNumbers: [14], isFormC: false },
  { id: "DI5", device: "BRAIN", type: "DI", label: "DI 5", pinNumbers: [15], isFormC: false },
  { id: "DI6", device: "BRAIN", type: "DI", label: "DI 6", pinNumbers: [16], isFormC: false },
  { id: "DI7", device: "BRAIN", type: "DI", label: "DI 7", pinNumbers: [17], isFormC: false },
  { id: "DI8", device: "BRAIN", type: "DI", label: "DI 8", pinNumbers: [18], isFormC: false },
  { id: "DI9", device: "BRAIN", type: "DI", label: "DI 9", pinNumbers: [19], isFormC: false },
  { id: "DI10", device: "BRAIN", type: "DI", label: "DI 10", pinNumbers: [20], isFormC: false },
  { id: "DI11", device: "BRAIN", type: "DI", label: "DI 11", pinNumbers: [21], isFormC: false },
  { id: "DI12", device: "BRAIN", type: "DI", label: "DI 12", pinNumbers: [22], isFormC: false },
  { id: "DI13", device: "BRAIN", type: "DI", label: "DI 13", pinNumbers: [23], isFormC: false },
  { id: "DI14", device: "BRAIN", type: "DI", label: "DI 14", pinNumbers: [24], isFormC: false },
  { id: "DI15", device: "BRAIN", type: "DI", label: "DI 15", pinNumbers: [25], isFormC: false },
  { id: "DI16", device: "BRAIN", type: "DI", label: "DI 16", pinNumbers: [26], isFormC: false },
  { id: "DI17", device: "BRAIN", type: "DI", label: "DI 17", pinNumbers: [27], isFormC: false },
  { id: "DI18", device: "BRAIN", type: "DI", label: "DI 18", pinNumbers: [28], isFormC: false },
  { id: "DI19", device: "BRAIN", type: "DI", label: "DI 19", pinNumbers: [29], isFormC: false },
  { id: "DI20", device: "BRAIN", type: "DI", label: "DI 20", pinNumbers: [30], isFormC: false },
  { id: "DI21", device: "BRAIN", type: "DI", label: "DI 21", pinNumbers: [31], isFormC: false },
  { id: "DI22", device: "BRAIN", type: "DI", label: "DI 22", pinNumbers: [32], isFormC: false },
  { id: "DI23", device: "BRAIN", type: "DI", label: "DI 23", pinNumbers: [33], isFormC: false },
  { id: "DI24", device: "BRAIN", type: "DI", label: "DI 24", pinNumbers: [34], isFormC: false },
  { id: "DI25", device: "BRAIN", type: "DI", label: "DI 25", pinNumbers: [35], isFormC: false },
  { id: "DI26", device: "BRAIN", type: "DI", label: "DI 26", pinNumbers: [36], isFormC: false },
  { id: "DI27", device: "BRAIN", type: "DI", label: "DI 27", pinNumbers: [37], isFormC: false },
  { id: "DI28", device: "BRAIN", type: "DI", label: "DI 28", pinNumbers: [38], isFormC: false },
  { id: "DI29", device: "BRAIN", type: "DI", label: "DI 29", pinNumbers: [39], isFormC: false },
  { id: "DI30", device: "BRAIN", type: "DI", label: "DI 30", pinNumbers: [40], isFormC: false },

  // --- Digital Outputs (DO 1–8, pins 68–75) ---
  // DO7 and DO8 are Form-C (NC contact) via TBT205/TBT206 — only valid targets for Relay-NC.
  { id: "DO1", device: "BRAIN", type: "DO", label: "DO 1", pinNumbers: [68], isFormC: false },
  { id: "DO2", device: "BRAIN", type: "DO", label: "DO 2", pinNumbers: [69], isFormC: false },
  { id: "DO3", device: "BRAIN", type: "DO", label: "DO 3", pinNumbers: [70], isFormC: false },
  { id: "DO4", device: "BRAIN", type: "DO", label: "DO 4", pinNumbers: [71], isFormC: false },
  { id: "DO5", device: "BRAIN", type: "DO", label: "DO 5", pinNumbers: [72], isFormC: false },
  { id: "DO6", device: "BRAIN", type: "DO", label: "DO 6", pinNumbers: [73], isFormC: false },
  {
    id: "DO7",
    device: "BRAIN",
    type: "DO",
    label: "DO 7 (Form-C)",
    pinNumbers: [74],
    isFormC: true,
  },
  {
    id: "DO8",
    device: "BRAIN",
    type: "DO",
    label: "DO 8 (Form-C)",
    pinNumbers: [75],
    isFormC: true,
  },

  // --- Thermocouples (TC 1–24, pin pairs 80/81 through 126/127) ---
  // All channels ship wired for Type-K; generated by brainTcPorts().
  ...brainTcPorts(),

  // --- Magnetic Pickup (RPM) ---
  {
    id: "MAG",
    device: "BRAIN",
    type: "MAG",
    label: "MAG (RPM)",
    pinNumbers: [46, 47],
    isFormC: false,
  },
];
