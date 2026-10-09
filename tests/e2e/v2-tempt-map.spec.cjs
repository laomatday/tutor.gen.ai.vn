const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("UI mapping — tempt.gen.ai.vn → Tutor", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "Requires student V2 visual flag");

  test("M3 shell maps 256px rail, 64px topbar, persisted dark/light and source-backed search", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const root = page.locator(".learning-os-v2");
    await expect(root).toHaveAttribute("data-design-source", "tempt-genai");
    await expect(root).toHaveAttribute("data-visual-theme", "dark");
    await expect(page.getByText("Không gian học tập", { exact: true })).toBeVisible();
    await expect(page.getByText("Tiện ích học tập", { exact: true })).toBeVisible();
    const sidebar = await page.locator(".v2-sidebar").boundingBox();
    const topbar = await page.locator(".v2-topbar").boundingBox();
    expect(sidebar?.width).toBeGreaterThanOrEqual(250);
    expect(sidebar?.width).toBeLessThanOrEqual(260);
    expect(topbar?.height).toBeGreaterThanOrEqual(63);
    expect(topbar?.height).toBeLessThanOrEqual(65);

    const modes = page.getByRole("group", { name: "Chế độ giao diện" });
    await modes.getByRole("button", { name: "Sáng" }).click();
    await expect(root).toHaveAttribute("data-visual-theme", "light");
    await expect(modes.getByRole("button", { name: "Sáng" })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(root).toHaveAttribute("data-visual-theme", "light");
    await modes.getByRole("button", { name: "Tối" }).click();
    await expect(root).toHaveAttribute("data-visual-theme", "dark");

    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog", { name: "Tìm nội dung học tập" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("searchbox", { name: "Từ khóa tìm kiếm học liệu" }).fill("căn");
    await expect(dialog.getByLabel("Bài học đã xuất bản phù hợp")).toBeVisible();
    const result = dialog.locator(".v2-search-results .ui-btn").first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).toHaveURL(/\/hoc-bai\?.*lesson=/);
    await expect(page.locator(".v2-legacy-surface")).toBeVisible();

    fs.mkdirSync(path.join("test-results","visual"), { recursive: true });
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    await page.screenshot({ path: path.join("test-results","visual","tempt-mapped-shell-1440.png") });
  });

  test("four real Tutor student screens preserve M3 composition and working interactions", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    fs.mkdirSync(path.join("test-results","visual"), { recursive: true });
    const entries = [
      { url: "/", selector: ".v2-mission-page", name: "mission" },
      { url: "/hoc-bai", selector: ".v2-universe-page", name: "universe" },
      { url: "/tu-giai", selector: ".v2-focus-page", name: "focus" },
      { url: "/replay?problem=quadratic-factor-01", selector: ".v2-replay-page", name: "replay" },
    ];
    for (const entry of entries) {
      await page.goto(entry.url);
      await expect(page.locator(entry.selector)).toBeVisible();
      await page.evaluate(() => document.querySelector(".v2-main")?.scrollTo(0, 0));
      await page.screenshot({
        path: path.join("test-results","visual",`tempt-map-${entry.name}-1440.png`),
      });
      const radius = await page.locator(".v2-topbar").evaluate(
        (element) => window.getComputedStyle(element).height,
      );
      expect(Number.parseFloat(radius)).toBeGreaterThanOrEqual(63);
    }
    await page.goto("/");
    await expect(page.locator(".v2-choices-grid .v2-choice")).toHaveCount(3);
    const mission = await page.locator(".v2-next-mission").boundingBox();
    const lab = await page.locator(".v2-mini-lab").boundingBox();
    expect(mission.width / lab.width).toBeGreaterThan(1.2);
    await page.goto("/hoc-bai");
    const mode = page.getByRole("tablist", { name: "Chế độ khám phá tri thức" });
    await mode.getByRole("tab", { name: "Danh sách" }).click();
    await expect(page.locator('.v2-universe-list[data-view="list"]')).toBeVisible();
    await page.goto("/tu-giai");
    await expect(page.getByLabel("Trình bày từng phép biến đổi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Kiểm tra từng bước" })).toBeVisible();
  });

  test("mobile 390 and 360 keeps four destinations, readable controls and no overflow", async ({ page }) => {
    fs.mkdirSync(path.join("test-results","visual"), { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const entry of [
      { url: "/", selector: ".v2-mission-page", name: "mission" },
      { url: "/hoc-bai", selector: ".v2-universe-page", name: "universe" },
      { url: "/tu-giai", selector: ".v2-focus-page", name: "focus" },
      { url: "/replay?problem=quadratic-factor-01", selector: ".v2-replay-page", name: "replay" },
    ]) {
      await page.goto(entry.url);
      await expect(page.locator(entry.selector)).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Điều hướng học tập chính" })).toBeVisible();
      await page.screenshot({ path: path.join("test-results","visual",`tempt-map-${entry.name}-390.png`) });
    }
    await page.setViewportSize({ width: 360, height: 800 });
    for (const url of ["/", "/hoc-bai", "/tu-giai", "/replay?problem=quadratic-factor-01"]) {
      await page.goto(url);
      await expect(page.locator(".learning-os-v2")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow: ${url}`).toBeLessThanOrEqual(1);
    }
  });

  test("V1 and Teacher/Admin are not styled as the imported prototype", async ({ page }) => {
    await page.goto("/giao-vien");
    await expect(page.locator(".learning-os-v2")).toHaveCount(0);
    await expect(page.locator(".app-header")).toBeVisible();
    await page.goto("/quan-tri");
    await expect(page.locator(".learning-os-v2")).toHaveCount(0);
    await expect(page.locator(".app-header")).toBeVisible();
  });

  test("dark theme main screen has no severe WCAG violations", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const issues = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa"] },
      });
      return result.violations
        .filter((issue) => ["serious","critical"].includes(issue.impact))
        .map((issue) => ({ id: issue.id, count: issue.nodes.length }));
    });
    expect(issues).toEqual([]);
  });
});
