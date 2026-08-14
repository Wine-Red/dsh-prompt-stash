import type { DshInputActions, DshInputState } from "./dsh-types";
import {
  DEFAULT_STACK_LIMIT,
  STORAGE_KEY,
  canStash,
  createEntry,
  type StashDocumentV1,
  type StashEntry,
} from "./model";
import {
  entriesFor,
  prepareRotation,
  prepareSwap,
  pushEntry,
  readDocument,
  removeEntry,
  withEntries,
  writeDocument,
  type StorageLike,
} from "./storage";
import { SHORTCUT_STORAGE_KEY, readShortcut, writeShortcut } from "./shortcut";

export interface StashNotice {
  readonly key: string;
  readonly seq: number;
}

export interface ControllerSnapshot {
  readonly revision: number;
  readonly document: StashDocumentV1;
  readonly openSessionId: string | null;
  readonly notice: StashNotice | null;
  readonly shortcut: string;
}

export class PromptStashController {
  private snapshot: ControllerSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly shortcutRotations = new Map<string, StashEntry>();
  private noticeSeq = 0;
  private disposed = false;
  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) {
      this.replaceDocument(readDocument(this.storage));
      return;
    }
    if (event.key === SHORTCUT_STORAGE_KEY)
      this.publish({ shortcut: readShortcut(this.storage) });
  };

  constructor(
    private readonly storage: StorageLike,
    private readonly now: () => number = Date.now,
    private readonly makeId: () => string = () => crypto.randomUUID(),
    private readonly limit = DEFAULT_STACK_LIMIT,
  ) {
    this.snapshot = {
      revision: 0,
      document: readDocument(storage),
      openSessionId: null,
      notice: null,
      shortcut: readShortcut(storage),
    };
    if (typeof window !== "undefined")
      window.addEventListener("storage", this.onStorage);
  }

  getSnapshot = (): ControllerSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  entries(sessionId: string): readonly StashEntry[] {
    return entriesFor(this.snapshot.document, sessionId);
  }

  toggle(sessionId: string): void {
    this.publish({
      openSessionId:
        this.snapshot.openSessionId === sessionId ? null : sessionId,
    });
  }

  close(): void {
    if (this.snapshot.openSessionId !== null)
      this.publish({ openSessionId: null });
  }

  stash(
    sessionId: string,
    input: DshInputState,
    actions: Pick<DshInputActions, "setDraft">,
  ): boolean {
    const eligibility = canStash(input);
    if (!eligibility.allowed) {
      this.setNotice(`error.blocked.${eligibility.reason ?? "empty"}`);
      return false;
    }
    const next = pushEntry(
      this.snapshot.document,
      sessionId,
      createEntry(input.draft, this.now(), this.makeId()),
      this.limit,
    );
    try {
      this.commit(next);
    } catch {
      this.setNotice("error.storageWrite");
      return false;
    }
    this.shortcutRotations.delete(sessionId);
    try {
      actions.setDraft("");
    } catch {
      this.setNotice("error.draftWrite");
      return false;
    }
    this.dismissNotice();
    return true;
  }

  activateShortcut(
    sessionId: string,
    input: DshInputState,
    actions: Pick<DshInputActions, "setDraft">,
  ): boolean {
    const eligibility = canStash(input);
    if (
      eligibility.allowed &&
      this.shortcutRotations.get(sessionId)?.text === input.draft &&
      this.entries(sessionId).length > 0
    )
      return this.rotateShortcut(sessionId, input, actions);
    if (eligibility.allowed) return this.stash(sessionId, input, actions);

    const composerIsEmpty =
      input.draft.length === 0 &&
      input.imageIds.length === 0 &&
      input.occurrences.length === 0;
    if (!composerIsEmpty || input.phase !== "plain") return false;

    const latest = this.entries(sessionId)[0];
    if (latest === undefined) return false;
    return this.restoreEmpty(sessionId, latest.id, input, actions);
  }

  restoreEmpty(
    sessionId: string,
    targetId: string,
    input: DshInputState,
    actions: Pick<DshInputActions, "setDraft">,
  ): boolean {
    if (
      input.draft.length > 0 ||
      input.imageIds.length > 0 ||
      input.occurrences.length > 0
    )
      return false;
    const target = this.entries(sessionId).find(
      (entry) => entry.id === targetId,
    );
    if (target === undefined) return false;
    this.shortcutRotations.delete(sessionId);
    try {
      actions.setDraft(target.text);
    } catch {
      this.setNotice("error.draftWrite");
      return false;
    }
    try {
      this.commit(removeEntry(this.snapshot.document, sessionId, targetId));
      this.shortcutRotations.set(sessionId, target);
      this.dismissNotice();
      return true;
    } catch {
      // The composer now contains the text and the stash still contains a duplicate.
      this.setNotice("error.cleanupCopy");
      return false;
    }
  }

  swapAndRestore(
    sessionId: string,
    targetId: string,
    input: DshInputState,
    actions: Pick<DshInputActions, "setDraft">,
  ): boolean {
    const eligibility = canStash(input);
    if (!eligibility.allowed) {
      this.setNotice(`error.blocked.${eligibility.reason ?? "empty"}`);
      return false;
    }
    const target = this.entries(sessionId).find(
      (entry) => entry.id === targetId,
    );
    if (target === undefined) return false;

    const staged = prepareSwap(
      this.snapshot.document,
      sessionId,
      createEntry(input.draft, this.now(), this.makeId()),
      targetId,
      this.limit,
    );
    try {
      this.commit(staged);
    } catch {
      this.setNotice("error.storageWrite");
      return false;
    }
    this.shortcutRotations.delete(sessionId);
    try {
      actions.setDraft(target.text);
    } catch {
      this.setNotice("error.draftWrite");
      return false;
    }
    try {
      this.commit(removeEntry(this.snapshot.document, sessionId, targetId));
      this.shortcutRotations.set(sessionId, target);
      this.dismissNotice();
      return true;
    } catch {
      // Both texts remain in localStorage; the restored target is also visible in the composer.
      this.setNotice("error.cleanupCopy");
      return false;
    }
  }

  delete(sessionId: string, entryId: string): boolean {
    try {
      this.commit(removeEntry(this.snapshot.document, sessionId, entryId));
      this.dismissNotice();
      return true;
    } catch {
      this.setNotice("error.storageWrite");
      return false;
    }
  }

  clear(sessionId: string): boolean {
    try {
      this.commit(withEntries(this.snapshot.document, sessionId, []));
      this.shortcutRotations.delete(sessionId);
      this.dismissNotice();
      return true;
    } catch {
      this.setNotice("error.storageWrite");
      return false;
    }
  }

  dismissNotice(): void {
    if (this.snapshot.notice !== null) this.publish({ notice: null });
  }

  saveShortcut(shortcut: string): boolean {
    try {
      const normalized = writeShortcut(this.storage, shortcut);
      this.publish({ shortcut: normalized });
      return true;
    } catch {
      return false;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (typeof window !== "undefined")
      window.removeEventListener("storage", this.onStorage);
    this.listeners.clear();
    this.shortcutRotations.clear();
  }

  private rotateShortcut(
    sessionId: string,
    input: DshInputState,
    actions: Pick<DshInputActions, "setDraft">,
  ): boolean {
    const current = this.shortcutRotations.get(sessionId);
    const target = this.entries(sessionId)[0];
    if (current === undefined || target === undefined) return false;

    let staged: StashDocumentV1;
    try {
      staged = prepareRotation(
        this.snapshot.document,
        sessionId,
        current,
        target.id,
        this.limit,
      );
      this.commit(staged);
    } catch {
      this.setNotice("error.storageWrite");
      return false;
    }
    try {
      actions.setDraft(target.text);
    } catch {
      this.shortcutRotations.delete(sessionId);
      this.setNotice("error.draftWrite");
      return false;
    }
    try {
      this.commit(removeEntry(this.snapshot.document, sessionId, target.id));
      this.shortcutRotations.set(sessionId, target);
      this.dismissNotice();
      return true;
    } catch {
      this.shortcutRotations.delete(sessionId);
      this.setNotice("error.cleanupCopy");
      return false;
    }
  }

  private replaceDocument(document: StashDocumentV1): void {
    const openSessionId = this.snapshot.openSessionId;
    this.publish({
      document,
      openSessionId:
        openSessionId !== null &&
        entriesFor(document, openSessionId).length === 0
          ? null
          : openSessionId,
    });
  }

  private commit(document: StashDocumentV1): void {
    writeDocument(this.storage, document);
    this.replaceDocument(document);
  }

  private setNotice(key: string): void {
    this.noticeSeq += 1;
    this.publish({ notice: { key, seq: this.noticeSeq } });
  }

  private publish(patch: Partial<Omit<ControllerSnapshot, "revision">>): void {
    this.snapshot = {
      ...this.snapshot,
      ...patch,
      revision: this.snapshot.revision + 1,
    };
    for (const listener of this.listeners) listener();
  }
}
