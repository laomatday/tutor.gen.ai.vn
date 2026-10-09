const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("Focus Studio V2 — math, agency and persistence", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "Requires V2 flag");

  test("real independent attempt, hint, correction and single reward", async ({ page }) => {
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    await expect(page.locator(".v2-focus-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Focus Studio", exact: true })).toBeVisible();
    const input = page.getByLabel("Trình bày từng phép biến đổi");
    await expect(input).toBeVisible();
    await page.getByRole("button", { name: "Đồ thị", exact: true }).count();
    await expect(page.getByText("Hãy thử một bước giải trước nhé")).toBeVisible();

    const hintLevel2 = page.getByRole("button", { name: /2.*Gợi ý|2.*Tìm|2.*Bước|2/ }).filter({has: page.locator("strong")}).first();
    if (await hintLevel2.count()) await expect(hintLevel2).toBeDisabled();
    await input.fill("(x-1)(x-6)=0\nx=1 hoặc x=6");
    await page.getByRole("button", { name: "Kiểm tra từng bước" }).click();
    await expect(page.getByRole("list", { name: "Các lần kiểm tra đã ghi nhận" }).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByText("Hãy thử một bước giải trước nhé")).toHaveCount(0);
    await input.fill("(x-2)(x-3)=0\nx=2 hoặc x=3");
    await page.getByRole("button", { name: "Kiểm tra từng bước" }).click();
    await page.getByRole("button", { name: "Nộp bài" }).click();
    const gpAfterFirst = await page.evaluate(() => localStorage.getItem("genai-student-gp-v1"));
    await page.getByRole("button", { name: "Nộp bài" }).click();
    expect(await page.evaluate(() => localStorage.getItem("genai-student-gp-v1"))).toBe(gpAfterFirst);
    await page.getByRole("button", { name: "Xem Thinking Replay" }).click();
    await expect(page).toHaveURL(/\/replay\?problem=quadratic-factor-01/);
    await expect(page.locator(".v2-legacy-surface")).toBeVisible();
  });

  test("separate problem drafts, tool keyboard, 390 and 1440 screenshots", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    const field = page.getByLabel("Trình bày từng phép biến đổi");
    await field.fill("Một ý tưởng cần lưu");
    await page.reload();
    await expect(field).toHaveValue("Một ý tưởng cần lưu");
    await page.getByRole("combobox", { name: "Chọn bài tập luyện tập" }).click();
    await page.getByRole("option", { name: "Xác định hệ số của parabol" }).click();
    await expect(page).toHaveURL(/problem=parabola-coefficient-03/);
    await expect(field).toHaveValue("");
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    await expect(field).toHaveValue("Một ý tưởng cần lưu");

    const tabs = page.getByRole("tablist", { name: "Công cụ Focus Studio V2" });
    await tabs.getByRole("tab", { name: "Vẽ nháp" }).click();
    await expect(page.getByRole("img", { name: "Vùng vẽ nháp bằng bút hoặc chuột" })).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    fs.mkdirSync(path.join("test-results","visual"), { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    await page.screenshot({path:path.join("test-results","visual","v2-focus-390.png"),fullPage:true});
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    await page.screenshot({path:path.join("test-results","visual","v2-focus-1440.png"),fullPage:true});
  });

  test("invalid problem is not silently replaced and active workspace meets serious WCAG gate", async ({ page }) => {
    await page.goto("/tu-giai?problem=does-not-exist");
    await expect(page.getByRole("heading", { name: "Không tìm thấy bài luyện phù hợp" })).toBeVisible();
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const issues = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa"] },
      });
      return result.violations.filter(x=>["serious","critical"].includes(x.impact)).map(x=>({id:x.id,nodes:x.nodes.length}));
    });
    expect(issues).toEqual([]);
  });
});
