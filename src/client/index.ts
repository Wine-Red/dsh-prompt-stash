import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type {
  PropsLocale,
  PropsRuntime,
} from "@deepseek-ai/dsh-client-ui-slots";
import type {} from "@deepseek-ai/dsh-client-ui-conversation/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings-plugins/client";
import type {} from "@deepseek-ai/dsh-client-locale/client";
import { createElement } from "react";
import { PromptStashController } from "./controller";
import { PromptStashButton } from "./PromptStashButton";
import { PromptStashList } from "./PromptStashList";
import { PromptStashSettings } from "./PromptStashSettings";
import { en, NS, zh } from "./locales";
import { installStyles } from "./styles";
import {
  decodePromptStashSettings,
  migrateLegacyShortcut,
  PROMPT_STASH_SETTINGS_NAMESPACE,
} from "../settings";

export { PromptStashController } from "./controller";
export * from "./model";
export * from "./storage";

export const inject = [
  "slots",
  "locale",
  "connection",
  "remote",
  "settingsScope",
];

type InputLeftProps = PropsRuntime<"conversation.input.left"> &
  PropsLocale<typeof NS>;
type InputDockProps = PropsRuntime<"conversation.input.dock"> &
  PropsLocale<typeof NS>;
type SettingsProps = PropsRuntime<"settings.plugin.item"> &
  PropsLocale<typeof NS>;

export function apply(ctx: ClientContext): void {
  const controller = new PromptStashController(window.localStorage);
  const settingsScope = ctx.settingsScope.bind({
    namespace: PROMPT_STASH_SETTINGS_NAMESPACE,
    decode: decodePromptStashSettings,
  });
  const syncShortcut = (): void => {
    const shortcut = settingsScope.getSnapshot().value?.shortcut;
    if (shortcut !== undefined) controller.setShortcut(shortcut);
  };
  let migrationPending = false;
  const migrateShortcut = (): void => {
    if (migrationPending) return;
    const snapshot = settingsScope.getSnapshot();
    if (snapshot.status !== "ready" || !snapshot.writable) return;
    migrationPending = true;
    void migrateLegacyShortcut(settingsScope, window.localStorage)
      .catch(() => undefined)
      .finally(() => {
        migrationPending = false;
      });
  };
  ctx.effect(() => {
    const unsubscribe = settingsScope.subscribe(() => {
      syncShortcut();
      migrateShortcut();
    });
    syncShortcut();
    migrateShortcut();
    return unsubscribe;
  }, "prompt-stash: Host shortcut settings");
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

  // rc6 dispatched this contribution by `id`; rc7 dispatches the keyed slot by
  // settings namespace. Keeping both fields is harmless at runtime and lets one
  // published package degrade across the two release candidates.
  const settingsSlotOptions = {
    name: "settings.plugin.item",
    key: PROMPT_STASH_SETTINGS_NAMESPACE,
    id: "prompt-stash",
    order: 30,
    locale: NS,
  } as const;
  ctx.slots.inject("settings.plugin.item", () =>
    ctx.slots.register(settingsSlotOptions, (props: SettingsProps) =>
      createElement(PromptStashSettings, { ...props, settingsScope }),
    ),
  );
}
