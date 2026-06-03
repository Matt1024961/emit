/**
 * Supported Ariel compressor models, grouped by series.
 * Edit this file to add new models — no code changes required.
 */
export interface CompressorModelGroup {
  series: string;
  models: string[];
}

export const COMPRESSOR_MODEL_GROUPS: CompressorModelGroup[] = [
  {
    series: "JG/JGC Series",
    models: ["JG/2", "JG/4", "JGC/2", "JGC/4", "JGC/6"],
  },
  {
    series: "KB/KBB Series",
    models: ["KBK", "KBZ", "KBB", "KBT"],
  },
  {
    series: "JGK Series",
    models: ["JGK/2", "JGK/4"],
  },
  {
    series: "JGT Series",
    models: ["JGT/2", "JGT/4"],
  },
  {
    series: "JGA/JGB Series",
    models: ["JGA", "JGB"],
  },
  {
    series: "Other",
    models: ["JGR", "JGP", "KBU", "KVS", "KVR", "KVG"],
  },
];

export const ALL_COMPRESSOR_MODELS: string[] = COMPRESSOR_MODEL_GROUPS.flatMap((g) => g.models);
