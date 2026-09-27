import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["en", "hi"]) {
  test(`${locale}: authentication forms are accessible and responsive`, async ({
    page,
    browserName,
  }) => {
    // Three full-page accessibility scans can exceed 30s on a cold Windows browser.
    test.setTimeout(90_000);
    for (const route of ["login", "register", "forgot-password"]) {
      const response = await page.goto(`/${locale}/${route}`);
      expect(response?.headers()["cache-control"]).toContain("no-store");
      expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toHaveAttribute(
        "required",
        "",
      );
      const results = await new AxeBuilder({ page })
        .setLegacyMode(process.platform === "win32" && browserName === "webkit")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
      await page.setViewportSize({ width: 320, height: 800 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
    }
  });
  test(`${locale}: protected routes and confirmation links fail safely`, async ({
    page,
  }) => {
    for (const route of ["account", "reset-password"]) {
      await page.goto(`/${locale}/${route}?next=https://example.com`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
    }
    await page.goto(`/${locale}/auth/confirm?token_hash=bad&type=signup`);
    await expect(page.locator("form")).toHaveCount(0);
    await page.goto(
      `/${locale}/auth/confirm?token_hash=${"a".repeat(64)}&type=recovery`,
    );
    await expect(page.locator('input[name="token_hash"]')).toHaveValue(
      "a".repeat(64),
    );
    await expect(page.locator("form button")).toBeVisible();
    // GET renders an interstitial; it must not consume email tokens or redirect.
    await expect(page).toHaveURL(/\/auth\/confirm\?/);
  });
}
