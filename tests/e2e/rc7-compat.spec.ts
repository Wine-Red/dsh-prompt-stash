import { expect, test, type Page } from "@playwright/test";

test.use({ locale: "zh-CN" });

async function dismissOnboarding(page: Page) {
  for (const name of ["继续", "稍后配置"]) {
    const button = page.getByRole("button", { name, exact: true });
    if (await button.isVisible()) await button.click();
  }
}

test("rc7 composer, shortcut persistence, and local stash survive a reload", async ({
  page,
}) => {
  test.skip(
    !process.env.DSH_TEST_URL,
    "Requires an isolated DSH 0.1.7-rc.1 URL, including its process token.",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.DSH_TEST_URL!);
  await expect(page.locator(".dsh-prompt-stash-button")).toBeVisible();
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "设置", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "内置插件", exact: true }).click();
  await page.getByRole("tab", { name: "Prompt Stash", exact: true }).click();
  await page
    .getByRole("button", { name: "展开: 输入暂存", exact: true })
    .click();
  const shortcut = page.getByRole("textbox", {
    name: "加入暂存快捷键",
    exact: true,
  });
  const previous = await shortcut.inputValue();
  const next = previous === "Alt+F8" ? "Alt+F9" : "Alt+F8";
  await shortcut.press(next);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  const composer = page.locator(
    '[data-composer-input][contenteditable="true"]',
  );
  const prompt = "DSH rc7 compatibility check\n保留第二行";
  await composer.fill(prompt);
  await composer.press(next);
  await expect(composer).toHaveText("");
  await expect(page.locator("[data-prompt-stash-dock]")).toBeVisible();
  await page.reload();
  await expect(page.locator(".dsh-prompt-stash-button")).toBeVisible();
  await dismissOnboarding(page);
  await composer.press(next);
  await expect(composer).toHaveText(prompt, { useInnerText: true });
  await composer.fill("");
  await page.getByRole("button", { name: "设置", exact: true }).click();
  await dialog.getByRole("button", { name: "内置插件", exact: true }).click();
  await page.getByRole("tab", { name: "Prompt Stash", exact: true }).click();
  await page
    .getByRole("button", { name: "展开: 输入暂存", exact: true })
    .click();
  await expect(shortcut).toHaveValue(next);
  await shortcut.press(previous);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "保存", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
