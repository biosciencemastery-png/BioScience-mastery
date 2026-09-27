import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const locale of ["en", "hi"]) {
  test(`${locale}: three-step registration validates locally and stays closed`, async ({
    page,
    browserName,
  }) => {
    await page.goto(`/${locale}/register`);
    await page.locator('[name="display_name"]').fill("Test learner");
    await page.locator('[name="email"]').fill("learner@example.test");
    await page.locator('[name="password"]').fill("long-password-only");
    await page.locator('[name="confirm_password"]').fill("different-password");
    await page.locator(".wizard-controls button").last().click();
    await expect(page.locator("#wizard-error")).toBeVisible();
    await expect(page.locator('[data-step="0"]')).toBeVisible();
    await page.locator('[name="confirm_password"]').fill("long-password-only");
    await page.locator(".wizard-controls button").last().click();
    await expect(page.locator('[data-step="1"]')).toBeVisible();
    await page.locator('[name="qualification"]').fill("Test qualification");
    await page.locator(".wizard-controls button").first().click();
    await expect(page.locator('[name="display_name"]')).toHaveValue(
      "Test learner",
    );
    await page.locator(".wizard-controls button").last().click();
    await expect(page.locator('[name="qualification"]')).toHaveValue(
      "Test qualification",
    );
    await page.locator(".wizard-controls button").last().click();
    await expect(page.locator('[data-step="2"]')).toBeVisible();
    await expect(page.locator('[name="terms"]')).not.toBeChecked();
    await expect(page.locator('[name="privacy"]')).not.toBeChecked();
    await expect(page.locator('[name="marketing"]')).not.toBeChecked();
    await expect(page.locator('[name="exam_ids"]')).toHaveCount(9);
    await page.locator('[name="terms"]').check();
    await page.locator('[name="privacy"]').check();
    // React actions reset uncontrolled forms after resolution; preserve data on errors.
    await page
      .locator("form")
      .evaluate((form) => (form as HTMLFormElement).reset());
    await expect(page.locator('[name="terms"]')).toBeChecked();
    await expect(page.locator('[name="privacy"]')).toBeChecked();
    await expect(page.locator('[name="display_name"]')).toHaveValue(
      "Test learner",
    );
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator(`form a[href="/${locale}/terms"]`)).toBeVisible();
    const results = await new AxeBuilder({ page })
      .setLegacyMode(process.platform === "win32" && browserName === "webkit")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
  test(`${locale}: draft legal pages have versions, support and localized links`, async ({
    page,
  }) => {
    for (const route of ["terms", "privacy", "refund-policy"]) {
      await page.goto(`/${locale}/${route}`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main")).toContainText("DRAFT");
      await expect(page.locator("main")).toContainText("2026-09-28-draft");
      await expect(
        page.locator('main a[href="mailto:biosciencemastery@gmail.com"]'),
      ).toBeVisible();
    }
  });
}
test("theme follows OS, persists a manual choice and remains accessible", async ({
  page,
  browserName,
}) => {
  test.setTimeout(120000);
  const checkFieldContrast = async () => {
    const ratio = await page
      .locator('input[name="email"]')
      .evaluate((input) => {
        const style = getComputedStyle(input);
        const luminance = (color: string) => {
          const rgb = (color.match(/[\d.]+/g) ?? [])
            .slice(0, 3)
            .map(Number)
            .map((v) => {
              const c = v / 255;
              return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const a = luminance(style.borderTopColor),
          b = luminance(style.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    expect(ratio).toBeGreaterThanOrEqual(3);
  };
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/en/login");
  await checkFieldContrast();
  await page.locator(".theme-toggle").click();
  for (const route of [
    "/en",
    "/en/exams",
    "/en/courses/gat-b",
    "/en/login",
    "/en/register",
    "/hi/privacy",
  ]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    if (route === "/en/login") await checkFieldContrast();
    const results = await new AxeBuilder({ page })
      .setLegacyMode(process.platform === "win32" && browserName === "webkit")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
});
