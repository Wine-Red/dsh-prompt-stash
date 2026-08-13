import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Button, Toast, Tooltip } from "@deepseek-ai/dsh-client-ui-primitives";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import { PromptStashController } from "./controller";
import type { DshInputActions, DshInputState } from "./dsh-types";
import { canStash } from "./model";
import { NS } from "./locales";
import { buttonStyles as styles } from "./styles";
import { matchesShortcut } from "./shortcut";

export interface PromptStashButtonProps {
  readonly controller: PromptStashController;
  readonly sessionId: string;
  readonly input: DshInputState;
  readonly inputActions: Pick<DshInputActions, "setDraft">;
  readonly t: TranslateNS<typeof NS>;
}

function ArchiveIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 8.5h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-10Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 4h16v4.5H4zM9 12h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4 3.5 19h17L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4.5M12 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PromptStashButton({
  controller,
  sessionId,
  input,
  inputActions,
  t,
}: PromptStashButtonProps): React.JSX.Element {
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const anchorRef = useRef<HTMLDivElement>(null);
  const eligibility = useMemo(() => canStash(input), [input]);
  const stashLabel = eligibility.allowed
    ? t("action.stashShortcut", { shortcut: snapshot.shortcut })
    : t(`error.blocked.${eligibility.reason ?? "empty"}`);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        !(event.target instanceof HTMLTextAreaElement) ||
        !matchesShortcut(event, snapshot.shortcut)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (eligibility.allowed) controller.stash(sessionId, input, inputActions);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    controller,
    eligibility.allowed,
    input,
    inputActions,
    sessionId,
    snapshot.shortcut,
  ]);

  return (
    <div
      className={styles.root}
      ref={anchorRef}
      data-testid="prompt-stash-controls"
    >
      <Tooltip label={stashLabel} side="top" maxWidth={280}>
        <Button
          variant="toolbar"
          size="sm"
          className={styles.stashButton}
          icon={<ArchiveIcon />}
          disabled={!eligibility.allowed}
          aria-label={t("action.stash")}
          onClick={() => controller.stash(sessionId, input, inputActions)}
        >
          {t("action.stash")}
        </Button>
      </Tooltip>

      {snapshot.notice !== null && (
        <Toast
          key={snapshot.notice.seq}
          text={t(snapshot.notice.key as Parameters<typeof t>[0])}
          icon={<WarningIcon />}
          anchor={anchorRef.current}
          onDone={() => controller.dismissNotice()}
        />
      )}
    </div>
  );
}
