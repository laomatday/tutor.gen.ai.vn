const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("Student Support V2 — preserve domain, replace screens", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "Needs opt-in V2");

  test("Progress: saved attempts and course completion without fictitious exam scores", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tien-bo");
    await expect(page.locator(".v2-progress-page")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Hành trình của em" })).toBeVisible();
    await expect(page.locator(".v2-legacy-surface")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Tổng quan hoạt động được ghi nhận" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tiến độ từng môn" })).toBeVisible();
    await expect(page.getByText(/Dữ liệu minh họa phương pháp phản hồi/)).toHaveCount(0);
    await expect(page.getByText(/Mức độ thành thạo 91%/)).toHaveCount(0);
    await page.getByRole("button", { name: "Hồ sơ học tập" }).click();
    const modal = page.getByRole("dialog", { name: "Hồ sơ học tập" });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("huy hiệu minh họa");
    await modal.getByRole("group", { name: "Lọc huy hiệu mẫu" })
      .getByRole("button", { name: "Chưa mở" }).click();
    await expect(modal.locator('.v2-profile-badge-list [data-unlocked="true"]')).toHaveCount(0);
    await modal.getByRole("button", { name: "Đóng hộp thoại" }).click();
    await expect(modal).not.toBeVisible();
    fs.mkdirSync(path.join("test-results", "visual"), { recursive: true });
    await page.goto("/tien-bo");
    await expect(page.locator(".v2-progress-page")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join("test-results", "visual", "v2-progress-1440.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tien-bo");
    await expect(page.locator(".v2-progress-page")).toBeVisible();
    await page.screenshot({ path: path.join("test-results", "visual", "v2-progress-390.png"), fullPage: true });
    await page.getByRole("button", { name: "Hồ sơ học tập" }).click();
    await expect(page.getByRole("dialog", { name: "Hồ sơ học tập" })).toBeVisible();
    await page.screenshot({ path: path.join("test-results", "visual", "v2-profile-390.png") });
  });

  test("Schedule: create, persist, edit, delete and undo the same local session", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/thoi-khoa-bieu");
    await expect(page.locator(".v2-schedule-page")).toBeVisible();
    await expect(page.locator(".v2-legacy-surface")).toHaveCount(0);
    await page.getByRole("button", { name: "Thêm lịch học" }).click();
    const dialog = page.getByRole("dialog", { name: "Thêm lịch học" });
    await dialog.getByLabel("Tên buổi học").fill("Ôn Toán V2");
    await dialog.getByLabel("Giờ bắt đầu").fill("20:00");
    await dialog.getByLabel("Giờ kết thúc").fill("20:45");
    await dialog.getByRole("button", { name: "Thêm buổi học" }).click();
    await expect(dialog).not.toBeVisible();
    const item = page.locator(".v2-schedule-session", { has: page.getByRole("heading", { name: "Ôn Toán V2" }) });
    await expect(item).toBeVisible();
    await page.reload();
    await expect(item).toBeVisible();
    await item.getByRole("button", { name: "Chỉnh sửa lịch: Ôn Toán V2" }).click();
    const edit = page.getByRole("dialog", { name: "Chỉnh sửa lịch học" });
    await edit.getByLabel("Tên buổi học").fill("Ôn Toán V2 nâng cao");
    await edit.getByRole("button", { name: "Lưu thay đổi" }).click();
    const updated = page.locator(".v2-schedule-session", {
      has: page.getByRole("heading", { name: "Ôn Toán V2 nâng cao" }),
    });
    await expect(updated).toBeVisible();
    await updated.getByRole("button", { name: "Xóa lịch: Ôn Toán V2 nâng cao" }).click();
    await expect(updated).toHaveCount(0);
    await page.getByRole("button", { name: "Hoàn tác" }).click();
    await expect(updated).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.goto("/thoi-khoa-bieu");
    await expect(page.locator(".v2-schedule-page")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join("test-results", "visual", "v2-schedule-390.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/thoi-khoa-bieu");
    await expect(page.locator(".v2-schedule-page")).toBeVisible();
    await page.screenshot({ path: path.join("test-results", "visual", "v2-schedule-1440.png"), fullPage: true });
  });

  test("Rewards: sample filter, one local redemption, never store parent contact", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("genai-student-gp-v1", JSON.stringify(400));
    });
    await page.goto("/doi-qua");
    await expect(page.locator(".v2-rewards-page")).toBeVisible();
    await expect(page.locator(".v2-legacy-surface")).toHaveCount(0);
    await expect(page.getByText(/dữ liệu minh họa/).first()).toBeVisible();
    const filters = page.getByRole("group", { name: "Lọc quà minh họa" });
    await filters.getByRole("button", { name: /Đủ điểm đổi ngay/ }).click();
    const sticker = page.locator(".v2-reward-card", {
      has: page.getByRole("heading", { name: "Bộ Sticker Hologram genAi Toán học" }),
    });
    await expect(sticker).toBeVisible();
    await sticker.getByRole("button", { name: "Thử đổi quà" }).click();
    const redeem = page.getByRole("dialog", { name: "Xác nhận đổi quà học tập" });
    await redeem.getByLabel("Địa chỉ nhận quà").fill("Số 123 đường Kiểm Thử, Thành phố Mẫu");
    await redeem.getByLabel("Số điện thoại phụ huynh").fill("0900000000");
    await redeem.getByRole("button", { name: /Xác nhận đổi 350 GP/ }).click();
    await expect(redeem).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Lịch sử đổi quà mẫu" })).toBeVisible();
    await expect(page.getByText("Đã ghi nhận yêu cầu minh họa", { exact: false })).toBeVisible();
    const stored = await page.evaluate(() => ({
      wallet: JSON.parse(localStorage.getItem("genai-student-gp-v1") || "null"),
      requests: localStorage.getItem("genai-reward-requests-v1") || "",
    }));
    expect(stored.wallet).toBe(50);
    expect(JSON.parse(stored.requests)).toHaveLength(1);
    expect(stored.requests).not.toContain("0900000000");
    expect(stored.requests).not.toContain("Số 123 đường");
    fs.mkdirSync(path.join("test-results", "visual"), { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/doi-qua");
    await expect(page.locator(".v2-rewards-page")).toBeVisible();
    await page.screenshot({ path: path.join("test-results", "visual", "v2-rewards-390.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/doi-qua");
    await expect(page.locator(".v2-rewards-page")).toBeVisible();
    await page.screenshot({ path: path.join("test-results", "visual", "v2-rewards-1440.png"), fullPage: true });
  });

  test("Mobile 360: progress, schedule and rewards without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const route of ["/tien-bo", "/thoi-khoa-bieu", "/doi-qua"]) {
      await page.goto(route);
      await expect(page.locator(".v2-support-page")).toBeVisible();
      expect(await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ), `Horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
    }
  });

  test("Supporting pages: serious/critical WCAG issues = 0", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/tien-bo", "/thoi-khoa-bieu", "/doi-qua"]) {
      await page.goto(route);
      await expect(page.locator(".v2-support-page")).toBeVisible();
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const issues = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
        return result.violations.filter((issue) => ["serious", "critical"].includes(issue.impact))
          .map((issue) => ({ id: issue.id, nodes: issue.nodes.length }));
      });
      expect(issues, `Accessibility on ${route}`).toEqual([]);
    }
  });
});
