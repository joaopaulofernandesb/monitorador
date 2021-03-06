const puppeteer = require('puppeteer');
var CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
var mysql = require('mysql');
require('dotenv').config();
const express = require('express');
var cors = require('express-cors');
const axios = require('axios');
const app = express();

app.use(cors());

app.get('/status', function(req, res) {
  res.json({ error: false, return: 'ok' });
});

var db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

db.connect();

const scrape = async () => {
  // const browser = await puppeteer.launch();
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('http://portal.esocial.gov.br/agenda/agenda-1');
  await page.screenshot({ path: 'esocial.png' });

  const result = await page.evaluate(() => {
    const books = [];
    document.querySelectorAll('div > article > div ').forEach(book =>
      books.push({
        info: book.getElementsByClassName('tileHeadline')[0].innerText,
        // prod: book.getAttribute('title'),
        // price: book.getElementsByClassName('price_color')[0].innerText,
      })
    );
    return books;
  });

  browser.close();
  return result;
};

var job = new CronJob('* * * * *', () => {
  console.log('---Iniciando o Monitoramento ---');
  scrape().then(value => {
    // const prod = value.map(produto => {
    //   return produto.info;
    // });

    db.query('SELECT * FROM monitorando', function dados(error, results) {
      if (error) throw error;
      if (!results[0]) {
        console.log('banco vazio !');
        for (iterator of value) {
          // console.log(iterator.info);
          db.query(
            'INSERT INTO monitorando (page) VALUES ("' + iterator.info + '")'
          );
        }
        console.log('Dados Armazenados com sucesso !');
      } else {
        db.query('SELECT * from monitorando', function(error, results) {
          if (error) throw error;
          const retornoPage = value.map(retornoWeb => {
            return retornoWeb.info;
          });

          const retornoDb = results.map(retornoBanco => {
            return retornoBanco.page;
          });
          console.log(retornoPage);
          console.log(retornoDb);

          // var apenasNoR1 = retornoPage.filter(function(element, index, array) {
          //   if (retornoDb.indexOf(element) == -1) return element;
          // });

          var apenasNoR2 = retornoDb.filter(function(element, index, array) {
            if (retornoPage.indexOf(element) == -1) return element;
          });

          var todasAsDiferencas = apenasNoR2;
          // console.log(todasAsDiferencas);
          if (!todasAsDiferencas[0]) {
            console.log('Nenhuma Alteração no Momento');
            console.log('---- Fim do Monitoramento ----');
            axios
              .post(
                'http://localhost:3000/api/notificar?notificacao=Nenhuma Notificação'
              )
              .then(function(response) {
                console.log(response);
              });
          } else {
            console.log('Foi encontrado Alterações');

            var r3 = [];
            retornoPage.forEach(function(element, index, array) {
              if (retornoDb.indexOf(element) == -1) r3.push(element);
            });
            // console.log('Dif', r3);

            db.query(
              'SELECT * FROM monitorando where page ="' +
                todasAsDiferencas[0] +
                '"',
              function(error, results) {
                if (error) throw error;
                db.query(
                  'UPDATE monitorando SET page ="' +
                    todasAsDiferencas[0] +
                    '" where id = "' +
                    results[0].id +
                    '"',
                  function(error, results) {
                    if (error) throw error;
                    console.log(results);
                  }
                );
              }
            );

            axios
              .post('http://localhost:3000/api/notificar?notificacao=' + r3)
              .then(function(response) {
                console.log(response);
              });

            // eslint-disable-next-line no-inner-declarations
            async function main() {
              // create reusable transporter object using the default SMTP transport
              const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                  user: process.env.EMIAL_USER, // generated ethereal user
                  pass: process.env.EMAIL_PASSWORD, // generated ethereal password
                },
              });

              // send mail with defined transport object
              const info = await transporter.sendMail({
                from: 'joao.brasil@tecnospeed.com.br', // sender address
                to: 'joao.brasil@tecnospeed.com.br', // list of receivers
                subject: 'Alerta ✔', // Subject line
                text: 'Novos itens alterado', // plain text body
                html:
                  '<p><h1>Novos Intens foram Encontrados:</h1></p><br><b>Antes:</b> ' +
                  todasAsDiferencas[0] +
                  '  <b>Agora:</b> ' +
                  r3[0], // html body
              });
              console.log('Message sent: %s', info.messageId);
              console.log(
                'Preview URL: %s',
                nodemailer.getTestMessageUrl(info)
              );
            }

            main().catch(console.error);
          }
        });
      }
    });
    // linha com problema

    // async function main() {
    //   // create reusable transporter object using the default SMTP transport
    //   const transporter = nodemailer.createTransport({
    //     host: 'smtp.gmail.com',
    //     port: 587,
    //     secure: false, // true for 465, false for other ports
    //     auth: {
    //       user: process.env.EMIAL_USER, // generated ethereal user
    //       pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    //     },
    //   });

    //   // send mail with defined transport object
    //   const info = await transporter.sendMail({
    //     from: 'joao.brasil@tecnospeed.com.br', // sender address
    //     to: 'joao.brasil@tecnospeed.com.br', // list of receivers
    //     subject: 'Alerta ✔', // Subject line
    //     text: 'Novos itens alterado', // plain text body
    //     html: 'teste', // html body
    //   });
    //   console.log('Message sent: %s', info.messageId);
    //   console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // }

    // main().catch(console.error);
  });
});
job.start();

app.listen(process.env.API_PORT || 1337);
