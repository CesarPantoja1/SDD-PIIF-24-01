/* Centralized localStorage keys for KOSMO. All keys live here so the future
 * migration to Lovable Cloud has a single map to swap. */
import type { AgentSlotKey, DocKey } from "./types";

export const PREFS_KEY = "kosmo.agentPrefs.v2";
export const KEYS_KEY = "kosmo.apiKeys";
export const DELETED_KEY = "kosmo.deletedProjects";

export const projectAgentsKey = (id: string) => `kosmo.project.${id}.agents.v2`;
export const generatedKey = (id: string) => `kosmo.project.${id}.generated`;
export const specsKey = (id: string) => `kosmo.project.${id}.specs`;
export const projectNameKey = (id: string) => `kosmo.project.${id}.name`;
export const openSpecsKey = (id: string) => `kosmo.project.${id}.openSpecs`;

export function promptKey(scope: "global" | string, slot: AgentSlotKey) {
  return scope === "global"
    ? `kosmo.prompt.global.${slot}`
    : `kosmo.prompt.project.${scope}.${slot}`;
}

/** Stable key for the generated map: "brief" or "<specId>.<doc>" */
export function docKey(specId: string | null, doc: DocKey) {
  return doc === "brief" ? "brief" : `${specId}.${doc}`;
}