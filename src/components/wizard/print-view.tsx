import { getAvailablePorts } from "@/hardware";
import type { Equipment, HardwareConfig } from "@/types/config";
import type { ActiveIOItem } from "@/types/io";
import type { PortMapping } from "@/types/port";

interface PrintViewProps {
  name: string;
  equipment: Equipment;
  hardware: HardwareConfig;
  activeIO: ActiveIOItem[];
  mappings: PortMapping[];
}

/** One labelled fact in the drawing header. */
function HeaderField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground mt-0.5">{value}</dd>
    </div>
  );
}

/**
 * Print-friendly Panel I/O drawing: the full table of every I/O item with its
 * tag, name, signal, mapped port, pins, and notes. Presentational only — reads
 * exclusively from props. The print stylesheet in index.css renders this on
 * white paper with black text and repeats the table header on every page.
 */
export function PrintView({
  name,
  equipment,
  hardware,
  activeIO,
  mappings,
}: PrintViewProps): React.JSX.Element {
  const availablePorts = getAvailablePorts(hardware.brainPlusCount);
  const brainPlusLabel =
    hardware.brainPlusCount === 0
      ? "None"
      : hardware.brainPlusCount === 1
        ? "1 × BRAIN+"
        : "2 × BRAIN+";
  const mappedCount = activeIO.filter((item) => mappings.some((m) => m.ioId === item.id)).length;

  return (
    <section aria-label="Panel I/O drawing" className="text-foreground p-8 text-sm">
      <header className="border-border mb-5 border-b-2 pb-4">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
          EMIT · Panel I/O Summary
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{name}</h1>
        <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
          <HeaderField label="Engine" value={equipment.engineType || "—"} />
          <HeaderField label="Compressor" value={equipment.compressorModel || "—"} />
          <HeaderField
            label="Stages / Coolers"
            value={`${equipment.stages} / ${equipment.coolerSections}`}
          />
          <HeaderField label="Hardware" value={`BRAIN + ${brainPlusLabel}`} />
          <HeaderField label="Mapped" value={`${mappedCount} of ${activeIO.length}`} />
        </dl>
      </header>

      <table className="w-full border-collapse">
        <caption className="text-muted-foreground mb-2 text-left text-xs">
          Auto-generated I/O summary — verify against approved panel drawings before installation.
        </caption>
        <thead>
          <tr className="border-border border-b-2 text-left align-bottom">
            <th className="w-8 py-2 pr-3 text-xs font-semibold">#</th>
            <th className="py-2 pr-4 text-xs font-semibold">Tag</th>
            <th className="py-2 pr-4 text-xs font-semibold">Name</th>
            <th className="py-2 pr-4 text-xs font-semibold">Signal</th>
            <th className="py-2 pr-4 text-xs font-semibold">Port</th>
            <th className="py-2 pr-4 text-xs font-semibold">Pins</th>
            <th className="py-2 text-xs font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {activeIO.map((item, index) => {
            const mapping = mappings.find((m) => m.ioId === item.id);
            const port = mapping ? availablePorts.find((p) => p.id === mapping.portId) : undefined;
            const isMapped = mapping !== undefined && port !== undefined;
            return (
              <tr key={item.id} className="border-border border-b align-top">
                <td className="text-muted-foreground py-1.5 pr-3 font-mono text-xs">{index + 1}</td>
                <td className="py-1.5 pr-4 font-mono text-xs font-medium">{item.tag}</td>
                <td className="py-1.5 pr-4">{item.name}</td>
                <td className="py-1.5 pr-4 font-mono text-xs">{item.signal}</td>
                <td className="py-1.5 pr-4 font-mono text-xs">{isMapped ? port.label : "—"}</td>
                <td className="py-1.5 pr-4 font-mono text-xs">
                  {isMapped ? port.pinNumbers.join(", ") : "—"}
                </td>
                <td className="text-muted-foreground py-1.5 text-xs">
                  {isMapped ? item.notes || "" : "Unmapped"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {activeIO.length === 0 && (
        <p className="text-muted-foreground mt-4">No I/O items configured.</p>
      )}
    </section>
  );
}
