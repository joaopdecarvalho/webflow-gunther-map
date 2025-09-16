# Claude Development Notes

## Project: Webflow Gunther Map - 3D Interactive Map

### Overview
This project implements a 3D interactive map for a Webflow homepage using Three.js, featuring:
- Real-time 3D model loading from Vercel
- Interactive camera controls with OrbitControls
- Professional performance monitoring and debugging tools
- **Development-only POI mapping system** for interactive point placement

### Development Commands
- `npm run dev` - Start Vite development server on http://localhost:8080

### Key Files
- `src/scripts/simple-3d-loader.js` - **Main production script** with development POI mapping features
- `public/Goetheviertel_250812_with-textures_webp25.glb` - Main 3D model (GLB format)

### POI Mapping System (Development Only)
**Controls:**
- `Ctrl+Alt+P` - Toggle POI mapping mode (enables click-to-place)
- `Ctrl+C` - Clear all POI markers (when in mapping mode)
- `togglePOIMapping()` - Console command to enable/disable POI placement
- `clearPOIs()` - Console command to remove all markers
- `exportPOIs()` - Console command to copy POI configuration to clipboard

**Workflow:**
1. Load your dev site with the 3D model
2. Press `Ctrl+Alt+P` to enter POI mapping mode
3. Click directly on the 3D model where you want POIs
4. Red spherical markers will appear at click locations
5. Use `exportPOIs()` to copy configuration to clipboard
6. Use `clearPOIs()` to remove markers and start over

### Model URLs (GitHub CDN)
- Goetheviertel: `https://raw.githubusercontent.com/joaopdecarvalho/webflow-gunther-map/master/public/Goetheviertel_250812.glb`

### Development Features
- **Camera Position Debugging**: Real-time coordinates, target, distance, rotation
- **Copy Camera Position**: One-click copying of camera setup for production
- **Performance Optimization**: Automatic quality adaptation based on device capabilities
- **POI Coordinate Mapping**: Visual click-to-place system for point-of-interest positioning

### Production Integration
For Webflow deployment:
1. Use `src/scripts/simple-3d-loader.js` as the main script
2. Host models on GitHub for CORS-free access
3. Ensure proper z-index layering for UI elements

### Production Cleanup Instructions
**IMPORTANT:** Before deploying to production, remove all POI mapping development code:

**Option 1: Automated Cleanup (Recommended)**
- Remove all code blocks marked with `// DEVELOPMENT ONLY` comments
- Search for `PRODUCTION NOTE:` comments and follow removal instructions

**Option 2: Manual Section Removal**
Remove these specific sections from `simple-3d-loader.js`:

1. **Constructor POI Variables** (lines ~35-46):
```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING SYSTEM
// =============================================================================
// Remove this entire if block
```

2. **Scene Setup POI Initialization** (lines ~828-834):
```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING INITIALIZATION
// =============================================================================
// Remove this entire if block
```

3. **POI Methods** (lines ~1245-1469):
```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING METHODS
// =============================================================================
// Remove this entire section until the next separator
```

4. **Dispose POI Cleanup** (lines ~1170-1176):
```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI CLEANUP
// =============================================================================
// Remove this entire if block
```

5. **Global POI Functions** (lines ~1538-1609):
```javascript
// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING GLOBAL FUNCTIONS
// =============================================================================
// Remove this entire section
```

**Verification:**
- Search for `isDevelopment` - should only appear in `detectDevelopmentMode()` method
- Search for `POI` - should return no results
- Search for `raycaster` - should return no results
- Test that production version works without POI functionality

### Technical Stack
- Three.js r158 with ES6 modules
- GLTF/GLB model support with DRACO compression
- GitHub Pages hosting for 3D models
- Vite development server for local testing

### Notes
- All models use GitHub raw URLs for CORS compatibility
- DRACO decoder hosted on Google's CDN for compression support
- Test interface provides real-time debugging for production setup
- Camera positions can be copied directly from test interface to production code