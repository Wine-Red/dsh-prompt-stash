import { expect, test } from "@playwright/test";

test("configures a single-key stash shortcut in the real plugin settings", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /设置|Settings/ }).click();
  await page.getByRole("button", { name: /^(插件|Plugins)$/ }).click();

  const card = page.getByRole("button", { name: /输入暂存|Prompt stash/ });
  await expect(card).toBeVisible();
  await card.click();
  const shortcut = page.getByRole("textbox", {
    name: /加入暂存快捷键|Stash shortcut/,
  });
  await expect(shortcut).toHaveValue("Ctrl+S");
  await shortcut.focus();
  await page.keyboard.press("F8");
  await expect(shortcut).toHaveValue("F8");
  await page.getByRole("button", { name: /^(保存|Save)$/ }).click();
  await expect(shortcut).toHaveValue("F8");
  await page.screenshot({
    path: "screenshots/dsh-prompt-stash-shortcut-settings.png",
    fullPage: true,
  });

  await page.keyboard.press("Escape");
  const composer = page.locator("textarea").first();
  await composer.fill("stashed by custom shortcut");
  await composer.press("F8");
  await expect(composer).toHaveValue("");
  await expect(page.locator("[data-prompt-stash-dock]")).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("dsh.promptStash.settings.v1") ?? "null"),
    ),
  ).toEqual({ version: 1, shortcut: "F8" });
  await expect(page.locator(".dsh-prompt-stash-button")).toHaveAttribute(
    "aria-label",
    /暂存|Stash/,
  );
  expect(errors.filter((error) => error.includes("prompt-stash"))).toEqual([]);
});
