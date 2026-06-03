import { Search, X } from "lucide-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

interface SearchBoxProps extends Omit<ComponentProps<"input">, "type"> {
  /** Callback to clear the search value. */
  onClear?: () => void;
}

/**
 * Search input with a leading magnifier and an optional clear button —
 * composed from the shadcn Input.
 */
export function SearchBox({ value, onClear, className, ...props }: SearchBoxProps) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
      <Input type="search" value={value} className={`pr-7 pl-8 ${className ?? ""}`} {...props} />
      {onClear && value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
