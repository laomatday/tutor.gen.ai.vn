const { test, expect } = require("@playwright/test");

test("Home: keyboard learning choices change the mission and keep the mobile start action in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const learn = page.getByRole("tab", { name: "Học mới", exact: true });
  const practice = page.getByRole("tab", {
    name: "Luyện một bài",
    exact: true,
  });
  const replay = page.getByRole("tab", { name: "Xem lại", exact: true });
  await expect(page.locator(".home-wallet")).toContainText("0 GP");
  await expect(page.locator('.home-week [data-active="true"]')).toHaveCount(0);
  await expect(
    page.locator('.course-path-step[data-state="complete"]'),
  ).toHaveCount(0);
  const start = page.getByRole("button", {
    name: "Bắt đầu bài học",
    exact: true,
  });
  await expect(start).toBeVisible();
  const box = await start.boundingBox();
  expect(box.y + box.height).toBeLessThan(740);
  await learn.focus();
  await learn.press("ArrowRight");
  await expect(practice).toBeFocused();
  await expect(practice).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("tabpanel", { name: "Luyện một bài", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mở bàn tự giải", exact: true }),
  ).toBeVisible();
  await practice.press("End");
  await expect(replay).toBeFocused();
  await expect(
    page.getByRole("tabpanel", { name: "Xem lại", exact: true }),
  ).toContainText("Sau khi thử một bài tự giải");
  await page
    .getByRole("button", { name: "Thử một bài trước nhé", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tu-giai\?problem=/);
});

test("Home: actual attempts mark the week and a merely opened problem cannot hide the latest replay", async ({
  page,
}) => {
  await page.goto("/tu-giai?problem=quadratic-factor-01");
  const input = page.getByLabel("Trình bày từng phép biến đổi");
  await input.fill("(x-1)(x-6)=0\nx=1 hoặc x=6");
  await page
    .getByRole("button", { name: "Kiểm tra bước giải", exact: true })
    .click();
  await input.fill("(x-2)(x-3)=0\nx=2 hoặc x=3");
  await page
    .getByRole("button", { name: "Kiểm tra bước giải", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Em đã tự tìm ra chỗ cần sửa!",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/tu-giai?problem=parabola-coefficient-03");
  await expect(input).toHaveValue("");
  await page.goto("/");
  await expect(page.locator('.home-week [data-active="true"]')).toHaveCount(1);
  await expect(page.locator(".home-week .is-today")).toHaveAttribute(
    "aria-label",
    /2 lượt kiểm tra/,
  );
  await expect(page.locator(".home-week-note")).toContainText(
    "2 lượt tự kiểm tra hôm nay",
  );
  await expect(page.locator(".home-progress-evidence")).toContainText(
    "1lần tự sửa đúng",
  );
  await page.getByRole("tab", { name: "Xem lại", exact: true }).click();
  await expect(page.locator(".home-replay-notes li")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Xem lại cách mình giải", exact: true })
    .click();
  await expect(page).toHaveURL(/\/replay\?problem=quadratic-factor-01$/);
  await expect(
    page
      .getByRole("list", { name: "Các bước đã ghi nhận" })
      .getByRole("listitem"),
  ).toHaveCount(3);
});

test("Môn học: list view supports filtering, choosing a topic and opening its lesson on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/hoc-bai");
  const map = page.getByRole("tab", { name: "Bản đồ", exact: true });
  const list = page.getByRole("tab", { name: "Danh sách", exact: true });
  await map.click();
  await map.focus();
  await map.press("ArrowRight");
  await expect(list).toBeFocused();
  await expect(list).toHaveAttribute("aria-selected", "true");
  const topics = page.locator(".knowledge-topic-card");
  expect(await topics.count()).toBeGreaterThan(1);
  const search = page.getByRole("searchbox", {
    name: "Tìm chủ đề, bài học",
  });
  await search.fill("zzzz-khong-co-chu-de");
  await expect(
    page.getByRole("heading", { name: "Không có chủ đề phù hợp" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hiện tất cả chủ đề", exact: true })
    .click();
  await topics.last().click();
  await expect(topics.last()).toHaveAttribute("aria-pressed", "true");
  const title = await topics.last().locator("strong").innerText();
  await page.getByRole("button", { name: /^Xem \d+ bài học$/ }).click();
  const detail = page.getByRole("complementary", { name: "Thông tin chủ đề" });
  await expect(detail).toBeFocused();
  await expect(
    detail.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await detail.locator(".knowledge-lesson-list button").first().click();
  await expect(page).toHaveURL(/lesson=/);
  await expect(page.locator("#main-content h1")).toHaveCount(1);
});

test("Môn học: laptop overlay expands without squeezing the map", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/hoc-bai");
  const sidebar = page.locator("#main-navigation");
  const mapPage = page.locator(".knowledge-map");
  await page.getByRole("tab", { name: "Bản đồ", exact: true }).click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(72);
  const before = await mapPage.boundingBox();
  // On a tablet/laptop the rail logo opens an overlay, not a pinned column.
  await expect(sidebar.getByRole("button", { name: "Mở menu", exact: true })).toBeVisible();
  await sidebar.locator(".student-sidebar-brand").click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(288);
  await expect(page.locator(".app-frame--student")).toHaveJSProperty("inert", true);
  const overlayMap = await mapPage.boundingBox();
  expect(overlayMap.x).toBe(before.x);
  expect(overlayMap.width).toBe(before.width);
  await page.keyboard.press("Escape");
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(72);
  await expect(page.locator(".app-frame--student")).toHaveJSProperty("inert", false);
  const detail = await page.getByRole("complementary", { name: "Thông tin chủ đề" }).boundingBox();
  const map = await mapPage.boundingBox();
  expect(detail.y).toBeGreaterThan(map.y + map.height);
});

for (const width of [360, 390]) {
  test(`Studio: start writing from the first mobile screen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/tu-giai?problem=quadratic-factor-01");
    const start = page.getByRole("button", {
      name: "Viết ý tưởng",
      exact: true,
    });
    await expect(start).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const box = await start.boundingBox();
    const navigation = await page
      .getByRole("navigation", { name: "Điều hướng học tập chính" })
      .boundingBox();
    expect(box.y + box.height).toBeLessThan(navigation.y);
    await start.click();
    await expect(page.getByLabel("Trình bày từng phép biến đổi")).toBeFocused();
  });
}
