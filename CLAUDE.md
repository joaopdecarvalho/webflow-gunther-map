# Webflow Gunther Map - AI Agent Instructions

## Project Overview

Interactive 3D map system for Webflow integration using Three.js. Features **direct script loading** with environment-aware fallback system and **configuration export workflow** that enables seamless transfer of test interface settings to production Webflow sites with automatic **Vercel** deployment.

## Architecture Pattern

**Direct Script Loading + Configuration System**: Scripts load directly via smart fallback system (localhost → Vercel). The **configuration export workflow** allows `Advanced-3D-Testing-Suite.html` settings to be exported as JSON and consumed in production.

```javascript
// Direct loading with environment-aware fallback
// Try localhost first, then fallback to Vercel
const localUrl = 'http://localhost:8080/src/scripts/simple-3d-loader.js';
const vercelUrl = 'https://webflow-gunther-map.vercel.app/src/scripts/simple-3d-loader.js';

function loadScript(url, fallbackUrl) {
  const script = document.createElement('script');
  script.src = url;

  script.onerror = function() {
    if (fallbackUrl) {
      const fallbackScript = document.createElement('script');
      fallbackScript.src = fallbackUrl;
      document.head.appendChild(fallbackScript);
    }
  };

  document.head.appendChild(script);
}

loadScript(localUrl, vercelUrl);
```

## Development Workflow

* **Primary testing interface:** `webflow-staging-site-files/index.html` (staging page that mirrors Webflow layout/UX)
* **Power testing interface:** `Advanced-3D-Testing-Suite.html` (comprehensive 3D testing with camera copying + configuration export)
* **Configuration export:** Export from testing suite → commit to repo → **Vercel auto‑deploys on push** → production reads new JSON
* **Dev server:** `npm run dev` starts Vite on port 8080 with CORS for Webflow integration
* **Build:** Vite auto‑discovers scripts in `src/scripts/` and builds them as separate entry points
* **Deploy:** Push to GitHub → **Vercel auto‑deploys**. (GitHub Pages is optional as a mirror/backup only.)

## Available MCP Integration

**Claude and other Agents has access to multiple MCP (Model Context Protocol) servers to enhance development capabilities:**

* **Webflow MCP:** Direct integration with Webflow API for component updates, page publishing, and site configuration
* **Playwright MCP:** Automated browser testing, visual regression testing, and end-to-end test scenarios
* **Ref(lightweight) or Context7 MCP:** Up-to-date documentation and code examples for any library or framework

**Usage Guidelines:**
- Leverage Webflow MCP for direct site management operations
- Use Playwright MCP for comprehensive testing workflows and browser automation
- Access Ref or Context7 for real-time library documentation and implementation examples
- Combine multiple MCPs for complex workflows (e.g., update Webflow site → test with Playwright)

## Configuration Export System

* **Export workflow:** Test Interface → Export JSON → commit to `/src/config/` → Vercel deploy
* **JSON format:** Includes camera, lighting, animations, performance, UI, and accessibility settings
* **Hot‑reloading:** Production scripts fetch updated configurations from Vercel
* **Validation:** Configuration includes fallbacks and validation for production safety

## 3D Map Implementation (`src/scripts/simple-3d-loader.js`)

* **CDN‑first approach:** Loads Three.js r158 from CDN with fallback error handling
* **Vercel‑hosted models:** Uses Vercel URLs for GLTF/GLB files with DRACO compression
* **Dynamic configuration loading:** Fetches settings from the environment‑appropriate configuration endpoint
* **Camera system:** OrbitControls with configurable positions, distances, and constraints
* **Performance monitoring:** Built‑in FPS tracking, triangle counting, and optimization
* **Accessibility features:** Motion preference detection, keyboard controls, ARIA labels
* **Security:** Input validation, CSP compliance, and graceful error handling
* **Phase 1 Lazy Loading:** Intelligent loading triggers (viewport intersection, user interaction) with loading states and error handling

```javascript
// Model URLs pattern - Vercel for production, local for dev
this.modelUrls = {
  goetheviertel: isLocal
    ? 'http://localhost:8080/Goetheviertel_250812_with-textures_webp25.glb'
    : 'https://webflow-gunther-map.vercel.app/Goetheviertel_250812_with-textures_webp25.glb'
};

// Configuration loading (env‑aware)
await this.loadConfiguration(configUrl);
```

## Webflow Integration

* **Head code injection:** Use `webflow-production-embed-enhanced.html` in Webflow Site Settings → Custom Code → Head
* **Direct loading:** Script automatically loads `simple-3d-loader.js` with localhost → Vercel fallback
* **Environment detection:** Automatically uses localhost in development, Vercel in production
* **No configuration needed:** Works seamlessly across all environments

## Key Files & Patterns

* `src/scripts/simple-3d-loader.js`: Main script for loading 3D models and handling interactions
* `webflow-production-embed-enhanced.html`: Production embed code with direct script loading and fallback
* `webflow-staging-site-files/index.html`: **Staging site** for testing Webflow integration (primary testing surface)
* `Advanced-3D-Testing-Suite.html`: Development interface with real‑time camera position copying and configuration export
* `vite.config.js`: Auto‑discovery of scripts, CORS headers for Webflow, models endpoint
* `public/`: 3D models (served locally in dev, via Vercel in prod)
* `/src/config/`: Configuration files (local in dev, Vercel in prod)
* `.github/workflows/deploy.yml`: Optional GitHub Pages mirror (not required for Vercel)

## Adding New Scripts

1. Create file in `src/scripts/scriptname.js`
2. Update `webflow-production-embed-enhanced.html` to load your new script directly
3. Vite automatically includes in build — no manual configuration needed

## Configuration JSON Format

