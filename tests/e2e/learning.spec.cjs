const { test, expect } = require("@playwright/test");
const path = require("node:path");

const pages = [
  ["/", "home"], ["/hoc-bai", "map"], ["/tu-giai", "practice"],
  ["/replay", "replay"], ["/tien-bo", "progress"],
  ["/thoi-khoa-bieu", "schedule"], ["/doi-qua", "rewards"],
  ["/thi-thu", "legacy-exam"], ["/giao-vien", "teacher-home"],
  ["/giao-vien/lop-hoc", "teacher-classes"], ["/giao-vien/bai-tap", "teacher-assignments"],
  ["/quan-tri", "admin-home"], ["/quan-tri/nguoi-dung", "admin-users"],
  ["/quan-tri/hoc-lieu", "admin-curriculum"],
];

test.describe("14 routes × 2 viewport visual, semantic and accessibility gates", () => {
  for (const [url, slug] of pages) for (const viewport of [
    {width:390,height:844}, {width:1440,height:900},
  ]) {
    test(`${slug} ${viewport.width}px`, async ({page}) => {
      await page.setViewportSize(viewport);
      await page.goto(url);
      await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "horizontal overflow").toBeLessThanOrEqual(1);
      const file = path.join("test-results", "visual", `${slug}-${viewport.width}.png`);
      await page.screenshot({path:file,fullPage:true,animations:"disabled"});
      await page.addScriptTag({path:require.resolve("axe-core/axe.min.js")});
      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}});
        return result.violations.filter((x) => ["serious","critical"].includes(x.impact))
          .map((x) => ({
          id:x.id, impact:x.impact, count:x.nodes.length,
          targets:x.nodes.slice(0,8).map((node) => ({
            selector:node.target,
            html:node.html.slice(0,160),
            reason:(node.failureSummary || "").slice(0,150),
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
    test(`${slug} has no page errors or horizontal overflow at 360px`, async ({page}) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({width:360,height:800});
      await page.goto(url);
      await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "horizontal overflow at 360px").toBeLessThanOrEqual(1);
      expect(errors, "uncaught browser errors at 360px").toEqual([]);
    });
  }
});

test("Reference shell: desktop sidebar, breadcrumb, and collapsed rail", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  const crumbs = page.locator("#main-content").getByRole("navigation", {name:"Đường dẫn"});
  await expect(crumbs).toContainText("Không gian học tập");
  await expect(crumbs).toContainText("Hôm nay");
  await expect(page.locator(".app-header").getByRole("navigation", {name:"Đường dẫn"})).toHaveCount(0);
  const sidebar = page.locator("#main-navigation");
  const nav = sidebar.getByRole("navigation", {name:"Các trang học tập"});
  await expect(nav.getByRole("button", {name:"Hôm nay"})).toHaveAttribute("aria-current","page");
  await expect(nav.getByRole("button", {name:"Môn học"})).toBeVisible();
  await expect(sidebar).toHaveCSS("background-color","rgb(255, 255, 255)");
  expect(Math.round((await sidebar.boundingBox()).width)).toBe(288);
  const handle = sidebar.getByRole("button", {name:"Thu gọn thanh bên"});
  await expect(handle).toBeVisible();
  await expect(handle).toHaveAttribute("aria-expanded","true");
  const toggleBox = await handle.boundingBox();
  const sideBox = await sidebar.boundingBox();
  expect(toggleBox.x + toggleBox.width / 2).toBeGreaterThan(sideBox.width - 5);
  await handle.click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(72);
  await page.screenshot({path:"test-results/visual/sidebar-collapsed-1440.png",animations:"disabled"});
  await expect(sidebar.getByRole("button", {name:"Phần thưởng"})).toBeVisible();
  await expect(sidebar.getByRole("button", {name:"Mở rộng thanh bên"})).toHaveAttribute("aria-expanded","false");
  await page.reload();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(72);
  await sidebar.getByRole("button", {name:"Mở rộng thanh bên"}).click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(288);
  await page.screenshot({path:"test-results/visual/sidebar-expanded-1440.png",animations:"disabled"});
});

test("Reference shell: mobile drawer preserves navigation and focus", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  const toggle = page.getByRole("button",{name:"Mở menu học tập"});
  await toggle.click();
  const sidebar = page.locator("#main-navigation");
  await expect(sidebar).toHaveClass(/is-open/);
  await expect(sidebar.getByRole("button",{name:"Đóng menu"})).toBeFocused();
  await page.screenshot({path:"test-results/visual/sidebar-drawer-390.png",animations:"disabled"});
  await page.keyboard.press("Escape");
  await expect(sidebar).not.toHaveClass(/is-open/);
  await expect(toggle).toBeFocused();
  await toggle.click();
  await expect(sidebar.getByRole("button",{name:"Đóng menu"})).toBeFocused();
  await sidebar.getByRole("button",{name:"Đóng menu"}).click();
  await expect(sidebar).not.toHaveClass(/is-open/);
  await expect(toggle).toBeFocused();
});

