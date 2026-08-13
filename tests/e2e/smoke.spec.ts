import { expect, test } from "@playwright/test";

test("DSH loads the prompt stash client without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#dsh-prompt-stash-style")).toHaveCount(1);
  await expect(
    page.locator('[data-testid="prompt-stash-controls"]'),
  ).toHaveCount(1);
  expect(errors.filter((error) => error.includes("prompt-stash"))).toEqual([]);
});
