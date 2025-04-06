const puppeteer = require("puppeteer");

(async () => {
  while (true) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--start-maximized"],
      }); // Headless mode
      const page = await browser.newPage();

      // Navigate to login page
      await page.goto("https://webland.ap.gov.in/", {
        waitUntil: "networkidle2",
      });

      // Fill in login form
      await page.type("#useID", "vro750003");
      await page.type("#pqrabc", "190Mrochr#");
      await page.select("#ddlDist", "21");

      // Click login button
      await page.click("#btnLogin");
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      await page.reload({ waitUntil: "networkidle2" });

      await page.goto(
        "https://webland.ap.gov.in/WatertaxDemandEntry_1434.aspx",
        {
          waitUntil: "networkidle2",
        }
      );

      // await page.waitForNavigation({ waitUntil: "networkidle2" });
      console.log("Main task starts");

      while (true) {
        console.log("Starting new cycle...");
        // await page.select("#MainContent_ddlvill", "2109005");

        let khataFound = false;


        while (!khataFound) {
          await delay(2000); // Delay before selecting Khata number
          console.log("Selecting Khata Number...");
          // await page.waitForSelector("#MainContent_ddlkhtas");

          // Get all valid 3 or 4-digit Khata numbers
          const khataOptions = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll("#MainContent_ddlkhtas option")
            )
              .map((o) => o.value)
              .filter((value) => /^\d{6}$/.test(value));
          });


          if (khataOptions.length === 0) {

            const khataOptions = await page.evaluate(() => {
              return Array.from(
                document.querySelectorAll("#MainContent_ddlkhtas option")
              )
                .map((o) => o.value)
                .filter((value) => /^\d{4}$/.test(value));
            });
          }


          if (khataOptions.length === 0) {

            console.log("No valid Khata Numbers found. Retrying...");
            continue;
          }

          await delay(2000); // Match original delay
          

          const selectedKhata =
            khataOptions[Math.floor(Math.random() * khataOptions.length)];
          await page.select("#MainContent_ddlkhtas", selectedKhata);
          console.log(`Selected Khata: ${selectedKhata}`);

          if(selectedKhata == 9999) {
            console.log("Khata number is 9999, skipping...");
            continue;
          }


          // Count remaining Khata numbers
          const remainingKhatas = khataOptions.filter(
            (khata) => khata !== selectedKhata
          );

          console.log(`Remaining Khata Numbers: ${remainingKhatas.length}`);

          await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay before checking surveys

          // Get all survey numbers for the selected Khata
          console.log("Checking Survey Numbers...");
          await page.waitForSelector("#MainContent_ddlsurveyno", {
            timeout: 5000,
          });

          const surveyOptions = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll("#MainContent_ddlsurveyno option")
            )
              .map((o) => o.value)
              .filter((value) => value.trim() !== ""); // Ignore empty values
          });

          if (surveyOptions.length === 0) {
            console.log(
              `No surveys found for Khata: ${selectedKhata}. Selecting a new Khata...`
            );
            continue;
          }

          khataFound = true; // A valid Khata with surveys was found
          console.log(surveyOptions);
          for (const survey of surveyOptions) {
            await page.select("#MainContent_ddlkhtas", selectedKhata);
            console.log(`Selected Khata: ${selectedKhata}`);

            // await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay before checking surveys

            await page.waitForSelector("#MainContent_ddlsurveyno", {
              timeout: 5000,
            });

            if (survey == 0) {
              continue;
            }
            await page.select("#MainContent_ddlsurveyno", survey);
            console.log(survey);
            console.log(`Processing Survey: ${survey}`);

            // await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            // MainContent_ddlwatappSurvey
            await page.waitForSelector("#MainContent_ddlwatappSurvey", {
              timeout: 5000,
            });

            if (survey == 0) {
              continue;
            }
            await page.select("#MainContent_ddlwatappSurvey", "1");

            await new Promise((resolve) => setTimeout(resolve, 4000)); // Small delay before processing

            await page.waitForSelector("#MainContent_ddlclassification", {
              timeout: 5000,
            });

            if (survey == 0) {
              continue;
            }
            await page.select("#MainContent_ddlclassification", "1");

            await page.waitForSelector("#MainContent_btnGetDetails", {
              timeout: 5000,
            });
            // Click "Get Details" Button
            await page.click("#MainContent_btnGetDetails");
            console.log('Clicked "Get Details" button.');
            await page.waitForNavigation({ waitUntil: "networkidle2" });

            const result = await page.$eval("#MainContent_lbloextent", (el) => {
              const value = parseFloat(el.textContent.trim());
              console.log("value: " + value);
              return Math.ceil(value * 200); // Round up to nearest integer
            });

            console.log(`Result: ${result}`);

            await page.evaluate(() => window.scrollBy(0, 450));

            await processRows(page, result);
            // Click Save button
            await page.waitForSelector("#MainContent_btnSavedata", {
              timeout: 5000,
            });
            await page.click("#MainContent_btnSavedata");
            console.log("Clicked Save button.");

            // Handle alert dialog safely
            page.once("dialog", async (dialog) => {
              console.log(`Alert Message: ${dialog.message()}`);
              await dialog.accept();
              console.log("Alert closed.");
            });

            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        console.log("Restarting process...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      console.log("Successfully logged in and navigated to the selected page");
      await browser.close();
      break;
    } catch (error) {
      console.error("An error occurred:", error);
      console.log("Restarting the process in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before retrying
    }
  }
})();

