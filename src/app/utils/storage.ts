import type { WritingParams } from "../projects/parametrischestool/components/param-panel";

export interface SavedTool {
  id: string;
  savedAt: string;
  name: string;
  description: string;
  params: WritingParams;
}

const KEY = "shapingThought_tools";

export function getSavedTools(): SavedTool[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function upsertTool(name: string, description: string, params: WritingParams): void {
  const tools = getSavedTools();
  const idx = tools.findIndex(t => t.name === name);
  const entry: SavedTool = {
    id: idx >= 0 ? tools[idx].id : crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    name,
    description,
    params,
  };
  if (idx >= 0) tools[idx] = entry;
  else tools.push(entry);
  localStorage.setItem(KEY, JSON.stringify(tools));
}
