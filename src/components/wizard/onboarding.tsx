import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Props for the Onboarding banner component. */
export interface OnboardingProps {
  /** Overridable for tests; defaults to "panel-io-onboarding-dismissed". */
  storageKey?: string;
}

const DEFAULT_STORAGE_KEY = "panel-io-onboarding-dismissed";

/**
 * Reads a localStorage value safely, returning null on any error (e.g. in
 * private-browsing environments where storage access throws).
 */
function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Writes a value to localStorage safely, silently ignoring errors (e.g.
 * storage quota exceeded or private-browsing restrictions).
 */
function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently ignore — dismissal is best-effort.
  }
}

/**
 * First-run tips explaining Form-C ports, the E-STOP reservation, and port
 * capacity. Dismissible; the choice persists to localStorage.
 */
export function Onboarding({
  storageKey = DEFAULT_STORAGE_KEY,
}: OnboardingProps): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState<boolean>(() => safeRead(storageKey) === "1");

  if (dismissed) {
    return null;
  }

  function handleDismiss(): void {
    safeWrite(storageKey, "1");
    setDismissed(true);
  }

  return (
    <Card className="border-border bg-card gap-0 rounded-lg py-2 shadow-sm">
      <CardHeader className="px-2 pb-1 pt-0">
        <CardTitle className="text-sm font-semibold text-card-foreground">
          New here? 3 quick tips
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-0">
        <div className="flex flex-wrap items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1 text-xs text-primary underline-offset-2 hover:underline"
                aria-label="Learn about Form-C ports"
              >
                Form-C
              </Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              <p className="font-medium text-popover-foreground">Form-C ports</p>
              <p className="mt-0.5 text-muted-foreground">
                Fail-safe shutdown signals must land on a Form-C port. Only DO 7 and DO 8 on the
                BRAIN have a normally-closed contact that opens when power is lost.
              </p>
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1 text-xs text-primary underline-offset-2 hover:underline"
                aria-label="Learn about the E-STOP reservation"
              >
                E-STOP
              </Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              <p className="font-medium text-popover-foreground">E-STOP reservation</p>
              <p className="mt-0.5 text-muted-foreground">
                DI 1 is reserved for the hard-wired emergency stop button. It does not appear in the
                port list, so you cannot assign anything else to it.
              </p>
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1 text-xs text-primary underline-offset-2 hover:underline"
                aria-label="Learn about port capacity"
              >
                Capacity
              </Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              <p className="font-medium text-popover-foreground">Port capacity</p>
              <p className="mt-0.5 text-muted-foreground">
                If you add more signals of a type than there are ports, a capacity warning appears.
                Add a BRAIN+ expansion module to get more channels.
              </p>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-auto h-7 px-1 text-xs text-muted-foreground"
          >
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
