const { test, expect } = require("@playwright/test");
const path = require("node:path");

const pages = [
  ["/", "home"],
  ["/hoc-bai", "map"],
  ["/tu-giai", "practice"],
  ["/replay", "replay"],
  ["/tien-bo", "progress"],
  ["/thoi-khoa-bieu", "schedule"],
  ["/doi-qua", "rewards"],
  ["/thi-thu", "legacy-exam"],
  ["/giao-vien", "teacher-home"],
  ["/giao-vien/lop-hoc", "teacher-classes"],
  ["/giao-vien/bai-tap", "teacher-assignments"],
  ["/quan-tri", "admin-home"],
  ["/quan-tri/nguoi-dung", "admin-users"],
  ["/quan-tri/hoc-lieu", "admin-curriculum"],
];

test.describe("14 routes × 2 viewport visual, semantic and accessibility gates", () => {
  for (const [url, slug] of pages)
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      test(`${slug} ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(url);
        await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
        await expect(page.locator("h1")).toHaveCount(1);
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow, "horizontal overflow").toBeLessThanOrEqual(1);
        const file = path.join(
          "test-results",
          "visual",
          `${slug}-${viewport.width}.png`,
        );
        await page.screenshot({ path: file, fullPage: true });
        await page.addScriptTag({
          path: require.resolve("axe-core/axe.min.js"),
        });
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
            },
          });
          return result.violations
            .filter((x) => ["serious", "critical"].includes(x.impact))
            .map((x) => ({
              id: x.id,
              impact: x.impact,
              count: x.nodes.length,
              targets: x.nodes.slice(0, 8).map((node) => ({
                selector: node.target,
                html: node.html.slice(0, 160),
                reason: (node.failureSummary || "").slice(0, 150),
              })),
            }));
        });
        expect(violations, "WCAG serious/critical violations").toEqual([]);
      });
    }
});

// Release gate for small Android/iPhone viewports; 390px smoke alone misses 360px clipping.
test.describe("360px minimum mobile width", () => {
  for (const [url, slug] of pages) {
    test(`${slug} has no page errors or horizontal overflow at 360px`, async ({
      page,
    }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(url);
      await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, "horizontal overflow at 360px").toBeLessThanOrEqual(1);
      expect(errors, "uncaught browser errors at 360px").toEqual([]);
    });
  }
});

test("Advanced Tutor: learning mission, graph and workspace identity are present", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".home-mission")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bạn muốn khám phá môn nào?" }),
  ).toBeVisible();
  await page.goto("/hoc-bai");
  await expect(page.getByRole("heading", { name: "Môn học" })).toBeVisible();
  await page.getByRole("tab", { name: "Bản đồ", exact: true }).click();
  const nodes = page.locator(".knowledge-graph button[aria-pressed]");
  expect(await nodes.count()).toBeGreaterThan(1);
  await nodes.last().click();
  await expect(nodes.last()).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("complementary", { name: "Thông tin chủ đề" })
      .getByRole("heading", { level: 2 }),
  ).toBeVisible();
  await page.goto("/tu-giai?problem=parabola-coefficient-03");
  await expect(page.getByRole("heading", { name: "Luyện tập" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bài làm của em" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Hỗ trợ làm bài" }),
  ).toBeVisible();
  await page.goto("/replay?problem=parabola-coefficient-03");
  await expect(page.getByRole("heading", { name: "Xem lại" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Chưa có lần thử nào? Bắt đầu thôi." }),
  ).toBeVisible();
});

test("Focus Studio: log only real attempts and reveal mathematical model after valid solution", async ({
  page,
}) => {
  await page.goto("/tu-giai?problem=parabola-coefficient-03");
  const answer = page.getByLabel("Trình bày từng phép biến đổi");
  await expect(answer).toHaveValue("");
  await page
    .getByRole("tab", { name: "Parabol tương tác", exact: true })
    .click();
  await expect(
    page.getByText(/Hoàn thành bài hoặc mở gợi ý cuối/),
  ).toBeVisible();
  await answer.fill("a=9");
  await page.getByRole("button", { name: "Kiểm tra bước giải" }).click();
  await expect(
    page.getByRole("list", { name: "Các lần kiểm tra đã ghi nhận" }),
  ).toBeVisible();
  await expect(page.getByText("a=9", { exact: true }).first()).toBeVisible();
  await answer.fill("12 = a * (-2)^2 ⇔ a = 3");
  await page.getByRole("button", { name: "Kiểm tra bước giải" }).click();
  await expect(page.getByText("Sau khi giải: y = 3x²")).toBeVisible();
  await page.getByRole("button", { name: "Xem lại bài làm" }).click();
  await expect(
    page.getByRole("list", { name: "Các bước đã ghi nhận" }),
  ).toBeVisible();
  await expect(page.getByText("a=9", { exact: true }).first()).toBeVisible();
});

test("Home → Luyện tập → Nộp bài → Xem lại", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Mỗi ngày, khám phá một điều mới." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Luyện một bài", exact: true }).click();
  await page
    .getByRole("button", { name: "Mở bàn tự giải", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tu-giai\?problem=/);
  const problem = new URL(page.url()).searchParams.get("problem");
  const answer =
    problem === "quadratic-factor-01"
      ? "(x-2)(x-3)=0\nx=2 hoặc x=3"
      : "12 = a * (-2)^2 ⇔ a = 3";
  await page.getByLabel("Trình bày từng phép biến đổi").fill(answer);
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await expect(
    page.getByText("Đã nhận thưởng hoàn thành", { exact: true }),
  ).toBeVisible();
  await page
    .locator("#main-content")
    .getByRole("button", { name: "Xem lại bài làm" })
    .click();
  await expect(
    page.getByRole("list", { name: "Các bước đã ghi nhận" }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Các bước đã ghi nhận" }),
  ).toContainText("Hoàn thành bài toán");
});

test("Lộ trình → Bài học → Hoàn thành", async ({ page }) => {
  await page.goto(
    "/hoc-bai?grade=9&subject=toan&topic=can-thuc&lesson=rut-gon-can-thuc&stage=exercises",
  );
  await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
  await expect(
    page.locator("#main-content").getByRole("heading", { level: 1 }),
  ).toHaveCount(1);
  const exerciseData = require("../../src/data/curriculum/lessons.json");
  const lesson = exerciseData.find((item) => item.id === "rut-gon-can-thuc");
  for (const exercise of lesson.exercises) {
    await page
      .locator(`input[name="${lesson.id}-${exercise.id}"]`)
      .nth(exercise.correctIndex)
      .check();
  }
  await page.getByRole("button", { name: /Kiểm tra.*hoàn thành/ }).click();
  await expect(page.getByText("Bạn đã hoàn thành bài học!")).toBeVisible();
});
