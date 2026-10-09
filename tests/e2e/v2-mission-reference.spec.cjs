const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("Mission Control — fidelity to supplied code.html and screenshot", () => {
  test.skip(process.env.VITE_STUDENT_EXPERIENCE_V2 !== "true", "V2 must be enabled in staging");

  test("desktop has loaded hero art, 7:5 mission/lab and 5:4:3 supporting composition", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    const art = page.locator(".v2-home-hero-scene");
    await expect(art).toBeVisible();
    await art.evaluate((img) => img.decode());
    expect(await art.evaluate((img) => img.naturalWidth)).toBeGreaterThan(500);

    const hero = await page.locator(".v2-home-hero").boundingBox();
    const mission = await page.locator(".v2-next-mission").boundingBox();
    const lab = await page.locator(".v2-mini-lab").boundingBox();
    const lower = await page.locator(".v2-home-lower-grid").boundingBox();
    expect(hero.y, "fallback notice must not push cinematic hero down").toBeLessThanOrEqual(75);
    expect(hero.height, "hero should be cinematic but compact").toBeGreaterThanOrEqual(220);
    expect(hero.height).toBeLessThanOrEqual(290);
    expect(mission.width / lab.width, "main reference ratio 7:5").toBeGreaterThan(1.2);
    expect(Math.abs(mission.y - lab.y), "mission/lab start together").toBeLessThan(3);
    expect(lower.y, "supporting modules are visually separate").toBeGreaterThan(mission.y + mission.height);
    const bottomPanels = page.locator(".v2-home-lower-grid > section");
    await expect(bottomPanels).toHaveCount(3);
    const widths = await bottomPanels.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
    expect(widths[0]).toBeGreaterThan(widths[1]);
    expect(widths[1]).toBeGreaterThan(widths[2]);
    await expect(page.locator(".v2-choices-grid .v2-choice")).toHaveCount(3);
    await expect(page.locator(".v2-mini-lab-control")).toHaveCount(0);
    await expect(page.locator(".v2-mini-lab-controls input[type=range]")).toHaveCount(3);
    const graphRect = await page.locator(".v2-mini-graph").boundingBox();
    const controlsRect = await page.locator(".v2-mini-lab-controls").boundingBox();
    expect(controlsRect, "coefficient controls must render").not.toBeNull();
    expect(graphRect, "graph panel must render").not.toBeNull();
    expect(
      controlsRect.y + controlsRect.height,
      "all sliders must remain inside graph panel",
    ).toBeLessThanOrEqual(graphRect.y + graphRect.height + 2);

    fs.mkdirSync(path.join("test-results","visual"), {recursive:true});
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({path:path.join("test-results","visual","v2-reference-home-1440-viewport.png")});
    await page.screenshot({path:path.join("test-results","visual","v2-reference-home-1440-full.png"),fullPage:true});
  });

  test("mobile 390: no missing hero art, accessible sliders, CTA above dock, no fabricated analytics", async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto("/");
    const hero = page.locator(".v2-home-hero");
    const art = page.locator(".v2-home-hero-scene");
    await expect(art).toBeVisible();
    await art.evaluate((img) => img.decode());
    const cta = page.getByRole("button", {name:"Bắt đầu ngay"});
    const dock = page.locator(".v2-mobile-dock");
    const btnBox = await cta.boundingBox(), dockBox = await dock.boundingBox();
    expect(btnBox.y + btnBox.height).toBeLessThan(dockBox.y);
    await expect(page.locator(".v2-choices-grid .v2-choice")).toHaveCount(3);
    const plot = page.getByRole("region", {name:"Phòng khám phá Toán học"});
    const initialStats = await page.locator(".v2-home-metrics").innerText();
    const coeffB = plot.getByRole("slider", {name:"Hệ số b"});
    const ariaBefore = await plot.getByRole("img").getAttribute("aria-label");
    await coeffB.focus();
    await coeffB.press("ArrowRight");
    expect(await plot.getByRole("img").getAttribute("aria-label")).not.toBe(ariaBefore);
    expect(await page.locator(".v2-home-metrics").innerText()).toBe(initialStats);
    await expect(page.getByText("12 ngày học liên tiếp")).toHaveCount(0);
    await expect(page.getByText("91%")).toHaveCount(0);
    fs.mkdirSync(path.join("test-results","visual"), {recursive:true});
    await page.goto("/");
    await expect(page.locator(".v2-mission-page")).toBeVisible();
    await page.locator(".v2-home-hero-scene").evaluate((img) => img.decode());
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector(".v2-main")?.scrollTo(0, 0);
    });
    const heading = await page.getByRole("heading", {level:1}).boundingBox();
    expect(heading.y, "mobile hero must not hide behind sticky header").toBeGreaterThan(56);
    await page.screenshot({path:path.join("test-results","visual","v2-reference-home-390-viewport.png")});
    await page.screenshot({path:path.join("test-results","visual","v2-reference-home-390-full.png"),fullPage:true});
    await page.setViewportSize({width:360,height:800});
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    )).toBeLessThanOrEqual(1);
  });
});
