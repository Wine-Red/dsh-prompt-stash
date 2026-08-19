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
  const report = (error: unknown): void => {
    try {
      ctx.logger.error(
        `dsh-prompt-stash: Host settings disabled after startup failure: ${error instanceof Error ? error.message : String(error)}`,
      );
    } catch {
      // Logging must never turn a plugin failure back into a DSH startup failure.
    }
  };
  try {
    ctx.inject(["settings"], (settingsCtx) => {
      try {
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
      } catch (error) {
        report(error);
      }
    });
  } catch (error) {
    report(error);
  }
}
