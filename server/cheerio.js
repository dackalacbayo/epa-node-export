var cheerio = require('cheerio');

var x = '<p><strong>Sources</strong></p>';

const $ = cheerio.load(x);

$('p').addClass('hello');
const theHTML = $('p').text();
console.log(theHTML);
