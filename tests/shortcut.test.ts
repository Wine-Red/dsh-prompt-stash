import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_STASH_SHORTCUT,
  SHORTCUT_STORAGE_KEY,
  matchesShortcut,
  parseShortcut,
  readShortcut,
  shortcutFromKeyboardEvent,
  writeShortcut,
} from "../src/client/shortcut";

describe("prompt stash shortcut", () => {
  it("normalizes single keys and modifier combinations", () => {
    expect(parseShortcut("f8")).toEqual({
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
      key: "F8",
    });
    expect(
      shortcutFromKeyboardEvent({
        key: "k",
        ctrlKey: true,
        altKey: true,
        shiftKey: false,
        metaKey: false,
      }),
    ).toBe("Ctrl+Alt+K");
    expect(parseShortcut("Ctrl+Ctrl+S")).toBeNull();
    expect(parseShortcut("Ctrl+S+K")).toBeNull();
    expect(parseShortcut("Control")).toBeNull();
  });

  it("matches the configured shortcut exactly", () => {
    const event = {
      key: "s",
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    };
    expect(matchesShortcut(event, "Ctrl+S")).toBe(true);
    expect(matchesShortcut({ ...event, shiftKey: true }, "Ctrl+S")).toBe(false);
    expect(matchesShortcut({ ...event, ctrlKey: false }, "S")).toBe(true);
  });

  it("persists a versioned shortcut and falls back on invalid data", () => {
    const storage = window.localStorage;
    expect(readShortcut(storage)).toBe(DEFAULT_STASH_SHORTCUT);
    expect(writeShortcut(storage, "alt+f8")).toBe("Alt+F8");
    expect(readShortcut(storage)).toBe("Alt+F8");
    expect(JSON.parse(storage.getItem(SHORTCUT_STORAGE_KEY) ?? "null")).toEqual(
      {
        version: 1,
        shortcut: "Alt+F8",
      },
    );

    storage.setItem(SHORTCUT_STORAGE_KEY, "not json");
    expect(readShortcut(storage)).toBe(DEFAULT_STASH_SHORTCUT);
    const failing = {
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };
    expect(() => writeShortcut(failing, "F8")).toThrow("quota");
  });
});
