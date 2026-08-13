export const buttonStyles = {
  root: "dsh-prompt-stash-controls",
  stashButton: "dsh-prompt-stash-button",
} as const;

export const listStyles = {
  dock: "dsh-prompt-stash-dock",
  panel: "dsh-prompt-stash-panel",
  headerShell: "dsh-prompt-stash-header-shell",
  header: "dsh-prompt-stash-header",
  headingGroup: "dsh-prompt-stash-heading-group",
  headerLead: "dsh-prompt-stash-header-lead",
  chevron: "dsh-prompt-stash-chevron",
  title: "dsh-prompt-stash-title",
  list: "dsh-prompt-stash-list",
  item: "dsh-prompt-stash-item",
  restoreButton: "dsh-prompt-stash-restore",
  time: "dsh-prompt-stash-time",
  preview: "dsh-prompt-stash-preview",
  iconButton: "dsh-prompt-stash-icon-button",
  headerClearButton: "dsh-prompt-stash-header-clear-button",
  clearButton: "dsh-prompt-stash-clear-button",
  dangerButton: "dsh-prompt-stash-danger-button",
} as const;

export const settingsStyles = {
  card: "dsh-prompt-stash-settings-card",
  cardOpen: "dsh-prompt-stash-settings-card-open",
  header: "dsh-prompt-stash-settings-header",
  headText: "dsh-prompt-stash-settings-head-text",
  name: "dsh-prompt-stash-settings-name",
  description: "dsh-prompt-stash-settings-description",
  pending: "dsh-prompt-stash-settings-pending",
  chevron: "dsh-prompt-stash-settings-chevron",
  chevronOpen: "dsh-prompt-stash-settings-chevron-open",
  body: "dsh-prompt-stash-settings-body",
  field: "dsh-prompt-stash-settings-field",
  fieldHead: "dsh-prompt-stash-settings-field-head",
  label: "dsh-prompt-stash-settings-label",
  reset: "dsh-prompt-stash-settings-reset",
  shortcutInput: "dsh-prompt-stash-settings-shortcut-input",
  hint: "dsh-prompt-stash-settings-hint",
  footer: "dsh-prompt-stash-settings-footer",
  failed: "dsh-prompt-stash-settings-failed",
  discard: "dsh-prompt-stash-settings-discard",
  save: "dsh-prompt-stash-settings-save",
} as const;

export const STYLE_ID = "dsh-prompt-stash-style";
const STYLE_REFS = Symbol.for("dsh.promptStash.styleRefs");

interface StyleDocument extends Document {
  [STYLE_REFS]?: number;
}

