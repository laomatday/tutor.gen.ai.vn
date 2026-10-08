const { test, expect } = require("@playwright/test");
const initialSessions = require("../../src/data/demo/schedule.json");

const schedulePath = "/thoi-khoa-bieu";
const scheduleKey = "genai-student-schedule-v1";
const sessionCards = (page) => page.locator("[data-session-id]");
const viewTabs = (page) =>
  page.getByRole("tablist", { name: "Chế độ xem lịch" });
const filterTabs = (page) =>
  page.getByRole("tablist", { name: "Loại buổi học" });
const monday = (page) => page.getByRole("button", { name: /^Thứ Hai(?:,| )/ });
const thursday = (page) =>
  page.getByRole("button", { name: /^Thứ Năm(?:,| )/ });

async function openSchedule(page) {
  await page.goto(schedulePath);
  await expect(
    page.getByRole("heading", { level: 1, name: "Lịch học của mình" }),
  ).toBeVisible();
}

test("Schedule: day selection and keyboard view switching retain the type filter", async ({
  page,
}) => {
  await openSchedule(page);
  await monday(page).click();
  await expect(monday(page)).toHaveAttribute("aria-pressed", "true");
  await expect(sessionCards(page)).toHaveCount(
    initialSessions.filter((session) => session.dayOfWeek === 2).length,
  );
  await filterTabs(page)
    .getByRole("tab", { name: "Tutor", exact: true })
    .click();
  await expect(sessionCards(page)).toHaveCount(1);
  await expect(page.locator('[data-session-id="mon-3"]')).toBeVisible();

  const daily = viewTabs(page).getByRole("tab", { name: "Theo ngày" });
  const weekly = viewTabs(page).getByRole("tab", { name: "Cả tuần" });
  await daily.focus();
  await daily.press("ArrowRight");
  await expect(weekly).toBeFocused();
  await expect(weekly).toHaveAttribute("aria-selected", "true");
  await expect(sessionCards(page)).toHaveCount(
    initialSessions.filter((session) => session.sessionType === "tutor").length,
  );
  await expect(page.locator('[data-session-id="wed-3"]')).toBeVisible();
  await expect(page.locator('[data-session-id="mon-1"]')).toHaveCount(0);

  await filterTabs(page)
    .getByRole("tab", { name: "Chính khóa", exact: true })
    .click();
  await expect(sessionCards(page)).toHaveCount(
    initialSessions.filter((session) => session.sessionType === "chinh-khoa")
      .length,
  );
  await daily.click();
  await expect(sessionCards(page)).toHaveCount(2);
  await expect(page.locator('[data-session-id="mon-3"]')).toHaveCount(0);
});

