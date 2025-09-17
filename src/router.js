// Environment Detection and Script Loading System
// Automatically detects dev vs production and loads appropriate scripts

// Environment detection
const isLocal = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);

const baseUrl = isLocal
  ? 'http://localhost:8080/src'
  : 'https://webflow-gunther-map.vercel.app/src';

// Configuration source (local in dev, Vercel in prod)
const configUrl = isLocal
  ? 'http://localhost:8080/src/config/3d-config.json'
  : 'https://webflow-gunther-map.vercel.app/src/config/3d-config.json';

// Optional: override for experiments
// window.SCRIPT_BASE_URL = 'http://localhost:8080/src' // or Vercel URL to force prod

function getBaseUrl() {
  // Check for manual override first
  if (window.SCRIPT_BASE_URL) {
    return window.SCRIPT_BASE_URL;
  }
  return baseUrl;
}

// Script loader utility
const loadScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    const existingScript = document.querySelector(`script[data-script-id="${scriptPath}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    const fullUrl = `${getBaseUrl()}/scripts/${scriptPath}`;
    
    script.src = fullUrl;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-script-id', scriptPath);
    script.setAttribute('crossorigin', 'anonymous');
    
    script.onload = () => {
      console.log(`✅ Script loaded: ${scriptPath}`);
      resolve();
    };
    
    script.onerror = (error) => {
      console.error(`❌ Failed to load script: ${scriptPath}`, error);
      reject(new Error(`Failed to load script: ${scriptPath}`));
    };
    
    document.head.appendChild(script);
  });
};

// Global scripts (loaded on every page)
window.globalScripts = [
  // Add any scripts that should load on every page
];

// Page-specific scripts
window.pageScripts = {
  // Homepage detection - load 3D map
  '/': ['simple-3d-loader.js'],
  'home': ['simple-3d-loader.js'],
  'index': ['simple-3d-loader.js']
};

// Auto-detect homepage and load appropriate scripts
function detectAndLoadScripts() {
  const currentPath = window.location.pathname;
  const isHomepage = currentPath === '/' || currentPath === '' || currentPath === '/index.html';
  
  // Load global scripts first
  const globalPromises = (window.globalScripts || []).map(script => loadScript(script));
  
  // Load page-specific scripts
  let pagePromises = [];
  if (isHomepage) {
    pagePromises = (window.pageScripts['/'] || []).map(script => loadScript(script));
  }
  
  // Wait for all scripts to load
  Promise.all([...globalPromises, ...pagePromises])
    .then(() => {
      console.log('🚀 All scripts loaded successfully');
    })
    .catch((error) => {
      console.error('❌ Error loading scripts:', error);
    });
}

// Initialize router when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectAndLoadScripts);
} else {
  detectAndLoadScripts();
}

// Export for debugging
window.scriptRouter = {
  getBaseUrl,
  loadScript,
  configUrl,
  isLocal,
  detectAndLoadScripts
};