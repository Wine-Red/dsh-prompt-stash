import { describe, expect, it } from "vitest";
import {
  DEFAULT_STACK_LIMIT,
  STORAGE_KEY,
  createEntry,
} from "../src/client/model";
import {
  emptyDocument,
  entriesFor,
  prepareSwap,
  pushEntry,
  readDocument,
} from "../src/client/storage";

describe("prompt stash storage", () => {
  it("keeps LIFO order and trims the oldest entry at ten", () => {
    let document = emptyDocument();
    for (let index = 0; index < DEFAULT_STACK_LIMIT + 2; index += 1) {
      document = pushEntry(
        document,
        "session-a",
        createEntry(`draft-${index}`, index, `id-${index}`),
      );
    }
    expect(entriesFor(document, "session-a")).toHaveLength(10);
    expect(
      entriesFor(document, "session-a").map((entry) => entry.text),
    ).toEqual([
      "draft-11",
      "draft-10",
      "draft-9",
      "draft-8",
      "draft-7",
      "draft-6",
      "draft-5",
      "draft-4",
      "draft-3",
      "draft-2",
    ]);
  });

  it("isolates session stacks and permits duplicate text", () => {
    let document = emptyDocument();
    document = pushEntry(document, "a", createEntry("same", 1, "a1"));
    document = pushEntry(document, "a", createEntry("same", 2, "a2"));
    document = pushEntry(document, "b", createEntry("other", 3, "b1"));
    expect(entriesFor(document, "a").map((entry) => entry.id)).toEqual([
      "a2",
      "a1",
    ]);
    expect(entriesFor(document, "b").map((entry) => entry.id)).toEqual(["b1"]);
  });

  it("degrades corrupt, invalid, and future data to a safe empty document", () => {
    window.localStorage.setItem(STORAGE_KEY, "{broken");
    expect(readDocument(window.localStorage)).toEqual(emptyDocument());

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, sessions: {} }),
    );
    expect(readDocument(window.localStorage)).toEqual(emptyDocument());

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, sessions: { a: [{ id: "bad" }] } }),
    );
    expect(readDocument(window.localStorage)).toEqual(emptyDocument());
  });

  it("keeps both target and current drafts in the persisted swap stage", () => {
    const target = createEntry("target", 1, "target");
    const current = createEntry("current", 2, "current");
    const staged = prepareSwap(
      pushEntry(emptyDocument(), "a", target),
      "a",
      current,
      target.id,
    );
    expect(entriesFor(staged, "a").map((entry) => entry.text)).toEqual([
      "current",
      "target",
    ]);
  });
});
