const path = require("path");
const puppeteer = require("puppeteer");

async function exportBatch() {
  const browser = await puppeteer.launch();

  for (let index = 1; index <= 5; index += 1) {
    const id = String(index).padStart(2, "0");
    const page = await browser.newPage();

    await page.setViewport({
      width: 1080,
      height: 1080,
      deviceScaleFactor: 1,
    });

    await page.goto(`file://${path.join(__dirname, `post-${id}.html`)}`, {
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
      throw new Error(`Could not find .canvas in post-${id}.html`);
    }

    await page.screenshot({
      path: path.join(__dirname, `post-${id}.png`),
      clip: {
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
      },
    });

    await page.close();
    console.log(`post-${id}.png created`);
  }

  await browser.close();
}

exportBatch().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
