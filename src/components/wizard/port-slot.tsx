import { useDroppable } from "@dnd-kit/core";
import { Star, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/wizard";
import type { ActiveIOItem } from "@/types/io";
import type { Port } from "@/types/port";
import { canMap } from "@/validation/rules";
import { SignalBadge } from "./signal-badge";

interface PortSlotProps {
  port: Port;
  draggingItem: ActiveIOItem | null;
}

/**
 * A single physical terminal: the screw-terminal dot, the channel label, and the
 * port's physical pin number(s). Renders a compact, mono pin readout so an EMIT
 * engineer can trace the channel back to the schematic.
 */
export function PortSlot({ port, draggingItem }: PortSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: port.id });
  // Select narrow slices so a slot re-renders only when mappings/activeIO change,
  // not on every store update — keeps dragging across the backplate responsive.
  const mappings = useWizardStore((s) => s.mappings);
  const activeIO = useWizardStore((s) => s.activeIO);
  const removeMapping = useWizardStore((s) => s.removeMapping);

  const mapping = mappings.find((m) => m.portId === port.id);
  const mappedItem = mapping ? activeIO.find((i) => i.id === mapping.ioId) : null;
  const compatible = draggingItem ? canMap(draggingItem, port).valid : null;
  const isCompatibleTarget = Boolean(draggingItem) && compatible === true;

  let tone = "bg-muted/60 border-border";
  if (mappedItem) {
    tone = "bg-success-muted border-success/50";
  } else if (draggingItem) {
    if (isOver && compatible) {
      tone = "bg-success-muted border-success ring-2 ring-success/30";
    } else if (isOver && !compatible) {
      tone = "bg-destructive-muted border-destructive ring-2 ring-destructive/30";
    } else if (compatible) {
      tone = "border-success/40 bg-success-muted/30";
    } else {
      tone = "border-border/40 bg-muted/30 opacity-50";
    }
  }

  const pins = port.pinNumbers.join(" · ");

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-0 flex-col gap-0.5 rounded-md border py-0.5 pr-1 pl-1.5 transition-colors duration-100",
        tone,
        // Gentle lift on the hovered compatible target (transform only, no opacity flicker).
        isCompatibleTarget && isOver && "scale-[1.03]",
        draggingItem && compatible && !mappedItem && "cursor-copy",
        draggingItem && !compatible && "cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between gap-0.5">
        <span className="text-muted-foreground flex items-center gap-0.5 truncate font-mono text-xs leading-none">
          {port.label}
          {port.isFormC && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-warning cursor-help" aria-label="Form-C">
                  <Star className="size-3 fill-current" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Form-C (NC contact)</TooltipContent>
            </Tooltip>
          )}
        </span>
        {mappedItem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (mapping) removeMapping(mapping.ioId);
            }}
            className="text-success/70 hover:text-destructive shrink-0 transition-colors"
            aria-label={`Unmap ${port.label}`}
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <span
        className="text-muted-foreground/60 truncate font-mono text-[10px] leading-none"
        title={`Pin ${pins}`}
      >
        pin {pins}
      </span>

      {mappedItem ? (
        <div
          key={mappedItem.id}
          className="animate-in zoom-in-95 fade-in flex min-w-0 items-center gap-0.5 duration-200"
        >
          <span className="text-foreground truncate font-mono text-xs">{mappedItem.tag}</span>
          <SignalBadge signal={mappedItem.signal} />
        </div>
      ) : (
        <span className="text-muted-foreground/40 truncate text-xs">
          {draggingItem && compatible && isOver ? "Drop here" : "—"}
        </span>
      )}
    </div>
  );
}
