const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("Opt-in Learning OS V2 shell", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "Requires VITE_STUDENT_EXPERIENCE_V2=true");

  test("desktop nav, search, teacher route isolation and saved practice remain available", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(".learning-os-v2")).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.locator(".v2-sidebar")).toBeVisible();
    await expect(page.getByRole("link", { name: "Focus Studio" })).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("dialog", { name: "Tìm nội dung học tập" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Từ khóa tìm kiếm học liệu" }).fill("căn thức");
    await page.getByRole("button", { name: "Tìm", exact: true }).click();
    await expect(page).toHaveURL(/\/hoc-bai\?q=c%C4%83n%20th%E1%BB%A9c/);
    await expect(page.locator(".v2-universe-page")).toBeVisible();
    await page.getByRole("link", { name: "Focus Studio" }).click();
    await expect(page).toHaveURL(/\/tu-giai/);
    await expect(page.getByLabel("Trình bày từng phép biến đổi")).toBeVisible();
    await page.goto("/giao-vien");
    await expect(page.locator(".learning-os-v2")).toHaveCount(0);
    await expect(page.locator(".app-header")).toBeVisible();
    fs.mkdirSync(path.join("test-results", "visual"), { recursive: true });
  });

  test("390px V2 bottom navigation and 360px fallback are operable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".learning-os-v2")).toBeVisible();
    const dock = page.getByRole("navigation", { name: "Điều hướng học tập chính" });
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("link")).toHaveCount(4);
    await page.getByRole("button", { name: "Mở menu học tập" }).click();
    await expect(page.locator("#v2-mobile-menu")).toHaveClass(/is-open/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#v2-mobile-menu")).not.toHaveClass(/is-open/);
    await expect(page.getByRole("button", { name: "Mở menu học tập" })).toBeFocused();
    const viewport = await dock.boundingBox();
    expect(viewport.y).toBeGreaterThan(680);
    await page.screenshot({ path: path.join("test-results", "visual", "v2-shell-390.png") });
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await dock.getByRole("link", { name: "Tri thức" }).click();
    await expect(page).toHaveURL(/\/hoc-bai/);
  });
});
