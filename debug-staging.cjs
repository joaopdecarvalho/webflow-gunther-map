// Debug script for staging site
const puppeteer = require('puppeteer');

async function debugStagingSite() {
  console.log('🔍 Starting staging site diagnostics...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type() === 'warning' ? '⚠️' : msg.type() === 'error' ? '❌' : '📝';
    console.log(`${type} CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Listen to failed requests
  page.on('requestfailed', request => {
    console.log(`❌ FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
  });
  
  // Listen to successful requests
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (url.includes('localhost:8080')) {
      const icon = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${icon} ${status}: ${url}`);
    }
  });
  
  try {
    console.log('🚀 Navigating to staging site...');
    await page.goto('http://localhost:8080/webflow-staging-site-files/index.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ Page loaded successfully');
    
    // Check if the container exists
    const containerExists = await page.$('#webgl-container');
    console.log(`📦 WebGL Container: ${containerExists ? 'EXISTS' : 'NOT FOUND'}`);
    
    // Check if scripts are loaded
    const scripts = await page.$$eval('script[data-script-id]', scripts => 
      scripts.map(s => s.dataset.scriptId)
    );
    console.log(`📜 Loaded Scripts: ${scripts.length > 0 ? scripts.join(', ') : 'NONE'}`);
    
    // Check for Three.js
    const threeJsLoaded = await page.evaluate(() => typeof window.THREE !== 'undefined');
    console.log(`🎮 Three.js: ${threeJsLoaded ? 'LOADED' : 'NOT LOADED'}`);
    
    // Check for WebGL context
    const webglSupported = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    });
    console.log(`🎨 WebGL Support: ${webglSupported ? 'YES' : 'NO'}`);
    
    // Wait a bit to see if anything loads
    console.log('⏳ Waiting 5 seconds for scripts to initialize...');
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'staging-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as staging-debug.png');
    
    // Check final state
    const finalCheck = await page.evaluate(() => {
      const container = document.querySelector('#webgl-container');
      return {
        containerHTML: container ? container.innerHTML.substring(0, 200) + '...' : 'NO CONTAINER',
        hasCanvas: !!container?.querySelector('canvas'),
        windowObjects: Object.keys(window).filter(key => 
          key.includes('webflow') || 
          key.includes('THREE') || 
          key.includes('scene') ||
          key.includes('3d')
        )
      };
    });
    
    console.log('\n📊 FINAL STATE:');
    console.log('Container HTML:', finalCheck.containerHTML);
    console.log('Has Canvas:', finalCheck.hasCanvas);
    console.log('Window Objects:', finalCheck.windowObjects);
    
    console.log('\n✨ Diagnosis complete! Check the console output above for issues.');
    console.log('The browser will stay open for manual inspection. Close it when done.');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(300000); // 5 minutes
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  } finally {
    await browser.close();
  }
}

debugStagingSite().catch(console.error);