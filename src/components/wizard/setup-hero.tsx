import { ArrowDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/store/wizard";

/**
 * Branded hero above the Setup form — the EMIT "Built to Outperform" treatment
 * with a navy/orange wash and a faint blueprint grid. The primary CTA seeds the
 * full Kodiak Site 14 sample.
 */
export function SetupHero() {
  return (
    <section className="emit-hero relative overflow-hidden rounded-lg border">
      <div
        className="emit-grid pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      />
      <div className="relative px-3 py-5 sm:px-5 sm:py-7">
        <p className="emit-eyebrow text-primary text-xs">EMIT · Panel I/O Configurator</p>
        <h1 className="emit-display text-foreground mt-1.5 text-4xl sm:text-6xl">
          Built to outperform
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm sm:text-base">
          Define the I/O for a BRAIN or BRAIN+ control panel, map every signal to a port, and export
          a configuration the downstream tooling reads. Three steps, no guesswork.
        </p>
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <Button type="button" size="lg" onClick={() => useWizardStore.getState().loadSample()}>
            <Sparkles />
            Load sample (Kodiak Site 14)
          </Button>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
            or fill in the details below
            <ArrowDown className="size-4" />
          </span>
        </div>
      </div>
    </section>
  );
}
