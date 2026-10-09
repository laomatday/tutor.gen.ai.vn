const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("V2 Knowledge Universe — published topic graph", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "Requires V2 flag");

  test("desktop: topic nodes, inspector, zoom, search, mode parity", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/hoc-bai");
    await expect(page.locator(".v2-universe-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Knowledge Universe", exact: true })).toBeVisible();
    const nodes = page.locator(".v2-universe-node");
    expect(await nodes.count()).toBeGreaterThanOrEqual(4);
    await nodes.last().click();
    await expect(nodes.last()).toHaveAttribute("aria-pressed", "true");
    const inspector = page.getByRole("complementary", { name: "Thông tin chủ đề" });
    await expect(inspector.getByRole("heading", { level: 2 })).toBeVisible();
    const scene = page.locator(".v2-universe-space-scene");
    const initial = await scene.getAttribute("style");
    await page.getByRole("button", { name: "Phóng to bản đồ" }).click();
    expect(await scene.getAttribute("style")).not.toBe(initial);
    await page.getByRole("button", { name: "Căn giữa bản đồ" }).click();
    await expect(scene).toHaveAttribute("style", /scale\(1\)/);
    const tabs = page.getByRole("tablist", { name: "Chế độ khám phá tri thức" });
    await tabs.getByRole("tab", { name: "Hành trình" }).click();
    await expect(page.locator('.v2-universe-list[data-view="journey"]')).toBeVisible();
    await tabs.getByRole("tab", { name: "Danh sách" }).click();
    await expect(page.locator('.v2-universe-list[data-view="list"]')).toBeVisible();
    fs.mkdirSync(path.join("test-results", "visual"), { recursive: true });
    await page.goto("/hoc-bai");
    await page.screenshot({ path: path.join("test-results", "visual", "v2-universe-1440.png"), fullPage: true });
  });

  test("mobile: full accessible list with real lesson deep links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/hoc-bai");
    await expect(page.locator(".v2-universe-page")).toBeVisible();
    await expect(page.locator('.v2-universe-list[data-view="list"]')).toBeVisible();
    const item = page.locator(".v2-universe-list li").first();
    await item.getByRole("button").click();
    const panel = page.getByRole("complementary", { name: "Thông tin chủ đề" });
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Khám phá bài học" }).click();
    await expect(page).toHaveURL(/\/hoc-bai\?.*lesson=/);
    await expect(page.locator(".v2-legacy-surface")).toBeVisible();
    await page.goto("/hoc-bai");
    await page.screenshot({ path: path.join("test-results", "visual", "v2-universe-390.png"), fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )).toBeLessThanOrEqual(1);
  });

  test("filtered results cannot invent topics; accessibility gate", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/hoc-bai");
    await page.getByRole("searchbox", { name: "Tìm chủ đề hoặc bài học" }).fill("ten-chu-de-khong-co");
    await expect(page.getByRole("heading", { name: "Chưa tìm thấy chủ đề phù hợp" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Thông tin chủ đề" })).toContainText("Chọn một chủ đề");
    await page.getByRole("button", { name: "Xem tất cả chủ đề" }).click();
    await expect(page.locator(".v2-universe-list li")).not.toHaveCount(0);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const issues = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
      return result.violations.filter((item) => ["serious", "critical"].includes(item.impact))
        .map((item) => ({ id: item.id, count: item.nodes.length }));
    });
    expect(issues).toEqual([]);
  });
});
