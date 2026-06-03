import { Eye, Printer, Redo2, Undo2, Upload, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { useStore } from "zustand";
import { IconButton } from "@/components/icon-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { buildConfiguration } from "@/lib/build-config";
import { useWizardStore } from "@/store/wizard";
import { parseXml } from "@/xml/parse";
import { XmlPreviewDialog } from "./xml-preview-dialog";

/**
 * Action toolbar for the Map Ports step.
 *
 * Renders hardware selector buttons, Auto Map, Clear, Undo/Redo icon buttons,
 * Preview XML, Import XML, and Print — all reading the wizard store directly.
 * Dialog open-states are kept local; undo/redo use separate temporal selectors
 * to avoid new-object-selector infinite render loops.
 */
export function MapPortsToolbar(): React.JSX.Element {
  const hardware = useWizardStore((s) => s.hardware);
  const setHardware = useWizardStore((s) => s.setHardware);
  const autoMap = useWizardStore((s) => s.autoMap);
  const clearMappings = useWizardStore((s) => s.clearMappings);
  const loadFromConfig = useWizardStore((s) => s.loadFromConfig);
  const mappings = useWizardStore((s) => s.mappings);
  const activeIO = useWizardStore((s) => s.activeIO);
  const configId = useWizardStore((s) => s.configId);
  const configName = useWizardStore((s) => s.configName);
  const configDescription = useWizardStore((s) => s.configDescription);
  const equipment = useWizardStore((s) => s.equipment);

  // Temporal selectors — each selected separately to avoid returning a new object
  const undo = useStore(useWizardStore.temporal, (s) => s.undo);
  const redo = useStore(useWizardStore.temporal, (s) => s.redo);
  const pastStates = useStore(useWizardStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useWizardStore.temporal, (s) => s.futureStates);

  const [xmlPreviewOpen, setXmlPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  /** Runs autoMap then toasts with the fresh mapping count. */
  function handleAutoMap() {
    autoMap();
    const { mappings: fresh, activeIO: freshIO } = useWizardStore.getState();
    toast.success(`Auto-mapped ${String(fresh.length)} of ${String(freshIO.length)}`);
  }

  /** Opens the hidden file input to trigger file selection. */
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  /** Reads the chosen XML file, parses it, and loads it into the store. */
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!event.target.files || !file) return;

    try {
      const text = await file.text();
      const parsed = parseXml(text);
      loadFromConfig({
        id: parsed.id,
        name: parsed.name,
        description: parsed.description,
        equipment: parsed.equipment,
        hardware: parsed.hardware,
        activeIO: parsed.activeIO,
        mappings: parsed.mappings,
      });
      toast.success(`Imported ${String(parsed.activeIO.length)} I/O items`);
    } catch {
      toast.error("Could not read that XML file.");
    }

    // Reset so the same file can be re-picked
    event.target.value = "";
  }

  const previewConfig = buildConfiguration(
    { configId, configName, configDescription, equipment, hardware, activeIO, mappings },
    new Date().toISOString()
  );

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role="toolbar"
      aria-label="Map ports actions"
    >
      {/* Hardware selector */}
      <div className="flex items-center gap-1 rounded-lg border p-0.5">
        <span className="text-muted-foreground mr-0.5 ml-0.5 text-xs">Hardware:</span>
        {([0, 1, 2] as const).map((n) => (
          <Button
            key={n}
            size="sm"
            variant={hardware.brainPlusCount === n ? "default" : "ghost"}
            onClick={() => setHardware({ brainPlusCount: n })}
          >
            {n === 0 ? "BRAIN only" : n === 1 ? "BRAIN + 1× BRAIN+" : "BRAIN + 2× BRAIN+"}
          </Button>
        ))}
      </div>

      {/* Auto Map */}
      <Button variant="outline" size="sm" onClick={handleAutoMap}>
        <Wand2 />
        Auto Map
      </Button>

      {/* Clear mappings */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => clearMappings()}
        disabled={mappings.length === 0}
      >
        Clear mappings
      </Button>

      {/* Undo */}
      <IconButton
        icon={Undo2}
        label="Undo"
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={() => undo()}
      />

      {/* Redo */}
      <IconButton
        icon={Redo2}
        label="Redo"
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={() => redo()}
      />

      {/* Output actions — each on its own full-width line on small screens,
          inline from md up. */}
      <div className="flex w-full flex-col gap-1 md:w-auto md:flex-row md:flex-wrap">
        {/* Preview XML */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center md:w-auto"
          onClick={() => setXmlPreviewOpen(true)}
        >
          <Eye />
          Preview XML
        </Button>

        {/* Import XML — hidden file input triggered via button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center md:w-auto"
          onClick={handleImportClick}
        >
          <Upload />
          Import XML
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,text/xml"
          aria-label="Import XML configuration file"
          className="sr-only"
          onChange={handleFileChange}
        />

        {/* Print — opens the browser print preview of the full I/O summary. */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center md:w-auto"
          onClick={() => window.print()}
        >
          <Printer />
          Print I/O Summary
        </Button>
      </div>

      <XmlPreviewDialog
        config={previewConfig}
        open={xmlPreviewOpen}
        onOpenChange={setXmlPreviewOpen}
      />
    </div>
  );
}
