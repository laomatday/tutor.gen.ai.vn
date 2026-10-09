const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("V2 Mission Control — published learning, not a cosmetic clone", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "Requires opt-in V2");

  test("desktop 1440: signature composition and recorded-only metrics", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Nhiệm vụ tiếp theo" })).toBeVisible();
    await expect(page.locator(".v2-home-metrics")).toContainText("0");
    await expect(page.getByRole("heading", { name: "Phòng khám phá" })).toBeVisible();
    await expect(page.locator(".v2-home-lower-grid > section")).toHaveCount(3);
    await expect(page.locator(".v2-choices-grid .v2-choice")).toHaveCount(3);
    await expect(page.getByText("12 ngày học liên tiếp")).toHaveCount(0);
    await expect(page.getByText("91%")).toHaveCount(0);
    await expect(page.getByText("AI đang phân tích")).toHaveCount(0);
    const desktopMission = await page.locator(".v2-next-mission").boundingBox();
    const desktopLab = await page.locator(".v2-mini-lab").boundingBox();
    expect(desktopMission.width / desktopLab.width).toBeGreaterThan(1.2);
    expect(Math.abs(desktopMission.y - desktopLab.y)).toBeLessThan(2);
    fs.mkdirSync(path.join("test-results", "visual"), { recursive: true });
    await page.screenshot({ path: path.join("test-results", "visual", "v2-mission-1440.png"), fullPage: true });
  });

  test("mobile 390 and 360: first mission, usable dock, keyboard lab, no fake completion", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    const mission = page.getByRole("button", { name: "Bắt đầu ngay" });
    const dock = page.locator(".v2-mobile-dock");
    const missionBox = await mission.boundingBox();
    const dockBox = await dock.boundingBox();
    expect(missionBox.y + missionBox.height, "first action above mobile dock").toBeLessThan(dockBox.y);
    const originalEvidence = await page.locator(".v2-home-metrics").innerText();
    const lab = page.locator(".v2-mini-lab");
    const slider = lab.getByRole("slider", { name: "Hệ số a" });
    await expect(slider).toBeVisible();
    await slider.focus();
    await slider.press("ArrowRight");
    await expect(lab.getByRole("img")).toHaveAccessibleName(/Đồ thị hàm số y =/);
    expect(await page.locator(".v2-home-metrics").innerText()).toBe(originalEvidence);
    await page.screenshot({ path: path.join("test-results", "visual", "v2-mission-390.png"), fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    await mission.click();
    await expect(page).toHaveURL(/\/hoc-bai\?.*lesson=/);
    await expect(page.locator(".v2-legacy-surface")).toBeVisible();
  });

  test("V2 Home accessibility: no serious or critical WCAG errors", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const issues = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
      return result.violations
        .filter((item) => ["critical", "serious"].includes(item.impact))
        .map((item) => ({
          id: item.id,
          nodes: item.nodes.slice(0, 3).map((node) => node.target),
        }));
    });
    expect(issues).toEqual([]);
  });
});
