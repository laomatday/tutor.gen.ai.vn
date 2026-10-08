const { test, expect } = require("@playwright/test");
const path = require("node:path");

test("Focus Studio: first checked attempt unlocks a separate quadratic inquiry, without scores", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tu-giai?problem=quadratic-factor-01");
  const tab = page.getByRole("tab", { name: "Thí nghiệm", exact: true });
  await tab.click();
  await expect(page.getByText("Hãy thử một bước giải trước nhé")).toBeVisible();
  await expect(page.locator('[data-micro-lab="quadratic-transformations"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Viết ý tưởng đầu tiên" }).click();
  await page.getByLabel("Trình bày từng phép biến đổi")
    .fill("x² − 5x + 6 = 0");
  await page.getByRole("button", { name: "Kiểm tra bước giải", exact: true }).click();
  await tab.click();

  const lab = page.locator('[data-micro-lab="quadratic-transformations"]');
  await expect(lab).toBeVisible();
  await expect(lab).toContainText("Bước 1/3");
  await expect(lab.getByRole("img")).toHaveAccessibleName(/Đồ thị y = x²/);

  await lab.getByRole("button", { name: "a = -1", exact: true }).click();
  await lab.getByRole("radio", { name: "Mở xuống", exact: true }).check();
  await lab.getByRole("button", { name: "Kiểm tra dự đoán" }).click();
  await expect(lab.getByRole("status")).toContainText("Em đã lý giải được!");
  await lab.getByRole("button", { name: "Bước tiếp theo" }).click();

  await expect(lab).toContainText("Bước 2/3");
  const coefficientC = lab.getByRole("slider", { name: "Hệ số c" });
  await coefficientC.focus();
  await coefficientC.press("ArrowRight");
  await expect(coefficientC).toHaveValue("1");
  await lab.getByRole("radio", { name: "Dịch lên trên" }).check();
  await lab.getByRole("button", { name: "Kiểm tra dự đoán" }).click();
  await expect(lab.getByRole("status")).toContainText("c làm thay đổi tung độ");
  await expect(page.locator(".studio-steps li")).toHaveCount(1);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: path.join("test-results", "visual", "math-micro-lab-390.png"),
    fullPage: true,
  });
});

test("English micro-lab: published school-club dialogue gives feedback over two scenes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/hoc-bai?grade=9&subject=tieng-anh&topic=school-life&lesson=school-club-invitation&stage=theory");

  const lab = page.locator('[data-micro-lab="school-club-dialogue"]');
  await expect(lab).toBeVisible();
  await expect(lab).toContainText("Tình huống 1/2");
  const progressBefore = await page.evaluate(() =>
    Object.entries(localStorage).filter(([key]) => /completed-lesson|lesson-completion/i.test(key)),
  );

  await lab.getByRole("radio", { name: "You join our club." }).check();
  await lab.getByRole("button", { name: "Kiểm tra lời đáp" }).click();
  await expect(lab.getByRole("status")).toContainText("Thử một cách diễn đạt khác");
  await expect(lab).not.toContainText("That sounds interesting. Tell me more");

  await lab.getByRole("button", { name: "Thử câu khác" }).click();
  await lab.getByRole("radio", { name: "Would you like to join our club?" }).check();
  await lab.getByRole("button", { name: "Kiểm tra lời đáp" }).click();
  await expect(lab.getByRole("status")).toContainText("Phản hồi phù hợp tình huống!");
  await expect(lab).toContainText("That sounds interesting. Tell me more");
  await lab.getByRole("button", { name: "Tiếp tục hội thoại" }).click();
  await expect(lab).toContainText("Tình huống 2/2");

  await lab.getByRole("radio", { name: "I’d love to, but I have practice." }).check();
  await lab.getByRole("button", { name: "Kiểm tra lời đáp" }).click();
  await expect(lab).toContainText("No problem! Maybe another day.");
  await expect(lab.getByRole("button", { name: "Luyện lại hội thoại" })).toBeVisible();

  const progressAfter = await page.evaluate(() =>
    Object.entries(localStorage).filter(([key]) => /completed-lesson|lesson-completion/i.test(key)),
  );
  expect(progressAfter).toEqual(progressBefore);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: path.join("test-results", "visual", "english-dialogue-390.png"),
    fullPage: true,
  });
});
