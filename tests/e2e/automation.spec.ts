import { test, expect, type BrowserContext } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";

async function session(
  context: BrowserContext,
  role: "admin" | "editor" | "student",
) {
  await context.clearCookies();
  const cookies: {
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    sameSite: "Lax";
  }[] = [];
  const client = createServerClient(
    "http://127.0.0.1:54321",
    "sb_publishable_test_fixture_only",
    {
      cookies: {
        getAll: () => [],
        setAll: (values) => {
          for (const { name, value } of values)
            cookies.push({
              name,
              value,
              domain: "127.0.0.1",
              path: "/",
              httpOnly: true,
              sameSite: "Lax",
            });
        },
      },
    },
  );
  const { error } = await client.auth.signInWithPassword({
    email: `${role}@example.test`,
    password: "fixture-password-only",
  });
  expect(error).toBeNull();
  await context.addCookies(cookies);
}
test("anonymous and student cannot access automation; Hindi route remains protected", async ({
  page,
  context,
}) => {
  await page.goto("/en/admin/automation");
  await expect(page).toHaveURL(/\/en\/login/);
  await session(context, "student");
  await page.goto("/hi/admin/automation");
  await expect(
    page.getByRole("heading", { name: "परीक्षा सूचना प्रबंधन" }),
  ).toHaveCount(0);
  await expect(page.getByText("404", { exact: true })).toBeVisible();
});
test("admin collection → editor verification and Hindi draft → admin approval; accessible themed layout", async ({
  page,
  context,
}) => {
  await session(context, "admin");
  const response = await page.goto("/en/admin/automation");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByRole("heading", { name: "Examination information desk" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Skip to content", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page
    .locator("summary")
    .filter({ hasText: /^Register a source$/ })
    .click();
  const source = page
    .locator('form:has(input[name="command"][value="source"])')
    .first();
  await source
    .getByLabel("Source name", { exact: true })
    .fill(`Browser fixture ${randomUUID()}`);
  await source
    .getByLabel("Official source URL", { exact: true })
    .fill(`https://official.example.org/${randomUUID()}`);
  await source
    .getByRole("combobox", { name: "Verification", exact: true })
    .selectOption("verified");
  await source
    .locator('[name="verification_notes"]')
    .fill("Synthetic test source reviewed; no official examination claims");
  await source
    .getByLabel("Licensing / reuse notes", { exact: true })
    .fill("Original synthetic fixture text; test reuse permitted");
  await source.getByLabel("Active source", { exact: true }).check();
  await source.getByRole("button", { name: "Save", exact: true }).click();
  await expect(source.getByRole("status")).toHaveText(
    "Saved. History retained.",
  );
  await page
    .locator("summary")
    .filter({ hasText: /^Manual Development evidence$/ })
    .click();
  const collect = page.locator(
    'form:has(input[name="command"][value="collect"])',
  );
  const marker = `Synthetic evidence ${randomUUID()}`;
  await collect.locator('[name="text"]').fill(marker);
  await collect.getByRole("button", { name: "Save", exact: true }).click();
  const item = page
    .locator("article[data-review-id]")
    .filter({ hasText: marker });
  await expect(item).toBeVisible();
  await session(context, "editor");
  await page.reload();
  await expect(
    page.locator("summary").filter({ hasText: /^Register a source$/ }),
  ).toHaveCount(0);
  await item
    .locator("summary")
    .filter({ hasText: /^Review evidence$/ })
    .click();
  const triage = item.locator('form:has(input[value="triage"])');
  await triage
    .getByRole("combobox", { name: "Verification", exact: true })
    .selectOption("verified");
  await triage
    .locator('[name="notes"]')
    .fill("Reviewed original synthetic evidence and licensing");
  await triage.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    item.getByRole("heading", { name: "Notice · Verified" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "हिन्दी", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "परीक्षा सूचना प्रबंधन" }),
  ).toBeVisible();
  await item
    .locator("summary")
    .filter({ hasText: /^नया संशोधन तैयार करें$/ })
    .click();
  const draft = item.locator('form:has(input[value="draft"])');
  await draft.locator('[name="title"]').fill("परीक्षण सारांश");
  await draft
    .locator('[name="body"]')
    .fill(
      "यह केवल परीक्षण के लिए मूल सारांश है। इसमें कोई परीक्षा तिथि नहीं है।",
    );
  await draft.locator('[name="rights_confirmed"]').check();
  await draft.getByRole("button", { name: "सहेजें", exact: true }).click();
  await expect(
    item.getByRole("heading", { name: "सूचना · मसौदा" }),
  ).toBeVisible();
  await expect(
    item.locator("summary").filter({ hasText: /^संशोधन अनुमोदित करें$/ }),
  ).toHaveCount(0);
  await session(context, "admin");
  await page.goto("/en/admin/automation");
  await item
    .locator("summary")
    .filter({ hasText: /^Approve revision$/ })
    .click();
  const approval = item.locator('form:has(input[value="approve"])');
  await approval
    .locator('[name="notes"]')
    .fill("Approved exact synthetic revision for testing only");
  await approval
    .getByRole("button", { name: "Approve revision", exact: true })
    .click();
  await expect(
    item.getByRole("heading", { name: "Notice · Approved" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Publish$/ })).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem("bsm-theme", "dark");
    document.documentElement.dataset.theme = "dark";
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .include("main")
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
