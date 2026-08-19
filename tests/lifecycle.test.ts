import { describe, expect, it, vi } from "vitest";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import { apply } from "../src/client/index";
import { STYLE_ID } from "../src/client/styles";
import { MemoryPromptStashSettings } from "./settings-fixture";

interface Harness {
  readonly ctx: ClientContext;
  readonly registrations: string[];
  dispose(): void;
}

function createHarness(): Harness {
  const disposers: Array<() => void> = [];
  const registrations: string[] = [];
  const settingsScope = new MemoryPromptStashSettings();

  const ctx = {
    logger: {
      error: vi.fn(),
    },
    effect(setup: () => void | (() => void)) {
      const dispose = setup();
      if (typeof dispose === "function") disposers.push(dispose);
    },
    locale: {
      register() {
        return () => undefined;
      },
    },
    settingsScope: {
      bind() {
        return settingsScope;
      },
    },
    slots: {
      inject(_name: string, setup: () => () => void) {
        const dispose = setup();
        disposers.push(dispose);
        return dispose;
      },
      register(options: { name: string; id: string; key?: string }) {
        registrations.push(
          `${options.name}:${options.key === undefined ? options.id : options.key}`,
        );
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
      "settings.plugin.item:dsh-prompt-stash",
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

  it("does not escape a settings initialization failure into DSH startup", () => {
    const error = vi.fn();
    const ctx = {
      logger: { error },
      settingsScope: {
        bind() {
          throw new Error("simulated settings failure");
        },
      },
    } as unknown as ClientContext;

    expect(() => apply(ctx)).not.toThrow();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        "plugin initialization disabled after startup failure",
      ),
    );
  });

  it("isolates a slot registration conflict and continues other slots", () => {
    const harness = createHarness();
    const error = vi.fn();
    let registrations = 0;
    const ctx = harness.ctx as unknown as {
      logger: { error: typeof error };
      slots: { register: (...args: unknown[]) => () => void };
    };
    ctx.logger.error = error;
    const originalRegister = ctx.slots.register;
    ctx.slots.register = (...args: unknown[]) => {
      registrations += 1;
      if (registrations === 1) throw new Error("simulated slot conflict");
      return originalRegister(...args);
    };

    expect(() => apply(harness.ctx)).not.toThrow();
    expect(registrations).toBe(3);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        "conversation.input.left disabled after startup failure",
      ),
    );
    harness.dispose();
  });
});
