export type SignalType = "4-20mA" | "TC-K" | "TC-J" | "Pulse" | "DryContact" | "Relay" | "Relay-NC";

export type PortType = "AI" | "AO" | "DI" | "DO" | "TC" | "MAG";

export type IOCategory = "Input" | "Output";

export interface CatalogItem {
  tag: string;
  name: string;
  category: IOCategory;
  signal: SignalType;
  range: string;
  hardwareHint: PortType;
  formC: boolean;
  tcType: "K" | "J" | null;
  group: string;
  inRecommended: boolean;
  inLimited: boolean;
}

export interface ActiveIOItem {
  id: string;
  tag: string;
  name: string;
  category: IOCategory;
  signal: SignalType;
  range: string;
  hardwareHint: PortType;
  formC: boolean;
  tcType: "K" | "J" | null;
  group: string;
  notes: string;
}
