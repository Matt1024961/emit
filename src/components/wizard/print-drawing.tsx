import { createPortal } from "react-dom";
import { useWizardStore } from "@/store/wizard";
import { PrintView } from "./print-view";

/**
 * Mounts the Panel I/O drawing into a body-level node that is hidden on screen
 * and revealed only by the print stylesheet (see `[data-print-root]` rules in
 * index.css). Because it lives outside the app's scroll containers and dialogs,
 * `window.print()` renders the complete drawing — every I/O row, on white paper.
 * Reads the live wizard config so the print always matches the current state.
 */
export function PrintDrawing(): React.JSX.Element {
  const configName = useWizardStore((s) => s.configName);
  const equipment = useWizardStore((s) => s.equipment);
  const hardware = useWizardStore((s) => s.hardware);
  const activeIO = useWizardStore((s) => s.activeIO);
  const mappings = useWizardStore((s) => s.mappings);

  return createPortal(
    <div data-print-root>
      <PrintView
        name={configName || "Untitled Configuration"}
        equipment={equipment}
        hardware={hardware}
        activeIO={activeIO}
        mappings={mappings}
      />
    </div>,
    document.body
  );
}
