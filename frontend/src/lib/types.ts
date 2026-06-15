/* Domain types shared across the KOSMO app */

export type Theme = "light" | "dark";

export type DocKey = "brief" | "requirements" | "design" | "tasks" | "code";

export type View =
  | { kind: "home" }
  | { kind: "my-workspace" }
  | { kind: "new-project" }
  | { kind: "profile" }
  | { kind: "about" }
  | { kind: "global-settings"; tab: string }
  | { kind: "project-settings"; projectId: string; tab: string }
  | { kind: "workspace"; projectId: string; specId: string | null; doc: DocKey; autoStartBrief?: boolean };

export type ProviderKey = "deepseek" | "google" | "openai" | "anthropic";

export type AgentSpec = { provider: ProviderKey; model: string };

export type StageKey = "discovery" | "requirements" | "design" | "tasks";

export type StageAgents = { creator: AgentSpec; reviewer: AgentSpec };

export type AgentsConfig = {
  clarifier: AgentSpec;
  discovery: StageAgents;
  requirements: StageAgents;
  design: StageAgents;
  tasks: StageAgents;
  configured: boolean;
};

export type ApiKeys = Record<ProviderKey, string>;

export type AgentSlotKey =
  | "clarifier"
  | `${StageKey}.creator`
  | `${StageKey}.reviewer`;

export type SpecRef = { id: string; name: string };

export type ProjectStatus = "active" | "paused" | "archived";

export type ProjectMeta = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  /** ISO date string */
  updatedAt: string;
  cost: number;
  tokens: number;
  specsCount: number;
  tags: string[];
};

export type DocSlot = { specId: string | null; doc: DocKey };