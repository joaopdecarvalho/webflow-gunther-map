# 🚨 **URGENT FIX for Webflow Integration**

## **Issue Identified**
Your Webflow site is loading the old `3d-map.js` script instead of the production-ready `3d-map-final.js` script. This is causing Three.js CDN loading issues and the `updateStatus` reference error.

## **✅ IMMEDIATE SOLUTION**

### **Step 1: Update Your Webflow Embed Code**

**Replace the current embed code in your Webflow site with this corrected version:**

Go to: **Site Settings → Custom Code → Head Code** and replace with:

```html
<!-- CORRECTED Webflow Embed Code - Uses 3d-map-final.js -->
<script>
(function() {
  // Configuration URL for hot-reloading
  const configUrl = 'https://joaopdecarvalho.github.io/webflow-gunther-map/config/3d-config.json';
  
  // UNCOMMENT the next line to force PRODUCTION mode (test before going live!)
  // window.SCRIPT_BASE_URL = 'https://joaopdecarvalho.github.io/webflow-gunther-map/src';
  
  const isDev = location.hostname.includes('.webflow.io');
  const baseUrl = window.SCRIPT_BASE_URL || (isDev 
    ? 'http://localhost:8080/src' 
    : 'https://joaopdecarvalho.github.io/webflow-gunther-map/src');
  
  let configCheckInterval;
  
  async function checkForConfigUpdates() {
    try {
      const response = await fetch(configUrl + '?v=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const lastModified = response.headers.get('Last-Modified') || response.headers.get('ETag');
      const storedVersion = localStorage.getItem('3d-config-last-modified');
      
      if (lastModified && lastModified !== storedVersion) {
        console.log('🔄 New configuration detected, updating...');
        localStorage.setItem('3d-config-last-modified', lastModified);
        showConfigUpdateIndicator();
        if (window.webflow3DScene && window.webflow3DScene.reload) {
          window.webflow3DScene.reload();
        }
      }
    } catch (error) {
      console.log('Configuration check failed (normal if offline):', error.message);
    }
  }
  
  function showConfigUpdateIndicator() {
    const existing = document.getElementById('webflow-3d-update-indicator');
    if (existing) existing.remove();
    
    const indicator = document.createElement('div');
    indicator.id = 'webflow-3d-update-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        cursor: pointer;
        user-select: none;
      " onclick="this.parentElement.remove()">
        ✨ 3D Configuration Updated
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          Click to dismiss
        </div>
      </div>
    `;
    document.body.appendChild(indicator);
    setTimeout(() => {
      const elem = document.getElementById('webflow-3d-update-indicator');
      if (elem) elem.remove();
    }, 5000);
  }
  
  function initConfigMonitoring() {
    checkForConfigUpdates();
    configCheckInterval = setInterval(checkForConfigUpdates, 30000);
    window.addEventListener('beforeunload', () => {
      if (configCheckInterval) clearInterval(configCheckInterval);
    });
  }
  
  window.globalScripts = ['alert'];
  
  // 🔥 FULL 3D MAP: Use real GLTF model version
  const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
  if (isHomePage) {
    window.pageScripts = ['3d-map-final'];  // ✅ REAL MAP: Use full version with GLTF models
    window.pageStyles = ['3d-map'];
    setTimeout(initConfigMonitoring, 2000);
  }
  
  window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('webflow-gunther-map')) {
      const container = document.querySelector('#webgl-container') || 
                       document.querySelector('.w-webgl-container') ||
                       document.querySelector('[data-webgl-container]');
      
      if (container && (event.error?.message?.includes('WebGL') || 
          event.error?.message?.includes('Three') ||
          event.error?.message?.includes('3d-map'))) {
        container.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            text-align: center;
            border-radius: 12px;
            padding: 40px 20px;
          ">
            <div>
              <div style="font-size: 48px; margin-bottom: 20px;">🏗️</div>
              <div style="font-size: 24px; font-weight: 600; margin-bottom: 12px;">
                3D Experience Loading...
              </div>
              <div style="font-size: 16px; opacity: 0.9;">
                The interactive map will appear here shortly
              </div>
            </div>
          </div>
        `;
      }
    }
  });
  
  const script = document.createElement('script');
  script.src = baseUrl + '/router.js';
  script.onerror = () => console.warn('Failed to load 3D map scripts.');
  document.head.appendChild(script);
})();
</script>
```

### **Step 2: Save and Test**
1. **Save** the changes in Webflow
2. **Publish** your site
3. Refresh `https://go-goethe-quartier-ebde32.webflow.io/`
4. Check browser console - should now load `3d-map-final.js` instead of `3d-map.js`

## **🔍 What Was Wrong**
- Your embed code was loading `window.pageScripts = ['3d-map']`
- This loaded the old `3d-map.js` which has CDN loading issues
- The correct script is `3d-map-final.js` which has better error handling

## **✅ Expected Result After Fix**
- ✅ No more `updateStatus is not defined` error
- ✅ Three.js CDN should load properly
- ✅ 3D scene should initialize in the `#webgl-container`
- ✅ Console should show "Map3D constructor called"

## **🧪 Test Commands (After Fix)**
Run in browser console on your Webflow site:
```javascript
// Check script status
console.log({
  pageScripts: window.pageScripts,
  threeJsLoaded: typeof THREE !== 'undefined',
  map3dLoaded: typeof window.Map3D !== 'undefined',
  containerExists: !!document.querySelector('#webgl-container')
});
```

**This should fix the immediate loading issues. Let me know once you've updated the embed code!**