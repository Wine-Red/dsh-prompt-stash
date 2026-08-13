import { describe, expect, it, vi } from "vitest";
import { PromptStashController } from "../src/client/controller";
import { STORAGE_KEY, createEntry } from "../src/client/model";
import {
  emptyDocument,
  pushEntry,
  writeDocument,
  type StorageLike,
} from "../src/client/storage";
import { inputState } from "./fixtures";

class FailingStorage implements StorageLike {
  getItem(): string | null {
    return null;
  }
  setItem(): void {
    throw new DOMException("quota", "QuotaExceededError");
  }
  removeItem(): void {}
}

describe("PromptStashController", () => {
  it.each([
    ["empty", inputState({ draft: "   " })],
    ["adjudicating", inputState({ draft: "text", phase: "adjudicating" })],
    ["claimed", inputState({ draft: "text", phase: "claimed" })],
    ["submitting", inputState({ draft: "text", phase: "submitting" })],
    ["images", inputState({ draft: "text", imageIds: ["image" as never] })],
    ["occurrences", inputState({ draft: "text", occurrences: [{} as never] })],
  ])("refuses unsafe stash state: %s", (_, input) => {
    const controller = new PromptStashController(window.localStorage);
    const setDraft = vi.fn();
    expect(controller.stash("session", input, { setDraft })).toBe(false);
    expect(setDraft).not.toHaveBeenCalled();
    expect(controller.entries("session")).toHaveLength(0);
    controller.dispose();
  });

  it("does not clear the composer when localStorage write fails", () => {
    const controller = new PromptStashController(new FailingStorage());
    const setDraft = vi.fn();
    expect(
      controller.stash("session", inputState({ draft: "important" }), {
        setDraft,
      }),
    ).toBe(false);
    expect(setDraft).not.toHaveBeenCalled();
    expect(controller.getSnapshot().notice?.key).toBe("error.storageWrite");
    controller.dispose();
  });

  it("restores into an empty composer and removes the stash", () => {
    const document = pushEntry(
      emptyDocument(),
      "session",
      createEntry("original", 1, "target"),
    );
    writeDocument(window.localStorage, document);
    const controller = new PromptStashController(window.localStorage);
    const setDraft = vi.fn();
    expect(
      controller.restoreEmpty("session", "target", inputState(), { setDraft }),
    ).toBe(true);
    expect(setDraft).toHaveBeenCalledWith("original");
    expect(controller.entries("session")).toEqual([]);
    controller.dispose();
  });

  it("never directly restores over a non-empty composer", () => {
    const document = pushEntry(
      emptyDocument(),
      "session",
      createEntry("target", 1, "target"),
    );
    writeDocument(window.localStorage, document);
    const controller = new PromptStashController(window.localStorage);
    const setDraft = vi.fn();
    expect(
      controller.restoreEmpty(
        "session",
        "target",
        inputState({ draft: "current" }),
        { setDraft },
      ),
    ).toBe(false);
    expect(setDraft).not.toHaveBeenCalled();
    expect(controller.entries("session")).toHaveLength(1);
    controller.dispose();
  });

  it("stashes current content before swapping and loses neither side", () => {
    const document = pushEntry(
      emptyDocument(),
      "session",
      createEntry("target", 1, "target"),
    );
    writeDocument(window.localStorage, document);
    const controller = new PromptStashController(
      window.localStorage,
      () => 2,
      () => "current",
    );
    const setDraft = vi.fn();
    expect(
      controller.swapAndRestore(
        "session",
        "target",
        inputState({ draft: "current text" }),
        { setDraft },
      ),
    ).toBe(true);
    expect(setDraft).toHaveBeenCalledWith("target");
    expect(controller.entries("session").map((entry) => entry.text)).toEqual([
      "current text",
    ]);
    controller.dispose();
  });

  it("deletes one item and clears only the addressed session", () => {
    let document = pushEntry(
      emptyDocument(),
      "a",
      createEntry("one", 1, "one"),
    );
    document = pushEntry(document, "a", createEntry("two", 2, "two"));
    document = pushEntry(document, "b", createEntry("other", 3, "other"));
    writeDocument(window.localStorage, document);
    const controller = new PromptStashController(window.localStorage);
    expect(controller.delete("a", "two")).toBe(true);
    expect(controller.getSnapshot().notice).toBeNull();
    expect(controller.entries("a").map((entry) => entry.id)).toEqual(["one"]);
    expect(controller.clear("a")).toBe(true);
    expect(controller.entries("a")).toEqual([]);
    expect(controller.entries("b")).toHaveLength(1);
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("other");
    controller.dispose();
  });

  it("closes an open panel when its final item is removed", () => {
    const document = pushEntry(
      emptyDocument(),
      "session",
      createEntry("only", 1, "only"),
    );
    writeDocument(window.localStorage, document);
    const controller = new PromptStashController(window.localStorage);
    controller.toggle("session");
    expect(controller.getSnapshot().openSessionId).toBe("session");

    expect(controller.delete("session", "only")).toBe(true);
    expect(controller.getSnapshot().openSessionId).toBeNull();
    controller.dispose();
  });
});
