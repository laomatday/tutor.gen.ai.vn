const { test, expect } = require("@playwright/test");

test.describe("tempt UI mapping, existing Tutor domain", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "V2 preview only");

  test("desktop shell and four screens use mapped dark surfaces without losing routes", async ({ page }) => {
    await page.setViewportSize({width:1440,height:900});
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    const shell = await page.locator(".learning-os-v2").evaluate((element) => {
      const css = getComputedStyle(element);
      return {
        sidebar: css.getPropertyValue("--v2-sidebar-width").trim(),
        bg: css.getPropertyValue("--tempt-bg").trim(),
      };
    });
    expect(shell.sidebar).toBe("248px");
    expect(shell.bg).toBe("#070c1b");
    const [task, lab] = await Promise.all([
      page.locator(".v2-next-mission").boundingBox(),
      page.locator(".v2-mini-lab").boundingBox(),
    ]);
    expect(task.width).toBeGreaterThan(lab.width);
    for (const [route, selector] of [
      ["/hoc-bai", ".v2-universe-page"],
      ["/tu-giai", ".v2-focus-page"],
      ["/replay", ".v2-replay-page"],
    ]) {
      await page.goto(route);
      await expect(page.locator(selector)).toBeVisible();
    }
  });

  test("360px: mapped layout keeps functional learning controls accessible", async ({ page }) => {
    await page.setViewportSize({width:360,height:800});
    for (const [route, selector] of [
      ["/", ".v2-mission-page"],
      ["/hoc-bai", ".v2-universe-page"],
      ["/tu-giai", ".v2-focus-page"],
      ["/replay", ".v2-replay-page"],
    ]) {
      await page.goto(route);
      await expect(page.locator(selector)).toBeVisible();
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      ), `overflow at ${route}`).toBeLessThanOrEqual(1);
    }
  });
});
