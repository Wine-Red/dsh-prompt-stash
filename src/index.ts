import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";
import { DEFAULT_STASH_SHORTCUT, normalizeShortcut } from "./client/shortcut";
import { PROMPT_STASH_SETTINGS_NAMESPACE } from "./settings";

/** Durable shortcut preferences stored in the DSH Host settings document. */
const PromptStashSettingsSchema = z.object({
  shortcut: z.string().default(DEFAULT_STASH_SHORTCUT),
});

/** Register the plugin-owned Host settings namespace when settings are present. */
export function apply(ctx: import("@deepseek-ai/cordis").Context): void {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(PROMPT_STASH_SETTINGS_NAMESPACE),
      PromptStashSettingsSchema,
      {
        validate(value) {
          if (normalizeShortcut(value.shortcut) === null)
            throw new TypeError("prompt stash shortcut is invalid");
        },
      },
    );
  });
}
