import { chromium } from 'playwright';

async function testWebsite() {
  // Launch browser maximized
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: null
  });
  const page = await context.newPage();
  
  // Maximize the browser window
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('Navigating to test-enhanced.html...');
    
    // Navigate to your test page
    await page.goto('http://127.0.0.1:8081/test-enhanced.html');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get page content information
    const content = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const canvasElements = document.querySelectorAll('canvas');
      const buttons = document.querySelectorAll('button');
      const panels = document.querySelectorAll('.debug-panel, .panel');
      
      return {
        h1Text: h1 ? h1.textContent : 'No h1 found',
        canvasCount: canvasElements.length,
        buttonCount: buttons.length,
        panelCount: panels.length,
        bodyClasses: document.body.className,
        hasThreeJs: typeof window.THREE !== 'undefined'
      };
    });
    
    console.log('Page analysis:');
    console.log('- Title:', content.h1Text);
    console.log('- Canvas elements:', content.canvasCount);
    console.log('- Buttons found:', content.buttonCount);
    console.log('- Debug panels:', content.panelCount);
    console.log('- Body classes:', content.bodyClasses);
    console.log('- Three.js loaded:', content.hasThreeJs);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'website-screenshot.png', 
      fullPage: true 
    });
    console.log('Screenshot saved as website-screenshot.png');
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Wait a bit more to see the 3D content load
    console.log('Waiting for 3D content to load...');
    await page.waitForTimeout(5000);
    
    // Check if 3D models loaded
    const modelInfo = await page.evaluate(() => {
      // Look for performance info or 3D indicators
      const perfElements = document.querySelectorAll('[class*="perf"], [class*="performance"], [class*="fps"]');
      const cameraElements = document.querySelectorAll('[class*="camera"], [class*="position"]');
      
      return {
        performanceElements: perfElements.length,
        cameraElements: cameraElements.length,
        canvasPresent: document.querySelector('canvas') !== null
      };
    });
    
    console.log('3D Model info:');
    console.log('- Performance elements:', modelInfo.performanceElements);
    console.log('- Camera elements:', modelInfo.cameraElements);
    console.log('- Canvas present:', modelInfo.canvasPresent);
    
    // Keep browser open for 10 seconds to see the 3D map
    console.log('Browser will stay open for 10 seconds to view the 3D map...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error testing website:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testWebsite().catch(console.error);