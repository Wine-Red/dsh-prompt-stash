import type {
  ConfigForm,
  ConfigFormSnapshot,
} from "@deepseek-ai/dsh-client-ui-settings/client";
import type { PromptStashSettings } from "../src/settings";

export class MemoryPromptStashSettings
  implements ConfigForm<PromptStashSettings>
{
  private readonly listeners = new Set<() => void>();
  private snapshot: ConfigFormSnapshot<PromptStashSettings>;

  constructor(
    shortcut = "Ctrl+S",
    options: { user?: unknown; writable?: boolean } = {},
  ) {
    this.snapshot = {
      status: "ready",
      value: { shortcut },
      base: { shortcut: "Ctrl+S" },
      user: options.user ?? {},
      revision: 0,
      writable: options.writable ?? true,
      mode: "host",
    };
  }

  getSnapshot(): ConfigFormSnapshot<PromptStashSettings> {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async set(field: string, value: unknown): Promise<boolean> {
    if (!this.snapshot.writable) throw new Error("settings are read-only");
    if (field !== "shortcut" || typeof value !== "string")
      throw new Error("invalid settings write");
    this.snapshot = {
      ...this.snapshot,
      value: { shortcut: value },
      user: { shortcut: value },
      revision: (this.snapshot.revision ?? 0) + 1,
    };
    for (const listener of this.listeners) listener();
    return true;
  }

  async mutate(
    ops: readonly {
      op: "set" | "unset";
      path: readonly string[];
      value?: unknown;
    }[],
  ): Promise<boolean> {
    for (const op of ops) {
      if (op.op === "set") await this.set(op.path[0]!, op.value);
      else await this.unset(op.path[0]!);
    }
    return true;
  }

  async unset(field: string): Promise<boolean> {
    if (field !== "shortcut") throw new Error("invalid settings clear");
    await this.set("shortcut", "Ctrl+S");
    this.snapshot = { ...this.snapshot, user: {} };
    return true;
  }
}
