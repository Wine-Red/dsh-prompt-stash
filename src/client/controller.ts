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
  prepareSwap,
  pushEntry,
  readDocument,
  removeEntry,
  withEntries,
  writeDocument,
  type StorageLike,
} from "./storage";

export interface StashNotice {
  readonly key: string;
  readonly seq: number;
}

export interface ControllerSnapshot {
  readonly revision: number;
  readonly document: StashDocumentV1;
  readonly openSessionId: string | null;
  readonly notice: StashNotice | null;
}

export class PromptStashController {
  private snapshot: ControllerSnapshot;
  private readonly listeners = new Set<() => void>();
  private noticeSeq = 0;
  private disposed = false;
  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY)
      this.replaceDocument(readDocument(this.storage));
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
    try {
      actions.setDraft("");
    } catch {
      this.setNotice("error.draftWrite");
      return false;
    }
    this.dismissNotice();
    return true;
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
    try {
      actions.setDraft(target.text);
    } catch {
      this.setNotice("error.draftWrite");
      return false;
    }
    try {
      this.commit(removeEntry(this.snapshot.document, sessionId, targetId));
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
    try {
      actions.setDraft(target.text);
    } catch {
      this.setNotice("error.draftWrite");
      return false;
    }
    try {
      this.commit(removeEntry(this.snapshot.document, sessionId, targetId));
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

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (typeof window !== "undefined")
      window.removeEventListener("storage", this.onStorage);
    this.listeners.clear();
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
