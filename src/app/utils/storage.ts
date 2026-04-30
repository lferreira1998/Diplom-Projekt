import { supabase } from "./supabase";
import type { WritingParams } from "../projects/parametrischestool/components/param-panel";

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

export async function getToolById(id: string): Promise<SavedTool | null> {
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapRow(data);
}
