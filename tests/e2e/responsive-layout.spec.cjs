const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const viewports = [
  [360, 800], [390, 844], [430, 932],
  [768, 1024], [820, 1180], [1024, 768],
  [1280, 800], [1440, 900], [1920, 1080],
];
const studentPages = [
  ["/", "today"],
  ["/hoc-bai", "knowledge"],
  ["/tu-giai", "studio"],
  ["/replay", "replay"],
];

for (const [width, height] of viewports) {
  test(`Adaptive learning workspaces at ${width} × ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    for (const [url, slug] of studentPages) {
      await page.goto(url);
      await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
      await expect(page.locator("#main-content h1")).toHaveCount(1);
      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        sidebar: Math.round(document.querySelector("#main-navigation").getBoundingClientRect().width),
      }));
      expect(layout.document - layout.viewport, `${slug} horizontal overflow at ${width}`).toBeLessThanOrEqual(1);
      if (width >= 768) {
        expect(layout.sidebar, "student rail collapsed").toBe(72);
        await expect(page.locator(".student-bottom-nav")).toBeHidden();
      } else {
        await expect(page.locator(".student-bottom-nav")).toBeVisible();
      }
      if ([390, 820, 1440, 1920].includes(width)) {
        const target = path.join("test-results", "adaptive", `${slug}-${width}.png`);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        await page.screenshot({ path: target, fullPage: true });
      }
    }
    expect(errors, "uncaught browser errors").toEqual([]);
  });
}

for (const width of [768, 1024, 1280]) {
  test(`Tablet/laptop rail opens as an accessible overlay at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const rail = page.locator("#main-navigation");
    const content = page.locator(".app-frame--student");
    const logo = rail.getByRole("button", { name: "Mở menu", exact: true });
    await expect(logo).toBeVisible();
    await expect(rail).toHaveCSS("width", "72px");
    await logo.click();
    await expect(rail).toHaveCSS("width", "288px");
    await expect(rail.getByRole("button", { name: "Đóng menu", exact: true })).toBeFocused();
    await expect(content).toHaveJSProperty("inert", true);
    await page.keyboard.press("Escape");
    await expect(rail).toHaveCSS("width", "72px");
    await expect(content).toHaveJSProperty("inert", false);
    await expect(rail.getByRole("button", { name: "Mở menu", exact: true })).toBeFocused();
  });
}

test("Knowledge Universe mobile map fills the screen and remains dismissible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/hoc-bai");
  await page.getByRole("tab", { name: "Bản đồ", exact: true }).click();
  const map = page.locator(".knowledge-map");
  await page.getByRole("button", { name: "Toàn màn hình" }).click();
  await expect(map).toHaveAttribute("data-map-expanded", "true");
  await expect(map).toHaveCSS("position", "fixed");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(map).toHaveAttribute("data-map-expanded", "false");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(page.locator("#main-content h1")).toHaveCount(1);
});

test("Knowledge Universe: topic selection opens a dismissible bottom sheet on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/hoc-bai");
  await page.getByRole("tab", { name: "Bản đồ", exact: true }).click();
  await page.getByRole("button", { name: "Toàn màn hình" }).click();
  await page.locator(".knowledge-map .knowledge-topic-node").first().click();
  const sheet = page.getByRole("dialog", { name: "Thông tin chủ đề" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toBeFocused();
  await expect(sheet.locator(".knowledge-lesson-list")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(page.locator(".knowledge-map")).toHaveAttribute("data-map-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator(".knowledge-map")).toHaveAttribute("data-map-expanded", "false");
});

test("Focus Studio phone: write first, open tool dock, then reach step hints", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tu-giai?problem=quadratic-factor-01");
  const problem = page.locator(".studio-problem");
  const reasoning = page.locator(".studio-reasoning");
  const tools = page.locator(".studio-toolbar");
  const problemY = (await problem.boundingBox()).y;
  const reasoningY = (await reasoning.boundingBox()).y;
  expect(reasoningY).toBeGreaterThan(problemY);
  expect((await tools.boundingBox())?.y ?? Infinity).toBeGreaterThan(reasoningY);
  await expect(page.getByRole("tablist", { name: "Công cụ Focus Studio" })).toBeHidden();
  await page.getByRole("button", { name: "Công cụ hỗ trợ" }).click();
  await expect(page.getByRole("tablist", { name: "Công cụ Focus Studio" })).toBeVisible();
  await page.getByRole("tab", { name: "Bút phác thảo" }).click();
  await expect(page.getByRole("img", { name: "Vùng vẽ nháp bằng bút hoặc chuột" })).toBeVisible();
  await page.getByRole("button", { name: "Xem gợi ý từng bước" }).click();
  await expect(page.getByRole("complementary", { name: "Hỗ trợ làm bài" })).toBeFocused();
});

for (const width of [390, 1024, 1440, 1920]) {
  test(`Staff and curriculum editor remain within viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/giao-vien", "/quan-tri", "/quan-tri/hoc-lieu"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `staff overflow at ${route}`).toBeLessThanOrEqual(1);
    }
  });
}
