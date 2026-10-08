const { test, expect } = require("@playwright/test");

test("Student shell: logo toggles a persistent rail without user or progress duplicates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const sidebar = page.locator("#main-navigation");
  const logo = sidebar.getByRole("button", { name: "Mở rộng menu" });
  await expect(logo.locator("img")).toBeVisible();
  await expect
    .poll(async () => Math.round((await sidebar.boundingBox()).width))
    .toBe(72);
  const position = await logo.boundingBox();
  await expect(sidebar.getByText("Bài học đã hoàn thành")).toHaveCount(0);
  await expect(sidebar.getByRole("button", { name: /Mở hồ sơ/ })).toHaveCount(
    0,
  );
  const home = sidebar.getByRole("button", { name: "Hôm nay", exact: true });
  await expect(home).toHaveCSS("border-radius", "10px");
  await expect(home).toHaveAttribute("aria-current", "page");
  await logo.click();
  await expect
    .poll(async () => Math.round((await sidebar.boundingBox()).width))
    .toBe(288);
  await sidebar.getByRole("button", { name: "Thu gọn menu" }).click();
  await expect
    .poll(async () => Math.round((await sidebar.boundingBox()).width))
    .toBe(72);
  const end = await logo.boundingBox();
  expect(end.x).toBe(position.x);
  expect(end.y).toBe(position.y);
  await page.reload();
  await expect(logo).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.locator(
      '.app-sidebar [data-icon="Menu"], .app-header [data-icon="Menu"]',
    ),
  ).toHaveCount(0);
});

test("Student shell: icon-only search supports shortcut, focus return and real results", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.locator(".app-header");
  await expect(header).not.toContainText("genAi Tutor");
  await expect(header.getByRole("searchbox")).toHaveCount(0);
  const trigger = header.getByRole("button", {
    name: "Tìm bài học",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Tìm bài học" });
  const search = dialog.getByRole("searchbox");
  await expect(search).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(search).toBeFocused();
  await search.fill("parabol");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/hoc-bai\?q=parabol/);
  await expect(
    page.getByRole("heading", { name: "Tìm bài học" }),
  ).toBeVisible();
});

test("Student shell: mobile logo, keyboard trap and viewport changes keep focus usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sidebar = page.locator("#main-navigation");
  const trigger = page.getByRole("button", { name: "Mở menu học tập" });
  const close = sidebar.getByRole("button", { name: "Đóng menu", exact: true });
  await expect(sidebar).toHaveJSProperty("inert", true);
  await trigger.click();
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    sidebar.getByRole("button", { name: "Phần thưởng", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .locator(".app-navigation-backdrop")
    .click({ position: { x: 370, y: 400 } });
  await expect(trigger).toBeFocused();
  await trigger.click();
  await sidebar.getByRole("button", { name: "Tiến bộ", exact: true }).click();
  await expect(page).toHaveURL(/\/tien-bo$/);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(sidebar).not.toHaveClass(/is-open/);
  await expect(
    sidebar.getByRole("button", { name: "Mở rộng menu" }),
  ).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(sidebar).toHaveJSProperty("inert", true);
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("Student shell: reduced motion and teacher/admin mobile drawers remain available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator("#main-navigation")
      .evaluate((element) =>
        parseFloat(getComputedStyle(element).transitionDuration),
      ),
  ).toBeLessThanOrEqual(0.001);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ["/giao-vien", "/quan-tri"]) {
    await page.goto(path);
    const trigger = page.getByRole("button", { name: "Mở menu", exact: true });
    await trigger.click();
    await expect(
      page
        .locator("#main-navigation")
        .getByRole("button", { name: "Đóng menu" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
});

for (const width of [360, 1440]) {
  test(`Student shell: compact context switches courses and navigates back at ${width}px`, async ({
    page,
  }) => {
    const { profile } = require("../../src/data/demo/student.json");
    const subjects = require("../../src/data/curriculum/subjects.json");
    const lessons = require("../../src/data/curriculum/lessons.json");
    const courses = profile.enrollments.map((enrollment) => ({
      ...enrollment,
      label: `${subjects.find((subject) => subject.id === enrollment.subjectId).name} ${enrollment.gradeId}`,
      path: `/hoc-bai?${new URLSearchParams({ grade: enrollment.gradeId, subject: enrollment.subjectId })}`,
    }));
    const [math, english] = ["toan", "tieng-anh"].map((id) =>
      courses.find((course) => course.subjectId === id),
    );
    const lesson = lessons.find(
      (item) =>
        item.subjectId === math.subjectId &&
        item.gradeId === math.gradeId &&
        item.status === "published",
    );
    const header = page.locator(".app-header");
    const courseSelector = (course) =>
      header.getByRole("combobox", {
        name: `${course.label} · Chuyển môn học`,
        exact: true,
      });
    const expectCourseRoute = async (course) => {
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === "/hoc-bai" &&
          url.searchParams.get("subject") === course.subjectId &&
          url.searchParams.get("grade") === course.gradeId &&
          !url.searchParams.has("lesson") &&
          !url.searchParams.has("topic"),
      );
      await expect(courseSelector(course)).toBeVisible();
    };

    await page.setViewportSize({ width, height: 900 });
    await page.goto(math.path);
    await expect(courseSelector(math)).toBeVisible();
    await expect(page.locator("#main-content .app-breadcrumbs")).toHaveCount(0);

    // The header selector supports keyboard navigation and keeps focus after selection.
    await courseSelector(math).click();
    await expect(page.getByRole("option")).toHaveText(
      courses.map((course) => course.label),
    );
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expectCourseRoute(english);
    await expect(courseSelector(english)).toBeFocused();

    await courseSelector(english).click();
    await page.getByRole("option", { name: math.label, exact: true }).click();
    await expectCourseRoute(math);

    const backToSubjects = header.getByRole("link", {
      name: "Quay lại Môn học",
      exact: true,
    });
    await expect(backToSubjects).toHaveAttribute("href", "/hoc-bai");
    await backToSubjects.click();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/hoc-bai" && url.search === "",
    );
    await expect(header.locator(".student-header-context")).toHaveText(
      "Môn học",
    );
    await expect(header.getByRole("combobox")).toHaveCount(0);

    await page.goto(
      `/hoc-bai?${new URLSearchParams({
        grade: lesson.gradeId,
        subject: lesson.subjectId,
        topic: lesson.topicId,
        lesson: lesson.id,
        stage: "theory",
      })}`,
    );
    await expect(header.locator(".student-header-context__current")).toHaveText(
      lesson.title,
    );
    const backToCourse = header.getByRole("link", {
      name: `Quay lại ${math.label}`,
      exact: true,
    });
    await expect(backToCourse).toHaveAttribute("href", math.path);
    await backToCourse.click();
    await expectCourseRoute(math);
    await expect(page.locator("#main-content .app-breadcrumbs")).toHaveCount(0);

    const layout = await header.evaluate((element) => ({
      viewport: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      controls: Array.from(element.querySelectorAll("button, a"))
        .map((control) => control.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => ({
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        })),
    }));
    expect(layout.overflow).toBeLessThanOrEqual(1);
    for (const control of layout.controls) {
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(layout.viewport);
      expect(control.width).toBeGreaterThanOrEqual(44);
      expect(control.height).toBeGreaterThanOrEqual(44);
    }
  });
}
