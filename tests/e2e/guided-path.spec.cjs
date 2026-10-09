const { test, expect } = require("@playwright/test");
const lessons = require("../../src/data/curriculum/lessons.json");
const topics = require("../../src/data/curriculum/topics.json");

const mathPath = "/hoc-bai?grade=9&subject=toan";
const mathLessons = lessons
  .filter(
    (lesson) =>
      lesson.gradeId === "9" &&
      lesson.subjectId === "toan" &&
      lesson.status === "published" &&
      topics.some((topic) => topic.id === lesson.topicId),
  )
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "vi"));
const completedKey = "genai-curriculum-completed-v1";
const step = (page, lesson) =>
  page.locator(`.course-path-step[data-lesson-id="${lesson.id}"]`);
const storedCompletion = (page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "[]"),
    completedKey,
  );

for (const width of [360, 1440]) {
  test(`Guided path: starts with a real lesson and allows curiosity ahead at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(mathPath);
    await expect(
      page.getByRole("tab", { name: "Lộ trình", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".course-path-step")).toHaveCount(
      mathLessons.length,
    );
    await expect(step(page, mathLessons[0])).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(
      page.locator('.course-path-step[data-state="complete"]'),
    ).toHaveCount(0);
    await expect(page.locator(".course-path-step:disabled")).toHaveCount(0);

    const later = mathLessons.at(-1);
    await expect(step(page, later)).toHaveAttribute("data-state", "available");
    await step(page, later).focus();
    await step(page, later).press("Enter");
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("lesson") === later.id &&
        url.searchParams.get("stage") === "theory",
    );
    expect(await storedCompletion(page)).toEqual([]);
    await page
      .locator(".app-header")
      .getByRole("link", { name: "Quay lại Toán 9" })
      .click();
    await expect(step(page, mathLessons[0])).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(step(page, later)).toHaveAttribute("data-state", "available");
    expect(await storedCompletion(page)).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });
}

test("Guided path: completing a lesson advances the next step, preserves review and scopes progress to its course", async ({
  page,
}) => {
  const [first, next] = mathLessons;
  await page.goto(mathPath);
  await step(page, first).click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("lesson") === first.id,
  );
  // Reading a lesson is not completion. Only answering its exercises advances the path.
  expect(await storedCompletion(page)).toEqual([]);
  const lessonUrl = new URL(page.url());
  lessonUrl.searchParams.set("stage", "exercises");
  await page.goto(lessonUrl.toString());
  for (const exercise of first.exercises) {
    await page
      .locator(`input[name="${first.id}-${exercise.id}"]`)
      .nth(exercise.correctIndex)
      .check();
  }
  await page
    .getByRole("button", { name: "Kiểm tra & hoàn thành", exact: true })
    .click();
  await expect(page.getByText("Bạn đã hoàn thành bài học!")).toBeVisible();
  await page
    .locator(".app-header")
    .getByRole("link", { name: "Quay lại Toán 9" })
    .click();
  await expect(step(page, first)).toHaveAttribute("data-state", "complete");
  await expect(step(page, next)).toHaveAttribute("aria-current", "step");
  await page.reload();
  await expect(step(page, next)).toHaveAttribute("aria-current", "step");
  expect(await storedCompletion(page)).toEqual([first.id]);

  await step(page, first).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("lesson") === first.id &&
      url.searchParams.get("stage") === "examples",
  );
  await page
    .locator(".app-header")
    .getByRole("link", { name: "Quay lại Toán 9" })
    .click();
  await page
    .getByRole("navigation", { name: "Chọn môn học" })
    .getByRole("button", { name: /Tiếng Anh · Lớp 9/ })
    .click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("subject") === "tieng-anh",
  );
  const englishLessons = lessons.filter(
    (lesson) =>
      lesson.gradeId === "9" &&
      lesson.subjectId === "tieng-anh" &&
      lesson.status === "published",
  );
  await expect(page.locator(".course-path-step")).toHaveCount(
    englishLessons.length,
  );
  await expect(
    page.locator('.course-path-step[data-state="complete"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('.course-path-step[aria-current="step"]'),
  ).toHaveCount(1);
  for (const lesson of englishLessons)
    await expect(step(page, lesson)).toBeVisible();
  await page
    .getByRole("navigation", { name: "Chọn môn học" })
    .getByRole("button", { name: /Toán · Lớp 9/ })
    .click();
  await expect(step(page, first)).toHaveAttribute("data-state", "complete");
  await expect(step(page, next)).toHaveAttribute("aria-current", "step");
});

test("Discovery: keyboard manipulation and retry explain an idea without awarding lesson completion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const first = mathLessons[0];
  const exercise = first.exercises[0];
  const discovery = page.locator(
    `.lesson-discovery[data-exercise="${exercise.id}"]`,
  );
  await page.locator(".home-micro-lab > summary").click();
  await expect(discovery).toBeVisible();
  const check = discovery.getByRole("button", {
    name: "Kiểm tra ý tưởng",
    exact: true,
  });
  await expect(check).toBeDisabled();
  const slider = discovery.getByRole("slider", { name: /Thay đổi x/ });
  await expect(slider).toHaveValue("0");
  await expect(discovery.getByRole("img")).toHaveAccessibleName(
    /Không có hình vuông mang diện tích âm/,
  );
  await slider.focus();
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("3");
  await expect(discovery.getByRole("img")).toHaveAccessibleName(
    "Hình vuông có diện tích 1 đơn vị vuông.",
  );
  const radios = discovery.getByRole("radio");
  await radios
    .nth((exercise.correctIndex + 1) % exercise.options.length)
    .check();
  await check.click();
  await expect(discovery.getByRole("status")).toContainText(
    "Một gợi ý để thử lại",
  );
  expect(await storedCompletion(page)).toEqual([]);
  await discovery
    .getByRole("button", { name: "Chọn lại đáp án", exact: true })
    .click();
  await expect(radios.first()).toBeFocused();
  await radios.nth(exercise.correctIndex).check();
  await check.click();
  await expect(discovery.getByRole("status")).toContainText("Em tìm ra rồi!");
  expect(await storedCompletion(page)).toEqual([]);
  await expect(page.locator(".home-wallet")).toContainText("0 GP");
  await discovery
    .getByRole("button", { name: "Học tiếp từ đây", exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("lesson") === first.id,
  );
  expect(await storedCompletion(page)).toEqual([]);
});
