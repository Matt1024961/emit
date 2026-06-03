import type React from "react";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";

export { toast } from "sonner";

function Toaster(props: React.ComponentProps<typeof Sonner>) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
