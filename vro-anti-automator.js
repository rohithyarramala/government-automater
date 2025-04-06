const puppeteer = require("puppeteer");

(async () => {
  const config = {
    url: {
      login: "https://webland.ap.gov.in/",
      target: "https://webland.ap.gov.in/WatertaxDemandEntry_1434.aspx",
    },
    credentials: {
      username: "vro750003",
      password: "190Mrochr#",
      district: "21",
    },
    selectors: {
      username: "#useID",
      password: "#pqrabc",
      district: "#ddlDist",
      loginBtn: "#btnLogin",
      khata: "#MainContent_ddlkhtas",
      survey: "#MainContent_ddlsurveyno",
      watappSurvey: "#MainContent_ddlwatappSurvey",
      classification: "#MainContent_ddlclassification",
      getDetailsBtn: "#MainContent_btnGetDetails",
      saveBtn: "#MainContent_btnSavedata",
    },
    timeouts: {
      navigation: 60000, // 60s for slow pages
      selector: 30000,   // 30s for elements to appear
      retry: 5000,       // 5s between retries
    },
    delays: {
      short: 3000,       // Increased base delay
      medium: 5000,
      long: 10000,
    },
    maxRetries: 3,
  };

  async function launchBrowser() {
    return await puppeteer.launch({
      headless: true,
      args: ["--start-maximized"],
      defaultViewport: null,
      timeout: config.timeouts.navigation,
    });
  }

  async function withRetry(fn, maxRetries = config.maxRetries, delayMs = config.timeouts.retry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) throw new Error(`Max retries reached: ${error.message}`);
        await delay(delayMs);
      }
    }
  }

  async function login(page) {
    await withRetry(async () => {
      await page.goto(config.url.login, { waitUntil: "networkidle2", timeout: config.timeouts.navigation });
      await page.waitForSelector(config.selectors.username, { timeout: config.timeouts.selector });
      await page.type(config.selectors.username, config.credentials.username, { delay: 100 });
      await page.type(config.selectors.password, config.credentials.password, { delay: 100 });
      await page.select(config.selectors.district, config.credentials.district);
      await page.click(config.selectors.loginBtn);
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: config.timeouts.navigation });
      await page.reload({ waitUntil: "networkidle2", timeout: config.timeouts.navigation });
      await page.goto(config.url.target, { waitUntil: "networkidle2", timeout: config.timeouts.navigation });
    });
  }

  async function getDropdownOptions(page, selector) {
    return await withRetry(async () => {
      await page.waitForSelector(selector, { timeout: config.timeouts.selector });
      return await page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(`${sel} option`))
          .map((o) => o.value)
          .filter((value) => value.trim() !== "");
      }, selector);
    });
  }

  async function processSurvey(page, khata, survey) {
    await withRetry(async () => {
      await page.select(config.selectors.khata, khata);
      await page.waitForSelector(config.selectors.survey, { timeout: config.timeouts.selector });
      await page.select(config.selectors.survey, survey);
      console.log(`Processing Survey: ${survey}`);
      await delay(config.delays.short);

      await page.waitForSelector(config.selectors.watappSurvey, { timeout: config.timeouts.selector });
      await page.select(config.selectors.watappSurvey, "2");
      await delay(config.delays.medium);

      await page.waitForSelector(config.selectors.classification, { timeout: config.timeouts.selector });
      await page.select(config.selectors.classification, "3");
      await delay(config.delays.short);

      await page.waitForSelector(config.selectors.getDetailsBtn, { timeout: config.timeouts.selector });
      await page.click(config.selectors.getDetailsBtn);
      console.log('Clicked "Get Details" button bhai, waiting for slow server...');
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: config.timeouts.navigation });

      await page.evaluate(() => window.scrollBy(0, 250));
      await delay(config.delays.short);

      await page.waitForSelector(config.selectors.saveBtn, { timeout: config.timeouts.selector });
      await page.click(config.selectors.saveBtn);
      console.log("Save button clicked, crossing fingers bhai!");

      page.once("dialog", async (dialog) => {
        console.log(`Alert popped up: ${dialog.message()}`);
        await dialog.accept();
      });
      await delay(config.delays.medium);
    });
  }

  async function main() {
    while (true) {
      let browser;
      try {
        console.log("Starting the grind bhai...");
        browser = await launchBrowser();
        const page = await browser.newPage();

        await login(page);
        console.log("Logged in, time to tackle the slow beast!");

        const selectedKhata = "101781";

        await page.select("#MainContent_ddlkhtas", selectedKhata);
        const surveyOptions = await getDropdownOptions(page, config.selectors.survey);

        for (let i = surveyOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [surveyOptions[i], surveyOptions[j]] = [surveyOptions[j], surveyOptions[i]];
        }
        
        if (!surveyOptions.length) {
          console.log(`No surveys for Khata ${selectedKhata}, site being lazy again!`);
          await browser.close();
          continue;
        }

        for (const survey of surveyOptions) {
          if (survey === "0") {
            console.log("Survey 0? Skipping this nonsense...");
            continue;
          }
          await processSurvey(page, selectedKhata, survey);
          console.log(`Survey ${survey} done, taking a breather...`);
          await delay(config.delays.long);
        }

        console.log("All done bhai, we survived the slow site!");
        await browser.close();
        break;

      } catch (error) {
        console.error("Site ne phir se dikhaya nakhrra:", error);
        if (browser) await browser.close();
        console.log("Chill kar, 5 sec mein retry karte hain...");
        await delay(config.timeouts.retry);
      }
    }
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await main();
})();