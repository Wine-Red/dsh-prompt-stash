import type { DshInputState } from "../src/client/dsh-types";

export function inputState(patch: Partial<DshInputState> = {}): DshInputState {
  return {
    draft: "",
    imageIds: [],
    draftRev: 0,
    phase: "plain",
    occurrences: [],
    queue: [],
    ...patch,
  } as DshInputState;
}
