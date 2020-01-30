// const puppeteer = require('puppeteer');
// var CronJob = require('cron').CronJob;

const express = require('express');
var cors = require('express-cors');

const app = express();

app.use(cors());

app.get('/status', function(req, res) {
  res.json({ error: false, return: 'ok' });
});

app.listen(3001);

// const scrape = async () => {
//   // const browser = await puppeteer.launch();
//   const browser = await puppeteer.launch({
//     args: ['--no-sandbox', '--disable-setuid-sandbox'],
//   });
//   const page = await browser.newPage();
//   await page.goto('http://books.toscrape.com/');

//   const result = await page.evaluate(() => {
//     const books = [];
//     document.querySelectorAll('section > div > ol > li').forEach(book =>
//       books.push({
//         prod: book.getElementsByTagName('h3')[0].innerText,
//         price: book.getElementsByClassName('price_color')[0].innerText,
//       })
//     );
//     return books;
//   });

//   browser.close();
//   return result;
// };

// var job = new CronJob('* * * * *', () => {
//   console.log('---Iniciando o Monitoramento ---');

//   scrape().then(value => {
//     // const prod = value.map(produto => {
//     //   return produto.prod;
//     // });

//     // const price = value.map(preco => {
//     //   return preco.price;
//     // });

//     // console.log('produto', prod);
//     // console.log('preço', price);
//     console.log(value);
//   });
// });
// job.start();
