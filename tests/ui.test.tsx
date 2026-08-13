import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import { PromptStashController } from "../src/client/controller";
import { en, zh, type PromptStashLocaleKey } from "../src/client/locales";
import { createEntry } from "../src/client/model";
import { PromptStashButton } from "../src/client/PromptStashButton";
import { PromptStashList } from "../src/client/PromptStashList";
import { PromptStashSettings } from "../src/client/PromptStashSettings";
import { emptyDocument, pushEntry, writeDocument } from "../src/client/storage";
import { installStyles, STYLE_ID } from "../src/client/styles";
import { inputState } from "./fixtures";

const t: TranslateNS<"prompt-stash"> = (
  key,
  params?: Record<string, unknown>,
): string => {
  const template = (zh as Readonly<Record<string, string>>)[key] ?? String(key);
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params?.[name] ?? `{${name}}`),
  );
};

describe("prompt stash UI", () => {
  it("ships complete Chinese and English dictionaries", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    expect(zh["action.stash"]).toBe("暂存");
    expect(en["action.stash"]).toBe("Stash");
  });

  it("exposes labeled keyboard-operable controls and hides an empty panel", async () => {
    const user = userEvent.setup();
    const controller = new PromptStashController(
      window.localStorage,
      () => 1,
      () => "one",
    );
    const setDraft = vi.fn();
    const input = inputState({ draft: "long draft" });
    render(
      <PromptStashButton
        controller={controller}
        sessionId="s"
        input={input}
        inputActions={{ setDraft }}
        t={t}
      />,
    );
    const button = screen.getByRole("button", { name: "暂存" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(setDraft).toHaveBeenCalledWith("");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /查看输入暂存/ }),
    ).not.toBeInTheDocument();
    controller.dispose();
  });

  it("keeps successful stash actions quiet while retaining error feedback", async () => {
    const user = userEvent.setup();
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    const controller = new PromptStashController(storage);
    render(
      <PromptStashButton
        controller={controller}
        sessionId="s"
        input={inputState({ draft: "important" })}
        inputActions={{ setDraft: vi.fn() }}
        t={t}
      />,
    );

    await user.click(screen.getByRole("button", { name: "暂存" }));
    expect(screen.getByRole("status")).toHaveTextContent("本地存储写入失败");
    controller.dispose();
  });

  it("stashes with the configured shortcut only from the composer", () => {
    const controller = new PromptStashController(
      window.localStorage,
      () => 1,
      () => "shortcut-entry",
    );
    const setDraft = vi.fn();
    render(
      <>
        <textarea aria-label="Composer" defaultValue="important" />
        <input aria-label="Other input" />
        <PromptStashButton
          controller={controller}
          sessionId="s"
          input={inputState({ draft: "important" })}
          inputActions={{ setDraft }}
          t={t}
        />
      </>,
    );

    const other = screen.getByRole("textbox", { name: "Other input" });
    other.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }),
    );
    expect(setDraft).not.toHaveBeenCalled();

    const composer = screen.getByRole("textbox", { name: "Composer" });
    const shortcutEvent = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    composer.dispatchEvent(shortcutEvent);
    expect(shortcutEvent.defaultPrevented).toBe(true);
    expect(setDraft).toHaveBeenCalledWith("");
    expect(controller.entries("s").map((entry) => entry.text)).toEqual([
      "important",
    ]);
    controller.dispose();
  });

  it("restores the latest stash when the shortcut is pressed on an empty composer", () => {
    let document = pushEntry(
      emptyDocument(),
      "s",
      createEntry("older", 1, "older"),
    );
    document = pushEntry(document, "s", createEntry("latest", 2, "latest"));
    writeDocument(window.localStorage, document);
    const controller = new PromptStashController(window.localStorage);
    const setDraft = vi.fn();
    render(
      <>
        <textarea aria-label="Composer" />
        <PromptStashButton
          controller={controller}
          sessionId="s"
          input={inputState()}
          inputActions={{ setDraft }}
          t={t}
        />
      </>,
    );

    screen.getByRole("textbox", { name: "Composer" }).dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(setDraft).toHaveBeenCalledWith("latest");
    expect(controller.entries("s").map((entry) => entry.text)).toEqual([
      "older",
    ]);
    controller.dispose();
  });

  it("records, saves, and immediately uses a custom single-key shortcut", async () => {
    const user = userEvent.setup();
    const controller = new PromptStashController(window.localStorage);
    const { rerender } = render(
      <PromptStashSettings controller={controller} t={t} />,
    );

    await user.click(screen.getByRole("button", { name: "展开: 输入暂存" }));
    const field = screen.getByRole("textbox", { name: "加入暂存快捷键" });
    expect(field).toHaveValue("Ctrl+S");
    await user.click(field);
    await user.keyboard("{F8}");
    expect(field).toHaveValue("F8");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(controller.getSnapshot().shortcut).toBe("F8");

    const setDraft = vi.fn();
    rerender(
      <>
        <textarea aria-label="Composer" />
        <PromptStashButton
          controller={controller}
          sessionId="s"
          input={inputState({ draft: "via F8" })}
          inputActions={{ setDraft }}
          t={t}
        />
      </>,
    );
    screen
      .getByRole("textbox", { name: "Composer" })
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "F8", bubbles: true }),
      );
    expect(setDraft).toHaveBeenCalledWith("");
    controller.dispose();
  });

  it("requires confirmation before replacing a non-empty composer and before clear all", async () => {
    const user = userEvent.setup();
    const stashDocument = pushEntry(
      emptyDocument(),
      "s",
      createEntry("stored text", 1, "stored"),
    );
    writeDocument(window.localStorage, stashDocument);
    const controller = new PromptStashController(
      window.localStorage,
      () => 2,
      () => "current",
    );
    controller.toggle("s");
    const setDraft = vi.fn();
    const input = inputState({ draft: "current text" });
    render(
      <PromptStashList
        controller={controller}
        sessionId="s"
        input={input}
        inputActions={{ setDraft }}
        t={t}
      />,
    );
    expect(
      screen.getByRole("button", { name: "1 条暂存消息" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("archive-icon")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    expect(
      document.querySelector(".dsh-prompt-stash-header-lead svg"),
    ).not.toBeNull();
    expect(document.querySelector(".dsh-prompt-stash-restore svg")).toBeNull();
    expect(document.querySelector(".dsh-prompt-stash-time")).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: /恢复此条: stored text/ }),
    );
    expect(setDraft).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "当前输入不会被覆盖" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "暂存当前内容并恢复此条" }),
    );
    expect(setDraft).toHaveBeenCalledWith("stored text");
    expect(controller.entries("s").map((entry) => entry.text)).toEqual([
      "current text",
    ]);

    await user.click(screen.getByRole("button", { name: "清空" }));
    expect(controller.entries("s")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: "清空当前会话的全部暂存？" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "清空全部" }));
    expect(controller.entries("s")).toEqual([]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    controller.dispose();
  });

  it("reference-counts the style element across overlapping HMR lifecycles", () => {
    const disposeOne = installStyles(document);
    const disposeTwo = installStyles(document);
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
    disposeOne();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();
    disposeTwo();
    expect(document.getElementById(STYLE_ID)).toBeNull();
  });
});
