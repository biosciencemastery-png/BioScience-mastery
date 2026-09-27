import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["en", "hi"]) {
  test(`${locale}: homepage sections, truthful course states and no collection`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const id of [
      "courses",
      "coming-soon",
      "approach",
      "updates",
      "resources",
      "faq",
    ]) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.locator(".exam-card")).toHaveCount(9);
    await expect(page.locator(".exam-card img, .exam-card svg")).toHaveCount(0);
    await expect(page.locator("input, form")).toHaveCount(0);
    await expect(page.locator(".update-date strong")).toHaveText(
      locale === "en" ? "To Be Announced" : "घोषणा की प्रतीक्षा",
    );
    await expect(page.locator(".hero .button")).toHaveAttribute(
      "href",
      `/${locale}/courses/gat-b`,
    );
    const summary = page.locator(".faq-list summary").first();
    await summary.click();
    await expect(page.locator(".faq-list details").first()).toHaveAttribute(
      "open",
      "",
    );
    await summary.click();
    await expect(page.locator(".faq-list details").first()).not.toHaveAttribute(
      "open",
    );
    expect(errors).toEqual([]);
  });

  test(`${locale}: homepage and course meet automated accessibility checks`, async ({
    page,
    browserName,
  }) => {
    for (const path of [`/${locale}`, `/${locale}/courses/gat-b`]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        // Phase 1 has no frames. Avoid a crashing isolated analysis tab in Windows WebKit.
        .setLegacyMode(process.platform === "win32" && browserName === "webkit")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  });

  test(`${locale}: course information and working internal destinations`, async ({
    page,
    request,
  }) => {
    await page.goto(`/${locale}/courses/gat-b`);
    await expect(page.locator("h1")).toHaveText("GAT-B");
    await expect(page.locator("#availability")).toContainText(
      locale === "en" ? "Not open yet" : "अभी शुरू नहीं हुआ है",
    );
    await expect(page.locator(".learning-step")).toHaveCount(4);
    await expect(page.locator("input, form")).toHaveCount(0);
    for (const path of [`/${locale}`, `/${locale}/courses/gat-b`]) {
      await page.goto(path);
      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((links) => [
          ...new Set(
            links.map((link) =>
              (link as HTMLAnchorElement).getAttribute("href")!,
            ),
          ),
        ]);
      for (const href of hrefs) {
        const target = new URL(href, page.url());
        expect(target.origin).toBe(new URL(page.url()).origin);
        const response = await request.get(target.pathname);
        expect(response.ok(), href).toBeTruthy();
        if (target.hash) {
          const html = await response.text();
          expect(html, href).toContain(`id="${target.hash.slice(1)}"`);
        }
      }
    }
  });
}

test("language switch preserves the course page", async ({ page }) => {
  await page.goto("/en/courses/gat-b");
  await page.getByRole("link", { name: "हिंदी", exact: true }).click();
  await expect(page).toHaveURL(/\/hi\/courses\/gat-b$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/courses\/gat-b$/);
});

test("root redirects, unsupported paths return 404, review is noindex", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  for (const path of [
    "/fr",
    "/en/courses/not-a-course",
    "/hi/courses/not-a-course",
    "/en/missing",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /",
  );
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("<loc>");
  const response = await request.get("/en");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});

test("mobile menu supports open, Escape, keyboard and destination selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-nav")).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Enter");
  await page
    .locator("#mobile-nav")
    .getByRole("link", { name: "Free resources", exact: true })
    .click();
  await expect(page).toHaveURL(/#resources$/);
  await expect(page.locator("#mobile-nav")).toBeHidden();
  await expect(page.locator("#resources")).toBeInViewport();
});

test("no horizontal overflow at small, tablet and desktop widths", async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/en",
      "/hi",
      "/en/courses/gat-b",
      "/hi/courses/gat-b",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${path} at ${width}px`,
      ).toBeTruthy();
    }
  }
});

test("skip link and FAQ work by keyboard", async ({ page, isMobile }) => {
  await page.goto("/en");
  // Mobile Safari's native Tab policy skips links. Test activation after focus there.
  // Desktop projects also verify the skip link is first in the native tab order.
  if (isMobile)
    await page.getByRole("link", { name: "Skip to content" }).focus();
  else await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  const summary = page.locator(".faq-list summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".faq-list details").first()).toHaveAttribute(
    "open",
    "",
  );
});
