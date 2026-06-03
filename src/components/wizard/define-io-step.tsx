import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAvailablePorts } from "@/hardware/index";
import { useWizardStore } from "@/store/wizard";
import { getCapacityWarning } from "@/validation/rules";
import { ActiveIOList } from "./active-io-list";
import { CatalogPanel } from "./catalog-panel";

const PANEL = "flex flex-col gap-0 overflow-hidden p-0";

/**
 * Step 2 — Define I/O Requirements. Searchable catalog (left) + active list (right).
 */
export function DefineIOStep() {
  const wizard = useWizardStore();
  const available = getAvailablePorts(wizard.hardware.brainPlusCount);
  const capacityWarning = getCapacityWarning(wizard.activeIO, available);

  return (
    <div className="flex min-h-[520px] flex-col gap-4 md:h-[calc(100vh-160px)]">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-1.5">
        <div>
          <p className="emit-eyebrow text-primary text-xs">Step 2</p>
          <h1 className="text-foreground mt-1 text-xl font-bold tracking-wide uppercase">
            Define I/O Requirements
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose I/O items from the catalog, or start from an EMIT template.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-muted-foreground text-xs">Templates:</span>
          <Button variant="outline" size="sm" onClick={() => wizard.applyTemplate("recommended")}>
            EMIT Recommended
          </Button>
          <Button variant="outline" size="sm" onClick={() => wizard.applyTemplate("limited")}>
            EMIT Limited
          </Button>
          {wizard.activeIO.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => wizard.clearIO()}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {capacityWarning && (
        <div className="border-warning/40 bg-warning-muted text-warning-foreground flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1.5 text-sm">
          <AlertTriangle className="size-4" />
          {capacityWarning}. Consider adding a BRAIN+ expansion on the mapping screen.
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
        <Card className={`w-full shrink-0 md:w-72 ${PANEL}`}>
          <CatalogPanel />
        </Card>
        <Card className={`flex-1 ${PANEL}`}>
          <ActiveIOList />
        </Card>
      </div>
    </div>
  );
}
