import { describe, expect, it, vi } from "vitest";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import { apply } from "../src/client/index";
import { STYLE_ID } from "../src/client/styles";

interface Harness {
  readonly ctx: ClientContext;
  readonly registrations: string[];
  dispose(): void;
}

function createHarness(): Harness {
  const disposers: Array<() => void> = [];
  const registrations: string[] = [];

  const ctx = {
    effect(setup: () => void | (() => void)) {
      const dispose = setup();
      if (typeof dispose === "function") disposers.push(dispose);
    },
    locale: {
      register() {
        return () => undefined;
      },
    },
    slots: {
      inject(_name: string, setup: () => () => void) {
        const dispose = setup();
        disposers.push(dispose);
        return dispose;
      },
      register(options: { name: string; id: string }) {
        registrations.push(`${options.name}:${options.id}`);
        return () => undefined;
      },
    },
  } as unknown as ClientContext;

  return {
    ctx,
    registrations,
    dispose() {
      for (const dispose of disposers.reverse()) dispose();
    },
  };
}

describe("client plugin lifecycle", () => {
  it("unloads cleanly and does not accumulate slots, styles, or storage listeners across HMR", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const first = createHarness();
    apply(first.ctx);
    expect(first.registrations).toEqual([
      "conversation.input.left:prompt-stash",
      "conversation.input.dock:prompt-stash",
    ]);
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
    first.dispose();
    expect(document.getElementById(STYLE_ID)).toBeNull();

    const second = createHarness();
    apply(second.ctx);
    expect(second.registrations).toEqual(first.registrations);
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
    second.dispose();

    expect(add.mock.calls.filter(([type]) => type === "storage")).toHaveLength(
      2,
    );
    expect(
      remove.mock.calls.filter(([type]) => type === "storage"),
    ).toHaveLength(2);
    add.mockRestore();
    remove.mockRestore();
  });
});
