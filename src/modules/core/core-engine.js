// Phase 1 Extraction: Core Engine
// Provides scene, camera, renderer setup previously in simple-3d-loader.js (setupScene & setupLighting subset)
// Pattern: function attachCoreEngine(loader) adding methods directly to loader instance.

export function attachCoreEngine(loader) {
  if (!loader) {
    console.warn('[CoreEngine] No loader instance provided');
    return;
  }
  if (loader.coreEngineAttached) {
    return; // idempotent
  }

  loader.setupScene = function() {
    if (!window.THREE) {
      console.warn('[CoreEngine] THREE not loaded yet');
      return;
    }
    console.log('[CoreEngine] Setting up scene');
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    // Use camera setup helper (can be called independently by other modules)
    this.setupCamera(width, height);
    const perf = this.config.performance;
    this.renderer = new THREE.WebGLRenderer({ antialias: perf.enableAntialiasing, alpha: true, premultipliedAlpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(perf.pixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;
    if (this.container && !this.renderer.domElement.parentNode) {
      this.container.appendChild(this.renderer.domElement);
    }
    this.adaptQualitySettings && this.adaptQualitySettings();
    this.setupLighting && this.setupLighting();
    this.initializeInteractionSystem && this.initializeInteractionSystem();
    console.log('[CoreEngine] Scene setup complete');
  };

  // Keep lighting logic minimal here (delegated later to lighting-system module)
  if (!loader.setupLighting) {
    loader.setupLighting = function() {
      if (!window.THREE) return;
      const cfg = this.config.lighting;
      if (cfg?.warmAmbient?.enabled) {
        const amb = new THREE.HemisphereLight(cfg.warmAmbient.skyColor, cfg.warmAmbient.groundColor, cfg.warmAmbient.intensity);
        this.scene.add(amb);
      }
    };
  }

  // Camera-only setup extracted so future animation / interaction systems can reinitialize or adjust
  loader.setupCamera = function(width = window.innerWidth, height = window.innerHeight) {
    if (!window.THREE) return;
    const camCfg = this.config.camera;
    if (!this.camera) {
      this.camera = new THREE.PerspectiveCamera(camCfg.fov, width/height, 0.1, 1000);
    } else {
      // Update existing camera parameters (e.g., after config changes)
      this.camera.fov = camCfg.fov;
      this.camera.aspect = width/height;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(...camCfg.position);
    if (camCfg.target && this.camera.lookAt) {
      this.camera.lookAt(...camCfg.target);
    }
  };

  loader.coreEngineAttached = true;
  console.log('✅ CoreEngine attached');
}

window.attachCoreEngine = attachCoreEngine;
