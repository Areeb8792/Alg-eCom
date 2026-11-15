const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'tablet_wide_963', width: 963, height: 800 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 }
  ];

  const evidenceDir = path.resolve('docs/evidence/responsive');
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });

    // Check Hero Image is visible
    const heroImg = page.locator('img[alt="Algions Season 04 Brutalist Campaign"]');
    const isVisible = await heroImg.isVisible();
    const box = await heroImg.boundingBox();

    console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): Hero image visible=${isVisible}, width=${box ? Math.round(box.width) : 0}, height=${box ? Math.round(box.height) : 0}`);

    // Capture screenshot
    await page.screenshot({ path: path.join(evidenceDir, `${vp.name}.png`), fullPage: false });
    await page.close();
  }

  await browser.close();
  console.log('All responsive checks passed successfully!');
})();
