const { test, expect } = require("@playwright/test");
const appConfig = require("../../src/data/config/app.json");
const { policy } = require("../../src/data/practice/tools.json");

const quadraticPath = "/tu-giai?problem=quadratic-factor-01";
const quadraticTitle = "Phương trình bậc hai & phân tích nhân tử";
const parabolaTitle = "Xác định hệ số của parabol";
const correctQuadratic = "(x-2)(x-3)=0\nx=2 hoặc x=3";

test.use({ viewport: { width: 1440, height: 900 } });

function answerField(page) {
  return page.getByRole("textbox", { name: "Trình bày từng phép biến đổi" });
}

async function chooseProblem(page, title) {
  await page.getByRole("combobox", { name: "Chọn bài tập luyện tập" }).click();
  await page.getByRole("option", { name: title, exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Chọn bài tập luyện tập" }),
  ).toHaveText(title);
}

async function gpBalance(page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("genai-student-gp-v1")),
  );
}

async function drawStroke(page, sketch, offset = 0) {
  await sketch.scrollIntoViewIfNeeded();
  const box = await sketch.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(
    box.x + box.width * 0.15,
    box.y + box.height * (0.3 + offset),
  );
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width * 0.35,
    box.y + box.height * (0.5 + offset),
    { steps: 6 },
  );
  await page.mouse.move(
    box.x + box.width * 0.6,
    box.y + box.height * (0.25 + offset),
    { steps: 6 },
  );
  await page.mouse.up();
}

test("Focus Studio: correct a quadratic with a hint, earn once, and replay with seek, speed and bookmarks", async ({
  page,
}) => {
  await page.goto(quadraticPath);
  const answer = answerField(page);
  await expect(answer).toHaveValue("");
  await expect
    .poll(() => gpBalance(page))
    .toBe(appConfig.rewards.initialBalance);

  await answer.fill("(x-1)(x-6)=0\nx=1 hoặc x=6");
  await page
    .getByRole("button", { name: "Kiểm tra bước giải", exact: true })
    .click();
  const attempts = page.getByRole("list", {
    name: "Các lần kiểm tra đã ghi nhận",
  });
  await expect(attempts.getByRole("listitem")).toHaveCount(1);
  await expect(attempts.getByRole("listitem").last()).toContainText(
    "Cùng xem lại bước này",
  );

  const hint = page.getByRole("button", { name: /Xác định tổng và tích/ });
  await hint.click();
  await expect(hint).toHaveAttribute("aria-expanded", "true");
  await answer.fill(correctQuadratic);
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(
    page.getByText("Đã nhận thưởng hoàn thành", { exact: true }),
  ).toBeVisible();
  await expect(attempts.getByRole("listitem").last()).toContainText(
    "Bước giải đã khớp",
  );
  const earnedBalance =
    appConfig.rewards.initialBalance +
    Math.min(
      appConfig.rewards.dailyLimit - appConfig.rewards.initialDailyEarned,
      appConfig.rewards.lessonCompletionGp - policy.hintPenaltyGp,
    );
  await expect.poll(() => gpBalance(page)).toBe(earnedBalance);

  await page
    .getByRole("button", { name: "Xem lại bài làm", exact: true })
    .click();
  await expect(page).toHaveURL(/\/replay\?problem=quadratic-factor-01$/);
  const timeline = page.getByRole("list", { name: "Các bước đã ghi nhận" });
  await expect(timeline.getByRole("listitem")).toHaveCount(4);
  await expect(timeline).toContainText("Mở một gợi ý");
  await expect(timeline).toContainText("Hoàn thành bài toán");
  await page
    .getByRole("button", { name: "Lưu lỗi vào sổ tay", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Đã lưu vào sổ tay", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  const seek = page.getByRole("slider", { name: "Vị trí phát lại" });
  await seek.focus();
  await seek.press("Home");
  await expect(seek).toHaveValue("0");
  await expect(timeline.getByRole("listitem")).toHaveCount(1);
  const speed = page.getByRole("button", { name: "2.0×", exact: true });
  await speed.click();
  await expect(speed).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Phát lại", exact: true }).click();
  await expect
    .poll(async () => Number(await seek.inputValue()))
    .toBeGreaterThan(0);
  await seek.focus();
  await seek.press("End");
  await expect
    .poll(async () => Number(await seek.inputValue()))
    .toBe(Number(await seek.getAttribute("max")));
  await expect(timeline.getByRole("listitem")).toHaveCount(4);
  await expect(page.locator(".replay-snapshot pre")).toHaveText(
    correctQuadratic,
  );

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Đã lưu vào sổ tay", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Tiếp tục tự giải", exact: true })
    .click();
  await expect(answerField(page)).toHaveValue(correctQuadratic);
  await page
    .getByRole("button", { name: "Xóa nháp để thử lại", exact: true })
    .click();
  await expect(answerField(page)).toHaveValue("");
  await expect(attempts.getByRole("listitem")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Xem lại bài làm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Đã lưu vào sổ tay", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(timeline.getByRole("listitem")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Tiếp tục tự giải", exact: true })
    .click();
  await answerField(page).fill(correctQuadratic);
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect.poll(() => gpBalance(page)).toBe(earnedBalance);
});

