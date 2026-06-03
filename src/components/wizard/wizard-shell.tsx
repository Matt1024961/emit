import { Download, RotateCcw } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { EmitWordmark } from "@/components/brand/emit-wordmark";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { buildConfiguration } from "@/lib/build-config";
import { useWizardStore } from "@/store/wizard";
import { getUnmappedFailSafeRelays } from "@/validation/rules";
import { downloadXml } from "@/xml/generate";
import { PrintDrawing } from "./print-drawing";
import { SaveLoadModal } from "./save-load-modal";
import { StepIndicator } from "./step-indicator";

// Lazy-load the three step bodies so the initial chunk stays small.
const SetupStep = lazy(() => import("./setup-step").then((m) => ({ default: m.SetupStep })));
const DefineIOStep = lazy(() =>
  import("./define-io-step").then((m) => ({ default: m.DefineIOStep }))
);
const MapPortsStep = lazy(() =>
  import("./map-ports-step").then((m) => ({ default: m.MapPortsStep }))
);

/** Centered fallback shown while a step chunk loads. */
function StepFallback() {
  return (
    <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
      Loading…
    </div>
  );
}

/**
 * Root wizard template — sticky header (brand, step indicator, theme toggle,
 * actions), scrollable content, sticky footer with step navigation.
 */
export function WizardShell() {
  const wizard = useWizardStore();
  const [modal, setModal] = useState<"save" | "load" | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);

  /** Clears the whole configuration, wipes undo history, and returns to Setup. */
  function handleRestart() {
    wizard.reset();
    useWizardStore.temporal.getState().clear();
    setConfirmRestart(false);
    toast.success("Started a new configuration");
  }

  /**
   * Builds the config, blocks export when a fail-safe relay is unmapped
   * (a safety-critical signal), then downloads the XML.
   */
  function handleExport() {
    const unmappedFailSafe = getUnmappedFailSafeRelays(wizard.activeIO, wizard.mappings);
    if (unmappedFailSafe.length > 0) {
      const tags = unmappedFailSafe.map((i) => i.tag).join(", ");
      toast.error(`Shutdown relay unmapped (${tags}). Map it to a Form-C port (DO 7/8) first.`);
      return;
    }
    const config = buildConfiguration(
      {
        configId: wizard.configId,
        configName: wizard.configName,
        configDescription: wizard.configDescription,
        equipment: wizard.equipment,
        hardware: wizard.hardware,
        activeIO: wizard.activeIO,
        mappings: wizard.mappings,
      },
      new Date().toISOString()
    );
    downloadXml(config);
    toast.success(`Exported ${config.name}`);
  }

  const canExport = wizard.step === 3 && wizard.mappings.length > 0;

  return (
    // Desktop: fixed-height shell (body doesn't scroll); main is the scroller.
    // Mobile: normal flow so the page scrolls as usual.
    <div className="bg-background flex min-h-screen flex-col md:h-screen md:overflow-hidden">
      {/* Header — single row on lg+. Below lg it wraps to two tiers (brand +
          actions on top, step indicator centered below). The bar has no fixed
          height — it grows with its content (min-h) so the background always
          covers every row. CSS `order` reflows the same markup, no duplication. */}
      <header className="bg-card/95 sticky top-0 z-30 shrink-0 border-b backdrop-blur-md">
        <div className="mx-auto flex min-h-14 max-w-[95vw] flex-wrap items-center content-center gap-x-3 gap-y-2 px-4 py-2 xl:gap-x-4 xl:py-0">
          <div className="order-1 flex shrink-0 items-center gap-3">
            <EmitWordmark withSubtitle subtitleClassName="hidden sm:block" />
            {wizard.configName && (
              <div className="hidden max-w-48 border-l pl-3 leading-none xl:block">
                <p className="text-muted-foreground truncate text-xs">{wizard.configName}</p>
              </div>
            )}
          </div>

          <div className="order-3 flex w-full justify-center xl:order-2 xl:mx-auto xl:w-auto">
            <StepIndicator currentStep={wizard.step} onStepClick={(s) => wizard.setStep(s)} />
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 xl:order-3 xl:ml-0 xl:gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Restart"
              onClick={() => setConfirmRestart(true)}
            >
              <RotateCcw />
              <span className="hidden sm:inline">Restart</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setModal("load")}>
              Load
            </Button>
            <Button variant="outline" size="sm" onClick={() => setModal("save")}>
              Save
            </Button>
            {canExport && (
              <Button size="sm" className="hidden md:inline-flex" onClick={handleExport}>
                <Download />
                Export XML
              </Button>
            )}
            <Separator orientation="vertical" className="h-6" />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Content — scrolls on desktop while the shell stays fixed */}
      <main className="flex-1 md:min-h-0 md:overflow-y-auto">
        <div className="mx-auto w-full max-w-[95vw] px-2 py-3">
          <Suspense fallback={<StepFallback />}>
            {wizard.step === 1 && <SetupStep />}
            {wizard.step === 2 && <DefineIOStep />}
            {wizard.step === 3 && <MapPortsStep />}
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/95 sticky bottom-0 z-30 shrink-0 border-t px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[95vw] items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => wizard.setStep((wizard.step - 1) as 1 | 2 | 3)}
            disabled={wizard.step === 1}
          >
            ← Back
          </Button>

          <div className="flex items-center gap-3">
            {/* Step 1 submits the setup form so its required-field validation fires. */}
            {wizard.step === 1 && (
              <Button size="sm" type="submit" form="setup-form">
                Continue →
              </Button>
            )}
            {wizard.step === 2 && (
              <Button
                size="sm"
                onClick={() => wizard.setStep(3)}
                disabled={wizard.activeIO.length === 0}
              >
                Continue to Mapping →
              </Button>
            )}
            {canExport && (
              <Button size="sm" onClick={handleExport}>
                <Download />
                Export XML
              </Button>
            )}
          </div>
        </div>
      </footer>

      <SaveLoadModal
        open={modal !== null}
        mode={modal ?? "save"}
        onOpenChange={(o) => {
          if (!o) setModal(null);
        }}
      />

      <Dialog open={confirmRestart} onOpenChange={setConfirmRestart}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start over?</DialogTitle>
            <DialogDescription>
              This clears the whole configuration — equipment, I/O, and mappings — and takes you
              back to Setup. You can't undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestart(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRestart}>
              <RotateCcw />
              Restart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden on screen; rendered only by the print stylesheet. */}
      <PrintDrawing />
    </div>
  );
}
