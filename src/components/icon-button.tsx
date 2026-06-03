import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ComponentProps<typeof Button>, "children" | "size"> {
  /** The lucide icon component. */
  icon: LucideIcon;
  /** Accessible name and tooltip content. Required. */
  label: string;
  /** Icon button size. */
  size?: "sm" | "icon";
}

/**
 * Icon-only button composed from the shadcn Button + Tooltip. Keeps icon
 * actions consistent (accessible name + hover tooltip) across the app.
 *
 * @example
 * <IconButton icon={Trash2} label="Delete" variant="ghost" onClick={…} />
 */
export function IconButton({
  icon: Icon,
  label,
  size = "icon",
  variant = "ghost",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size === "sm" ? "sm" : "icon"}
          aria-label={label}
          className={cn(size === "sm" && "size-8", className)}
          {...props}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
