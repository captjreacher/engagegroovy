const path = require("path");
const puppeteer = require("puppeteer");

async function exportPng() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({
    width: 1080,
    height: 1080,
    deviceScaleFactor: 1,
  });

  await page.goto(`file://${path.join(__dirname, "post-preview.html")}`, {
    waitUntil: "networkidle0",
  });

  await page.addStyleTag({
    content: `
      body {
        padding: 0 !important;
        overflow: hidden !important;
      }
    `,
  });

  const canvas = await page.$(".canvas");
  if (!canvas) {
    throw new Error("Could not find .canvas in post-preview.html");
  }

  await page.screenshot({
    path: path.join(__dirname, "output.png"),
    clip: {
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
    },
  });

  await browser.close();
  console.log("output.png created");
}

exportPng().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
