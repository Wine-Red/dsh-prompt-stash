import {
  useEffect,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { IconChevronDownOutline14 } from "@deepseek-ai/dsh-client-ui-primitives";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import { PromptStashController } from "./controller";
import { NS } from "./locales";
import { DEFAULT_STASH_SHORTCUT, shortcutFromKeyboardEvent } from "./shortcut";
import { settingsStyles as styles } from "./styles";

export interface PromptStashSettingsProps {
  readonly controller: PromptStashController;
  readonly t: TranslateNS<typeof NS>;
}

export function PromptStashSettings({
  controller,
  t,
}: PromptStashSettingsProps): React.JSX.Element {
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(snapshot.shortcut);
  const [failed, setFailed] = useState(false);
  const dirty = draft !== snapshot.shortcut;

  useEffect(() => {
    setDraft(snapshot.shortcut);
  }, [snapshot.shortcut]);

  const recordShortcut = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === "Tab") return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    const next = shortcutFromKeyboardEvent(event.nativeEvent);
    if (next === null) return;
    setDraft(next);
    setFailed(false);
  };

  const save = (): void => {
    setFailed(!controller.saveShortcut(draft));
  };

  return (
    <li className={`${styles.card}${open ? ` ${styles.cardOpen}` : ""}`}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-label={`${t(open ? "settings.collapse" : "settings.expand")}: ${t("settings.title")}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.headText}>
          <span className={styles.name}>{t("settings.title")}</span>
          <span className={styles.description}>
            {t("settings.description")}
          </span>
        </span>
        {dirty && (
          <span className={styles.pending}>{t("settings.unsaved")}</span>
        )}
        <IconChevronDownOutline14
          className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`}
        />
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.field}>
            <div className={styles.fieldHead}>
              <label className={styles.label} htmlFor="prompt-stash-shortcut">
                {t("settings.shortcutLabel")}
              </label>
              <button
                type="button"
                className={styles.reset}
                disabled={draft === DEFAULT_STASH_SHORTCUT}
                onClick={() => {
                  setDraft(DEFAULT_STASH_SHORTCUT);
                  setFailed(false);
                }}
              >
                {t("settings.reset")}
              </button>
            </div>
            <input
              id="prompt-stash-shortcut"
              className={styles.shortcutInput}
              value={draft}
              readOnly
              spellCheck={false}
              aria-describedby="prompt-stash-shortcut-hint"
              onKeyDown={recordShortcut}
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
            />
            <p id="prompt-stash-shortcut-hint" className={styles.hint}>
              {t("settings.shortcutHint")}
            </p>
          </div>
          <div className={styles.footer}>
            {failed && (
              <p className={styles.failed} role="status">
                {t("settings.saveFailed")}
              </p>
            )}
            <button
              type="button"
              className={styles.discard}
              disabled={!dirty}
              onClick={() => {
                setDraft(snapshot.shortcut);
                setFailed(false);
              }}
            >
              {t("settings.discard")}
            </button>
            <button
              type="button"
              className={styles.save}
              disabled={!dirty}
              onClick={save}
            >
              {t("settings.save")}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
