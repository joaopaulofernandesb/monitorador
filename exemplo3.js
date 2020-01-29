const puppeteer = require('puppeteer');
const scrape = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://books.toscrape.com/');
  // page.click('h3 > a');
  // await page.waitForNavigation();
  // await page.screenshot({ path: 'exemplo3.png' });
  const result = await page.evaluate(() => {
    const books = {};
    document.querySelectorAll(' section > div > ol > li ').forEach(book => {
      books.title = book.getElementsByTagName('h3').innerText;
      books.price = book.getElementsByClassName('price_color')[0].innerText;
    });
    return books;
  });

  browser.close();
  return result;
};
scrape().then(value => {
  console.log(value);
});
