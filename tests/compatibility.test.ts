import fs from "node:fs";
import path from "node:path";
import { describe, expect, test, vi } from "vitest";
import { apply as applyHost } from "../src/index";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("release compatibility", () => {
  test("declares rc6 through rc8 and only additive slots", () => {
    const compatibility = JSON.parse(read("compatibility.json"));
    const patch = read("cordis.patch.yml");
    expect(compatibility.supportedDshVersions).toEqual([
      "0.1.0-rc.6",
      "0.1.0-rc.7",
      "0.1.0-rc.8",
    ]);
    expect(compatibility.adapter.mode).toBe("additive-public-slots");
    expect(patch).not.toContain("disabled: true");
  });

  test("retains both settings dispatch identifiers", () => {
    const client = read("src/client/index.ts");
    expect(client).toContain("key: PROMPT_STASH_SETTINGS_NAMESPACE");
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
          settings: {
            register() {
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
});
