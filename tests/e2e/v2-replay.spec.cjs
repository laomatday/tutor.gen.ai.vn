const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("V2 Thinking Replay — real recorded events only", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "Requires V2 flag");

  test("empty state cannot invent history or pretend AI reflection", async ({ page }) => {
    await page.goto("/replay?problem=quadratic-factor-01");
    await expect(page.locator(".v2-replay-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Thinking Replay", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chưa có lần thử nào? Bắt đầu thôi." })).toBeVisible();
    await expect(page.locator(".v2-replay-timeline")).toHaveCount(0);
    await page.getByRole("button", { name: "Thử giải bài đầu tiên" }).click();
    await expect(page).toHaveURL(/\/tu-giai\?problem=quadratic-factor-01/);
    await expect(page.locator(".v2-focus-page")).toBeVisible();
  });

  test("real checks and corrections replay with seek, speed and preserved text", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    const field = page.getByLabel("Trình bày từng phép biến đổi");
    await field.fill("(x-1)(x-6)=0\nx=1 hoặc x=6");
    await page.getByRole("button", { name: "Kiểm tra từng bước" }).click();
    await field.fill("(x-2)(x-3)=0\nx=2 hoặc x=3");
    await page.getByRole("button", { name: "Kiểm tra từng bước" }).click();
    await page.getByRole("button", { name: "Xem Thinking Replay" }).click();
    await expect(page).toHaveURL(/\/replay\?problem=quadratic-factor-01/);
    await expect(page.locator(".v2-replay-page")).toBeVisible();
    const player = page.locator(".v2-replay-paper");
    const timeline = page.getByRole("complementary", { name: "Các bước đã ghi nhận" });
    await expect(timeline.getByRole("listitem")).toHaveCount(3);
    await expect(player.locator(".v2-replay-written")).toContainText("(x-2)(x-3)");
    const firstCheck = timeline.getByRole("listitem").nth(1).getByRole("button");
    await firstCheck.click();
    await expect(player.locator(".v2-replay-written")).toContainText("(x-1)(x-6)");
    await page.getByRole("button", { name: "Phát lại" }).click();
    await expect(page.getByRole("button", { name: "Tạm dừng" })).toBeVisible();
    await page.getByRole("button", { name: "Tạm dừng" }).click();
    await page.getByRole("group", { name: "Tốc độ phát lại" }).getByRole("button", { name: "1.5×" }).click();
    await expect(page.getByRole("button", { name: "1.5×" })).toHaveAttribute("aria-pressed", "true");
    const snapshot = await page.evaluate(() => localStorage.getItem("genai-practice-sessions-v3"));
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem("genai-practice-sessions-v3"))).toBe(snapshot);
    fs.mkdirSync(path.join("test-results", "visual"), { recursive: true });
    await page.screenshot({ path: path.join("test-results","visual","v2-replay-1440.png"), fullPage: true });
    await page.goto("/replay?problem=parabola-coefficient-03");
    await expect(page.getByRole("heading", { name: "Chưa có lần thử nào? Bắt đầu thôi." })).toBeVisible();
  });

  test("mobile replay no overflow and no severe WCAG issues", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    await page.getByLabel("Trình bày từng phép biến đổi").fill("(x-2)(x-3)=0\nx=2 hoặc x=3");
    await page.getByRole("button", { name: "Kiểm tra từng bước" }).click();
    await page.goto("/replay?problem=quadratic-factor-01");
    await expect(page.locator(".v2-replay-page")).toBeVisible();
    fs.mkdirSync(path.join("test-results","visual"), { recursive: true });
    await page.screenshot({ path: path.join("test-results","visual","v2-replay-390.png"), fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const issues = await page.evaluate(async () => {
      const res = await window.axe.run(document,{
        runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa"] },
      });
      return res.violations.filter(x=>["critical","serious"].includes(x.impact)).map(x=>({id:x.id,count:x.nodes.length}));
    });
    expect(issues).toEqual([]);
  });
});
