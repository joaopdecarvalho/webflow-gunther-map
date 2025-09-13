# Webflow Gunther Map - AI Agent Instructions

## Project Overview
Interactive 3D map system for Webflow integration using Three.js. Features dual-environment script router with **configuration export system** that enables seamless transfer of test interface settings to production Webflow sites with automatic GitHub Pages deployment.

## Architecture Pattern
**Script Router + Configuration System**: All scripts load through `src/router.js` with environment detection. The new **configuration export workflow** allows `test-enhanced.html` settings to be exported as JSON and automatically deployed to production via GitHub Pages.

```javascript
// Environment detection in router.js
const isDev = location.hostname.includes('.webflow.io');
const baseUrl = isDev ? 'http://localhost:8080/src' : 'https://joaopdecarvalho.github.io/webflow-gunther-map/src';
// Configuration loading from GitHub Pages
const configUrl = 'https://joaopdecarvalho.github.io/webflow-gunther-map/config/3d-config.json';
```

## Development Workflow
- **Primary testing interface**: `test-enhanced.html` (comprehensive 3D testing suite with animation controls and configuration export)
- **Configuration export**: Export settings from test interface → commit to GitHub → auto-deploy to Webflow
- **Dev server**: `npm run dev` starts Vite on port 8080 with CORS for Webflow integration
- **Build**: Vite automatically discovers all scripts in `src/scripts/` and builds them as separate entry points
- **Deploy**: GitHub Actions auto-deploys to GitHub Pages on push to main branch (includes configuration files)

## Configuration Export System
- **Export workflow**: Test Interface → Export JSON → Commit to `/config/` → GitHub Pages deployment
- **JSON format**: Includes camera, lighting, animations, performance, UI, and accessibility settings
- **Hot-reloading**: Production scripts dynamically load updated configurations from GitHub Pages CDN
- **Validation**: Configuration includes fallbacks and validation for production safety

## 3D Map Implementation (`src/scripts/3d-map-final.js`)
- **CDN-first approach**: Loads Three.js r158 from CDN with fallback error handling
- **GitHub-hosted models**: Uses raw GitHub URLs for GLTF/GLB files with DRACO compression
- **Dynamic configuration loading**: Fetches settings from GitHub Pages configuration endpoint
- **Camera system**: OrbitControls with configurable positions, distances, and constraints
- **Performance monitoring**: Built-in FPS tracking, triangle counting, and optimization
- **Accessibility features**: Motion preference detection, keyboard controls, ARIA labels
- **Security**: Input validation, CSP compliance, and graceful error handling

```javascript
// Model URLs pattern - always use GitHub raw URLs for CORS
this.modelUrls = {
  goetheviertel: 'https://raw.githubusercontent.com/joaopdecarvalho/webflow-gunther-map/master/public/Goetheviertel_250812.glb'
};
// Configuration loading from GitHub Pages
await this.loadConfiguration('https://joaopdecarvalho.github.io/webflow-gunther-map/config/3d-config.json');
```

## Webflow Integration
- **Head code injection**: Use `webflow-embed-code.html` in Webflow Site Settings → Custom Code → Head
- **Page-specific loading**: Router detects homepage and loads `3d-map` script automatically
- **Global scripts**: Defined in `window.globalScripts` array (loads on every page)
- **Production toggle**: Uncomment `window.SCRIPT_BASE_URL` line to force production mode during testing

## Key Files & Patterns
- `src/router.js`: Core script loader - handles environment switching and script discovery
- `test-enhanced.html`: Development interface with real-time camera position copying and configuration export
- `.docs/webflow-integration-plan.md`: Complete implementation plan with 9 phases and 50+ tasks
- `vite.config.js`: Auto-discovery of scripts, CORS headers for Webflow, models endpoint
- `public/`: 3D models hosted via GitHub Pages for CORS-free access
- `/config/`: Configuration files deployed to GitHub Pages for production use
- `.github/workflows/deploy.yml`: Auto-deployment pipeline to GitHub Pages

## Critical Development Notes
1. **Follow the integration plan**: Use `.docs/webflow-integration-plan.md` for structured implementation
2. **Always test with GitHub-hosted models** - local models won't work in production due to CORS
3. **Use configuration export system** - settings from test interface should be exportable as JSON
4. **Implement security measures** - CSP headers, input validation, and error boundaries
5. **Ensure accessibility compliance** - motion preferences, keyboard navigation, screen readers
6. **Test across environments** - development, staging, and production configurations
7. **Monitor performance impact** - FPS, memory usage, and loading times in production
8. **Plan for client handoff** - documentation, training materials, and maintenance procedures

## Implementation Priority
1. **Phase 1-2**: Assessment and configuration export system
2. **Phase 3-4**: Production script enhancement and Webflow integration
3. **Phase 5-6**: Auto-update pipeline and comprehensive testing
4. **Phase 7-9**: Security, client handoff, and enhancement features
4. **Check DRACO loader availability** - models use compression and need Google's DRACO decoder CDN
5. **Monitor performance in test interface** - real-time FPS, triangle count, and memory usage

## Adding New Scripts
1. Create file in `src/scripts/scriptname.js`
2. Add to `window.globalScripts` or `window.pageScripts` in router
3. Vite automatically includes in build - no manual configuration needed

## Configuration JSON Format
Production scripts load dynamic configurations from GitHub Pages:
```json
{
  "version": "1.0.0",
  "camera": { "position": [x,y,z], "target": [x,y,z], "distance": 100, "fov": 75 },
  "lighting": { "ambient": {"color": "#fff", "intensity": 0.4} },
  "performance": { "qualityLevel": "high", "targetFPS": 60 },
  "accessibility": { "respectMotionPreference": true, "keyboardControls": true }
}
```