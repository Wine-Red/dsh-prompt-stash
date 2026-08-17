import { expect, test } from "@playwright/test";

test("stores the shortcut in Host plugin settings instead of localStorage", async ({
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
  const settingsDialog = page.getByRole("dialog", { name: /设置|Settings/ });
  await settingsDialog
    .getByRole("button", { name: /^(插件|Plugins)$/ })
    .first()
    .click();
  await settingsDialog
    .getByRole("tab", { name: /^(插件配置|Plugin configuration)$/ })
    .click();

  const card = page.getByRole("button", { name: /输入暂存|Prompt stash/ });
  await expect(card).toBeVisible();
  await card.click();
  const shortcut = page.getByRole("textbox", {
    name: /加入暂存快捷键|Stash shortcut/,
  });
  const initialShortcut = await shortcut.inputValue();
  const testShortcut = initialShortcut === "F8" ? "F9" : "F8";
  await shortcut.focus();
  await page.keyboard.press(testShortcut);
  await expect(shortcut).toHaveValue(testShortcut);
  await page.getByRole("button", { name: /^(保存|Save)$/ }).click();
  await expect(shortcut).toHaveValue(testShortcut);
  await page.screenshot({
    path: "screenshots/dsh-prompt-stash-shortcut-settings.png",
    fullPage: true,
  });

  await page.keyboard.press("Escape");
  const composer = page.locator("textarea").first();
  await composer.fill("stashed by custom shortcut");
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("");
  await expect(page.locator("[data-prompt-stash-dock]")).toBeVisible();
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("stashed by custom shortcut");
  await expect(page.locator("[data-prompt-stash-dock]")).toHaveCount(0);

  await composer.fill("first rotation item");
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("");
  await composer.fill("second rotation item");
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("");
  await composer.fill("third rotation item");
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("");

  await composer.press(testShortcut);
  await expect(composer).toHaveValue("third rotation item");
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("second rotation item");
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("first rotation item");
  await composer.press(testShortcut);
  await expect(composer).toHaveValue("third rotation item");

  await page.evaluate(() =>
    localStorage.removeItem("dsh.promptStash.settings.v1"),
  );
  await page.reload({ waitUntil: "networkidle" });
  expect(
    await page.evaluate(() =>
      localStorage.getItem("dsh.promptStash.settings.v1"),
    ),
  ).toBeNull();
  await expect(page.locator(".dsh-prompt-stash-button")).toHaveAttribute(
    "aria-label",
    /暂存|Stash/,
  );

  await page.getByRole("button", { name: /设置|Settings/ }).click();
  const reloadedSettingsDialog = page.getByRole("dialog", {
    name: /设置|Settings/,
  });
  await reloadedSettingsDialog
    .getByRole("button", { name: /^(插件|Plugins)$/ })
    .first()
    .click();
  await reloadedSettingsDialog
    .getByRole("tab", { name: /^(插件配置|Plugin configuration)$/ })
    .click();
  await page.getByRole("button", { name: /输入暂存|Prompt stash/ }).click();
  const persistedShortcut = page.getByRole("textbox", {
    name: /加入暂存快捷键|Stash shortcut/,
  });
  await expect(persistedShortcut).toHaveValue(testShortcut);
  await persistedShortcut.focus();
  await page.keyboard.press(initialShortcut.replace(/^Ctrl(?=\+)/, "Control"));
  await page.getByRole("button", { name: /^(保存|Save)$/ }).click();
  await expect(persistedShortcut).toHaveValue(initialShortcut);
  expect(errors.filter((error) => error.includes("prompt-stash"))).toEqual([]);
});
