import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PortType, SignalType } from "@/types/io";

type DomainVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "muted";

const SIGNAL_VARIANT: Record<SignalType, DomainVariant> = {
  "4-20mA": "primary",
  "TC-K": "warning",
  "TC-J": "warning",
  Pulse: "info",
  DryContact: "muted",
  Relay: "secondary",
  "Relay-NC": "destructive",
};

const PORT_TYPE_VARIANT: Record<PortType, DomainVariant> = {
  AI: "primary",
  AO: "success",
  DI: "warning",
  DO: "info",
  TC: "secondary",
  MAG: "muted",
};

interface PillInfo {
  title: string;
  body: string;
}

// Plain-language explanations (written for a quick read, ~5th-grade level).
const SIGNAL_INFO: Record<SignalType, PillInfo> = {
  "4-20mA": {
    title: "4–20 mA analog",
    body: "A current signal from 4 to 20 mA. It carries one changing reading, like pressure or level. 4 mA is the low end and 20 mA is the high end.",
  },
  "TC-K": {
    title: "Type-K thermocouple",
    body: "Two metal wires that make a tiny voltage to show temperature. Type K is the most common kind.",
  },
  "TC-J": {
    title: "Type-J thermocouple",
    body: "Like Type K, but made from different metals. A Type-J sensor must go on a Type-J channel.",
  },
  Pulse: {
    title: "Pulse",
    body: "Quick on/off pulses. The faster they come, the higher the speed. Used for things like engine RPM.",
  },
  DryContact: {
    title: "Dry contact",
    body: "A simple on/off switch with no power of its own. The panel reads it as open or closed, like a door switch.",
  },
  Relay: {
    title: "Relay output",
    body: "An output that switches something on or off, like a light or a valve. It stays open until the panel turns it on.",
  },
  "Relay-NC": {
    title: "Fail-safe relay (Relay-NC)",
    body: "A fail-safe output. It stays on and drops out only when power is lost, so it is used for shutdowns. It needs a Form-C port (DO 7 or DO 8).",
  },
};

const PORT_INFO: Record<PortType, PillInfo> = {
  AI: {
    title: "Analog Input",
    body: "Reads a changing value like pressure or level from a 4–20 mA sensor.",
  },
  AO: {
    title: "Analog Output",
    body: "Sends out a changing 4–20 mA signal, like a valve position.",
  },
  DI: { title: "Digital Input", body: "Reads a simple on/off, like a switch or a dry contact." },
  DO: { title: "Digital Output", body: "Turns something on or off, like a relay or a solenoid." },
  TC: { title: "Thermocouple", body: "Reads temperature from a Type-K or Type-J sensor." },
  MAG: { title: "Magnetic Pickup", body: "Reads engine speed (RPM) from pulses." },
};

const FORM_C_INFO: PillInfo = {
  title: "Form-C contact",
  body: "A relay with a normally-closed contact. It stays on and opens only when power drops. Fail-safe shutdown relays must use one — only DO 7 and DO 8 on the BRAIN have it.",
};

/** Wraps a pill in a click-to-open popover that explains what it means. */
function PillPopover({ info, children }: { info: PillInfo; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`What is ${info.title}?`}
        className="focus-visible:ring-ring inline-flex cursor-help rounded-full outline-none focus-visible:ring-2"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <p className="text-foreground text-sm font-semibold">{info.title}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">{info.body}</p>
      </PopoverContent>
    </Popover>
  );
}

/** Signal-type badge. Shows an info popover by default; pass `info={false}` inside draggable items. */
export function SignalBadge({ signal, info = true }: { signal: SignalType; info?: boolean }) {
  const badge = <Badge variant={SIGNAL_VARIANT[signal]}>{signal}</Badge>;
  return info ? <PillPopover info={SIGNAL_INFO[signal]}>{badge}</PillPopover> : badge;
}

/** Port-type badge. Shows an info popover by default; pass `info={false}` inside draggable items. */
export function PortTypeBadge({ type, info = true }: { type: PortType; info?: boolean }) {
  const badge = <Badge variant={PORT_TYPE_VARIANT[type]}>{type}</Badge>;
  return info ? <PillPopover info={PORT_INFO[type]}>{badge}</PillPopover> : badge;
}

/** Form-C badge with an info popover. Pass `info={false}` inside draggable items. */
export function FormCBadge({ info = true }: { info?: boolean }) {
  const badge = <Badge variant="destructive">Form-C</Badge>;
  return info ? <PillPopover info={FORM_C_INFO}>{badge}</PillPopover> : badge;
}
