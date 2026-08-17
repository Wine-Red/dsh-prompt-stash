import type { SettingsScope } from "@deepseek-ai/dsh-client-runtime/client";
import { DEFAULT_STASH_SHORTCUT, normalizeShortcut } from "./client/shortcut";

/** Stable Host settings namespace owned by prompt stash. */
export const PROMPT_STASH_SETTINGS_NAMESPACE = "dsh-prompt-stash";
export const PROMPT_STASH_SHORTCUT_FIELD = "shortcut";
export const LEGACY_SHORTCUT_STORAGE_KEY = "dsh.promptStash.settings.v1";

export interface PromptStashSettings {
  readonly shortcut: string;
}

export const DEFAULT_PROMPT_STASH_SETTINGS: PromptStashSettings = Object.freeze(
  {
    shortcut: DEFAULT_STASH_SHORTCUT,
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow and normalize the redacted Host settings payload. */
export function decodePromptStashSettings(
  value: unknown,
): PromptStashSettings | undefined {
  if (!isRecord(value) || typeof value.shortcut !== "string") return undefined;
  const shortcut = normalizeShortcut(value.shortcut);
  return shortcut === null ? undefined : { shortcut };
}

function legacyShortcut(storage: Pick<Storage, "getItem">): string | null {
  try {
    const raw = storage.getItem(LEGACY_SHORTCUT_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.shortcut !== "string"
    )
      return null;
    return normalizeShortcut(parsed.shortcut);
  } catch {
    return null;
  }
}

function hasHostShortcutOverride(user: unknown): boolean {
  return (
    isRecord(user) &&
    Object.prototype.hasOwnProperty.call(user, PROMPT_STASH_SHORTCUT_FIELD)
  );
}

/**
 * Move the obsolete browser-local preference into Host settings once. Host
 * state always wins, and the legacy key is removed after it is no longer
 * needed. Stashed prompt content remains browser-local under its separate key.
 */
export async function migrateLegacyShortcut(
  scope: SettingsScope<PromptStashSettings>,
  storage: Pick<Storage, "getItem" | "removeItem">,
): Promise<void> {
  const snapshot = scope.getSnapshot();
  if (snapshot.status !== "ready" || !snapshot.writable) return;

  const shortcut = legacyShortcut(storage);
  if (shortcut !== null && !hasHostShortcutOverride(snapshot.user)) {
    await scope.set(PROMPT_STASH_SHORTCUT_FIELD, shortcut);
  }
  storage.removeItem(LEGACY_SHORTCUT_STORAGE_KEY);
}
