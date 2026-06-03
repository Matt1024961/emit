import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CATALOG_GROUPS, IO_CATALOG } from "@/catalog/io-catalog";
import { filterByEquipment } from "@/catalog/stage-filter";
import { IconButton } from "@/components/icon-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/wizard";
import { SearchBox } from "./search-box";
import { FormCBadge, SignalBadge } from "./signal-badge";

/** Left panel — searchable catalog of available I/O items, filtered by equipment config. */
export function CatalogPanel() {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All");
  const activeIO = useWizardStore((s) => s.activeIO);
  const equipment = useWizardStore((s) => s.equipment);
  const addIOFromCatalog = useWizardStore((s) => s.addIOFromCatalog);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of activeIO) {
      counts.set(item.tag, (counts.get(item.tag) ?? 0) + 1);
    }
    return counts;
  }, [activeIO]);

  const filtered = useMemo(() => {
    const equipmentFiltered = filterByEquipment(IO_CATALOG, equipment);
    const q = search.toLowerCase();
    return equipmentFiltered.filter((item) => {
      const matchGroup = group === "All" || item.group === group;
      const matchSearch =
        !q || item.name.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q);
      return matchGroup && matchSearch;
    });
  }, [search, group, equipment]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-1 border-b p-1.5">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Available I/O
        </p>
        <SearchBox
          name="catalog-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by tag or name…"
          aria-label="Search catalog"
        />
        <div className="flex flex-wrap gap-0.5">
          {["All", ...CATALOG_GROUPS].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={cn(
                "rounded-full px-1 py-0.5 text-xs font-medium transition-colors",
                g === group
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 divide-y overflow-y-auto">
        {filtered.length === 0 && (
          <li className="text-muted-foreground px-2 py-4 text-center text-sm">No items match</li>
        )}
        {filtered.map((item) => {
          const count = tagCounts.get(item.tag) ?? 0;
          return (
            <li
              key={item.tag}
              className="hover:bg-muted/50 flex items-start gap-1 px-1.5 py-1.5 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-muted-foreground font-mono text-xs">{item.tag}</span>
                  <SignalBadge signal={item.signal} />
                  {item.formC && <FormCBadge />}
                  {count > 0 && (
                    <Badge variant="muted" aria-label={`${count} added`}>
                      {count}
                    </Badge>
                  )}
                </div>
                <p className="text-foreground mt-0.5 truncate text-sm">{item.name}</p>
                {item.range && <p className="text-muted-foreground text-xs">{item.range}</p>}
              </div>
              <IconButton
                icon={Plus}
                label={`Add ${item.name}`}
                variant="ghost"
                size="sm"
                onClick={() => addIOFromCatalog(item)}
              />
            </li>
          );
        })}
      </ul>

      <div className="text-muted-foreground border-t px-1.5 py-1 text-xs">
        {filtered.length} items
      </div>
    </div>
  );
}
