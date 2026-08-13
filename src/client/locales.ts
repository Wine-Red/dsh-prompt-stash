import type { LocaleDictOf } from "@deepseek-ai/dsh-client-ui-slots";

export const NS = "prompt-stash" as const;

export const zh = {
  "action.stash": "暂存",
  "action.stashShortcut": "暂存（{shortcut}）",
  "action.restoreShortcut": "恢复最新暂存（{shortcut}）",
  "action.open": "查看输入暂存，共 {count} 条",
  "action.restore": "恢复此条",
  "action.delete": "删除此条",
  "action.clear": "清空",
  "action.cancel": "取消",
  "action.confirmClear": "清空全部",
  "action.swap": "暂存当前内容并恢复此条",
  "panel.title": "输入暂存",
  "panel.summaryOne": "{count} 条暂存消息",
  "panel.summary": "{count} 条暂存消息",
  "dialog.restoreTitle": "当前输入不会被覆盖",
  "dialog.restoreDescription": "先暂存当前内容，再恢复所选内容。",
  "dialog.clearTitle": "清空当前会话的全部暂存？",
  "dialog.clearDescription": "此操作无法撤销。当前输入框不会受到影响。",
  "relative.now": "刚刚",
  "relative.minutes": "{count} 分钟前",
  "relative.hours": "{count} 小时前",
  "relative.days": "{count} 天前",
  "error.blocked.empty": "请输入非空文本后再暂存。",
  "error.blocked.busy": "输入正在处理，暂时无法暂存。",
  "error.blocked.images": "暂存仅支持纯文本；请先移除图片。",
  "error.blocked.occurrences": "暂存仅支持纯文本；请先移除文件或引用。",
  "error.storageWrite":
    "本地存储写入失败，输入内容未被清空。请检查浏览器存储空间后重试。",
  "error.draftWrite": "无法更新输入框。暂存副本仍然保留。",
  "error.cleanupCopy": "内容已恢复，但暂存副本未能移除；你可以稍后手动删除。",
  "settings.title": "输入暂存",
  "settings.description": "配置将当前输入加入暂存的快捷键",
  "settings.expand": "展开",
  "settings.collapse": "折叠",
  "settings.unsaved": "未保存",
  "settings.shortcutLabel": "加入暂存快捷键",
  "settings.shortcutHint":
    "点击输入框后按下一个按键或组合键。仅在消息输入框内生效。",
  "settings.reset": "恢复默认",
  "settings.discard": "放弃更改",
  "settings.save": "保存",
  "settings.saveFailed": "无法保存快捷键，请检查浏览器本地存储后重试。",
} as const;

export type PromptStashLocaleKey = keyof typeof zh;

export const en: LocaleDictOf<typeof NS> = {
  "action.stash": "Stash",
  "action.stashShortcut": "Stash ({shortcut})",
  "action.restoreShortcut": "Restore latest stash ({shortcut})",
  "action.open": "View {count} stashed prompts",
  "action.restore": "Restore this prompt",
  "action.delete": "Delete this prompt",
  "action.clear": "Clear",
  "action.cancel": "Cancel",
  "action.confirmClear": "Clear all",
  "action.swap": "Stash current prompt and restore this one",
  "panel.title": "Prompt stash",
  "panel.summaryOne": "{count} stashed prompt",
  "panel.summary": "{count} stashed prompts",
  "dialog.restoreTitle": "Your current prompt will not be overwritten",
  "dialog.restoreDescription":
    "Stash the current prompt first, then restore the selected prompt.",
  "dialog.clearTitle": "Clear every stash in this session?",
  "dialog.clearDescription":
    "This cannot be undone. The current composer will not be changed.",
  "relative.now": "Just now",
  "relative.minutes": "{count}m ago",
  "relative.hours": "{count}h ago",
  "relative.days": "{count}d ago",
  "error.blocked.empty": "Enter some text before stashing.",
  "error.blocked.busy": "The composer is busy and cannot be stashed yet.",
  "error.blocked.images":
    "Only plain text can be stashed. Remove images first.",
  "error.blocked.occurrences":
    "Only plain text can be stashed. Remove file references first.",
  "error.storageWrite":
    "Local storage failed, so the composer was not cleared. Check browser storage and try again.",
  "error.draftWrite":
    "The composer could not be updated. A stashed copy is still available.",
  "error.cleanupCopy":
    "The prompt was restored, but its stash copy could not be removed. You can delete it later.",
  "settings.title": "Prompt stash",
  "settings.description":
    "Configure the shortcut that stashes the current prompt",
  "settings.expand": "Expand",
  "settings.collapse": "Collapse",
  "settings.unsaved": "Unsaved",
  "settings.shortcutLabel": "Stash shortcut",
  "settings.shortcutHint":
    "Focus the field, then press one key or a key combination. It only works in the message composer.",
  "settings.reset": "Reset to default",
  "settings.discard": "Discard changes",
  "settings.save": "Save",
  "settings.saveFailed":
    "The shortcut could not be saved. Check browser storage and try again.",
};

declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface LocaleNamespaceMap {
    "prompt-stash": PromptStashLocaleKey;
  }
}
