const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://app.notasegura.com.br');
  await page.screenshot({ path: 'notasegura.png' });
  await browser.close();
})();
