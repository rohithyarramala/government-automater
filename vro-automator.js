const puppeteer = require("puppeteer");

(async () => {
  while (true) {
    try {
      const browser = await puppeteer.launch({
        headless: false,
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
          console.log("Selecting Khata Number...");
          // await page.waitForSelector("#MainContent_ddlkhtas");

          // Get all valid 3 or 4-digit Khata numbers
          const khataOptions = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll("#MainContent_ddlkhtas option")
            )
              .map((o) => o.value)
              .filter((value) => /^\d{4}$/.test(value));
          });

          if (khataOptions.length === 0) {
            console.log("No valid Khata Numbers found. Retrying...");
            continue;
          }

          const selectedKhata =
            khataOptions[Math.floor(Math.random() * khataOptions.length)];
          await page.select("#MainContent_ddlkhtas", selectedKhata);
          console.log(`Selected Khata: ${selectedKhata}`);

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

            // 1 st row
            var selector = `#MainContent_ddlcropnature1430`;

            await page.waitForSelector(selector, {
              visible: true,
              timeout: 5000,
            });
            await page.select(selector, "1");

            await page.select(`#MainContent_ddlwatercategory1430`, "1");

            await page.type("#MainContent_txtArrearUpto1430", "0", {
              delay: 50,
            });

            await page.evaluate(() => {
              let el = document.querySelector("#MainContent_txtArrearUpto1430");
              if (el) el.blur(); // Remove focus
            });
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            await page.type(
              "#MainContent_txtCurrentDemand1430",
              result.toString(),
              {
                delay: 50,
              }
            );

            await page.evaluate(() => {
              let el = document.querySelector(
                "#MainContent_txtCurrentDemand1430"
              );
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing
            await page.type(
              "#MainContent_txtCollection1430",
              result.toString(),
              {
                delay: 50,
              }
            );

            await page.evaluate(() => {
              let el = document.querySelector("#MainContent_txtCollection1430");
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            // 2 nd row

            var selector = `#MainContent_ddlcropnature1431`;
            await page.waitForSelector(selector, {
              visible: true,
              timeout: 5000,
            });
            await page.select(selector, "1");

            await page.select(`#MainContent_ddlwatercategory1431`, "1");

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            await page.type(
              "#MainContent_txtCurrentDemand1431",
              result.toString(),
              {
                delay: 50,
              }
            );

            await page.evaluate(() => {
              let el = document.querySelector(
                "#MainContent_txtCurrentDemand1431"
              );
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing
            await page.type(
              "#MainContent_txtCollection1431",
              result.toString(),
              {
                delay: 50,
              }
            );

            await page.evaluate(() => {
              let el = document.querySelector("#MainContent_txtCollection1431");
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            // 3 rd row
            var selector = `#MainContent_ddlcropnature1432`;
            await page.waitForSelector(selector, {
              visible: true,
              timeout: 5000,
            });
            await page.select(selector, "1");

            await page.select(`#MainContent_ddlwatercategory1432`, "1");

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            await page.type(
              "#MainContent_txtCurrentDemand1432",
              result.toString(),
              {
                delay: 50,
              }
            );

            await page.evaluate(() => {
              let el = document.querySelector(
                "#MainContent_txtCurrentDemand1432"
              );
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing
            await page.type("#MainContent_txtCollection1432", "0", {
              delay: 50,
            });

            await page.evaluate(() => {
              let el = document.querySelector("#MainContent_txtCollection1432");
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            // 4 th row

            var selector = `#MainContent_ddlcropnature1433`;
            await page.waitForSelector(selector, {
              visible: true,
              timeout: 5000,
            });
            await page.select(selector, "1");

            await page.select(`#MainContent_ddlwatercategory1433`, "1");

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            await page.type(
              "#MainContent_txtCurrentDemand1433",
              result.toString(),
              {
                delay: 50,
              }
            );

            await page.evaluate(() => {
              let el = document.querySelector(
                "#MainContent_txtCurrentDemand1433"
              );
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing
            await page.type("#MainContent_txtCollection1433", "0", {
              delay: 50,
            });

            await page.evaluate(() => {
              let el = document.querySelector("#MainContent_txtCollection1433");
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing
            // 5 th row
            //
            await page.evaluate(() => {
              let el = document.querySelector("#MainContent_chk1434");
              if (el) {
                el.checked = true; // Force tick
                el.dispatchEvent(new Event("change", { bubbles: true })); // Trigger JS event
              }
            });
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing


            var selector = `#MainContent_ddlcropnature1434`;
            await page.waitForSelector(selector, {
              visible: true,
              timeout: 5000,
            });
            await page.select(selector, "1");

            await page.select(`#MainContent_ddlwatercategory1434`, "1");

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing

            await page.waitForSelector("#MainContent_txtCurrentDemand1434", {
              visible: true,
              timeout: 5000,
            });

            await page.click("#MainContent_txtCurrentDemand1434", {
              clickCount: 3,
            }); // Select existing text
            await page.keyboard.press("Backspace"); // Clear old value
            await page.evaluate(
              () =>
                (document.querySelector(
                  "#MainContent_txtCurrentDemand1434"
                ).value = "")
            ); // Force clear
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing


            await page.type(selector, result.toString(), { delay: 50 }); // Enter new value

            await page.evaluate(() => {
              let el = document.querySelector(
                "#MainContent_txtCurrentDemand1434"
              );
              if (el) el.blur(); // Remove focus
            });

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Small delay before processing


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
