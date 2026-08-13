import type { PropsRuntime } from "@deepseek-ai/dsh-client-ui-slots";

export type InputZoneProps = PropsRuntime<"conversation.input.left">;
export type DshInputState = InputZoneProps["input"];
export type DshInputActions = InputZoneProps["inputActions"];
