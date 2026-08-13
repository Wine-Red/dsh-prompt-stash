import { useEffect, useId, useState, useSyncExternalStore } from "react";
import {
  Button,
  IconArchiveOutline20,
  IconChevronDownOutline14,
  IconChevronUpOutline14,
  IconTrashOutline16,
  Modal,
} from "@deepseek-ai/dsh-client-ui-primitives";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import { PromptStashController } from "./controller";
import type { DshInputActions, DshInputState } from "./dsh-types";
import { composerHasContent, type StashEntry } from "./model";
import { NS } from "./locales";
import { listStyles as styles } from "./styles";

export interface PromptStashListProps {
  readonly controller: PromptStashController;
  readonly sessionId: string;
  readonly input: DshInputState;
  readonly inputActions: Pick<DshInputActions, "setDraft">;
  readonly t: TranslateNS<typeof NS>;
}

function relativeTime(
  entry: StashEntry,
  now: number,
  t: TranslateNS<typeof NS>,
): string {
  const delta = Math.max(0, now - entry.createdAt);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return t("relative.now");
  if (minutes < 60) return t("relative.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("relative.hours", { count: hours });
  return t("relative.days", { count: Math.floor(hours / 24) });
}

export function PromptStashList({
  controller,
  sessionId,
  input,
  inputActions,
  t,
}: PromptStashListProps): React.JSX.Element | null {
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [restoreTarget, setRestoreTarget] = useState<StashEntry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const listId = useId();
  const entries = controller.entries(sessionId);
  const expanded = snapshot.openSessionId === sessionId;

  useEffect(() => {
    if (snapshot.openSessionId !== sessionId) {
      setRestoreTarget(null);
      setConfirmClear(false);
    }
  }, [sessionId, snapshot.openSessionId]);

  if (entries.length === 0) return null;

  const requestRestore = (entry: StashEntry): void => {
    if (composerHasContent(input)) setRestoreTarget(entry);
    else controller.restoreEmpty(sessionId, entry.id, input, inputActions);
  };

  const confirmSwap = (): void => {
    if (restoreTarget === null) return;
    if (
      controller.swapAndRestore(
        sessionId,
        restoreTarget.id,
        input,
        inputActions,
      )
    )
      setRestoreTarget(null);
  };

  return (
    <>
      <div className={styles.dock} data-prompt-stash-dock="">
        <section
          className={styles.panel}
          aria-label={t("panel.title")}
          data-testid="prompt-stash-panel"
        >
          <header
            className={styles.headerShell}
            data-expanded={expanded || undefined}
          >
            <button
              type="button"
              className={styles.header}
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => controller.toggle(sessionId)}
            >
              <span className={styles.headingGroup}>
                <span className={styles.headerLead} aria-hidden="true">
                  <IconArchiveOutline20 size={14} />
                </span>
                <span className={styles.title}>
                  {t(
                    entries.length === 1 ? "panel.summaryOne" : "panel.summary",
                    { count: entries.length },
                  )}
                </span>
              </span>
              <span className={styles.chevron} aria-hidden="true">
                {expanded ? (
                  <IconChevronDownOutline14 size={14} />
                ) : (
                  <IconChevronUpOutline14 size={14} />
                )}
              </span>
            </button>
            {expanded && (
              <Button
                variant="ghost"
                size="sm"
                className={`${styles.clearButton} ${styles.headerClearButton}`}
                onClick={() => setConfirmClear(true)}
              >
                {t("action.clear")}
              </Button>
            )}
          </header>

          {expanded && (
            <ol className={styles.list} id={listId}>
              {entries.map((entry, index) => (
                <li
                  className={styles.item}
                  key={entry.id}
                  data-latest={index === 0 || undefined}
                >
                  <button
                    type="button"
                    className={styles.restoreButton}
                    aria-label={`${t("action.restore")}: ${entry.text}`}
                    title={entry.text}
                    onClick={() => requestRestore(entry)}
                  >
                    <time
                      className={styles.time}
                      dateTime={new Date(entry.createdAt).toISOString()}
                      title={new Date(entry.createdAt).toLocaleString()}
                    >
                      {relativeTime(entry, Date.now(), t)}
                    </time>
                    <span className={styles.preview}>{entry.text}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.iconButton}
                    aria-label={`${t("action.delete")}: ${entry.text}`}
                    onClick={() => controller.delete(sessionId, entry.id)}
                  >
                    <IconTrashOutline16 size={14} />
                  </Button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <Modal
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        title={t("dialog.restoreTitle")}
        closeLabel={t("action.cancel")}
        description={t("dialog.restoreDescription")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRestoreTarget(null)}>
              {t("action.cancel")}
            </Button>
            <Button variant="primary" onClick={confirmSwap}>
              {t("action.swap")}
            </Button>
          </>
        }
      />

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={t("dialog.clearTitle")}
        closeLabel={t("action.cancel")}
        description={t("dialog.clearDescription")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              className={styles.dangerButton}
              onClick={() => controller.clear(sessionId)}
            >
              {t("action.confirmClear")}
            </Button>
          </>
        }
      />
    </>
  );
}
