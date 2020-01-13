const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

var browser;

let openBrowser = async (isHeadless, isDevtools, isNoSandboxMode) => {
	if(isNoSandboxMode) {
		console.log("Browser is lunching.")
		try {
			console.log("Launched?")
			browser = await puppeteer.launch({
				headless: isHeadless,
				devtools: isDevtools,
				args: ['--no-sandbox']
			});
		} catch (error) {
			console.log(error)
		}
		console.log("Yo yo yo.")
	} else {
		browser = await puppeteer.launch({
			headless: isHeadless,
			devtools: isDevtools
		});
	}
};

function initializeModule(isHeadless, isDevtools, isNoSandboxMode, callback) {
	openBrowser(isHeadless, isDevtools, isNoSandboxMode)
		.then(() => {
			callback(null, true);
		})
		.catch(function(err) {
			callback(err, false);
		});
}

const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);
  
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }
  
let getBibtexOfTopArticleInSearchAsync = async searchText => {
	const page = await browser.newPage();
	await page.goto("http://scholar.google.com/", { waitUntil: "networkidle0" });
	await page.waitFor('input[type= "text"]');
	await page.keyboard.type(searchText);

	await Promise.all([
		page.click('button[type="submit"]'),
		page.waitForNavigation({ waitUntil: "networkidle0" })
	]);

	alert("YO");

	page.on("console", msg => {
		console.log(msg.text());
	});

	page.click("[title=Cite]")

	const randomAdditionToSleepTimeMs = Math.floor(Math.random() * 101);
	const sleepTimeMs = 1000 + randomAdditionToSleepTimeMs;
	await sleep(sleepTimeMs);

	await clickByText(page, `BibTeX`);
	  await page.waitForNavigation({waitUntil: 'load'});
	  
	let bibtex = await page.evaluate(() => document.getElementsByTagName("pre")[0].innerHTML);

	page.close();
	return bibtex;
}

function getBibtexOfTopArticleInSearch(searchText, callback) {
	getBibtexOfTopArticleInSearchAsync(searchText)
		.then(result => {
			callback(null, result);
		})
		.catch(function(err) {
			callback(err, null);
		});
}

module.exports = {
	initializeModule: initializeModule,
	getBibtexOfTopArticleInSearch: getBibtexOfTopArticleInSearch
}