async function processRows(page, result) {
  const rows = [
    { crop: "1430", collection: result, arrear: "0" }, // Added arrear field
    { crop: "1431", collection: result },
    { crop: "1432", collection: 0 },
    { crop: "1433", collection: 0 },
    { crop: "1434", collection: 0, checkbox: true },
  ];

  for (const row of rows) {
    // Handle checkbox if present
    if (row.checkbox) {
      await page.evaluate((id) => {
        let el = document.querySelector(`#MainContent_chk${id}`);
        if (el) {
          el.checked = true;
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, row.crop);
      await delay(2000); // Match original delay
    }

    await delay(2000); // Match original delay
    // Select crop nature
    const cropNatureSelector = `#MainContent_ddlcropnature${row.crop}`;
    await page.waitForSelector(cropNatureSelector, {
      visible: true,
      timeout: 5000,
    });
    await page.select(cropNatureSelector, "1");

    await delay(2000); // Match original delay
    // Select water category
    await page.select(`#MainContent_ddlwatercategory${row.crop}`, "1");
    await delay(2000); // Match original delay

    // Handle Arrear Upto input (only for first row)
    if (row.arrear) {
      const arrearInputSelector = `#MainContent_txtArrearUpto${row.crop}`;
      await page.type(arrearInputSelector, row.arrear, { delay: 50 });
      await page.evaluate((id) => {
        let el = document.querySelector(`#MainContent_txtArrearUpto${id}`);
        if (el) {
          el.blur();
          el.dispatchEvent(new Event("blur", { bubbles: true }));
        }
      }, row.crop);
      await delay(2000); // Match original delay
    }
    await delay(2000); // Match original delay

    // Handle Current Demand input with special handling for 1434
    const demandInputSelector = `#MainContent_txtCurrentDemand${row.crop}`;
    if (row.crop === "1434") {
      await page.waitForSelector(demandInputSelector, {
        visible: true,
        timeout: 5000,
      });
      await page.click(demandInputSelector, { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.evaluate((id) => {
        document.querySelector(`#MainContent_txtCurrentDemand${id}`).value = "";
      }, row.crop);
      await delay(2000);
    }
    await page.type(demandInputSelector, result.toString(), { delay: 500 });
    await page.evaluate((id) => {
      let el = document.querySelector(`#MainContent_txtCurrentDemand${id}`);
      if (el) {
        el.blur();
        el.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    }, row.crop);
    await delay(2000); // Match original delay

    // Handle Collection input
    const collectionInputSelector = `#MainContent_txtCollection${row.crop}`;
    await page.type(collectionInputSelector, row.collection.toString(), {
      delay: 500,
    });
    await page.evaluate((id) => {
      let el = document.querySelector(`#MainContent_txtCollection${id}`);
      if (el) {
        el.blur();
        el.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    }, row.crop);
    await delay(2000); // Match original delay
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
