# Claude Development Notes

## Project: Webflow Gunther Map - 3D Interactive Map

### Overview
This project implements a 3D interactive map for a Webflow homepage using Three.js, featuring:
- Real-time 3D model loading from GitHub
- Interactive camera controls with OrbitControls  
- Professional performance monitoring and debugging tools
- Goetheviertel GLB model support

### Development Commands
- `npm run dev` - Start Vite development server on http://localhost:5173
- Main testing interface: **http://localhost:8080/test-enhanced.html**

### Key Files
- `test-enhanced.html` - **Primary testing interface** with comprehensive controls
- `src/scripts/3d-map-final.js` - Production-ready 3D map implementation
- `public/Goetheviertel_250812.glb` - Main 3D model (GLB format)

### Model URLs (GitHub CDN)
- Goetheviertel: `https://raw.githubusercontent.com/joaopdecarvalho/webflow-gunther-map/master/public/Goetheviertel_250812.glb`

### Testing Features (test-enhanced.html)
- **Load Time Tracking**: Precise millisecond timing for model loading
- **Real-time Camera Position**: Live coordinates, target, distance, rotation
- **Performance Monitoring**: FPS, triangle count, draw calls, memory usage
- **Copy Camera Position**: One-click copying of camera setup for production
- **Multi-panel Interface**: Professional layout for comprehensive testing

### Production Integration
For Webflow deployment:
1. Use `src/scripts/3d-map-final.js` as the main script
2. Host models on GitHub for CORS-free access
3. Copy camera positions from test-enhanced.html for optimal viewing angles
4. Ensure proper z-index layering for UI elements

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