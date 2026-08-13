export const DEFAULT_STASH_SHORTCUT = "Ctrl+S";
export const SHORTCUT_STORAGE_KEY = "dsh.promptStash.settings.v1";

export interface ShortcutSpec {
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
  readonly key: string;
}

const MODIFIER_ORDER = ["Ctrl", "Alt", "Shift", "Meta"] as const;

const KEY_ALIASES: Readonly<Record<string, string>> = {
  " ": "Space",
  esc: "Escape",
  spacebar: "Space",
  del: "Delete",
  return: "Enter",
  plus: "Plus",
  "+": "Plus",
};

function normalizeKey(key: string): string | null {
  const trimmed = key.trim();
  if (key === " ") return "Space";
  if (trimmed === "") return null;
  const alias = KEY_ALIASES[trimmed.toLowerCase()];
  if (alias !== undefined) return alias;
  if (trimmed.length === 1) return trimmed.toUpperCase();
  return trimmed[0]!.toUpperCase() + trimmed.slice(1);
}

export function formatShortcut(spec: ShortcutSpec): string {
  const parts: string[] = [];
  if (spec.ctrl) parts.push(MODIFIER_ORDER[0]);
  if (spec.alt) parts.push(MODIFIER_ORDER[1]);
  if (spec.shift) parts.push(MODIFIER_ORDER[2]);
  if (spec.meta) parts.push(MODIFIER_ORDER[3]);
  parts.push(spec.key);
  return parts.join("+");
}

export function parseShortcut(value: string): ShortcutSpec | null {
  const rawParts = value
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  if (rawParts.length === 0) return null;

  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;
  let key: string | null = null;

  for (const rawPart of rawParts) {
    const part = rawPart.toLowerCase();
    if (part === "ctrl" || part === "control") {
      if (ctrl) return null;
      ctrl = true;
      continue;
    }
    if (part === "alt" || part === "option") {
      if (alt) return null;
      alt = true;
      continue;
    }
    if (part === "shift") {
      if (shift) return null;
      shift = true;
      continue;
    }
    if (part === "meta" || part === "cmd" || part === "command") {
      if (meta) return null;
      meta = true;
      continue;
    }
    if (key !== null) return null;
    key = normalizeKey(rawPart);
  }

  if (key === null || ["Control", "Alt", "Shift", "Meta"].includes(key))
    return null;
  return { ctrl, alt, shift, meta, key };
}

export function shortcutFromKeyboardEvent(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey"
  >,
): string | null {
  if (
    ["Control", "Alt", "Shift", "Meta", "Process", "Dead"].includes(event.key)
  )
    return null;
  const key = normalizeKey(event.key);
  if (key === null) return null;
  return formatShortcut({
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
    key,
  });
}

export function matchesShortcut(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey"
  >,
  shortcut: string,
): boolean {
  const expected = parseShortcut(shortcut);
  const actual = shortcutFromKeyboardEvent(event);
  return expected !== null && actual === formatShortcut(expected);
}

export function readShortcut(storage: Pick<Storage, "getItem">): string {
  try {
    const raw = storage.getItem(SHORTCUT_STORAGE_KEY);
    if (raw === null) return DEFAULT_STASH_SHORTCUT;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== 1 ||
      typeof (parsed as { shortcut?: unknown }).shortcut !== "string"
    )
      return DEFAULT_STASH_SHORTCUT;
    const spec = parseShortcut((parsed as { shortcut: string }).shortcut);
    return spec === null ? DEFAULT_STASH_SHORTCUT : formatShortcut(spec);
  } catch {
    return DEFAULT_STASH_SHORTCUT;
  }
}

export function writeShortcut(
  storage: Pick<Storage, "setItem">,
  shortcut: string,
): string {
  const spec = parseShortcut(shortcut);
  if (spec === null) throw new TypeError("Invalid shortcut");
  const normalized = formatShortcut(spec);
  storage.setItem(
    SHORTCUT_STORAGE_KEY,
    JSON.stringify({ version: 1, shortcut: normalized }),
  );
  return normalized;
}
