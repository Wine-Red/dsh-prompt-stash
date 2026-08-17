import type {
  SettingsScope,
  SettingsScopeSnapshot,
} from "@deepseek-ai/dsh-client-runtime/client";
import type { PromptStashSettings } from "../src/settings";

export class MemoryPromptStashSettings
  implements SettingsScope<PromptStashSettings>
{
  private readonly listeners = new Set<() => void>();
  private snapshot: SettingsScopeSnapshot<PromptStashSettings>;

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

  getSnapshot(): SettingsScopeSnapshot<PromptStashSettings> {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async set(field: string, value: unknown): Promise<void> {
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
  }

  async unset(field: string): Promise<void> {
    if (field !== "shortcut") throw new Error("invalid settings clear");
    await this.set("shortcut", "Ctrl+S");
    this.snapshot = { ...this.snapshot, user: {} };
  }
}
