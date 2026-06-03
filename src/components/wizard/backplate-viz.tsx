import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import { BRAIN_PORTS } from "@/hardware/brain";
import { BRAIN_PLUS_P1_PORTS, BRAIN_PLUS_P2_PORTS } from "@/hardware/brain-plus";
import { cn } from "@/lib/utils";
import type { ActiveIOItem, PortType } from "@/types/io";
import type { Port } from "@/types/port";
import { PortTypeBadge } from "./signal-badge";
import { TerminalStrip } from "./terminal-strip";

interface BackplateVizProps {
  brainPlusCount: 0 | 1 | 2;
  draggingItem: ActiveIOItem | null;
}

interface PortSection {
  type: PortType;
  label: string;
  ports: Port[];
}

function makeSections(ports: Port[]): PortSection[] {
  const order: { type: PortType; label: string }[] = [
    { type: "AI", label: "Analog Inputs" },
    { type: "AO", label: "Analog Outputs" },
    { type: "DI", label: "Digital Inputs" },
    { type: "DO", label: "Digital Outputs" },
    { type: "TC", label: "Thermocouples" },
    { type: "MAG", label: "Mag Pickup (RPM)" },
  ];
  return order
    .map(({ type, label }) => ({ type, label, ports: ports.filter((p) => p.type === type) }))
    .filter((s) => s.ports.length > 0);
}

interface ModuleCardProps {
  name: string;
  partNumber: string;
  slot?: string;
  accentClass: string;
  sections: PortSection[];
  draggingItem: ActiveIOItem | null;
}

/**
 * One physical rail-mounted module: an accent header (name, P/N, optional slot
 * tag) over a card body that lays the channels out as labeled terminal strips.
 * The header has a chevron toggle to collapse/expand the body; open by default.
 */
function ModuleCard({
  name,
  partNumber,
  slot,
  accentClass,
  sections,
  draggingItem,
}: ModuleCardProps) {
  const [open, setOpen] = useState(true);
  return (
    <article className="overflow-hidden rounded-lg border shadow-sm">
      <div className={cn("flex items-center justify-between px-2 py-1.5", accentClass)}>
        <div>
          <p className="text-sm font-semibold tracking-wide">{name}</p>
          <p className="font-mono text-xs opacity-60">
            P/N {partNumber}
            {slot ? ` · ${slot}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-xs opacity-50 sm:block">EMIT Technologies</span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${name}`}
            className="hover:bg-background/20 -mr-1 inline-flex items-center justify-center rounded p-1 transition-colors"
          >
            <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="bg-card grid gap-1.5 p-1.5 sm:grid-cols-2">
          {sections.map((section) => (
            <TerminalStrip
              key={section.type}
              type={section.type}
              label={section.label}
              ports={section.ports}
              draggingItem={draggingItem}
            />
          ))}
        </div>
      )}
    </article>
  );
}

/** Panel backplate with BRAIN and optional BRAIN+ modules. Ports are droppable. */
export function BackplateViz({ brainPlusCount, draggingItem }: BackplateVizProps) {
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
        <span className="font-medium">Port types:</span>
        {(["AI", "AO", "DI", "DO", "TC", "MAG"] as PortType[]).map((t) => (
          <PortTypeBadge key={t} type={t} />
        ))}
        <span className="ml-0.5 inline-flex items-center gap-0.5">
          <Star className="text-warning size-3 fill-current" /> = Form-C (NC contact)
        </span>
      </div>

      <ModuleCard
        name="BRAIN Controller"
        partNumber="20320"
        accentClass="bg-foreground text-background"
        sections={makeSections(BRAIN_PORTS)}
        draggingItem={draggingItem}
      />

      {brainPlusCount >= 1 && (
        <ModuleCard
          name="BRAIN+ Expansion — Slot P1"
          partNumber="20330"
          slot="P1"
          accentClass="bg-primary text-primary-foreground"
          sections={makeSections(BRAIN_PLUS_P1_PORTS)}
          draggingItem={draggingItem}
        />
      )}

      {brainPlusCount >= 2 && (
        <ModuleCard
          name="BRAIN+ Expansion — Slot P2"
          partNumber="20330"
          slot="P2"
          accentClass="bg-primary text-primary-foreground"
          sections={makeSections(BRAIN_PLUS_P2_PORTS)}
          draggingItem={draggingItem}
        />
      )}
    </div>
  );
}
