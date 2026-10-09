const {test,expect}=require("@playwright/test");

for(const [width,height] of [[360,800],[390,844],[768,1024],[1024,768],[1440,900]]){
  test("Tutor Pilot login remains accessible at "+width+"px",async({page})=>{
    await page.setViewportSize({width,height});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("/pilot");
    await expect(page.getByRole("heading",{name:"Đăng nhập genAi Tutor Pilot"})).toBeVisible();
    await expect(page.getByRole("textbox",{name:"Email đã được cấp quyền"})).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".home-wallet")).toHaveCount(0);
    await expect(page.locator(".student-bottom-nav")).toHaveCount(0);
    const metrics=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      width:document.documentElement.clientWidth,
      submit:(()=>{
        const b=document.querySelector('button[type="submit"]');
        return b?.getBoundingClientRect().toJSON()??null;
      })(),
    }));
    expect(metrics.overflow,"pilot horizontal overflow").toBeLessThanOrEqual(1);
    expect(metrics.submit?.width).toBeGreaterThan(100);
    expect(metrics.submit?.right).toBeLessThanOrEqual(metrics.width);
    expect(errors).toEqual([]);
  });
}

test("Tutor Pilot does not expose learning data without an account",async({page})=>{
  await page.goto("/pilot");
  await expect(page.getByRole("heading",{name:"Đăng nhập genAi Tutor Pilot"})).toBeVisible();
  await expect(page.getByRole("heading",{name:/Hỗ trợ học sinh đúng chỗ/})).toHaveCount(0);
  await expect(page.getByRole("heading",{name:/Chào.*bắt đầu từ một bước nhỏ/})).toHaveCount(0);
  await expect(page.getByText("Lê Phương Linh",{exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Đăng nhập bảo mật"}).click();
  // Native form validation blocks a password-less request.
  expect(await page.locator('input[type="email"]').evaluate(el=>el.checkValidity())).toBe(false);
  await expect(page.getByRole("heading",{name:"Đăng nhập genAi Tutor Pilot"})).toBeVisible();
});

test("Student auxiliary navigation opens the distinct pilot rather than simulating a login",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await page.getByRole("button",{name:"Mở menu học tập"}).click();
  await page.locator("#main-navigation").getByRole("button",{name:"Học có tài khoản",exact:true}).click();
  await expect(page).toHaveURL(/\/pilot$/);
  await expect(page.getByRole("heading",{name:"Đăng nhập genAi Tutor Pilot"})).toBeVisible();
});
