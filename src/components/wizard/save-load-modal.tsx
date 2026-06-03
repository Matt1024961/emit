import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { configService } from "@/services/local-storage";
import { useSavedConfigsStore } from "@/store/saved";
import { useWizardStore } from "@/store/wizard";
import type { Configuration } from "@/types/config";

interface SaveLoadModalProps {
  open: boolean;
  mode: "save" | "load";
  onOpenChange: (open: boolean) => void;
}

/** Save the current configuration or load a saved one — shadcn Dialog. */
export function SaveLoadModal({ open, mode, onOpenChange }: SaveLoadModalProps) {
  const wizard = useWizardStore();
  const { summaries, load: loadList, remove } = useSavedConfigsStore();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  /**
   * Saves the current wizard state, overwriting the existing config (same id,
   * version stays at 1 for a fresh save or is preserved for an existing entry).
   */
  async function handleSave() {
    if (!wizard.configName.trim()) {
      setFeedback("Configuration name is required.");
      return;
    }
    setSaving(true);
    const config: Configuration = {
      id: wizard.configId,
      name: wizard.configName,
      description: wizard.configDescription,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equipment: wizard.equipment,
      hardware: wizard.hardware,
      activeIO: wizard.activeIO,
      mappings: wizard.mappings,
    };
    await configService.save(config);
    await loadList();
    setSaving(false);
    setFeedback("Saved.");
    setTimeout(() => onOpenChange(false), 800);
  }

  /**
   * Saves the current wizard state as a brand-new configuration entry with a
   * fresh id and the next sequential version number for the given name.
   * Version is computed via `configService.nextVersion(name)`.
   */
  async function handleSaveAsNewVersion() {
    if (!wizard.configName.trim()) {
      setFeedback("Configuration name is required.");
      return;
    }
    setSaving(true);
    const version = await configService.nextVersion(wizard.configName);
    const config: Configuration = {
      id: crypto.randomUUID(),
      name: wizard.configName,
      description: wizard.configDescription,
      version,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      equipment: wizard.equipment,
      hardware: wizard.hardware,
      activeIO: wizard.activeIO,
      mappings: wizard.mappings,
    };
    await configService.save(config);
    await loadList();
    setSaving(false);
    setFeedback(`Saved as v${version.toString()}.`);
    setTimeout(() => onOpenChange(false), 800);
  }

  async function handleLoad(id: string) {
    const config = await configService.load(id);
    if (!config) return;
    wizard.loadFromConfig(config);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "save" ? "Save Configuration" : "Load Configuration"}</DialogTitle>
          <DialogDescription>
            {mode === "save"
              ? "Store this configuration in your browser to recall later."
              : "Open a previously saved configuration."}
          </DialogDescription>
        </DialogHeader>

        {mode === "save" && (
          // A form, so pressing Enter in the name field saves the configuration.
          <form
            className="space-y-4 border-b pb-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="modal-cfg-name">Configuration name</Label>
              <Input
                id="modal-cfg-name"
                name="configName"
                value={wizard.configName}
                onChange={(e) => wizard.setConfigName(e.target.value)}
                placeholder="e.g. Kodiak Site 14 — JGC4"
              />
            </div>
            {feedback && (
              <p
                className={
                  feedback.startsWith("Saved") ? "text-success text-sm" : "text-destructive text-sm"
                }
              >
                {feedback}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                className="flex-1"
                variant="secondary"
                onClick={handleSaveAsNewVersion}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save as new version"}
              </Button>
            </div>
          </form>
        )}

        <div>
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            {summaries.length === 0 ? "No saved configurations" : "Saved configurations"}
          </p>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {summaries.map((s) => (
              <li
                key={s.id}
                className="hover:border-primary/40 hover:bg-primary-muted/30 flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-foreground flex items-center gap-1.5 truncate text-sm font-medium">
                    {s.name}
                    <Badge variant="muted" className="shrink-0">
                      v{s.version}
                    </Badge>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(s.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="ml-3 flex shrink-0 gap-2">
                  {mode === "load" && (
                    <Button size="sm" variant="outline" onClick={() => handleLoad(s.id)}>
                      Load
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
