const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("Today bento: interactive square uses published Math 9 content and never awards progress", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const hero = page.locator(".home-next-hero");
  await expect(hero).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hôm nay", exact: true })).toBeVisible();

  const start = page.getByRole("button", { name: "Bắt đầu bài học", exact: true });
  const nav = page.getByRole("navigation", { name: "Điều hướng học tập chính" });
  const startBox = await start.boundingBox();
  const navBox = await nav.boundingBox();
  expect(startBox.y + startBox.height).toBeLessThan(navBox.y);
  const initialProgress = await page.locator(".home-progress-header-info strong").textContent();
  const initialGp = await page.locator(".home-wallet").innerText();

  const square = page.locator("[data-home-square-lab]");
  await expect(square).toBeVisible();
  await expect(page.locator(".home-micro-lab")).toBeVisible();
  await expect(page.locator(".home-micro-lab")).not.toHaveAttribute("open");
  await expect(square.getByRole("img")).toHaveAccessibleName(
    "Hình vuông cạnh 3 centimét có diện tích 9 centimét vuông",
  );
  const slider = square.getByRole("slider", { name: "Thay đổi độ dài cạnh" });
  await slider.focus();
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("4");
  await expect(square.getByRole("img")).toHaveAccessibleName(
    "Hình vuông cạnh 4 centimét có diện tích 16 centimét vuông",
  );
  await expect(square.locator(".home-next-square-head strong")).toContainText("S = 16 cm²");
  await expect(page.locator(".home-progress-header-info strong")).toHaveText(initialProgress);
  await expect(page.locator(".home-wallet")).toContainText(initialGp.split("\n")[0]);

  fs.mkdirSync(path.join("test-results", "visual"), { recursive: true });
  await page.screenshot({
    path: path.join("test-results", "visual", "home-bento-390.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 360, height: 800 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(square).toBeVisible();
  await expect(page.locator(".home-next-bento-bottom")).toBeVisible();
  await page.screenshot({
    path: path.join("test-results", "visual", "home-bento-1440.png"),
    fullPage: true,
  });
});

test("Today bento: three real modes, course list and square lesson navigation", async ({ page }) => {
  await page.goto("/");
  const modes = page.getByRole("tablist", { name: "Bạn muốn học thế nào?" });
  const learn = modes.getByRole("tab", { name: "Học mới", exact: true });
  const practice = modes.getByRole("tab", { name: "Luyện một bài", exact: true });
  const replay = modes.getByRole("tab", { name: "Xem lại", exact: true });

  await expect(learn).toHaveAttribute("aria-selected", "true");
  await learn.focus();
  await learn.press("ArrowRight");
  await expect(practice).toBeFocused();
  await expect(practice).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Mở bàn tự giải", exact: true })).toBeVisible();
  await practice.press("End");
  await expect(replay).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Xem lại" })).toContainText(
    "Sau khi thử một bài tự giải",
  );
  await replay.press("Home");
  await expect(learn).toBeFocused();

  const courseList = page.locator(".home-next-course-list");
  await expect(courseList.locator(".home-next-course")).toHaveCount(2);
  await page.getByRole("button", { name: "Học về căn bậc hai" }).click();
  await expect(page).toHaveURL(/\/hoc-bai\?.*lesson=can-bac-hai/);
  await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
});
