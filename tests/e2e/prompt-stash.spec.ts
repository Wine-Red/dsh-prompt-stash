import { expect, test, type Page } from "@playwright/test";

const LONG_PROMPT =
  "请帮我分析这个仓库的模块边界、运行时数据流和测试覆盖，并保持现有接口兼容。\n同时列出最可能出现回归的三个位置。";
const TEMP_PROMPT = "临时问题：当前会话使用的模型是什么？";

async function composer(page: Page) {
  return page.locator("textarea").first();
}

test("stashes, persists, guards overwrite, swaps, deletes, and clears in the real DSH composer", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const pluginErrors: string[] = [];
  page.on("pageerror", (error) => {
    if (error.message.includes("prompt-stash"))
      pluginErrors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("prompt-stash")) {
      pluginErrors.push(message.text());
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });
  const input = await composer(page);
  const stash = page.locator(".dsh-prompt-stash-button");
  await expect(stash).toBeDisabled();

  await input.fill(LONG_PROMPT);
  await expect(stash).toBeEnabled();
  await stash.focus();
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("");
  await expect(page.getByText("Prompt stashed.", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "1 stashed prompt" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "1 stashed prompt" }),
  ).toHaveAttribute("aria-expanded", "false");

  await input.fill(TEMP_PROMPT);
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "1 stashed prompt" }).click();
  await expect(
    page.getByRole("region", { name: "Prompt stash" }),
  ).toBeVisible();
  await expect(page.getByText(LONG_PROMPT, { exact: true })).toBeVisible();
  const itemBox = await page.locator(".dsh-prompt-stash-item").boundingBox();
  const composerBox = await input.boundingBox();
  expect(itemBox).not.toBeNull();
  expect(composerBox).not.toBeNull();
  expect(itemBox!.y + itemBox!.height).toBeLessThanOrEqual(composerBox!.y);
  await page.screenshot({
    path: "screenshots/dsh-prompt-stash-light.png",
    fullPage: true,
  });

  await page.locator(".dsh-prompt-stash-restore").first().click();
  await expect(
    page.getByRole("dialog", {
      name: "Your current prompt will not be overwritten",
    }),
  ).toBeVisible();
  await expect(input).toHaveValue(TEMP_PROMPT);
  await page
    .getByRole("button", { name: "Cancel", exact: true })
    .last()
    .click();
  await expect(input).toHaveValue(TEMP_PROMPT);

  await page.locator(".dsh-prompt-stash-restore").first().click();
  await page
    .getByRole("button", { name: "Stash current prompt and restore this one" })
    .click();
  await expect(input).toHaveValue(LONG_PROMPT);
  await expect(page.getByText(TEMP_PROMPT, { exact: true })).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  const reloadedInput = await composer(page);
  await expect(reloadedInput).toHaveValue(LONG_PROMPT);
  await expect(
    page.getByRole("button", { name: "1 stashed prompt" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "1 stashed prompt" }).click();
  await expect(page.getByText(TEMP_PROMPT, { exact: true })).toBeVisible();

  await page
    .getByRole("button", {
      name: new RegExp(`^Delete this prompt: ${TEMP_PROMPT}`),
    })
    .click();
  await expect(
    page.getByText("Stashed prompt deleted.", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /stashed prompts/ }),
  ).toHaveCount(0);

  await reloadedInput.fill("one");
  await page.locator(".dsh-prompt-stash-button").click();
  await reloadedInput.fill("two");
  await page.locator(".dsh-prompt-stash-button").click();
  await page.getByRole("button", { name: "2 stashed prompts" }).click();
  await expect(page.getByText("two", { exact: true })).toBeVisible();
  await expect(page.getByText("one", { exact: true })).toBeVisible();
  const previews = page.locator(".dsh-prompt-stash-preview");
  expect(await previews.allTextContents()).toEqual(["two", "one"]);

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(
    page.getByRole("dialog", { name: "Clear every stash in this session?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "2 stashed prompts" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(
    page.getByRole("button", { name: /stashed prompts/ }),
  ).toHaveCount(0);
  expect(pluginErrors).toEqual([]);
});

