import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/wizard";
import type { ActiveIOItem } from "@/types/io";
import { SearchBox } from "./search-box";
import { SignalBadge } from "./signal-badge";

function DraggableIOCard({ item }: { item: ActiveIOItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <li>
      {/* The draggable handle is an inner element so dnd-kit's role="button"
          lands on a valid host (not the <li>). */}
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "bg-card hover:border-primary/40 cursor-grab rounded-md border px-1.5 py-1 transition-shadow select-none hover:shadow-sm active:cursor-grabbing",
          isDragging && "ring-primary/30 opacity-40 shadow-md ring-2"
        )}
      >
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-muted-foreground font-mono text-xs">{item.tag}</span>
          <SignalBadge signal={item.signal} info={false} />
          {item.formC && <Badge variant="destructive">Form-C</Badge>}
        </div>
        <p className="text-foreground mt-0.5 truncate text-sm">{item.name}</p>
      </div>
    </li>
  );
}

/** Left panel — draggable list of I/O items not yet assigned to a port. */
export function UnmappedIOPanel() {
  const [search, setSearch] = useState("");
  const activeIO = useWizardStore((s) => s.activeIO);
  const mappings = useWizardStore((s) => s.mappings);

  const unmapped = useMemo(() => {
    const mappedIds = new Set(mappings.map((m) => m.ioId));
    return activeIO.filter((item) => !mappedIds.has(item.id));
  }, [activeIO, mappings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return unmapped.filter(
      (item) => !q || item.name.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q)
    );
  }, [unmapped, search]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-1 border-b p-1.5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Unmapped I/O
          </p>
          <span className="text-muted-foreground text-xs">{unmapped.length} remaining</span>
        </div>
        <SearchBox
          name="unmapped-io-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Filter…"
          aria-label="Filter unmapped I/O"
        />
      </div>

      {unmapped.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-6 text-center">
          <CheckCircle2 className="text-success mb-1 size-6" />
          <p className="text-success text-sm font-medium">All items mapped</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground px-1.5 py-3 text-center text-sm">No matches</div>
      ) : null}

      <ul className="flex-1 space-y-1 overflow-y-auto p-1.5">
        {filtered.map((item) => (
          <DraggableIOCard key={item.id} item={item} />
        ))}
      </ul>

      <p className="text-muted-foreground border-t px-1.5 py-1 text-xs">Drag items onto ports →</p>
    </div>
  );
}
