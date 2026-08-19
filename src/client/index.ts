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

type Cleanup = () => void;

function formatStartupError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function logStartupFailure(
  ctx: ClientContext,
  scope: string,
  error: unknown,
): void {
  try {
    ctx.logger.error(
      `dsh-prompt-stash: ${scope} disabled after startup failure: ${formatStartupError(error)}`,
    );
  } catch {
    // Logging must never turn a plugin failure back into a DSH startup failure.
  }
}

function safeEffect(
  ctx: ClientContext,
  scope: string,
  install: () => Cleanup,
): void {
  try {
    ctx.effect(() => {
      try {
        return install();
      } catch (error) {
        logStartupFailure(ctx, scope, error);
        return () => undefined;
      }
    }, scope);
  } catch (error) {
    logStartupFailure(ctx, scope, error);
  }
}

function safeContribution(
  ctx: ClientContext,
  scope: string,
  register: () => () => void,
): () => void {
  try {
    return register();
  } catch (error) {
    logStartupFailure(ctx, scope, error);
    return () => undefined;
  }
}

function safeSlotInject(
  ctx: ClientContext,
  scope: string,
  inject: () => void,
): void {
  try {
    inject();
  } catch (error) {
    logStartupFailure(ctx, scope, error);
  }
}

function initialize(
  ctx: ClientContext,
  controller: PromptStashController,
): void {
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
  safeEffect(ctx, "prompt-stash: Host shortcut settings", () => {
    const unsubscribe = settingsScope.subscribe(() => {
      try {
        syncShortcut();
        migrateShortcut();
      } catch (error) {
        logStartupFailure(ctx, "Host shortcut synchronization", error);
      }
    });
    syncShortcut();
    migrateShortcut();
    return unsubscribe;
  });
  safeEffect(
    ctx,
    "prompt-stash: local storage lifecycle",
    () => () => controller.dispose(),
  );
  safeEffect(ctx, "prompt-stash: styles", () => installStyles(document));
  safeEffect(ctx, "prompt-stash: dictionaries", () =>
    ctx.locale.register(NS, { zh, en }),
  );

  safeSlotInject(ctx, "conversation.input.left", () =>
    ctx.slots.inject("conversation.input.left", () =>
      safeContribution(ctx, "conversation.input.left", () =>
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
      ),
    ),
  );

  safeSlotInject(ctx, "conversation.input.dock", () =>
    ctx.slots.inject("conversation.input.dock", () =>
      safeContribution(ctx, "conversation.input.dock", () =>
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
      ),
    ),
  );

  // rc6 dispatched this contribution by `id`; rc7+ dispatch the keyed slot by
  // settings namespace. Both fields preserve one additive build across releases.
  const settingsSlotOptions = {
    name: "settings.plugin.item",
    key: PROMPT_STASH_SETTINGS_NAMESPACE,
    id: "prompt-stash",
    order: 30,
    locale: NS,
  } as const;
  safeSlotInject(ctx, "settings.plugin.item", () =>
    ctx.slots.inject("settings.plugin.item", () =>
      safeContribution(ctx, "settings.plugin.item", () =>
        ctx.slots.register(settingsSlotOptions, (props: SettingsProps) =>
          createElement(PromptStashSettings, { ...props, settingsScope }),
        ),
      ),
    ),
  );
}

export function apply(ctx: ClientContext): void {
  let controller: PromptStashController | undefined;
  try {
    controller = new PromptStashController(window.localStorage);
    initialize(ctx, controller);
  } catch (error) {
    controller?.dispose();
    logStartupFailure(ctx, "plugin initialization", error);
  }
}
