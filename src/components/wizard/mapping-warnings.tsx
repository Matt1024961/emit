import { AlertTriangle, ShieldAlert } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailablePorts } from "@/hardware/index";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/wizard";
import type { CanNode } from "@/validation/can-termination";
import { canNodeLabel, getCanTerminationWarning } from "@/validation/can-termination";
import { getCapacityWarning, getUnmappedFailSafeRelays } from "@/validation/rules";

/** All four CAN node options in bus order. */
const CAN_NODES: CanNode[] = ["BRAIN", "P1", "P2", "AFR"];

// Both tones keep readable contrast in light and dark themes (the muted surface
// flips with the theme; the foreground tracks it).
const TONE = {
  warning: "border-warning/40 bg-warning-muted text-warning-foreground",
  destructive: "border-destructive/40 bg-destructive-muted text-destructive",
} as const;

/**
 * Full-width warning callout. Unlike a Badge, the text wraps instead of being
 * clipped, so long messages stay readable on small screens.
 */
function Callout({
  tone,
  icon: Icon,
  children,
}: {
  tone: keyof typeof TONE;
  icon: typeof AlertTriangle;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-full items-start gap-1.5 rounded-md border px-2 py-1.5 text-xs leading-snug",
        TONE[tone]
      )}
    >
      <Icon className="mt-px size-3.5 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/**
 * Surfaces capacity, CAN-bus termination, and unmapped fail-safe relay warnings
 * on the mapping screen. Reads raw store slices and derives all computed values
 * via useMemo to avoid infinite re-renders.
 */
export function MappingWarnings(): React.JSX.Element {
  const activeIO = useWizardStore((s) => s.activeIO);
  const mappings = useWizardStore((s) => s.mappings);
  const brainPlusCount = useWizardStore((s) => s.hardware.brainPlusCount);

  const [terminationAt, setTerminationAt] = useState<CanNode>("BRAIN");
  const [hasAfr, setHasAfr] = useState(false);

  const availablePorts = useMemo(() => getAvailablePorts(brainPlusCount), [brainPlusCount]);

  const capacityWarning = useMemo(
    () => getCapacityWarning(activeIO, availablePorts),
    [activeIO, availablePorts]
  );

  const unmappedFailSafe = useMemo(
    () => getUnmappedFailSafeRelays(activeIO, mappings),
    [activeIO, mappings]
  );

  const canWarning = useMemo(
    () => getCanTerminationWarning({ brainPlusCount, hasAfr, terminationAt }),
    [brainPlusCount, hasAfr, terminationAt]
  );

  const failSafeCount = unmappedFailSafe.length;
  const failSafeMessage =
    failSafeCount > 0
      ? `${failSafeCount} fail-safe relay${failSafeCount > 1 ? "s" : ""} unmapped — assign to a Form-C port (DO 7/8) before export.`
      : null;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <label htmlFor="can-termination-select" className="text-muted-foreground text-xs">
          CAN termination:
        </label>
        <Select value={terminationAt} onValueChange={(v) => setTerminationAt(v as CanNode)}>
          <SelectTrigger
            id="can-termination-select"
            size="sm"
            className="w-36"
            aria-label="CAN termination location"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAN_NODES.map((node) => (
              <SelectItem key={node} value={node}>
                {canNodeLabel(node)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant={hasAfr ? "default" : "outline"}
          onClick={() => setHasAfr((prev) => !prev)}
          type="button"
        >
          {hasAfr ? "AFR present" : "No AFR module"}
        </Button>
      </div>

      {capacityWarning && (
        <Callout tone="warning" icon={AlertTriangle}>
          {capacityWarning}
        </Callout>
      )}

      {failSafeMessage && (
        <Callout tone="destructive" icon={ShieldAlert}>
          {failSafeMessage}
        </Callout>
      )}

      {canWarning && (
        <Callout tone="warning" icon={AlertTriangle}>
          {canWarning}
        </Callout>
      )}
    </div>
  );
}
