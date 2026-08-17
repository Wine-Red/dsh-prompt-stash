import { describe, expect, it } from "vitest";
import {
  decodePromptStashSettings,
  LEGACY_SHORTCUT_STORAGE_KEY,
  migrateLegacyShortcut,
} from "../src/settings";
import { MemoryPromptStashSettings } from "./settings-fixture";

describe("prompt stash Host settings", () => {
  it("decodes and normalizes the Host shortcut section", () => {
    expect(decodePromptStashSettings({ shortcut: "alt+f8" })).toEqual({
      shortcut: "Alt+F8",
    });
    expect(
      decodePromptStashSettings({ shortcut: "Ctrl+Ctrl+S" }),
    ).toBeUndefined();
    expect(decodePromptStashSettings(null)).toBeUndefined();
  });

  it("migrates an old browser shortcut only when Host has no override", async () => {
    const scope = new MemoryPromptStashSettings();
    window.localStorage.setItem(
      LEGACY_SHORTCUT_STORAGE_KEY,
      JSON.stringify({ version: 1, shortcut: "alt+f8" }),
    );

    await migrateLegacyShortcut(scope, window.localStorage);

    expect(scope.getSnapshot().value).toEqual({ shortcut: "Alt+F8" });
    expect(window.localStorage.getItem(LEGACY_SHORTCUT_STORAGE_KEY)).toBeNull();
  });

  it("keeps Host authoritative and removes an obsolete browser value", async () => {
    const scope = new MemoryPromptStashSettings("F9", {
      user: { shortcut: "F9" },
    });
    window.localStorage.setItem(
      LEGACY_SHORTCUT_STORAGE_KEY,
      JSON.stringify({ version: 1, shortcut: "F8" }),
    );

    await migrateLegacyShortcut(scope, window.localStorage);

    expect(scope.getSnapshot().value).toEqual({ shortcut: "F9" });
    expect(window.localStorage.getItem(LEGACY_SHORTCUT_STORAGE_KEY)).toBeNull();
  });
});
