import emitLogo from "@/assets/emit-logo.webp";
import { cn } from "@/lib/utils";

interface EmitWordmarkProps {
  /** Render the "Panel I/O Configurator" lockup line beneath the logo. */
  withSubtitle?: boolean;
  /** Size of the EMIT logo. */
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Extra classes for the subtitle line — e.g. responsive visibility in a tight header. */
  subtitleClassName?: string;
}

const LOGO_HEIGHT: Record<NonNullable<EmitWordmarkProps["size"]>, string> = {
  sm: "h-4",
  md: "h-5",
  lg: "h-8",
};

/**
 * EMIT brand wordmark — the official EMIT logo on a fixed dark plate so the
 * white mark stays readable in light mode too, optionally over a
 * "Panel I/O Configurator" lockup line.
 */
export function EmitWordmark({
  withSubtitle = false,
  size = "md",
  className,
  subtitleClassName,
}: EmitWordmarkProps) {
  return (
    <div className={cn("flex flex-col leading-none", className)}>
      <span className="emit-logo-plate inline-flex w-fit items-center rounded-md px-2 py-1.5">
        <img src={emitLogo} alt="EMIT" className={cn("w-auto", LOGO_HEIGHT[size])} />
      </span>
      {withSubtitle && (
        <span
          className={cn("emit-eyebrow text-muted-foreground mt-1.5 text-[10px]", subtitleClassName)}
        >
          Panel I/O Configurator
        </span>
      )}
    </div>
  );
}
