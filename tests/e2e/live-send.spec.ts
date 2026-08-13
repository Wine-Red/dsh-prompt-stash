import { expect, test } from "@playwright/test";

const ORIGINAL =
  "这是一段需要稍后继续编辑的长草稿。请保留全部上下文、格式和措辞，不要在临时问题处理期间覆盖它。";
const TEMPORARY = "临时问题：请只回复“临时问题已完成”。";

test("sends a temporary question and restores the original draft", async ({
  page,
}) => {
  test.skip(
    process.env.DSH_LIVE_SEND !== "1",
    "Opt-in because this test sends one real DSH request.",
  );
  test.setTimeout(180_000);

  await page.goto("/", { waitUntil: "networkidle" });
  const input = page.locator("textarea").first();
  await input.fill(ORIGINAL);
  await page.locator(".dsh-prompt-stash-button").click();
  await expect(input).toHaveValue("");

  await input.fill(TEMPORARY);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByText(TEMPORARY, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible({
    timeout: 150_000,
  });

  await page.getByRole("button", { name: "1 stashed prompt" }).click();
  await page.locator(".dsh-prompt-stash-restore").first().click();
  await expect(input).toHaveValue(ORIGINAL);
  await expect(
    page.getByRole("button", { name: /stashed prompts/ }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "screenshots/dsh-live-send-restored.png",
    fullPage: true,
  });
});
