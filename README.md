# dsh-prompt-stash

DeepSeek Harness Web 的本地输入暂存插件。把尚未发送的纯文本压入当前会话的 LIFO 暂存栈，先处理临时问题，之后再安全恢复原输入。

> 输入暂存不是草稿同步。DSH 已负责保存当前输入框草稿；本插件提供的是一组可明确存入、恢复和删除的临时输入副本。

## 功能

- 每个 DSH 会话独立保存，最新内容优先，最多保留 10 条。
- 暂存后立即在输入框上方显示折叠栏，可展开预览、恢复、删除或清空。
- 当前输入非空时不会直接覆盖；恢复前必须确认先暂存当前内容。
- 使用 DSH 官方 `inputActions.setDraft()` 清空和恢复，不操作 `textarea` 或内部 Store。
- 纯客户端实现，不联网；内容只保存在当前浏览器的 `localStorage`。
- 支持中英文、深浅主题、键盘操作和 DSH 原生队列组合布局。

当前版本仅支持纯文本。带图片、附件或文件引用的输入不会被暂存。

## 要求

- DeepSeek Harness `0.1.0-rc.6`
- Web profile
- Node.js 20 或更高版本（仅源码开发需要）

## 安装

### Release tarball（推荐）

从 [Releases](https://github.com/Wine-Red/dsh-prompt-stash/releases/latest) 下载 `dsh-prompt-stash-0.1.0.tgz`，然后安装到 Web profile：

```sh
dsh plugin --profile web add ./dsh-prompt-stash-0.1.0.tgz
```

tarball 已包含构建产物，不需要允许安装期构建脚本。安装后重启 DSH Web。

### 本地源码 checkout

```sh
git clone https://github.com/Wine-Red/dsh-prompt-stash.git
cd dsh-prompt-stash
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

`dsh plugin` 会把组合包加入目标 profile 的 `dsh.profile.bundles`。可在启动前检查最终配置：

```sh
dsh --profile web --dump-config
```

输出中应包含 `dsh-prompt-stash` 组合层与 `prompt-stash` 插件行。

### 卸载

```sh
dsh plugin --profile web remove dsh-prompt-stash
```

卸载插件不会主动删除浏览器中已有的 `dsh.promptStash.v1` 数据。如需清除，可在浏览器站点数据中删除对应 `localStorage` 项。

## 使用

1. 在输入框中编写一段纯文本。
2. 点击工具栏中的“暂存”。输入框会被清空，上方立即出现折叠的暂存消息栏。
3. 输入并发送临时问题。
4. 展开暂存消息，点击目标内容恢复。
5. 如果输入框已有内容，选择“暂存当前内容并恢复此条”，或取消操作。

添加或删除成功时不会弹出通知；只有存储或输入更新失败时才会显示错误提示。

## 数据与安全边界

- 存储键：`dsh.promptStash.v1`
- 范围：当前浏览器、按 `sessionId` 隔离
- 内容：文本、ID、创建与更新时间、结构版本
- 不存储：图片二进制、附件正文、文件内容、凭据或环境信息
- 不发送网络请求，不收集遥测

浏览器站点数据被清理时，暂存内容也会被删除。

## 开发与打包

```sh
pnpm install --frozen-lockfile
pnpm format
pnpm typecheck
pnpm test
pnpm build
pnpm pack
```

项目按照 DSH 官方组合包格式提供：

- `package.json` 中的 `dsh.bundle.patch` 声明配置层。
- `cordis.patch.yml` 通过包名挂载插件。
- `lib/` 是预构建运行入口，并被收录进 tarball。
- 客户端分别注册 `conversation.input.left` 和 `conversation.input.dock` 插槽。

打包与安装机制参见 [DeepSeek Harness 官方文档](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)。

## 许可证

[MIT](LICENSE)