Production scripts load dynamic configurations (local in dev / Vercel in prod):

```json
{
  "version": "1.0.0",
  "camera": { "position": [0, 0, 100], "target": [0, 0, 0], "distance": 100, "fov": 75 },
  "lighting": { "ambient": {"color": "#ffffff", "intensity": 0.4} },
  "performance": { "qualityLevel": "high", "targetFPS": 60 },
  "accessibility": { "respectMotionPreference": true, "keyboardControls": true },
  "lazyLoading": {
    "enabled": true,
    "triggers": {
      "viewport": true,
      "userInteraction": true,
      "delay": false
    },
    "delay": 2000
  }
}
```

## Phase 1 Lazy Loading Implementation

**Intelligent Loading System**: The 3D loader now supports multiple loading triggers to optimize performance and user experience:

### Loading Triggers

* **Viewport Intersection**: Uses IntersectionObserver to detect when the 3D container enters the viewport
* **User Interaction**: Responds to clicks, hover, touch, and keyboard interactions
* **Delay Timer**: Optional delay-based loading after a specified time
* **Manual Trigger**: Programmatic loading via `loader.load()` method

### Loading States & UI

* **Pending**: Shows animated loading placeholder with spinner
* **Loading**: Updates progress during model download with percentage
* **Loaded**: Removes placeholder and shows final 3D scene
* **Error**: Displays user-friendly error state with retry button

### Configuration

```javascript
// Enable/disable lazy loading
this.lazyLoadingEnabled = true;

// Configure triggers
this.loadTriggers = {
  viewport: true,      // Load when container enters viewport
  userInteraction: true, // Load on first user interaction
  delay: false,        // Load after delay (requires delay config)
  manual: false        // Manual loading only
};

// Manual trigger example
window.simple3DLoader.load();
```

# Claude Development Notes

## Project: Webflow Gunther Map - 3D Interactive Map

### Overview

This project implements a 3D interactive map for a Webflow homepage using Three.js, featuring:

* Real‑time 3D model loading (local in dev, **Vercel** in production)
* Interactive camera controls with OrbitControls
* Professional performance monitoring and debugging tools
* **Development‑only POI mapping system** for interactive point placement

### Development Commands

* `npm run dev` — Start Vite development server on [http://localhost:8080](http://localhost:8080)

### Key Files

* `src/scripts/simple-3d-loader.js` — **Main production script** with development POI mapping features
* `public/Goetheviertel_250812_with-textures_webp25.glb` — Main 3D model (GLB format)

### POI Mapping System (Development Only)

**Controls:**

* `Ctrl+Alt+P` — Toggle POI mapping mode (enables click‑to‑place)
* `Ctrl+C` — Clear all POI markers (when in mapping mode)
* `togglePOIMapping()` — Console command to enable/disable POI placement
* `clearPOIs()` — Console command to remove all markers
* `exportPOIs()` — Console command to copy POI configuration to clipboard

**Workflow:**

1. Load your dev site with the 3D model
2. Press `Ctrl+Alt+P` to enter POI mapping mode
3. Click directly on the 3D model where you want POIs
4. Red spherical markers will appear at click locations
5. Use `exportPOIs()` to copy configuration to clipboard
6. Use `clearPOIs()` to remove markers and start over

### Model URLs (Vercel CDN)

* Goetheviertel: `https://webflow-gunther-map.vercel.app/Goetheviertel_250812_with-textures_webp25.glb`

### Development Features

* **Camera Position Debugging:** Real‑time coordinates, target, distance, rotation
* **Copy Camera Position:** One‑click copying of camera setup for production
* **Performance Optimization:** Automatic quality adaptation based on device capabilities
* **POI Coordinate Mapping:** Visual click‑to‑place system for point‑of‑interest positioning

### Production Integration

For Webflow deployment:

1. Use `src/scripts/simple-3d-loader.js` as the main script
2. Host models on Vercel for CORS‑free access (dev uses local `public/`)
3. Ensure proper z‑index layering for UI elements

### Production Cleanup Instructions

**IMPORTANT:** Before deploying to production, remove all POI mapping development code:

**Option 1: Automated Cleanup (Recommended)**

* Remove all code blocks marked with `// DEVELOPMENT ONLY` comments
* Search for `PRODUCTION NOTE:` comments and follow removal instructions

**Option 2: Manual Section Removal**
Remove these specific sections from `simple-3d-loader.js`:

1. **Constructor POI Variables** (lines \~35–46):

```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING SYSTEM
// =============================================================================
// Remove this entire if block
```

2. **Scene Setup POI Initialization** (lines \~828–834):

```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING INITIALIZATION
// =============================================================================
// Remove this entire if block
```

3. **POI Methods** (lines \~1245–1469):

```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING METHODS
// =============================================================================
// Remove this entire section until the next separator
```

4. **Dispose POI Cleanup** (lines \~1170–1176):

```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI CLEANUP
// =============================================================================
// Remove this entire if block
```

5. **Global POI Functions** (lines \~1538–1609):

```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING GLOBAL FUNCTIONS
// =============================================================================
// Remove this entire section
```

**Verification:**

* Search for `isDevelopment` — should only appear in `detectDevelopmentMode()` method
* Search for `POI` — should return no results
* Search for `raycaster` — should return no results
* Test that production version works without POI functionality

### Technical Stack

* Three.js r158 with ES6 modules
* GLTF/GLB model support with DRACO compression
* Vercel hosting for 3D models (local in dev)
* Vite development server for local testing

### Notes

* DRACO decoder hosted on Google's CDN for compression support
* Staging page (`webflow-staging-site-files/index.html`) provides real‑time debugging with near‑production UI parity
* Camera positions can be copied directly from test interface to configuration JSON