test("Focus Studio: switching exercises preserves separate drafts, hints and completion", async ({
  page,
}) => {
  await page.goto(quadraticPath);
  const quadraticDraft = "x^2-5x+6=0\n(x-2)(x-3)=0";
  await answerField(page).fill(quadraticDraft);
  await page.getByRole("button", { name: /Xác định tổng và tích/ }).click();

  await chooseProblem(page, parabolaTitle);
  await expect(page).toHaveURL(/problem=parabola-coefficient-03$/);
  await expect(answerField(page)).toHaveValue("");
  await expect(
    page.getByRole("button", { name: /Điểm thuộc đồ thị/ }),
  ).toHaveAttribute("aria-expanded", "false");
  await answerField(page).fill("a=12/4=3");
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(
    page.getByText("Đã nhận thưởng hoàn thành", { exact: true }),
  ).toBeVisible();

  await chooseProblem(page, quadraticTitle);
  await expect(answerField(page)).toHaveValue(quadraticDraft);
  await expect(
    page.getByRole("button", { name: /Xác định tổng và tích/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByText("Đã nhận thưởng hoàn thành", { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(answerField(page)).toHaveValue(quadraticDraft);
  await chooseProblem(page, parabolaTitle);
  await expect(answerField(page)).toHaveValue("a=12/4=3");
  await expect(
    page.getByText("Đã nhận thưởng hoàn thành", { exact: true }),
  ).toBeVisible();
});

test("Focus Studio: sketch strokes survive reload and support undo and clearing", async ({
  page,
}) => {
  await page.goto(quadraticPath);
  await page.getByRole("tab", { name: "Bút phác thảo", exact: true }).click();
  const sketch = page.getByRole("img", {
    name: "Vùng vẽ nháp bằng bút hoặc chuột",
  });
  await drawStroke(page, sketch);
  await expect(sketch.locator("polyline")).toHaveCount(1);
  const savedPoints = await sketch.locator("polyline").getAttribute("points");
  await page.reload();
  await page.getByRole("tab", { name: "Bút phác thảo", exact: true }).click();
  await expect(sketch.locator("polyline")).toHaveCount(1);
  await expect(sketch.locator("polyline")).toHaveAttribute(
    "points",
    savedPoints,
  );

  await page
    .getByRole("button", { name: "Hoàn tác nét vẽ", exact: true })
    .click();
  await expect(sketch.locator("polyline")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Hoàn tác nét vẽ", exact: true }),
  ).toBeDisabled();
  await drawStroke(page, sketch);
  await drawStroke(page, sketch, 0.15);
  await expect(sketch.locator("polyline")).toHaveCount(2);
  await page.getByRole("button", { name: "Xóa bản nháp", exact: true }).click();
  await expect(sketch.locator("polyline")).toHaveCount(0);
  await page.reload();
  await page.getByRole("tab", { name: "Bút phác thảo", exact: true }).click();
  await expect(sketch.locator("polyline")).toHaveCount(0);
});

test("Focus Studio: keyboard tabs operate the graph slider and algebra sum/product model", async ({
  page,
}) => {
  await page.goto(quadraticPath);
  const tabs = page.getByRole("tablist", { name: "Công cụ Focus Studio" });
  const math = tabs.getByRole("tab", { name: "Công thức Toán", exact: true });
  const sketch = tabs.getByRole("tab", { name: "Bút phác thảo", exact: true });
  const graph = tabs.getByRole("tab", {
    name: "Parabol tương tác",
    exact: true,
  });
  const tiles = tabs.getByRole("tab", {
    name: "Ghép hình đại số",
    exact: true,
  });
  await math.focus();
  await math.press("ArrowRight");
  await expect(sketch).toBeFocused();
  await expect(sketch).toHaveAttribute("aria-selected", "true");
  await sketch.press("ArrowRight");
  await expect(graph).toBeFocused();
  await expect(graph).toHaveAttribute("aria-selected", "true");
  const x = page.getByRole("slider", { name: "Hoành độ điểm M" });
  await expect(x).toHaveValue("0");
  await x.focus();
  await x.press("ArrowRight");
  await expect(x).toHaveValue("0.1");
  await expect(page.getByText("M(0.1; 5.51)", { exact: true })).toBeVisible();

  await graph.focus();
  await graph.press("End");
  await expect(tiles).toBeFocused();
  await expect(tiles).toHaveAttribute("aria-selected", "true");
  await page.getByRole("spinbutton", { name: "Giá trị u" }).fill("-1");
  await page.getByRole("spinbutton", { name: "Giá trị v" }).fill("-6");
  await expect(
    page.getByText("Thử một cặp số của em", { exact: true }),
  ).toBeVisible();
  await page.getByRole("spinbutton", { name: "Giá trị u" }).fill("-2");
  await page.getByRole("spinbutton", { name: "Giá trị v" }).fill("-3");
  await expect(
    page.getByText("Cả tổng và tích đều phù hợp", { exact: true }),
  ).toBeVisible();
  await tiles.focus();
  await tiles.press("Home");
  await expect(math).toBeFocused();
  await expect(math).toHaveAttribute("aria-selected", "true");
  await math.press("ArrowLeft");
  await expect(tiles).toBeFocused();
  await expect(tiles).toHaveAttribute("aria-selected", "true");
});
