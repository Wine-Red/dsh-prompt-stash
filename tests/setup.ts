import "@testing-library/jest-dom/vitest";
import { createElement, type ReactElement, type ReactNode } from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("@deepseek-ai/dsh-client-ui-primitives", () => ({
  Button: ({
    variant: _variant,
    size: _size,
    icon,
    children,
    ...props
  }: {
    variant?: string;
    size?: string;
    icon?: ReactNode;
    children?: ReactNode;
  }) => createElement("button", props, icon, children),
  Tooltip: ({ children }: { children: ReactElement }) => children,
  IconArchiveOutline20: ({ size = 20 }: { size?: number }) =>
    createElement("svg", {
      width: size,
      height: size,
      "data-testid": "archive-icon",
    }),
  IconChevronDownOutline14: ({ size = 14 }: { size?: number }) =>
    createElement("svg", {
      width: size,
      height: size,
      "data-testid": "chevron-down-icon",
    }),
  IconChevronUpOutline14: ({ size = 14 }: { size?: number }) =>
    createElement("svg", {
      width: size,
      height: size,
      "data-testid": "chevron-up-icon",
    }),
  IconTrashOutline16: ({ size = 16 }: { size?: number }) =>
    createElement("svg", {
      width: size,
      height: size,
      "data-testid": "trash-icon",
    }),
  Toast: ({ text }: { text: string }) =>
    createElement("div", { role: "status" }, text),
  Modal: ({
    open,
    title,
    description,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
  }) =>
    open
      ? createElement(
          "div",
          { role: "dialog", "aria-label": title },
          description,
          children,
          footer,
        )
      : null,
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.head.querySelector("#dsh-prompt-stash-style")?.remove();
});