test("composes cleanly with the native queue dock", async ({ page }) => {
  test.skip(
    process.env.DSH_QUEUE_VISUAL !== "1",
    "Opt-in because this test creates and cancels one real running turn.",
  );
  test.setTimeout(180_000);

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const input = await composer(page);
  await input.fill("队列与暂存组合布局验收：请持续分析十五秒后再简短回复。 ");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("button", { name: "Stop generating" }),
  ).toBeVisible({
    timeout: 20_000,
  });

  await input.fill("暂存列表中的内容");
  await page.locator(".dsh-prompt-stash-button").click();
  await input.fill("这是一条用于布局验收的排队消息");
  await input.press("Enter");
  await input.fill("第二条用于标题对齐验收的排队消息");
  await input.press("Enter");
  await expect(page.locator("[data-queue-dock]")).toBeVisible();
  const stashDock = page.locator("[data-prompt-stash-dock]");
  await expect(
    stashDock.getByRole("button", { name: "1 stashed prompt" }),
  ).toHaveAttribute("aria-expanded", "false");
  await stashDock.getByRole("button", { name: "1 stashed prompt" }).click();

  const queue = page.locator("[data-queue-dock]");
  const queueHeader = queue.locator("button[aria-expanded]").first();
  await expect(queueHeader).toBeVisible();
  await expect(
    stashDock.locator(".dsh-prompt-stash-header-lead svg"),
  ).toBeVisible();
  await expect(
    stashDock.getByRole("button", { name: "1 stashed prompt" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(stashDock.locator("time")).toHaveCount(1);
  const queueLeadBox = await queueHeader.locator("svg").first().boundingBox();
  const stashLeadBox = await stashDock
    .locator(".dsh-prompt-stash-header-lead svg")
    .boundingBox();
  const queueTitleBox = await queueHeader
    .getByText("2 queued messages")
    .boundingBox();
  const stashTitleBox = await stashDock
    .locator(".dsh-prompt-stash-title")
    .boundingBox();
  expect(queueLeadBox).not.toBeNull();
  expect(stashLeadBox).not.toBeNull();
  expect(queueTitleBox).not.toBeNull();
  expect(stashTitleBox).not.toBeNull();
  expect(Math.abs(queueLeadBox!.x - stashLeadBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(queueTitleBox!.x - stashTitleBox!.x)).toBeLessThanOrEqual(1);
  const queueChevronBox = await queueHeader.locator("svg").last().boundingBox();
  const stashChevronBox = await stashDock
    .locator(".dsh-prompt-stash-chevron svg")
    .boundingBox();
  const queueRightActionBox = await queue
    .getByRole("button", { name: "Steer queued message" })
    .first()
    .locator("svg")
    .boundingBox();
  const stashTrashBox = await stashDock
    .getByRole("button", { name: /^Delete this prompt:/ })
    .locator("svg")
    .boundingBox();
  expect(queueChevronBox).not.toBeNull();
  expect(stashChevronBox).not.toBeNull();
  expect(queueRightActionBox).not.toBeNull();
  expect(stashTrashBox).not.toBeNull();
  expect(
    Math.abs(
      queueChevronBox!.x +
        queueChevronBox!.width / 2 -
        (stashChevronBox!.x + stashChevronBox!.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      queueRightActionBox!.x +
        queueRightActionBox!.width / 2 -
        (stashTrashBox!.x + stashTrashBox!.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  const composerBox = await input.boundingBox();
  const queueBox = await queue.boundingBox();
  const stashBox = await stashDock.boundingBox();
  expect(composerBox).not.toBeNull();
  expect(queueBox).not.toBeNull();
  expect(stashBox).not.toBeNull();
  expect(Math.abs(queueBox!.x - stashBox!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(queueBox!.width - stashBox!.width)).toBeLessThanOrEqual(1);
  const queueStashOverlap = queueBox!.y + queueBox!.height - stashBox!.y;
  expect(queueStashOverlap).toBeGreaterThanOrEqual(2);
  expect(queueStashOverlap).toBeLessThanOrEqual(4);
  expect(stashBox!.y + stashBox!.height).toBeLessThanOrEqual(
    composerBox!.y + 4,
  );
  await page.screenshot({
    path: "screenshots/dsh-prompt-stash-with-queue.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Stop generating" }).click();
});

test("keeps session stacks isolated and remains readable in dark mode", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const input = await composer(page);
  await input.fill("session-one-stash");
  await page.locator(".dsh-prompt-stash-button").click();
  await page.getByRole("button", { name: "1 stashed prompt" }).click();
  await page.screenshot({
    path: "screenshots/dsh-prompt-stash-dark.png",
    fullPage: true,
  });

  const sessionOneId = await page.evaluate(() => {
    const document = JSON.parse(
      localStorage.getItem("dsh.promptStash.v1") ?? "null",
    ) as {
      sessions: Record<string, unknown>;
    };
    return Object.keys(document.sessions)[0];
  });
  expect(sessionOneId).toBeTruthy();

  await page
    .getByRole("tree", { name: "Sessions" })
    .locator('[role="treeitem"][aria-selected="false"]')
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: /stashed prompts/ }),
  ).toHaveCount(0);
  await expect(await composer(page)).toHaveValue("");

  const storage = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dsh.promptStash.v1") ?? "null"),
  );
  expect(Object.keys(storage.sessions)).toEqual([sessionOneId]);
});
