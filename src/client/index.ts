import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type {
  PropsLocale,
  PropsRuntime,
} from "@deepseek-ai/dsh-client-ui-slots";
import type {} from "@deepseek-ai/dsh-client-ui-conversation/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings-plugins/client";
import type {} from "@deepseek-ai/dsh-client-locale/client";
import { createElement } from "react";
import { PromptStashController } from "./controller";
import { PromptStashButton } from "./PromptStashButton";
import { PromptStashList } from "./PromptStashList";
import { PromptStashSettings } from "./PromptStashSettings";
import { en, NS, zh } from "./locales";
import { installStyles } from "./styles";

export { PromptStashController } from "./controller";
export * from "./model";
export * from "./storage";

export const inject = ["slots", "locale"];

type InputLeftProps = PropsRuntime<"conversation.input.left"> &
  PropsLocale<typeof NS>;
type InputDockProps = PropsRuntime<"conversation.input.dock"> &
  PropsLocale<typeof NS>;
type SettingsProps = PropsRuntime<"settings.plugin.item"> &
  PropsLocale<typeof NS>;

export function apply(ctx: ClientContext): void {
  const controller = new PromptStashController(window.localStorage);
  ctx.effect(
    () => () => controller.dispose(),
    "prompt-stash: local storage lifecycle",
  );
  ctx.effect(() => installStyles(document), "prompt-stash: styles");
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    "prompt-stash: dictionaries",
  );

  ctx.slots.inject("conversation.input.left", () =>
    ctx.slots.register(
      {
        name: "conversation.input.left",
        id: "prompt-stash",
        order: 20,
        locale: NS,
      },
      (props: InputLeftProps) =>
        createElement(PromptStashButton, { ...props, controller }),
    ),
  );

  ctx.slots.inject("conversation.input.dock", () =>
    ctx.slots.register(
      {
        name: "conversation.input.dock",
        id: "prompt-stash",
        order: 30,
        locale: NS,
      },
      (props: InputDockProps) =>
        createElement(PromptStashList, { ...props, controller }),
    ),
  );

  ctx.slots.inject("settings.plugin.item", () =>
    ctx.slots.register(
      {
        name: "settings.plugin.item",
        id: "prompt-stash",
        order: 30,
        locale: NS,
      },
      (props: SettingsProps) =>
        createElement(PromptStashSettings, { ...props, controller }),
    ),
  );
}
