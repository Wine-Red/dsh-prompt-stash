import { describe, expect, it } from "vitest";
import {
  DEFAULT_STASH_SHORTCUT,
  matchesShortcut,
  normalizeShortcut,
  parseShortcut,
  shortcutFromKeyboardEvent,
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

  it("normalizes valid settings values without using browser storage", () => {
    expect(DEFAULT_STASH_SHORTCUT).toBe("Ctrl+S");
    expect(normalizeShortcut("alt+f8")).toBe("Alt+F8");
    expect(normalizeShortcut("Ctrl+Ctrl+S")).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });
});
