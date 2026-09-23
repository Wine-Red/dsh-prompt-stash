import type { Context } from "@deepseek-ai/cordis";
import type {} from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";
import { DEFAULT_STASH_SHORTCUT } from "./client/shortcut";

/** Live configuration is persisted by the official profile editor. */
export const Config = z.object({
  shortcut: z
    .string()
    .pattern(
      /^(?:Ctrl\+)?(?:Alt\+)?(?:Shift\+)?(?:Meta\+)?(?!Ctrl$|Alt$|Shift$|Meta$)[^+\s]+$/u,
    )
    .default(DEFAULT_STASH_SHORTCUT)
    .volatile(),
});

export function apply(ctx: Context): void {
  ctx.inject(["settings"], (child) => {
    try {
      child.effect(() => child.settings.configure({ auto: false }, ctx.fiber));
    } catch (error) {
      ctx.logger.error(
        `dsh-prompt-stash: Host settings disabled after startup failure: ${String(error)}`,
      );
    }
  });
}