test("Advanced Tutor: learning mission, graph and workspace identity are present", async ({page}) => {
  await page.goto("/");
  await expect(page.locator(".advanced-mission")).toBeVisible();
  await expect(page.getByRole("heading", {name:"Các bài cần học tiếp"})).toBeVisible();
  await page.goto("/hoc-bai");
  await expect(page.getByRole("heading", {name:/Knowledge Universe/})).toBeVisible();
  const nodes = page.locator(".ai-v3-map-node");
  expect(await nodes.count()).toBeGreaterThan(1);
  await nodes.last().click();
  await expect(nodes.last()).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("complementary",{name:"Thông tin chủ đề"}).getByRole("heading",{level:2})).toBeVisible();
  await page.goto("/tu-giai?problem=parabola-coefficient-03");
  await expect(page.getByRole("heading", {name:/Focus Studio/})).toBeVisible();
  await expect(page.getByRole("heading", {name:/Reasoning Canvas/})).toBeVisible();
  await expect(page.getByRole("heading", {name:"Các bước đã kiểm tra"})).toBeVisible();
  await expect(page.getByRole("heading", {name:"Tự đặt câu hỏi"})).toBeVisible();
  await page.goto("/replay?problem=parabola-coefficient-03");
  await expect(page.getByRole("heading", {name:/Xem lại bài làm/})).toBeVisible();
  await expect(page.getByText("Chưa có bài nộp để xem lại")).toBeVisible();
});

test("Focus Studio: log only real attempts and reveal mathematical model after valid solution", async ({page}) => {
  await page.goto("/tu-giai?problem=parabola-coefficient-03");
  const answer = page.getByLabel("Trình bày từng phép biến đổi");
  await expect(answer).toHaveValue("");
  await expect(page.getByText("Mô hình mở sau khi em kiểm tra đúng")).toBeVisible();
  await answer.fill("a=9");
  await page.getByRole("button",{name:"Kiểm tra bước giải"}).click();
  await expect(page.getByRole("heading",{name:"Các bước đã kiểm tra"})).toBeVisible();
  await expect(page.getByText("a=9",{exact:true}).first()).toBeVisible();
  await answer.fill("12 = a * (-2)^2 ⇔ a = 3");
  await page.getByRole("button",{name:"Kiểm tra bước giải"}).click();
  await expect(page.getByText("Sau khi giải: y = 3x²")).toBeVisible();
  await page.getByRole("button", {name:"Xem lại bài làm"}).click();
  await expect(page.getByRole("heading",{name:"Các bước đã ghi nhận"})).toBeVisible();
  await expect(page.getByText("a=9",{exact:true}).first()).toBeVisible();
});

test("Home → Luyện tập → Nộp bài → Xem lại", async ({page}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", {name:/Chào/})).toBeVisible();
  await page.getByRole("button", {name:/Mở bài luyện tập/}).click();
  await expect(page).toHaveURL(/\/tu-giai\?problem=parabola-coefficient-03/);
  await page.getByLabel("Trình bày từng phép biến đổi").fill("12 = a * (-2)^2 ⇔ a = 3");
  await page.getByRole("button", {name:"Nộp bài"}).click();
  await expect(page.locator(".ui-alert.ui-tone-success").getByText(/Các phép tính khớp với bài mẫu/)).toBeVisible();
  await page.locator("#main-content").getByRole("button", {name:"Xem lại bài làm"}).click();
  await expect(page.getByRole("heading",{name:"Các bước đã ghi nhận"})).toBeVisible();
  await expect(page.getByText("Nộp bài", {exact:true}).first()).toBeVisible();
});

test("Lộ trình → Bài học → Hoàn thành", async ({page}) => {
  await page.goto("/hoc-bai?grade=9&subject=toan&topic=can-thuc&lesson=rut-gon-can-thuc&stage=exercises");
  await expect(page.locator(".learning-load-skeleton")).toHaveCount(0);
  await expect(page.locator("#main-content").getByRole("heading",{level:1})).toHaveCount(1);
  const exerciseData = require("../../src/data/curriculum/lessons.json");
  const lesson = exerciseData.find((item) => item.id === "rut-gon-can-thuc");
  for (const exercise of lesson.exercises) {
    await page.locator(`input[name="${lesson.id}-${exercise.id}"]`).nth(exercise.correctIndex).check();
  }
  await page.getByRole("button", {name:/Kiểm tra.*hoàn thành/}).click();
  await expect(page.getByText("Bạn đã hoàn thành bài học!")).toBeVisible();
});
