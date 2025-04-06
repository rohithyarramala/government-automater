const { spawn } = require("child_process");

const maxParallelWorkers = 10; // Adjust this to control parallel execution
const totalInstances = 5; // Total number of scraper instances to run
const childProcesses = new Set();

function runScraper() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["vro-automator-v2-large.js"], {
      stdio: "inherit", // Inherit standard output for real-time logs
    });

    childProcesses.add(child);

    child.on("exit", (code) => {
      childProcesses.delete(child);
      if (code !== 0) {
        console.error(`Scraper instance exited with code ${code}`);
        reject(new Error(`Scraper instance failed`));
      } else {
        console.log(`Scraper instance completed.`);
        resolve();
      }
    });

    child.on("error", reject);
  });
}

async function runParallelScrapers() {
  let activeWorkers = [];

  for (let i = 0; i < totalInstances; i++) {
    if (activeWorkers.length >= maxParallelWorkers) {
      await Promise.all(activeWorkers); // Wait for one batch to complete
      activeWorkers = [];
    }

    console.log(`Starting scraper instance ${i + 1}`);
    activeWorkers.push(runScraper());
  }

  await Promise.all(activeWorkers);
}

// Graceful shutdown for all scrapers
function shutdown() {
  console.log("\nStopping all scraper instances...");
  for (const child of childProcesses) {
    child.kill("SIGTERM"); // Kill each running scraper
  }
  process.exit(0);
}

process.on("SIGINT", shutdown); // Handle Ctrl+C
process.on("SIGTERM", shutdown); // Handle termination signals

runParallelScrapers().catch(console.error);