test("Schedule: an empty filtered day offers a working reset", async ({
  page,
}) => {
  await openSchedule(page);
  await monday(page).click();
  await filterTabs(page)
    .getByRole("tab", { name: "Thi thử", exact: true })
    .click();
  await expect(sessionCards(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Xem tất cả", exact: true }).click();
  await expect(
    filterTabs(page).getByRole("tab", { name: "Tất cả", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(sessionCards(page)).toHaveCount(3);
  await expect(monday(page)).toHaveAttribute("aria-pressed", "true");
});

test("Schedule: a personal session can be saved, edited, restored and deleted across reloads", async ({
  page,
}) => {
  await openSchedule(page);
  await page.getByRole("button", { name: "Thêm lịch", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thêm lịch học",
    exact: true,
  });
  const title = "Ôn căn thức với sơ đồ của mình";
  await dialog.getByLabel("Tên buổi học", { exact: true }).fill(title);
  for (const [label, choice] of [
    ["Môn học", "Toán học"],
    ["Thứ trong tuần", "Thứ Năm"],
    ["Loại buổi học", "Tự học"],
  ]) {
    await dialog.getByRole("combobox", { name: label, exact: true }).click();
    await dialog.getByRole("option", { name: choice, exact: true }).click();
  }
  await dialog.getByLabel("Bắt đầu", { exact: true }).fill("18:15");
  await dialog.getByLabel("Kết thúc", { exact: true }).fill("18:45");
  await dialog.getByLabel("Người hướng dẫn", { exact: true }).fill("Tự học");
  await dialog.getByLabel("Địa điểm", { exact: true }).fill("Góc học ở nhà");
  await dialog
    .getByLabel("Ghi chú", { exact: true })
    .fill("Mang vở ghi ba câu hỏi.");
  await dialog.getByRole("button", { name: "Lưu lịch", exact: true }).click();
  await expect(dialog).toBeHidden();
  await thursday(page).click();
  const card = sessionCards(page).filter({ hasText: title });
  await expect(card).toContainText("18:15");
  await expect(card).toContainText("18:45");
  await expect(card).toContainText("Góc học ở nhà");
  await expect(card).toContainText("Mang vở ghi ba câu hỏi.");
  await page.reload();
  await thursday(page).click();
  await expect(card).toBeVisible();
  await card
    .getByRole("button", { name: `Chỉnh sửa lịch: ${title}`, exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: "Chỉnh sửa lịch học",
    exact: true,
  });
  await expect(edit.getByLabel("Tên buổi học", { exact: true })).toHaveValue(
    title,
  );
  await edit.getByLabel("Địa điểm", { exact: true }).fill("Thư viện trường");
  await edit.getByRole("button", { name: "Lưu lịch", exact: true }).click();
  await expect(edit).toBeHidden();
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Thư viện trường");
  await page.reload();
  await thursday(page).click();
  await expect(card).toContainText("Thư viện trường");
  await card
    .getByRole("button", { name: `Xóa lịch: ${title}`, exact: true })
    .click();
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(card).toBeVisible();
  await card
    .getByRole("button", { name: `Xóa lịch: ${title}`, exact: true })
    .click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await thursday(page).click();
  await expect(card).toHaveCount(0);
});

test("Schedule: equal or earlier end times show feedback without saving", async ({
  page,
}) => {
  await openSchedule(page);
  const before = await page.evaluate(
    (key) => localStorage.getItem(key),
    scheduleKey,
  );
  await page.getByRole("button", { name: "Thêm lịch", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thêm lịch học",
    exact: true,
  });
  await dialog
    .getByLabel("Tên buổi học", { exact: true })
    .fill("Lịch chưa hợp lệ");
  await dialog.getByLabel("Bắt đầu", { exact: true }).fill("18:00");
  for (const end of ["18:00", "17:59"]) {
    await dialog.getByLabel("Kết thúc", { exact: true }).fill(end);
    await dialog.getByRole("button", { name: "Lưu lịch", exact: true }).click();
    await expect(dialog).toBeVisible();
    const endField = dialog.getByLabel("Kết thúc", { exact: true });
    await expect(endField).toHaveAttribute("aria-invalid", "true");
    await expect(endField).toHaveAccessibleDescription(/kết thúc/i);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), scheduleKey),
    ).toBe(before);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Thêm lịch", exact: true }),
  ).toBeFocused();
});

test("Schedule: lesson actions open existing curriculum and missing lessons fall back to subjects", async ({
  page,
}) => {
  await openSchedule(page);
  await monday(page).click();
  await page
    .locator('[data-session-id="mon-1"]')
    .getByRole("button", { name: /Mở bài học|Xem bài học/ })
    .click();
  await expect(page).toHaveURL(/lesson=can-bac-hai/);
  await expect(page.locator("#main-content h1")).toContainText(
    "Căn bậc hai số học",
  );
  await openSchedule(page);
  await monday(page).click();
  await page
    .locator('[data-session-id="mon-2"]')
    .getByRole("button", { name: "Xem môn học", exact: true })
    .click();
  await expect(page).toHaveURL(/\/hoc-bai$/);
});

test("Schedule: 360px day, week and add-dialog layouts remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openSchedule(page);
  await page.evaluate(() => document.fonts.ready);
  const controls = [
    monday(page),
    viewTabs(page).getByRole("tab", { name: "Theo ngày" }),
    filterTabs(page).getByRole("tab", { name: "Tự học", exact: true }),
    page.getByRole("button", { name: "Thêm lịch", exact: true }),
  ];
  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  for (const mode of ["Theo ngày", "Cả tuần"]) {
    await viewTabs(page).getByRole("tab", { name: mode }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  }
  await page.getByRole("button", { name: "Thêm lịch", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Thêm lịch học",
    exact: true,
  });
  await expect(
    dialog.getByLabel("Tên buổi học", { exact: true }),
  ).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
