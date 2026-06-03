import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStep } from "@/store/wizard";

interface StepIndicatorProps {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
}

const STEPS: { step: WizardStep; label: string; short: string }[] = [
  { step: 1, label: "Setup", short: "Setup" },
  { step: 2, label: "Define I/O", short: "I/O" },
  { step: 3, label: "Map Ports", short: "Map" },
];

/** Three-step progress indicator. Completed steps are clickable and show a check. */
export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Wizard steps" className="flex items-center">
      {STEPS.map(({ step, label, short }, idx) => {
        const completed = step < currentStep;
        const active = step === currentStep;
        const clickable = Boolean(onStepClick) && completed;

        return (
          <div key={step} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn("mx-1 h-px w-8 sm:w-12", completed ? "bg-primary" : "bg-border")}
              />
            )}

            <button
              type="button"
              onClick={clickable ? () => onStepClick?.(step) : undefined}
              disabled={!clickable && !active}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "text-primary"
                  : completed
                    ? "text-muted-foreground hover:text-foreground cursor-pointer"
                    : "text-muted-foreground/50 cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground ring-primary/20 ring-4"
                    : completed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {completed ? <Check className="size-3.5" /> : step}
              </span>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
