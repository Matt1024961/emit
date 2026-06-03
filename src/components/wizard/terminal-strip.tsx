import { cn } from "@/lib/utils";
import type { ActiveIOItem, PortType } from "@/types/io";
import type { Port } from "@/types/port";
import { PortSlot } from "./port-slot";
import { PortTypeBadge } from "./signal-badge";

interface TerminalStripProps {
  type: PortType;
  label: string;
  ports: Port[];
  draggingItem: ActiveIOItem | null;
}

/** Per-type terminal-block grid: tighter on wider channels, single column for MAG. */
function gridCols(type: PortType): string {
  if (type === "TC" || type === "DI") return "grid-cols-4 sm:grid-cols-6";
  if (type === "MAG") return "grid-cols-1 max-w-40";
  return "grid-cols-2 sm:grid-cols-4";
}

/**
 * A labeled terminal strip styled like a physical terminal block: a header row
 * (type badge + name + channel count) sitting above a divider rail line, with
 * the type's droppable {@link PortSlot} terminals laid out below it.
 */
export function TerminalStrip({ type, label, ports, draggingItem }: TerminalStripProps) {
  return (
    <section className="bg-muted/30 rounded-md border p-1.5">
      <header className="mb-1 flex items-center gap-1 border-b pb-1">
        <PortTypeBadge type={type} />
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <span className="text-muted-foreground/60 ml-auto font-mono text-[10px]">
          ×{ports.length}
        </span>
      </header>
      <div className={cn("grid gap-1", gridCols(type))}>
        {ports.map((port) => (
          <PortSlot key={port.id} port={port} draggingItem={draggingItem} />
        ))}
      </div>
    </section>
  );
}
