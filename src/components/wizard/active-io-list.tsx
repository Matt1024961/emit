import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/icon-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizardStore } from "@/store/wizard";
import type { ActiveIOItem } from "@/types/io";
import { FormCBadge, SignalBadge } from "./signal-badge";

interface EditingState {
  id: string;
  notes: string;
  range: string;
}

/** Right panel — the active I/O list with inline editing of notes and range. */
export function ActiveIOList() {
  const { activeIO, removeIOItem, editIOItem } = useWizardStore();
  const [editing, setEditing] = useState<EditingState | null>(null);

  function startEdit(item: ActiveIOItem) {
    setEditing({ id: item.id, notes: item.notes, range: item.range });
  }

  function saveEdit() {
    if (!editing) return;
    editIOItem(editing.id, { notes: editing.notes, range: editing.range });
    setEditing(null);
  }

  if (activeIO.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-3 py-8 text-center">
        <ClipboardList className="text-muted-foreground/40 mb-1 size-8" />
        <p className="text-foreground text-sm font-medium">No I/O items yet</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Click + in the catalog to add items, or use a template button above.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1.5">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Active I/O
          <span className="ml-1 font-normal normal-case">({activeIO.length} items)</span>
        </p>
      </div>

      <ul className="flex-1 divide-y overflow-y-auto">
        {activeIO.map((item, idx) => (
          <li key={item.id} className="px-2 py-1.5">
            {editing?.id === item.id ? (
              // A form, so pressing Enter in Range or Notes saves the edit
              // (the same way the Step 1 setup form submits).
              <form
                className="space-y-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <p className="text-foreground text-sm font-medium">
                  <span className="text-muted-foreground font-mono">{item.tag}</span> {item.name}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-1">
                    <Label htmlFor={`edit-range-${editing.id}`}>Range</Label>
                    <Input
                      id={`edit-range-${editing.id}`}
                      name="range"
                      value={editing.range}
                      onChange={(e) => setEditing({ ...editing, range: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`edit-notes-${editing.id}`}>Notes</Label>
                    <Input
                      id={`edit-notes-${editing.id}`}
                      name="notes"
                      value={editing.notes}
                      onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-start gap-1">
                <span className="text-muted-foreground mt-0.5 w-5 shrink-0 text-right text-xs">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-muted-foreground font-mono text-xs">{item.tag}</span>
                    <SignalBadge signal={item.signal} />
                    <Badge variant={item.category === "Input" ? "primary" : "success"}>
                      {item.category}
                    </Badge>
                    {item.formC && <FormCBadge />}
                  </div>
                  <p className="text-foreground mt-0.5 text-sm">{item.name}</p>
                  {item.range && <p className="text-muted-foreground text-xs">{item.range}</p>}
                  {item.notes && <p className="text-primary mt-0.5 text-xs italic">{item.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <IconButton
                    icon={Pencil}
                    label={`Edit ${item.tag}`}
                    onClick={() => startEdit(item)}
                  />
                  <IconButton
                    icon={Trash2}
                    label={`Remove ${item.tag}`}
                    onClick={() => removeIOItem(item.id)}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
