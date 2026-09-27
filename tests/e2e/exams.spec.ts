import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const locale of ["en", "hi"])
  test(`${locale}: database exam catalogue and disabled notification setup`, async ({
    page,
    browserName,
    request,
  }) => {
    await page.goto(`/${locale}/exams`);
    await expect(page.locator(".exam-card")).toHaveCount(9);
    await expect(page.locator(".exam-card img,.exam-card svg")).toHaveCount(0);
    await expect(
      page.locator(`.exam-card a[href="/${locale}/courses/gat-b"]`),
    ).toBeVisible();
    await expect(page.locator('.exam-card a[href$="/notify"]')).toHaveCount(8);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const result = await new AxeBuilder({ page })
      .setLegacyMode(process.platform === "win32" && browserName === "webkit")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.locator('.exam-card a[href$="/notify"]').first().click();
    await expect(page.locator("form")).toHaveCount(0);
    expect(
      (
        await request.get(`/${locale}/notifications/confirm?token=invalid`)
      ).status(),
    ).toBe(200);
    expect((await request.post("/api/notifications/deliver")).status()).toBe(
      503,
    );
  });
