import { chromium } from "playwright";

export async function fetchRenderedHtml(url: string) {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.waitForTimeout(2000);

  const html = await page.content();

  await browser.close();

  return html;
}
