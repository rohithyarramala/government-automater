const puppeteer = require("puppeteer");

(async () => {
  while (true) {
    try {
      const browser = await puppeteer.launch({ headless: false }); // Headless mode
      const page = await browser.newPage();

      // Navigate to login page
      await page.goto("https://webland.ap.gov.in/", {
        waitUntil: "networkidle2",
      });

      // Fill in login form
      await page.type("#useID", "dtcheruk");
      await page.type("#pqrabc", "Santhi#123");
      await page.select("#ddlDist", "21");

      // Click login button
      await page.click("#btnLogin");
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      await page.reload({ waitUntil: "networkidle2" });

      // Navigate to Water Tax Verification
      await page.evaluate(() => {
        let element = document.querySelector('li[rel="WT"]');
        if (element) element.click();
      });

      await page.evaluate(() => {
        let link = document.querySelector(
          'a[href="WatertaxDTverification.aspx"]'
        );
        if (link) link.click();
      });

      await page.waitForNavigation({ waitUntil: "networkidle2" });
      console.log("Main task starts");

      while (true) {
        console.log("Starting new cycle...");
        await page.select("#MainContent_ddlvill", "2109005");

        let khataFound = false;

        while (!khataFound) {
          console.log("Selecting Khata Number...");
          await page.waitForSelector("#MainContent_ddlkhtas");

          // Get all valid 3 or 4-digit Khata numbers
          const khataOptions = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll("#MainContent_ddlkhtas option")
            )
              .map((o) => o.value);
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

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay before checking surveys

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

            await page.waitForSelector("#MainContent_btnGetDetails", {
              timeout: 5000,
            });
            // Click "Get Details" Button
            await page.click("#MainContent_btnGetDetails");
            console.log('Clicked "Get Details" button.');
            await page.waitForNavigation({ waitUntil: "networkidle2" });

            // Click the edit checkbox
            // await page.waitForSelector("#MainContent_Chkedit");
            // await page.click("#MainContent_Chkedit");
            // await page.waitForNavigation({ waitUntil: "networkidle2" });

            // await page.evaluate(() => window.scrollBy(0, 100));

            // // Wait for and check all checkboxes
            // await page.waitForSelector('[id^="MainContent_chk"]');

            // while (true) {
            //   const checkboxes = await page.$$(
            //     'input[id^="MainContent_chk"]:not(:checked)'
            //   );
            //   if (checkboxes.length === 0) break;

            //   const checkbox = checkboxes[0];
            //   await checkbox.evaluate((el) =>
            //     el.scrollIntoView({ behavior: "smooth", block: "center" })
            //   );
            //   await new Promise((resolve) => setTimeout(resolve, 2000));
            //   await checkbox.click();

            //   await page
            //     .waitForNavigation({ waitUntil: "networkidle2" })
            //     .catch(() => {});
            //   await new Promise((resolve) => setTimeout(resolve, 2000));
            // }

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
