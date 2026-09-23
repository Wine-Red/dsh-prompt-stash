import fs from "node:fs";
import path from "node:path";
import { describe, expect, test, vi } from "vitest";
import { apply as applyHost, Config } from "../src/index";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("release compatibility", () => {
  test("declares rc7.1 and only additive slots", () => {
    const compatibility = JSON.parse(read("compatibility.json"));
    const patch = read("cordis.patch.yml");
    expect(compatibility.supportedDshVersions).toEqual(["0.1.7-rc.1"]);
    expect(compatibility.adapter.mode).toBe("additive-public-slots");
    expect(patch).not.toContain("disabled: true");
  });

  test("registers the settings tab in the official plugin section", () => {
    const client = read("src/client/index.ts");
    expect(client).toContain('label: () => "Prompt Stash"');
    expect(client).toContain('id: "prompt-stash"');
  });

  test("contains fail-open boundaries for client and Host startup", () => {
    const client = read("src/client/index.ts");
    const host = read("src/index.ts");
    expect(client).toContain("function safeEffect");
    expect(client).toContain("function safeSlotInject");
    expect(client).toContain("function safeContribution");
    expect(client).toContain("disabled after startup failure");
    expect(host).toContain("Host settings disabled after startup failure");
  });

  test("does not escape a Host settings conflict into DSH startup", () => {
    const error = vi.fn();
    const ctx = {
      logger: { error },
      inject(_services: string[], install: (ctx: unknown) => void) {
        install({
          effect: (setup: () => unknown) => setup(),
          settings: {
            configure() {
              throw new Error("simulated namespace conflict");
            },
          },
        });
      },
    } as unknown as import("@deepseek-ai/cordis").Context;

    expect(() => applyHost(ctx)).not.toThrow();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("Host settings disabled after startup failure"),
    );
  });

  test("exports a serializable live shortcut schema and rejects invalid combinations", () => {
    expect(Config({}).shortcut.get()).toBe("Ctrl+S");
    expect(Config({ shortcut: "Alt+F8" }).shortcut.get()).toBe("Alt+F8");
    expect(() => Config({ shortcut: "Ctrl+Ctrl+S" })).toThrow();
    expect(() => Config({ shortcut: "Ctrl" })).toThrow();
    expect(JSON.stringify(Config)).not.toContain('"type":"transform"');
  });
});