export const STYLE_TEXT = String.raw`
.dsh-prompt-stash-controls{display:inline-flex;align-items:center;gap:4px;min-width:0}
.dsh-prompt-stash-button{flex:none;min-width:28px;touch-action:manipulation}
.dsh-prompt-stash-dock{box-sizing:border-box;flex:none;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));max-width:calc(var(--dsh-composer-card-max-width) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto calc(0px - var(--dsh-composer-stack-gap) - 3px);padding:0 var(--dsh-composer-dock-inset)}
.dsh-prompt-stash-panel{position:relative;width:100%;max-height:min(42dvh,360px);padding:2px 0;overflow:hidden;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-tip);border-radius:12px 12px 0 0;box-shadow:none}
.dsh-prompt-stash-panel::after{position:absolute;inset:0;pointer-events:none;content:"";border:1px solid var(--dsw-alias-border-l1);border-bottom:0;border-radius:inherit}
[data-queue-dock]+.dsh-prompt-stash-dock .dsh-prompt-stash-panel{border-radius:0}
.dsh-prompt-stash-header-shell{position:relative}
.dsh-prompt-stash-header-shell[data-expanded]{border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-prompt-stash-header{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;width:100%;height:36px;gap:10px;padding:4px 12px;color:inherit;font:inherit;text-align:start;cursor:pointer;background:transparent;border:0;border-radius:8px}
.dsh-prompt-stash-heading-group{display:flex;align-items:center;min-width:0;gap:10px}
.dsh-prompt-stash-header[aria-expanded=true] .dsh-prompt-stash-heading-group{max-width:calc(100% - 80px)}
.dsh-prompt-stash-header-lead{display:grid;flex:none;color:var(--dsw-alias-label-tertiary);place-items:center}
.dsh-prompt-stash-title{min-width:0;overflow:hidden;font-family:Inter,var(--dsw-font-family);font-size:13px;font-weight:500;line-height:24px;text-overflow:ellipsis;white-space:nowrap}
.dsh-prompt-stash-chevron{display:grid;flex:none;width:14px;height:14px;color:var(--dsw-alias-label-tertiary);place-items:center}
.dsh-prompt-stash-header-clear-button{position:absolute;inset-block-start:4px;inset-inline-end:38px;height:28px}
.dsh-prompt-stash-list{max-height:min(calc(42dvh - 39px),321px);margin:0;padding:4px 5px 4px 4px;overflow-y:auto;overscroll-behavior:contain;list-style:none}
.dsh-prompt-stash-item{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 28px;align-items:center;gap:2px;border-radius:8px}
.dsh-prompt-stash-item[data-latest]::before{position:absolute;inset-block:8px;inset-inline-start:2px;width:2px;content:"";background:var(--dsw-alias-state-business-primary);border-radius:2px}
.dsh-prompt-stash-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-prompt-stash-restore{display:grid;grid-template-columns:76px minmax(0,1fr);align-items:start;gap:10px;min-width:0;min-height:44px;padding:5px 8px 5px 12px;color:inherit;font:inherit;text-align:start;cursor:pointer;background:transparent;border:0;border-radius:8px;touch-action:manipulation}
.dsh-prompt-stash-time{overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:12px;font-variant-numeric:tabular-nums;line-height:20px;text-overflow:ellipsis;white-space:nowrap}
.dsh-prompt-stash-preview{display:-webkit-box;min-width:0;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;overflow-wrap:anywhere;white-space:pre-wrap;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.dsh-prompt-stash-icon-button{display:grid;place-items:center;flex:none;width:28px;height:28px;min-width:28px;padding:0;color:var(--dsw-alias-label-tertiary);border-radius:999px}
.dsh-prompt-stash-clear-button{color:var(--dsw-alias-label-secondary)}
.dsh-prompt-stash-danger-button{color:var(--dsw-alias-label-primary-inverted);background:var(--dsw-alias-state-error-primary)}
.dsh-prompt-stash-settings-card{list-style:none;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;transition:border-color .16s,background .16s}
.dsh-prompt-stash-settings-card:hover{border-color:var(--dsw-alias-label-dimmed)}
.dsh-prompt-stash-settings-card-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
.dsh-prompt-stash-settings-header{display:flex;align-items:center;width:100%;gap:12px;padding:14px 16px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:transparent;border:0;border-radius:12px;appearance:none}
.dsh-prompt-stash-settings-head-text{display:flex;flex:1;flex-direction:column;min-width:0;gap:4px}
.dsh-prompt-stash-settings-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.dsh-prompt-stash-settings-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.dsh-prompt-stash-settings-pending{flex:none;padding:1px 8px;color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:500;line-height:17px;white-space:nowrap;background:var(--dsw-alias-bg-module-platform);border-radius:999px}
.dsh-prompt-stash-settings-chevron{flex:none;color:var(--dsw-alias-label-tertiary);transition:transform .16s}
.dsh-prompt-stash-settings-chevron-open{transform:rotate(180deg)}
.dsh-prompt-stash-settings-body{padding-bottom:8px;margin:0 16px;border-top:1px solid var(--dsw-alias-border-l2)}
.dsh-prompt-stash-settings-field{display:flex;flex-direction:column;gap:6px;padding:12px 0}
.dsh-prompt-stash-settings-field-head{display:flex;align-items:center;gap:8px}
.dsh-prompt-stash-settings-label{flex:1;min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
.dsh-prompt-stash-settings-reset{padding:0;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1.5;cursor:pointer;background:transparent;border:0}
.dsh-prompt-stash-settings-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.dsh-prompt-stash-settings-reset:disabled{cursor:default;opacity:.4}
.dsh-prompt-stash-settings-shortcut-input{box-sizing:border-box;width:100%;height:38px;padding:0 12px;color:var(--dsw-alias-label-primary);font:600 13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.01em;cursor:key;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;caret-color:transparent}
.dsh-prompt-stash-settings-shortcut-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
.dsh-prompt-stash-settings-hint{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
.dsh-prompt-stash-settings-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 0 4px;border-top:1px solid var(--dsw-alias-border-l2)}
.dsh-prompt-stash-settings-failed{flex:1;min-width:0;margin:0;color:var(--dsw-alias-label-error);font-size:12px;line-height:1.5}
.dsh-prompt-stash-settings-discard,.dsh-prompt-stash-settings-save{padding:5px 14px;font:inherit;font-size:13px;line-height:1.5;cursor:pointer;border:1px solid transparent;border-radius:8px;appearance:none}
.dsh-prompt-stash-settings-discard{color:var(--dsw-alias-label-secondary);background:transparent;border-color:var(--dsw-alias-border-l2)}
.dsh-prompt-stash-settings-save{color:var(--dsw-alias-bg-layer-3);background:var(--dsw-alias-label-primary)}
.dsh-prompt-stash-settings-discard:disabled,.dsh-prompt-stash-settings-save:disabled{cursor:default;opacity:.4}
.dsh-prompt-stash-button:focus-visible,.dsh-prompt-stash-header:focus-visible,.dsh-prompt-stash-restore:focus-visible,.dsh-prompt-stash-icon-button:focus-visible,.dsh-prompt-stash-clear-button:focus-visible,.dsh-prompt-stash-danger-button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.dsh-prompt-stash-settings-header:focus-visible,.dsh-prompt-stash-settings-reset:focus-visible,.dsh-prompt-stash-settings-discard:focus-visible,.dsh-prompt-stash-settings-save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
@media(max-width:520px){.dsh-prompt-stash-button{padding-inline:7px}.dsh-prompt-stash-dock{width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance));padding-inline:0}.dsh-prompt-stash-panel{max-height:min(48dvh,360px);border-radius:10px 10px 0 0}.dsh-prompt-stash-restore{grid-template-columns:64px minmax(0,1fr);gap:6px}}
@media(prefers-reduced-motion:reduce){.dsh-prompt-stash-panel,.dsh-prompt-stash-item,.dsh-prompt-stash-restore,.dsh-prompt-stash-settings-card,.dsh-prompt-stash-settings-chevron{scroll-behavior:auto;transition:none}}
`;

export function installStyles(document: Document): () => void {
  const styleDocument = document as StyleDocument;
  let element = document.getElementById(STYLE_ID);
  if (element === null) {
    element = document.createElement("style");
    element.id = STYLE_ID;
    element.textContent = STYLE_TEXT;
    document.head.appendChild(element);
  }
  styleDocument[STYLE_REFS] = (styleDocument[STYLE_REFS] ?? 0) + 1;
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const next = Math.max(0, (styleDocument[STYLE_REFS] ?? 1) - 1);
    styleDocument[STYLE_REFS] = next;
    if (next === 0) document.getElementById(STYLE_ID)?.remove();
  };
}
