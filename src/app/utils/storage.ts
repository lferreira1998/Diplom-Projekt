import { supabase } from "./supabase";
import type { WritingParams } from "../projects/parametrischestool/components/param-panel";

// ── New-tool types ────────────────────────────────────────────────────────────
export interface NewToolParams {
  source: "new";
  sessionId: string;
  displayName: string;
  prompts: string[];
  asciiImage: string | null;
  timerEnabled: boolean;
  timerMode: string;
  timerMinutes: number;
  visualTimer: boolean;
  timerUserReset: boolean;
  cursorRunning: boolean;
  visibility: string;
  deleteMode: string;
  correctionVisible: boolean;
  textFliegtEnabled: boolean;
  fliegtUnit: string;
  fliegtZeitpunkt: number;
  fliegtSchnelligkeit: number;
  textVerblassEnabled: boolean;
  verblassZeitpunkt: number;
  verblassSchnelligkeit: number;
  positionMode: string;
  grainLevel: number;
  textSizeLevel: number;
  bgHue: number | null;
}

export interface NewToolData {
  id: string;
  savedAt: string;
  name: string;
  description: string;
  params: NewToolParams;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNewRow(row: any): NewToolData {
  return {
    id: row.id,
    savedAt: row.saved_at,
    name: row.params?.displayName || row.name,
    description: row.description ?? "",
    params: row.params as NewToolParams,
  };
}

export async function saveNewTool(
  displayName: string,
  description: string,
  params: Omit<NewToolParams, "displayName">
): Promise<string> {
  const uniqueName = `${displayName.trim() || "Untitled"}_${Date.now()}`;
  const fullParams: NewToolParams = { ...params, displayName: displayName.trim() || "Untitled" };
  const { data, error } = await supabase
    .from("tools")
    .insert({ name: uniqueName, description, params: fullParams })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateNewTool(
  id: string,
  displayName: string,
  description: string,
  params: Omit<NewToolParams, "displayName">
): Promise<string> {
  const fullParams: NewToolParams = { ...params, displayName: displayName.trim() || "Untitled" };
  const { error } = await supabase
    .from("tools")
    .update({ description, params: fullParams })
    .eq("id", id);
  if (error) throw error;
  return id;
}

export async function getAllNewTools(): Promise<NewToolData[]> {
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).filter((row: any) => row.params?.source === "new").map(mapNewRow);
}

export async function deleteNewTool(id: string): Promise<void> {
  const { error } = await supabase.from("tools").delete().eq("id", id);
  if (error) throw error;
}

export async function getNewToolById(id: string): Promise<NewToolData | null> {
  const { data, error } = await supabase
    .from("tools").select("*").eq("id", id).single();
  if (error || !data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data as any).params?.source !== "new") return null;
  return mapNewRow(data);
}

export interface SavedTool {
  id: string;
  savedAt: string;
  name: string;
  description: string;
  params: WritingParams;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): SavedTool {
  return {
    id: row.id,
    savedAt: row.saved_at,
    name: row.name,
    description: row.description ?? "",
    params: row.params as WritingParams,
  };
}

export async function getSavedTools(): Promise<SavedTool[]> {
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function upsertTool(
  name: string,
  description: string,
  params: WritingParams
): Promise<string> {
  const { data, error } = await supabase
    .from("tools")
    .upsert({ name, description, params }, { onConflict: "name" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function deleteTool(id: string): Promise<void> {
  const { error } = await supabase.from("tools").delete().eq("id", id);
  if (error) throw error;
}

export async function getToolById(id: string): Promise<SavedTool | null> {
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapRow(data);
}
