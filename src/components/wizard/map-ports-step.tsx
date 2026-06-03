import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAvailablePorts } from "@/hardware/index";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/wizard";
import type { ActiveIOItem } from "@/types/io";
import { BackplateViz } from "./backplate-viz";
import { MapPortsToolbar } from "./map-ports-toolbar";
import { MappingWarnings } from "./mapping-warnings";
import { Onboarding } from "./onboarding";
import { SignalBadge } from "./signal-badge";
import { UnmappedIOPanel } from "./unmapped-io-panel";

const PANEL = "flex flex-col gap-0 overflow-hidden p-0";

/** Step 3 — Map I/O items to hardware ports via drag-and-drop (mouse or keyboard). */
export function MapPortsStep() {
  const hardware = useWizardStore((s) => s.hardware);
  const activeIO = useWizardStore((s) => s.activeIO);
  const mappings = useWizardStore((s) => s.mappings);
  const addMapping = useWizardStore((s) => s.addMapping);

  const [draggingItem, setDraggingItem] = useState<ActiveIOItem | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Pointer for mouse/touch, Keyboard so mapping works without a mouse
  // (Space to pick up, arrow keys to move, Space to drop). The small activation
  // distance means a click (e.g. opening a badge popover) won't start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const available = getAvailablePorts(hardware.brainPlusCount);
  const mapped = mappings.length;
  const total = activeIO.length;
  const pct = total > 0 ? (mapped / total) * 100 : 0;

  function handleDragStart(event: DragStartEvent) {
    setDraggingItem(activeIO.find((i) => i.id === event.active.id) ?? null);
    setLastError(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingItem(null);
    const { active, over } = event;
    if (!over) return;
    const port = available.find((p) => p.id === over.id);
    if (!port) return;
    const result = addMapping(active.id as string, port);
    if (!result.success) setLastError(result.reason ?? "Mapping rejected");
  }

  return (
    <div className="flex min-h-[600px] flex-col gap-4 md:h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-1.5">
        <div>
          <p className="emit-eyebrow text-primary text-xs">Step 3</p>
          <h1 className="text-foreground mt-1 text-xl font-bold tracking-wide uppercase">
            Map to Hardware Ports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drag I/O items onto ports, or use the keyboard. Green = compatible, red = incompatible.
          </p>
        </div>
        <MapPortsToolbar />
      </div>

      <Onboarding />

      {/* Status bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Progress
            value={pct}
            indicatorClassName="bg-success"
            className="w-40"
            aria-label={`${mapped} of ${total} mapped`}
          />
          <span className="text-muted-foreground text-sm">
            {mapped} / {total} mapped
          </span>
        </div>
        <MappingWarnings />
        {lastError && (
          <Badge variant="destructive" className="gap-1">
            <XCircle />
            {lastError}
          </Badge>
        )}
      </div>

      {/* Layout — stacks on small screens, side-by-side from md up */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
          <Card className={cn("w-full shrink-0 md:w-64", PANEL)}>
            <UnmappedIOPanel />
          </Card>
          <Card className={cn("flex-1 overflow-y-auto p-2")}>
            <BackplateViz brainPlusCount={hardware.brainPlusCount} draggingItem={draggingItem} />
          </Card>
        </div>

        <DragOverlay>
          {draggingItem && (
            <div className="bg-card border-primary pointer-events-none w-52 rotate-1 rounded-md border-2 px-1.5 py-1 opacity-95 shadow-xl">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-muted-foreground font-mono text-xs">{draggingItem.tag}</span>
                <SignalBadge signal={draggingItem.signal} info={false} />
                {draggingItem.formC && <Badge variant="destructive">Form-C</Badge>}
              </div>
              <p className="text-foreground mt-0.5 truncate text-sm">{draggingItem.name}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
