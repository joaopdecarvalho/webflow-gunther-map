/**
 * Simple Three.js GLB Loader for Webflow Integration with Default Configuration
 * 
 * This script provides a clean, straightforward implementation to load
 * a GLB model into the webgl-container element using Three.js with your custom configuration.
 * 
 * Last Updated: January 22, 2025 - Custom Animation Coordinates (27.7,41.2,42.6) → (10.3,21.9,16.0)
 * 
 * DEVELOPMENT NOTE: This script includes camera position panel functionality for debugging.
 * When deploying to production:
 * 1. The camera panel is hidden by CSS in staging but code remains
 * 2. Consider removing updateCameraInfo(), toggleCameraPanel(), copyCurrentPosition() 
 *    functions if not needed in production
 * 3. Remove camera panel HTML from staging site before copying to production
 * 4. Panel functions are safe to leave - they won't break if DOM elements don't exist
 */

// TEMPORARY: Make webflow.io domains use production URLs (Vercel first)
// Set to false to revert to localhost-first behavior
const WEBFLOW_USE_PRODUCTION_MODE = true;

class Simple3DLoader {
  constructor() {
    // Inject CSS immediately to prevent any flash
    this.injectAntiFlashCSS();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.model = null;
    this.controls = null;

    // (Phase 1 Cleanup) Removed legacy flag POI system (flags & flagCoordinates)

    // Performance and development flags
    this.isDevelopment = this.detectDevelopmentMode();
    this.lastDebugUpdate = 0;
    this.pauseRendering = false;
    this.loadingState = 'loading'; // 'loading', 'loaded', 'error'
    this.debugPanelsEnabled = false;

    // (Phase 2 Cleanup) Legacy POI mapping system removed

    // =====================================================================
    // Phase 3: New Interactive Station System (Skeleton Implementation)
    // =====================================================================
    // Mapping of model object names to modal trigger IDs
    this.stationMapping = {
      'Station01': 'station-1-goethestr-45',
      'Station02': 'station-2-afz-theo',
      'Station03': 'station-3-rueckenwind',
      'Station04': 'station-4-beet',
      'Station05': 'station-5-zolli',
      'Station06': 'station-6-starthaus',
      'Station07': 'station-7-studierendenhaus-h34',
      'Station08': 'station-8-quartiersmeisterei-lehe',
      'Station09': 'station-9-kulturbahnhof-lehe',
      'Station10': 'station-10-goethestrasse-60'
    };

    // Interaction system core properties (populated in Phase 4)
    this.interactiveObjects = []; // Array of THREE.Object3D that can be interacted with
    this.hoveredObject = null;    // Currently hovered object reference

    // Raycasting utilities (initialized after Three.js + scene setup)
    this.raycaster = null;
    this.mouse = null; // Normalized device coordinates vector
    this.interactionSystemInitialized = false;
    
    // Default configuration based on your 3d-config.json
    this.config = {
      "version": "1.0.0",
      "camera": {
        "position": [10.3, 1.2, 85.4],
        "target": [-14.0, -61.5, 33.4],
        "fov": 60,
        "minDistance": 85,
        "maxDistance": 125
      },
      "controls": {
        "minPolarAngle": 27,
        "maxPolarAngle": 54,
        "minDistance": 85,
        "maxDistance": 125,
        "enableZoom": true,
        "enableRotate": true,
        "enablePan": true,
        "dampingFactor": 0.02,
        "enableDamping": true
      },
      "lighting": {
        "warmAmbient": {
          "enabled": true,
          "intensity": 3.9,
          "skyColor": "#fff5f5",
          "groundColor": "#bd9a1f"
        }
      },
      "models": {
        "primary": "goetheviertel"
      },
      "animations": {
        "welcomeAnimation": {
          "enabled": true,
          "duration": 1300,
          "easing": "easeInOut",
          "startPosition": [30.7, 20.7, 107.5],
          "startTarget": [-18.7, -72.1, 39.8],
          "endPosition": [10.3, 1.2, 85.4],
          "endTarget": [-14.0, -61.5, 33.4]
        }
      },
      "performance": {
        "qualityLevel": "high",
        "targetFPS": 60,
        "enableAntialiasing": true,
        "pixelRatio": 1
      },
      "ui": {
        "showLoadingProgress": true,
        "enableControls": true,
        "enableZoom": true,
        "enableRotate": true,
        "enablePan": true
      },
      "accessibility": {
        "respectMotionPreference": true,
        "keyboardControls": true,
        "ariaLabels": true
      }
    };
    
    // Model URL - environment-aware with fallback
    this.modelUrls = {
      local: 'http://localhost:8080/Goetheviertel_250919_with_flags_webp80.glb',
      production: 'https://webflow-gunther-map.vercel.app/Goetheviertel_250919_with_flags_webp80.glb'
    };
    this.modelUrl = this.isDevelopment ? this.modelUrls.local : this.modelUrls.production;
    
    this.init();
  }

  detectDevelopmentMode() {
    const isWebflowDomain = location.hostname.includes('webflow.io') || location.hostname.includes('webflow.com');
    
    // TEMPORARY OVERRIDE: treat webflow domains as production if flag is enabled
    if (isWebflowDomain) {
      return !WEBFLOW_USE_PRODUCTION_MODE; // true flag = false isDevelopment = production behavior
    }
    
    // Normal detection for other domains
    return location.hostname === 'localhost' ||
           location.hostname === '127.0.0.1' ||
           location.hostname.includes('dev') ||
           location.search.includes('debug=true') ||
           location.hostname.includes('5173'); // Vite dev server
  }

  injectAntiFlashCSS() {
    // Create and inject CSS to prevent any white flash
    const style = document.createElement('style');
    style.textContent = `
      #webgl-container,
      .webgl-container,
      [data-webgl-container] {
        background-color: #3c5e71 !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    console.log('🚫 Anti-flash CSS injected');
  }

  async init() {
    try {
      // Find the container element
      this.container = document.querySelector('#webgl-container') ||
                       document.querySelector('.webgl-container') ||
                       document.querySelector('[data-webgl-container]');

      if (!this.container) {
        console.error('WebGL container not found! Looking for #webgl-container');
        return;
      }

      console.log('✅ Container found:', this.container);

      // Apply initial styling to prevent gradient flash
      this.applyInitialStyling();

      // Load Three.js then ensure core modules (or fallbacks) are ready
      await this.loadThreeJS();
      await this.ensureCoreModules();

      // Setup Three.js scene
      this.setupScene();

      // Load the GLB model
      await this.loadModel();

      // Setup controls
      this.setupControls();

      // Handle window resize and visibility changes
      this.setupEventListeners();

      // Start render loop
      this.animate();

      // Play welcome animation if enabled
      if (this.config.animations.welcomeAnimation.enabled) {
        this.playWelcomeAnimation();
      }

      // Remove loading state after everything is initialized
      this.finishLoading();

      console.log('✅ 3D scene initialized successfully!');
      console.log('🧩 Debug panels are available with enableDebugPanels() method');

    } catch (error) {
      console.error('❌ Error initializing 3D scene:', error);
      this.loadingState = 'error';
    }
  }

  // Centralized core module loader + fallback binding
  async ensureCoreModules() {
    // Skip if already attempted
    if (this._coreModulesEnsured) return;
    this._coreModulesEnsured = true;
    console.log('🧩 Ensuring core modules (Phase 1)...');
    // Phase 1.6.1c: On‑demand / conditional module list
    const eagerModules = [
      'core/core-engine',       // Required before scene setup
      'core/model-loader',      // Needed for loadModel()
      'core/controls-manager'   // Needed for setupControls()
    ];
    // Lighting is generally inexpensive & required visually; keep eager unless explicitly disabled
    if (!(this.config?.lighting?.warmAmbient?.enabled === false)) {
      eagerModules.push('core/lighting-system');
    }
    // Animation module loaded only if welcome animation enabled (lazy after first frame)
    const lazyModules = [];
    if (this.config?.animations?.welcomeAnimation?.enabled) {
      lazyModules.push('core/animation-system');
    }

    // Load eager modules sequentially for clearer error logs (avoid Promise noise masking root cause)
    for (const mod of eagerModules) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.loadModule(mod);
      } catch (err) {
        console.warn(`⚠️ Eager module failed '${mod}' -> fallback will be used where possible:`, err.message);
      }
    }

    // Schedule lazy modules using requestIdleCallback / setTimeout fallback
    if (lazyModules.length) {
      const loadLazy = () => {
        lazyModules.forEach(m => {
          this.loadModule(m).catch(err => console.warn(`⚠️ Lazy module failed '${m}':`, err.message));
        });
      };
      if (typeof window.requestIdleCallback === 'function') {
        requestIdleCallback(loadLazy, { timeout: 1500 });
      } else {
        setTimeout(loadLazy, 500); // after first render(s)
      }
    }

    // Fallback wiring (idempotent) if module methods not attached
    if (!this.modelLoaderAttached) {
      if (!this.loadModel || this.loadModel === Simple3DLoader.prototype.loadModel) {
        this.loadModel = this._legacyLoadModel.bind(this);
      }
      if (!this.centerModel || this.centerModel === Simple3DLoader.prototype.centerModel) {
        this.centerModel = this._legacyCenterModel.bind(this);
      }
      console.log('↩️ Using legacy model loader fallback');
    }
    if (!this.controlsManagerAttached) {
      if (!this.setupControls || this.setupControls === Simple3DLoader.prototype.setupControls) {
        this.setupControls = this._legacySetupControls.bind(this);
      }
      console.log('↩️ Using legacy controls manager fallback');
    }
    if (!this.lightingSystemAttached) {
      if (!this.setupLighting || this.setupLighting === Simple3DLoader.prototype.setupLighting) {
        // already present legacy setupLighting
      }
      console.log('↩️ Using legacy lighting system fallback');
    }
    if (!this.animationSystemAttached) {
      if (!this.playWelcomeAnimation || this.playWelcomeAnimation === Simple3DLoader.prototype.playWelcomeAnimation) {
        // legacy playWelcomeAnimation already in place
      }
      console.log('↩️ Using legacy animation system fallback');
    }
    if (!this.coreEngineAttached) {
      if (!this.setupScene || this.setupScene === Simple3DLoader.prototype.setupScene) {
        // keep legacy method as-is (already defined below) - no rename needed
        console.log('↩️ Using legacy core engine (scene setup) fallback');
      }
    }

    // Phase 1.6.1b: Ensure public API surface remains stable regardless of module load success
    this.ensurePublicAPI();
    console.log('🧩 Core module ensure complete (API compatibility enforced)');
  }

  // Ensure all expected public methods exist (backwards compatibility layer)
  ensurePublicAPI() {
    if (this._publicApiEnsured) return; // idempotent
    const requiredMethods = [
      'setupScene', 'loadModel', 'centerModel', 'setupControls', 'setupLighting', 'playWelcomeAnimation',
      // forward‑looking placeholders (will be added in later phases but safe to expose early)
      'dispose', 'updateConfig', 'getStats'
    ];
    requiredMethods.forEach(name => {
      if (typeof this[name] !== 'function') {
        this[name] = () => {
          console.warn(`⚠️ Public API stub '${name}' invoked before its module was loaded.`);
        };
      }
    });
    this._publicApiEnsured = true;
  }

  // Progressive loading alternative for better performance
  async initProgressive() {
    try {
      console.log('🚀 Starting progressive 3D initialization...');

      // Find the container element first
      this.container = document.querySelector('#webgl-container') ||
                       document.querySelector('.webgl-container') ||
                       document.querySelector('[data-webgl-container]');

      if (!this.container) {
        console.error('WebGL container not found! Looking for #webgl-container');
        return;
      }

      // Apply initial styling immediately
      this.applyInitialStyling();

      // Phase 1: Load core components and show basic scene
      console.log('📦 Phase 1: Loading core components...');
      await this.loadCoreComponents();
      this.showBasicScene();

      // Phase 2: Load model with progress tracking
      console.log('🏗️ Phase 2: Loading 3D model...');
      await this.loadModelProgressive();

      // Phase 3: Enhance scene with animations and controls
      console.log('✨ Phase 3: Enhancing scene...');
      this.enhanceScene();

      console.log('🎉 Progressive 3D initialization complete!');

    } catch (error) {
      console.error('❌ Error in progressive initialization:', error);
      this.initFallbackMode();
    }
  }

  async loadCoreComponents() {
    // Load Three.js with retry logic
    await this.loadThreeJS();

    // Setup basic scene without model
    this.setupScene();
    this.setupEventListeners();

    console.log('✅ Core components loaded');
  }

  showBasicScene() {
    // Start basic render loop
    this.animate();

    // Show a simple loading state in the scene
    const loadingGeometry = new THREE.BoxGeometry(10, 10, 10);
    const loadingMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a90e2,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const loadingCube = new THREE.Mesh(loadingGeometry, loadingMaterial);
    this.scene.add(loadingCube);

    // Animate the loading cube
    const animateLoadingCube = () => {
      if (loadingCube.parent) { // Still in scene
        loadingCube.rotation.x += 0.01;
        loadingCube.rotation.y += 0.01;
        requestAnimationFrame(animateLoadingCube);
      }
    };
    animateLoadingCube();

    this.loadingCube = loadingCube; // Store reference for cleanup
    console.log('🎬 Basic scene visible with loading indicator');
  }

  async loadModelProgressive() {
    try {
      // Remove loading cube
      if (this.loadingCube) {
        this.scene.remove(this.loadingCube);
        this.loadingCube.geometry.dispose();
        this.loadingCube.material.dispose();
        this.loadingCube = null;
      }

      // Load the actual model
      await this.loadModel();

      console.log('✅ Model loaded and added to scene');

    } catch (error) {
      console.error('❌ Model loading failed:', error);
      // Keep the loading cube as fallback
    }
  }

  enhanceScene() {
    // Setup controls
    this.setupControls();

    // Finish loading sequence
    this.finishLoading();

    // Play welcome animation if enabled
    if (this.config.animations.welcomeAnimation.enabled) {
      this.playWelcomeAnimation();
    }

    console.log('✨ Scene enhancement complete');
  }

  // WebGL capability detection and performance adaptation
  detectCapabilities() {
    if (!this.renderer) {
      console.warn('⚠️ Renderer not available for capability detection');
      return null;
    }

    const gl = this.renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    const capabilities = {
      // Basic WebGL info
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),

      // Extensions
      supportsFloatTextures: !!gl.getExtension('OES_texture_float'),
      supportsHalfFloatTextures: !!gl.getExtension('OES_texture_half_float'),
      supportsAnisotropy: !!gl.getExtension('EXT_texture_filter_anisotropic'),
      supportsInstancing: !!gl.getExtension('ANGLE_instanced_arrays'),
      supportsDepthTexture: !!gl.getExtension('WEBGL_depth_texture'),

      // GPU info (if available)
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
    };

    // Get unmasked renderer info for better GPU detection
    if (debugInfo) {
      capabilities.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      capabilities.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    console.log('🔍 WebGL Capabilities detected:', capabilities);
    return capabilities;
  }

  // Adaptive quality based on device capabilities
  adaptQualitySettings() {
    const capabilities = this.detectCapabilities();
    if (!capabilities) return;

    // Default to current config
    let qualityAdjustments = {
      enableAntialiasing: this.config.performance.enableAntialiasing,
      pixelRatio: this.config.performance.pixelRatio,
      shadowMapSize: 2048
    };

    // Detect mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Performance classification based on GPU
    const gpuInfo = (capabilities.unmaskedRenderer || capabilities.renderer || '').toLowerCase();
    let performanceTier = 'high';

    if (isMobile || gpuInfo.includes('intel') || gpuInfo.includes('powervr') || gpuInfo.includes('adreno')) {
      performanceTier = 'medium';
    }

    if (capabilities.maxTextureSize < 4096 || gpuInfo.includes('mali-400') || gpuInfo.includes('adreno 3')) {
      performanceTier = 'low';
    }

    // Apply quality adjustments based on performance tier
    switch (performanceTier) {
      case 'low':
        qualityAdjustments = {
          enableAntialiasing: false,
          pixelRatio: Math.min(0.75, window.devicePixelRatio),
          shadowMapSize: 512
        };
        console.log('📱 Low-end device detected - applying performance optimizations');
        break;

      case 'medium':
        qualityAdjustments = {
          enableAntialiasing: true,
          pixelRatio: Math.min(1.5, window.devicePixelRatio),
          shadowMapSize: 1024
        };
        console.log('💻 Medium-performance device detected - balanced settings');
        break;

      case 'high':
      default:
        qualityAdjustments = {
          enableAntialiasing: true,
          pixelRatio: Math.min(2.0, window.devicePixelRatio),
          shadowMapSize: 2048
        };
        console.log('🚀 High-performance device detected - maximum quality');
        break;
    }

    // Apply the adjustments to renderer
    if (this.renderer) {
      this.renderer.setPixelRatio(qualityAdjustments.pixelRatio);

      // Update shadow map size if shadows are enabled
      if (this.renderer.shadowMap.enabled) {
        this.renderer.shadowMap.autoUpdate = true;
        // Note: Shadow map size would need to be set per light, not globally
      }

      console.log('⚙️ Quality settings adapted:', qualityAdjustments);
    }

    return qualityAdjustments;
  }

  // Legacy fallback (will be overridden by animation-system module)
  playWelcomeAnimation() { // keep name for now until module attached, module loader will replace with module version; rename internals next phase if needed
    const animConfig = this.config.animations.welcomeAnimation;
    console.log('🎬 Playing welcome animation with updated start/end positions (smooth expo.inOut easing)...');
    
    // Use configuration values for animation positions
    const startPos = new THREE.Vector3(...animConfig.startPosition);
    const startTarget = new THREE.Vector3(...animConfig.startTarget);
    const endPos = new THREE.Vector3(...animConfig.endPosition);
    const endTarget = new THREE.Vector3(...animConfig.endTarget);
    
    // Set initial camera position and target
    this.camera.position.copy(startPos);
    this.controls.target.copy(startTarget);
    this.controls.update();
    
    // Animation parameters - using high precision timing
    const startTime = performance.now();
    const duration = animConfig.duration; // 1300ms
    
    const animateCamera = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply smooth exponential InOut easing (gentler curve than standard expo)
      let easedProgress = progress;
      if (animConfig.easing === 'easeInOut') {
        if (progress === 0) {
          easedProgress = 0;
        } else if (progress === 1) {
          easedProgress = 1;
        } else if (progress < 0.5) {
          // Gentler exponential ease in (reduced from 20 to 12 for smoother curve)
          easedProgress = Math.pow(2, 12 * progress - 6) / 2;
        } else {
          // Gentler exponential ease out
          easedProgress = (2 - Math.pow(2, -12 * progress + 6)) / 2;
        }
      }
      
      // Interpolate camera position and target
      this.camera.position.lerpVectors(startPos, endPos, easedProgress);
      this.controls.target.lerpVectors(startTarget, endTarget, easedProgress);
      this.controls.update();
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // Ensure final positions are exact
        this.camera.position.copy(endPos);
        this.controls.target.copy(endTarget);
        this.controls.update();
        console.log('✅ Welcome animation complete - new camera positions applied');
      }
    };
    
    requestAnimationFrame(animateCamera);
  }

  applyInitialStyling() {
    console.log('🎨 Applying initial styling to prevent flash...');
    
    // Store original styles to restore later
    this.originalContainerStyles = {
      background: this.container.style.background,
      opacity: this.container.style.opacity,
      transition: this.container.style.transition
    };
    
    // Apply loading styles to prevent gradient flash
    this.container.style.background = '#3c5e71'; // Set target color immediately
    this.container.style.opacity = '1'; // Keep visible but with correct background
    this.container.style.transition = 'none'; // Remove transition during setup
    
    // Ensure container covers the full viewport
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.zIndex = '1';
    
    console.log('✅ Initial styling applied - full viewport coverage with target background');
  }

  finishLoading() {
    console.log('🎉 Finishing loading sequence...');
    
    // Set loading state to loaded
    this.loadingState = 'loaded';
    
    // Set the final scene background now that everything is loaded
    if (this.scene) {
      this.scene.background = new THREE.Color(0x3c5e71); // Blue-gray background
      console.log('🎨 Scene background set to final color');
    }
    
    // Update renderer clear color for proper rendering
    if (this.renderer) {
      this.renderer.setClearColor(0x3c5e71, 1); // Opaque background
    }
    
    // Container is already visible with correct background - just log completion
    console.log('✅ 3D scene ready and visible');
  }

  fadeInModel() {
    if (!this.model) {
      console.warn('⚠️ No model to fade in');
      return;
    }

    console.log('✨ Starting model fade-in animation...');

    const duration = 2000; // 2 seconds fade-in
    const startTime = performance.now();

    const fadeAnimation = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      // Apply opacity to all meshes in the model
      this.model.traverse((child) => {
        if (child.isMesh && child.material && child.material.transparent) {
          child.material.opacity = easedProgress;
          child.material.needsUpdate = true;
        }
      });
      
      if (progress < 1) {
        requestAnimationFrame(fadeAnimation);
      } else {
        console.log('✅ Model fade-in complete');
      }
    };
    
    // Start the fade-in animation
    requestAnimationFrame(fadeAnimation);
  }

  async loadThreeJS() {
    return this.loadThreeJSWithRetry(3);
  }

  async loadThreeJSWithRetry(maxRetries = 3) {
    console.log('📦 Starting Three.js loading with retry logic...');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📦 Loading Three.js (attempt ${attempt}/${maxRetries})...`);
        console.log('🌐 Network status:', navigator.onLine ? 'online' : 'offline');

        await this.attemptThreeJSLoad();
        console.log('✅ Three.js loaded successfully!');

        // Verify all required objects are available
        if (window.THREE && window.GLTFLoader && window.OrbitControls) {
          console.log('✅ All Three.js modules verified present');
          return;
        } else {
          throw new Error('Three.js modules incomplete after load');
        }
      } catch (error) {
        console.warn(`❌ Three.js loading attempt ${attempt} failed:`, error.message);
        console.warn('📍 Error details:', {
          message: error.message,
          stack: error.stack,
          windowTHREE: !!window.THREE,
          GLTFLoader: !!window.GLTFLoader,
          OrbitControls: !!window.OrbitControls
        });

        if (attempt === maxRetries) {
          console.error('💥 All Three.js loading attempts failed, initializing fallback mode');
          this.initFallbackMode();
          return;
        }

        // Exponential backoff delay
        const delayMs = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }
  }

  async attemptThreeJSLoad() {
    return new Promise((resolve, reject) => {
      if (window.THREE) {
        console.log('✅ Three.js already loaded');
        resolve();
        return;
      }
      
      // Load Three.js core using ES modules approach
      const threeScript = document.createElement('script');
      threeScript.type = 'importmap';
      threeScript.textContent = JSON.stringify({
        "imports": {
          "three": "https://unpkg.com/three@0.158.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.158.0/examples/jsm/"
        }
      });
      document.head.appendChild(threeScript);

      // Load the main script that imports Three.js
      const mainScript = document.createElement('script');
      mainScript.type = 'module';
      mainScript.textContent = `
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        
        // Make THREE available globally
        window.THREE = THREE;
        window.GLTFLoader = GLTFLoader;
        window.OrbitControls = OrbitControls;
        
        console.log('✅ Three.js loaded successfully via ES modules');
        
        // Dispatch custom event to signal loading completion
        window.dispatchEvent(new CustomEvent('threeJSLoaded'));
      `;

      // Listen for the custom event
      window.addEventListener('threeJSLoaded', () => {
        console.log('✅ Three.js modules ready');
        resolve();
      }, { once: true });

      mainScript.onerror = () => {
        console.warn('⚠️ ES modules approach failed, trying fallback...');
        this.loadThreeJSFallback().then(resolve).catch(reject);
      };

      document.head.appendChild(mainScript);

      // Timeout fallback
      setTimeout(() => {
        if (!window.THREE) {
          reject(new Error('Three.js loading timeout'));
        }
      }, 10000);
    });
  }

  // Utility method for delays
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fallback mode when Three.js completely fails to load
  initFallbackMode() {
    console.log('🛟 Initializing fallback mode...');

    // Create a simple fallback message
    const fallbackDiv = document.createElement('div');
    fallbackDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #3c5e71 0%, #2a4a5c 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 1000;
      ">
        <div style="text-align: center; max-width: 400px; padding: 2rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🏗️</div>
          <h2 style="margin: 0 0 1rem 0; font-weight: 300;">3D Experience Loading</h2>
          <p style="margin: 0; opacity: 0.8; line-height: 1.5;">
            We're preparing an immersive 3D experience for you.
            Please refresh the page or try again later.
          </p>
          <button onclick="location.reload()" style="
            margin-top: 1.5rem;
            padding: 0.75rem 2rem;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
          ">
            Retry
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(fallbackDiv);
    console.log('🛟 Fallback mode initialized with user-friendly interface');
  }

  async loadThreeJSFallback() {
    return new Promise((resolve, reject) => {
      console.log('🔄 Loading Three.js using fallback method...');
      
      // Try loading Three.js from different CDNs
      const cdnUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js',
        'https://unpkg.com/three@0.158.0/build/three.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js'
      ];

      let currentCdnIndex = 0;

      const tryNextCdn = () => {
        if (currentCdnIndex >= cdnUrls.length) {
          reject(new Error('All CDN sources failed to load Three.js'));
          return;
        }

        const script = document.createElement('script');
        script.src = cdnUrls[currentCdnIndex];
        
        script.onload = () => {
          console.log(`✅ Three.js loaded from: ${cdnUrls[currentCdnIndex]}`);
          
          // Load additional modules manually
          this.loadAdditionalModules().then(resolve).catch(reject);
        };
        
        script.onerror = () => {
          console.warn(`❌ Failed to load from: ${cdnUrls[currentCdnIndex]}`);
          currentCdnIndex++;
          tryNextCdn();
        };
        
        document.head.appendChild(script);
      };

      tryNextCdn();
    });
  }

  async loadAdditionalModules() {
    return new Promise((resolve, reject) => {
      if (!window.THREE) {
        reject(new Error('Three.js not available for module loading'));
        return;
      }

      console.log('📦 Loading additional Three.js modules...');

      // Create a simple GLTFLoader and OrbitControls using basic Three.js
      const moduleScript = document.createElement('script');
      moduleScript.textContent = `
        // Basic GLTFLoader implementation
        window.GLTFLoader = function() {
          this.load = function(url, onLoad, onProgress, onError) {
            fetch(url)
              .then(response => response.arrayBuffer())
              .then(data => {
                // This is a simplified loader - for production use proper GLTFLoader
                console.log('⚠️ Using simplified model loader');
                if (onError) onError(new Error('Simplified loader - model format not supported'));
              })
              .catch(error => {
                console.error('Model loading error:', error);
                if (onError) onError(error);
              });
          };
        };

        // Basic OrbitControls
        window.OrbitControls = function(camera, domElement) {
          console.log('⚠️ Using simplified orbit controls');
          this.update = function() {};
          this.enableDamping = false;
          this.dampingFactor = 0.05;
        };

        console.log('✅ Simplified modules loaded');
      `;

      moduleScript.onload = () => {
        console.log('✅ Additional modules ready');
        resolve();
      };

      moduleScript.onerror = () => {
        console.warn('⚠️ Module loading failed, continuing with basic Three.js');
        resolve(); // Continue anyway
      };

      document.head.appendChild(moduleScript);
      
      // Resolve immediately since inline scripts execute synchronously
      setTimeout(resolve, 100);
    });
  }

  setupScene() {
    console.log('🎬 Setting up Three.js scene...');

    // Use viewport dimensions for full-page coverage
    const width = window.innerWidth;
    const height = window.innerHeight;
    console.log('📐 Viewport dimensions:', { width, height });

    // Verify Three.js is available
    if (!window.THREE) {
      console.error('❌ THREE.js not available for scene setup');
      throw new Error('THREE.js not available');
    }

    console.log('🎬 Creating Three.js scene...');
    // Create scene
    this.scene = new THREE.Scene();
    // Start with transparent background to prevent gradient flash
    this.scene.background = null; // Will be set after loading
    console.log('✅ Scene created');

    // Create camera using configuration
    console.log('📷 Creating camera with config:', this.config.camera);
    const cameraConfig = this.config.camera;
    this.camera = new THREE.PerspectiveCamera(
      cameraConfig.fov,
      width / height,
      0.1,
      1000
    );
    this.camera.position.set(...cameraConfig.position);
    console.log('✅ Camera created at position:', this.camera.position);

    // Create renderer with configuration
    console.log('🖥️ Creating WebGL renderer...');
    const performanceConfig = this.config.performance;

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: performanceConfig.enableAntialiasing,
        alpha: true,
        premultipliedAlpha: false // Prevent alpha blending issues
      });
      console.log('✅ WebGL renderer created successfully');
    } catch (error) {
      console.error('❌ Failed to create WebGL renderer:', error);
      throw error;
    }

    console.log('🖥️ Configuring renderer settings...');
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(performanceConfig.pixelRatio);
    this.renderer.setClearColor(0x000000, 0); // Transparent clear color initially
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    console.log('📊 Renderer configuration:', {
      size: { width, height },
      pixelRatio: performanceConfig.pixelRatio,
      antialias: performanceConfig.enableAntialiasing,
      shadowsEnabled: this.renderer.shadowMap.enabled
    });

    // Add renderer to container
    console.log('🎬 Adding renderer canvas to container...');
    if (!this.container) {
      console.error('❌ Container not available for renderer attachment');
      throw new Error('Container not available');
    }

    this.container.appendChild(this.renderer.domElement);
    console.log('✅ Renderer canvas added to container');

    // Detect capabilities and adapt quality settings
    console.log('🔍 Detecting WebGL capabilities...');
    this.adaptQualitySettings();

    // Add lights
    console.log('💡 Setting up lighting...');
    this.setupLighting();

    // Initialize new interaction system core (Phase 3 skeleton)
    console.log('🧭 Initializing interaction system...');
    this.initializeInteractionSystem();

    console.log('✅ Scene setup complete - all components initialized');
  }

  // Legacy fallback (will be overridden by lighting-system module)
  setupLighting() {
    const lightingConfig = this.config.lighting;
    
    // Warm ambient lighting (your preferred setup)
    if (lightingConfig.warmAmbient.enabled) {
      const ambientLight = new THREE.HemisphereLight(
        lightingConfig.warmAmbient.skyColor, 
        lightingConfig.warmAmbient.groundColor, 
        lightingConfig.warmAmbient.intensity
      );
      this.scene.add(ambientLight);
      console.log('💡 Warm ambient lighting added');
    }

    console.log('✅ Lighting setup complete with configuration');
  }

  // Legacy fallback (replaced by module attachModelLoader). Retained for safety.
  async _legacyLoadModel() {
    return new Promise((resolve, reject) => {
      console.log('📁 Starting GLB model loading...');
      console.log('🌐 Model URL:', this.modelUrl);
      console.log('🔧 Development mode:', this.isDevelopment);
      console.log('🌐 Network status:', navigator.onLine ? 'online' : 'offline');

      if (!window.GLTFLoader) {
        console.error('❌ GLTFLoader not available - Three.js modules not properly loaded');
        console.log('🔍 Available window objects:', Object.keys(window).filter(k => k.includes('THREE') || k.includes('GLTF') || k.includes('Orbit')));
        reject(new Error('GLTFLoader not available'));
        return;
      }

      console.log('✅ GLTFLoader available, creating loader instance...');
      const loader = new window.GLTFLoader();

      // Test network connectivity to model URL
      console.log('🔍 Testing model URL accessibility...');
      fetch(this.modelUrl, { method: 'HEAD' })
        .then(response => {
          console.log('🌐 Model URL test response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          });
        })
        .catch(error => {
          console.warn('⚠️ Model URL test failed:', error);
        });

      loader.load(
        this.modelUrl,
        (gltf) => {
          console.log('🎉 Model loaded successfully!');
          console.log('📊 Model data:', {
            scene: !!gltf.scene,
            animations: gltf.animations?.length || 0,
            scenes: gltf.scenes?.length || 0,
            cameras: gltf.cameras?.length || 0
          });

          this.model = gltf.scene;

          // Log model structure
          let meshCount = 0;
          let materialCount = 0;
          this.model.traverse((child) => {
            if (child.isMesh) {
              meshCount++;
              if (child.material) {
                if (Array.isArray(child.material)) {
                  materialCount += child.material.length;
                } else {
                  materialCount++;
                }
              }
            }
          });

          console.log('📊 Model structure:', {
            totalChildren: this.model.children.length,
            meshCount: meshCount,
            materialCount: materialCount
          });

          // Enable shadows on all meshes and set initial opacity to 0
          console.log('🎨 Configuring materials and shadows...');
          this.model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Make model invisible initially for fade-in effect
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    mat.transparent = true;
                    mat.opacity = 0;
                  });
                } else {
                  child.material.transparent = true;
                  child.material.opacity = 0;
                }
              }
            }
          });

          // Add model to scene
          console.log('🎬 Adding model to scene...');
          this.scene.add(this.model);

          // Center and scale model
          console.log('📐 Centering and scaling model...');
          this.centerModel();

          // Phase 5.1: Initialize interactive stations automatically after model load
          try {
            if (this.interactionSystemInitialized) {
              console.log('🧭 Setting up interactive objects...');
              this.setupInteractiveObjects();
              console.log('🧭 Phase 5.1: Interactive objects auto-setup after model load');
            } else {
              console.warn('⚠️ Phase 5.1: Interaction system not initialized yet when model loaded');
            }
          } catch (e) {
            console.error('❌ Phase 5.1: Failed to setup interactive objects:', e);
          }

          // Start fade-in animation for the model
          console.log('✨ Starting model fade-in animation...');
          this.fadeInModel();

          console.log('✅ Model loading process complete!');
          resolve();
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total * 100).toFixed(1);
            console.log(`📊 Loading progress: ${percent}% (${progress.loaded}/${progress.total} bytes)`);
          } else {
            console.log(`📊 Loading progress: ${progress.loaded} bytes loaded`);
          }
        },
        (error) => {
          console.error('❌ Error loading model:', error);
          console.error('📍 Model loading error details:', {
            message: error.message,
            type: error.type,
            target: error.target,
            stack: error.stack
          });
          console.log('🔍 Attempted URL:', this.modelUrl);
          console.log('🔍 Current scene state:', !!this.scene);
          reject(error);
        }
      );
    });
  }

  _legacyCenterModel() {
    if (!this.model) return;

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(this.model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    console.log('📐 Model dimensions:', {
      center: center,
      size: size,
      maxDimension: Math.max(size.x, size.y, size.z)
    });

    // Center the model
    this.model.position.sub(center);
    
    // Scale model to fit in view
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetSize = 80;
    const scale = targetSize / maxDimension;
    this.model.scale.setScalar(scale);

    // Position camera to view the model using configuration
    this.camera.position.set(...this.config.camera.position);
    this.camera.lookAt(...this.config.camera.target);

    console.log('✅ Model centered and scaled with configuration positioning');
  }

  _legacySetupControls() {
    if (!window.OrbitControls) {
      console.warn('⚠️ OrbitControls not available, using basic mouse controls');
      this.setupBasicControls();
      return;
    }

    const cameraConfig = this.config.camera;
    const controlsConfig = this.config.controls;
    const uiConfig = this.config.ui;
    
    this.controls = new window.OrbitControls(this.camera, this.renderer.domElement);
    
    // Apply enhanced configuration settings
    this.controls.enableDamping = controlsConfig.enableDamping;
    this.controls.dampingFactor = controlsConfig.dampingFactor;
    
    // Apply updated polar angle restrictions
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(controlsConfig.minPolarAngle); // 22 degrees
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(controlsConfig.maxPolarAngle); // 104 degrees
    
    // Apply updated distance constraints
    this.controls.minDistance = controlsConfig.minDistance; // 50
    this.controls.maxDistance = controlsConfig.maxDistance; // 125
    
    // Enable/disable controls based on configuration
    this.controls.enableZoom = controlsConfig.enableZoom;
    this.controls.enableRotate = controlsConfig.enableRotate;
    this.controls.enablePan = controlsConfig.enablePan;
    
    // Set camera target from configuration
    this.controls.target.set(...cameraConfig.target);
    this.controls.update();

    console.log('🎮 Camera controls setup complete with updated configuration:', {
      minPolarAngle: controlsConfig.minPolarAngle + '°',
      maxPolarAngle: controlsConfig.maxPolarAngle + '°',
      minDistance: controlsConfig.minDistance,
      maxDistance: controlsConfig.maxDistance,
      dampingFactor: controlsConfig.dampingFactor
    });
  }

  setupBasicControls() {
    console.log('🎮 Setting up basic mouse controls...');
    
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    
    this.renderer.domElement.addEventListener('mousedown', (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });
    
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      targetX += deltaX * 0.01;
      targetY += deltaY * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    });
    
    this.renderer.domElement.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
    
    // Update camera rotation in animation loop
    this.updateBasicControls = () => {
      if (this.camera && this.model) {
        const radius = 80;
        this.camera.position.x = Math.cos(targetX) * radius;
        this.camera.position.z = Math.sin(targetX) * radius;
        this.camera.position.y = Math.sin(targetY) * 50 + 40;
        this.camera.lookAt(0, 15, 0);
      }
    };
    
    console.log('✅ Basic controls setup complete');
  }

  setupEventListeners() {
    // Window resize handling
    window.addEventListener('resize', () => this.onWindowResize());

    // Visibility API for performance optimization
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    console.log('🎧 Event listeners setup complete (resize, visibility)');
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Tab is hidden - pause rendering to save battery/CPU
      this.pauseRendering = true;
      console.log('⏸️ Rendering paused (tab hidden)');
    } else {
      // Tab is visible - resume rendering
      this.pauseRendering = false;
      this.animate(); // Restart animation loop
      console.log('▶️ Rendering resumed (tab visible)');
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;

    // Use viewport dimensions for full-page coverage
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    console.log('📱 Viewport resized:', { width, height });
  }

  animate() {
    // Check if rendering is paused (e.g., tab hidden)
    if (this.pauseRendering) {
      return;
    }

    requestAnimationFrame(() => this.animate());

    const now = performance.now();

    // Update controls
    if (this.controls && this.controls.update) {
      this.controls.update();
    } else if (this.updateBasicControls) {
      this.updateBasicControls();
    }

    // Throttled debug updates (development only) - only if debug panels are enabled
    if (this.isDevelopment && this.debugPanelsEnabled && (now - this.lastDebugUpdate) > 100) {
      this.updateCameraInfo();
      this.lastDebugUpdate = now;
    }

    // Phase 5.1: Per-frame interaction visuals update (hover glow easing)
    if (this.updateInteractionVisuals) {
      this.updateInteractionVisuals();
    }

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // =============================================================================
  // DEVELOPMENT/DEBUG FUNCTIONS - Hooks for External Debug Panels
  // =============================================================================
  // Debug panels are now loaded externally via debug-panels.js module
  // These methods will be populated by the debug panels module when loaded
  
  // Placeholder methods for debug panels (will be overridden when debug module loads)
  createCameraInfoPanel() {
    if (!this.debugPanelsEnabled) {
      console.log('🧩 Debug panels not loaded. Use enableDebugPanels() to load them.');
      return;
    }
  }
  
  updateCameraInfo() {
    // Will be overridden by debug panels module
  }

  // Placeholder methods for debug panels (will be overridden when debug module loads)
  createControlsPanel() {
    if (!this.debugPanelsEnabled) {
      console.log('🧩 Debug panels not loaded. Use enableDebugPanels() to load them.');
      return;
    }
  }

  setupControlsListeners() {
    // Will be overridden by debug panels module
  }

  // =============================================================================
  // DEBUG PANELS LOADER
  // =============================================================================
  
  // Generic helper to load any module script with environment-aware fallback
  async loadModuleScript(primaryUrl, fallbackUrl) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = primaryUrl;

      script.onload = () => {
        console.log('✅ Module script loaded:', primaryUrl);
        resolve();
      };

      script.onerror = () => {
        if (!fallbackUrl || fallbackUrl === primaryUrl) {
          reject(new Error('Failed to load module script: ' + primaryUrl));
          return;
        }
        console.log('🔄 Primary module URL failed, trying fallback:', fallbackUrl);
        const fallbackScript = document.createElement('script');
        fallbackScript.type = 'module';
        fallbackScript.src = fallbackUrl;
        fallbackScript.onload = () => {
          console.log('✅ Module script loaded from fallback:', fallbackUrl);
          resolve();
        };
        fallbackScript.onerror = () => {
          reject(new Error('Failed to load module script from both primary & fallback URLs'));
        };
        document.head.appendChild(fallbackScript);
      };

      document.head.appendChild(script);
    });
  }

  // Convert a module path (e.g. "dev/debug-panels") to an attach function name (attachDebugPanels)
  _deriveAttachFunctionName(moduleName) {
    const base = moduleName.split('/').pop().replace(/\.js$/,'');
    const pascal = base.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return 'attach' + pascal;
  }

  // Load a module from /src/modules/ with environment-aware URLs
  async loadModule(moduleName) {
    try {
      const localUrl = `http://localhost:8080/src/modules/${moduleName}.js`;
      const prodUrl = `https://webflow-gunther-map.vercel.app/src/modules/${moduleName}.js`;
      const primary = this.isDevelopment ? localUrl : prodUrl;
      const fallback = this.isDevelopment ? prodUrl : localUrl;
      await this.loadModuleScript(primary, fallback);
      const attachFnName = this._deriveAttachFunctionName(moduleName);
      if (typeof window[attachFnName] === 'function') {
        window[attachFnName](this);
        console.log(`🧩 Module '${moduleName}' attached via ${attachFnName}()`);
      } else {
        console.warn(`⚠️ Module '${moduleName}' loaded but global ${attachFnName}() not found`);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to load module '${moduleName}':`, err.message);
      throw err;
    }
  }

  // Method to enable debug panels by loading the external module
  async enableDebugPanels() {
    if (this.debugPanelsEnabled) {
      console.log('🧩 Debug panels already enabled');
      return;
    }

    try {
      console.log('🧩 Loading debug panels module...');
      // New preferred path (Phase 1 modularization)
      try {
        await this.loadModule('dev/debug-panels');
      } catch (modErr) {
        console.warn('⚠️ New module path failed, falling back to legacy scripts directory...', modErr.message);
        // Legacy fallback (pre-modular path)
        const legacyLocal = 'http://localhost:8080/src/scripts/debug-panels.js';
        const legacyProd = 'https://webflow-gunther-map.vercel.app/src/scripts/debug-panels.js';
        const primary = this.isDevelopment ? legacyLocal : legacyProd;
        const fallback = this.isDevelopment ? legacyProd : legacyLocal;
        await this.loadModuleScript(primary, fallback);
        if (window.attachDebugPanels) {
          window.attachDebugPanels(this);
        } else {
          throw new Error('Legacy debug panels script loaded but attachDebugPanels not found');
        }
      }
      
      console.log('✅ Debug panels loaded and enabled');
      
      // Show panels immediately if in development and scene is loaded
      if (this.isDevelopment && this.loadingState === 'loaded') {
        setTimeout(() => {
          this.createCameraInfoPanel?.();
          this.createControlsPanel?.();
          
          // Create interaction overlay if interactive objects are available
          if (Array.isArray(this.interactiveObjects) && this.interactiveObjects.length) {
            const foundKeys = new Set(this.interactiveObjects.map(m => m.stationKey));
            const missingKeys = Object.keys(this.stationMapping || {}).filter(k => !foundKeys.has(k));
            this.createInteractionDebugOverlay?.(foundKeys, missingKeys);
          }
        }, 100);
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to load debug panels module:', error);
    }
  }

  // Public method to get model stats
  getStats() {
    if (!this.model) return null;

    let triangleCount = 0;
    let vertexCount = 0;
    
    this.model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geometry = child.geometry;
        if (geometry.index) {
          triangleCount += geometry.index.count / 3;
        } else {
          triangleCount += geometry.attributes.position.count / 3;
        }
        vertexCount += geometry.attributes.position.count;
      }
    });

    return {
      triangles: Math.floor(triangleCount),
      vertices: vertexCount,
      meshes: this.model.children.length
    };
  }

  // Public method to update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuration updated:', this.config);

    // Apply camera settings if scene is initialized
    if (this.camera && this.controls) {
      this.camera.position.set(...this.config.camera.position);
      this.controls.target.set(...this.config.camera.target);
      this.controls.minDistance = this.config.camera.minDistance;
      this.controls.maxDistance = this.config.camera.maxDistance;
      this.controls.update();
    }
  }

  // Memory management - comprehensive resource disposal
  dispose() {
    console.log('🧹 Starting comprehensive resource cleanup...');

    // Pause rendering immediately
    this.pauseRendering = true;

  // (Phase 1 Cleanup) Flag system disposal removed

    // (Phase 2 Cleanup) POI mapping disposal removed

  // Phase 3: Interaction system disposal
  this.disposeInteractionSystem && this.disposeInteractionSystem();

    // Clean up model and its materials/geometries
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          // Dispose geometry
          if (child.geometry) {
            child.geometry.dispose();
          }

          // Dispose materials and textures
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => this.disposeMaterial(material));
            } else {
              this.disposeMaterial(child.material);
            }
          }
        }
      });

      // Remove model from scene
      if (this.scene) {
        this.scene.remove(this.model);
      }
      this.model = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    // Clean up controls
    if (this.controls) {
      if (this.controls.dispose) {
        this.controls.dispose();
      }
      this.controls = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Clear references
    this.scene = null;
    this.camera = null;
    this.container = null;

    console.log('✅ Resource cleanup complete - memory freed');
  }

  // Helper method to dispose materials and their textures
  disposeMaterial(material) {
    if (!material) return;

    // Dispose all textures used by the material
    const textureProperties = ['map', 'normalMap', 'bumpMap', 'displacementMap',
                              'roughnessMap', 'metalnessMap', 'alphaMap', 'aoMap',
                              'emissiveMap', 'envMap', 'lightMap'];

    textureProperties.forEach(prop => {
      if (material[prop] && material[prop].dispose) {
        material[prop].dispose();
      }
    });

    // Dispose the material itself
    material.dispose();
  }

  // (Phase 1 Cleanup) Legacy flag POI system methods removed (initializeFlags, createFlag, animateFlags, disposeFlags)

  // (Phase 2 Cleanup) POI mapping methods removed

  // =====================================================================
  // Phase 3: Interactive Station System (Skeleton)
  // =====================================================================
  // NOTE: This phase only introduces the foundational plumbing (raycaster,
  // event listeners, mapping object). Actual object detection, hover effects,
  // and modal triggering will be implemented in Phase 4.

  initializeInteractionSystem() {
    if (this.interactionSystemInitialized) {
      return; // Prevent duplicate initialization
    }
    if (!window.THREE || !this.renderer || !this.camera) {
      console.warn('⚠️ Interaction system postponed (Three.js or scene not ready yet)');
      return;
    }

    try {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      // Basic throttling for mouse move to avoid excessive calculations
      this._lastPointerMove = 0;
      this._pointerMoveThrottleMs = 50; // Adjust in Phase 5 if needed
      // Phase 5.3 performance metrics
      this._lastPointerActivity = performance.now();
      this._pointerIdleThresholdMs = 1500; // ms
      this._lastRaycastTime = 0;
      this._raycastIntervalMs = 50; // ms

      // Phase 5.2 touch interaction state
      this._touchState = {
        active: false,
        startX: 0,
        startY: 0,
        moved: false,
        startTime: 0,
        tapMovementThreshold: 10,
        tapDurationThreshold: 500
      };

      // Phase 4: Wire handlers to actual interaction logic methods
      this._interactionHandlers = {
        pointerMove: (event) => {
          const now = performance.now();
          if (now - this._lastPointerMove < this._pointerMoveThrottleMs) return;
          this._lastPointerMove = now;
          this.onPointerMove(event);
        },
        click: (event) => {
          this.onClick(event);
        },
        touchStart: (event) => {
          if (!event.touches || event.touches.length === 0) return;
          const touch = event.touches[0];
          this._touchState.active = true;
          this._touchState.startX = touch.clientX;
          this._touchState.startY = touch.clientY;
          this._touchState.startTime = performance.now();
          this._touchState.moved = false;
          // Immediate hover feedback
          this.onPointerMove(touch);
        },
        touchMove: (event) => {
          if (!event.touches || event.touches.length === 0) return;
          const touch = event.touches[0];
          const dx = touch.clientX - this._touchState.startX;
          const dy = touch.clientY - this._touchState.startY;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this._touchState.moved = true;
          if (!this._touchState.moved) this.onPointerMove(touch);
        },
        touchEnd: (event) => {
          if (!this._touchState.active) return;
          const duration = performance.now() - this._touchState.startTime;
          const wasTap = !this._touchState.moved && duration < this._touchState.tapDurationThreshold;
          this._touchState.active = false;
          if (wasTap && event.changedTouches && event.changedTouches.length > 0) {
            this.onClick(event.changedTouches[0]);
          }
        }
      };

      // Attach listeners to canvas element for scoped interaction
      const el = this.renderer.domElement;
      el.addEventListener('mousemove', this._interactionHandlers.pointerMove);
      el.addEventListener('click', this._interactionHandlers.click);
      el.addEventListener('touchstart', this._interactionHandlers.touchStart, { passive: true });
      el.addEventListener('touchmove', this._interactionHandlers.touchMove, { passive: true });
      el.addEventListener('touchend', this._interactionHandlers.touchEnd, { passive: true });

      this.interactionSystemInitialized = true;
      console.log('🧩 Phase 3 interaction system skeleton initialized');
    } catch (err) {
      console.error('❌ Failed to initialize interaction system skeleton:', err);
    }
  }

  updateNormalizedPointer(event) {
    if (!this.mouse || !this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  disposeInteractionSystem() {
    if (!this.interactionSystemInitialized || !this.renderer) return;
    const el = this.renderer.domElement;
    if (this._interactionHandlers) {
      el.removeEventListener('mousemove', this._interactionHandlers.pointerMove);
      el.removeEventListener('click', this._interactionHandlers.click);
      el.removeEventListener('touchstart', this._interactionHandlers.touchStart);
      el.removeEventListener('touchmove', this._interactionHandlers.touchMove);
      el.removeEventListener('touchend', this._interactionHandlers.touchEnd);
    }
    this.raycaster = null;
    this.mouse = null;
    this.hoveredObject = null;
    this.interactiveObjects = [];
    this.interactionSystemInitialized = false;
    console.log('🧹 Phase 3 interaction system skeleton disposed');
  }

  // =====================================================================
  // Phase 4: Interactive Station System - Functional Implementation
  // =====================================================================
  // Provides: object detection, hover feedback, cursor changes, modal triggers
  // NOTE: Not yet auto-invoked after model load (that will be Phase 5 task 5.1)

  // Discover interactive station objects within the loaded model
  setupInteractiveObjects() {
    if (!this.model) {
      console.warn('⚠️ Cannot setup interactive objects before model loads');
      return;
    }
    if (!this.stationMapping) {
      console.warn('⚠️ Station mapping not defined');
      return;
    }

    this.interactiveObjects = [];
    this._interactiveMetaMap = new Map();

    const stationKeys = Object.keys(this.stationMapping);
    let foundCount = 0;

    const foundKeys = new Set();

    this.model.traverse((child) => {
      if (!child.isMesh || !child.name) return;
      for (const key of stationKeys) {
        // Allow partial / case-insensitive match (e.g., 'Station01', 'station01_mesh')
        if (child.name.toLowerCase().includes(key.toLowerCase())) {
          // Clone material to prevent shared-material side effects when highlighting
            if (child.material && !child.material._isClonedForInteraction) {
              child.material = child.material.clone();
              child.material._isClonedForInteraction = true;
            }

          const meta = {
            object: child,
            stationKey: key,
            modalId: this.stationMapping[key],
            original: {
              color: child.material && child.material.color ? child.material.color.clone() : null,
              emissive: child.material && child.material.emissive ? child.material.emissive.clone() : null
            },
            currentGlow: 0,
            targetGlow: 0,
            highlighted: false
          };
          this.interactiveObjects.push(meta);
          this._interactiveMetaMap.set(child.uuid, meta);
          foundCount++;
          foundKeys.add(key);
          break; // Stop checking other keys for this child
        }
      }
    });

    console.log(`🧭 Interactive stations setup complete: ${foundCount} objects mapped`);

    // Phase 5.1: Log warnings for any missing mapped stations
    const missing = stationKeys.filter(k => !foundKeys.has(k));
    if (missing.length > 0) {
      console.warn('⚠️ Missing station objects for mapping keys:', missing);
    } else {
      console.log('✅ All station mapping keys found in model');
    }
    // Development overlay
    this.createInteractionDebugOverlay && this.createInteractionDebugOverlay(foundKeys, missing);
  }

  // Handle pointer movement for hover detection
  onPointerMove(event) {
    if (!this.raycaster || !this.mouse || !this.camera) return;
    const now = performance.now();
    this._lastPointerActivity = now;
    this.updateNormalizedPointer(event);

    if (!this.interactiveObjects || this.interactiveObjects.length === 0) {
      // Silent early exit until setupInteractiveObjects is called (Phase 5)
      return;
    }

  if (now - this._lastRaycastTime < this._raycastIntervalMs) return; // interval gating
  if (now - this._lastPointerActivity > this._pointerIdleThresholdMs) return; // idle gating
  this._lastRaycastTime = now;
  this.raycaster.setFromCamera(this.mouse, this.camera);
    const candidates = this.interactiveObjects.map(m => m.object);
    const intersections = this.raycaster.intersectObjects(candidates, true);

    const top = intersections.length > 0 ? intersections[0].object : null;

    if (top && (!this.hoveredObject || this.hoveredObject.uuid !== top.uuid)) {
      // New hover target
      this.clearHover();
      this.applyHover(top);
    } else if (!top && this.hoveredObject) {
      // Pointer left any interactive object
      this.clearHover();
    }
  }

  // Handle click / touch interaction
  onClick(event) {
    if (!this.raycaster || !this.mouse || !this.camera) return;
    this.updateNormalizedPointer(event);

    if (!this.interactiveObjects || this.interactiveObjects.length === 0) {
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const candidates = this.interactiveObjects.map(m => m.object);
    const intersections = this.raycaster.intersectObjects(candidates, true);
    if (intersections.length === 0) return;

    const hit = intersections[0].object;
    const meta = this._interactiveMetaMap && this._interactiveMetaMap.get(hit.uuid);
    if (meta) {
      console.log(`🖱️ Station clicked: ${meta.stationKey} -> modal '${meta.modalId}'`);
      this.triggerModal(meta.modalId, meta.stationKey);
    }
  }

  applyHover(object) {
    this.hoveredObject = object;
    if (!this._interactiveMetaMap) return;
    const meta = this._interactiveMetaMap.get(object.uuid);
    if (!meta) return;
    meta.targetGlow = 1; // Animate towards highlight
    meta.highlighted = true;
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.cursor = 'pointer';
    }
  }

  clearHover() {
    if (!this.hoveredObject || !this._interactiveMetaMap) return;
    const meta = this._interactiveMetaMap.get(this.hoveredObject.uuid);
    if (meta) {
      meta.targetGlow = 0;
      meta.highlighted = false;
    }
    this.hoveredObject = null;
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  // Smooth visual feedback executed each frame from animate()
  updateInteractionVisuals() {
    if (!this.interactiveObjects || this.interactiveObjects.length === 0) return;
    let active = this.hoveredObject != null;
    if (!active) {
      for (let i = 0; i < this.interactiveObjects.length; i++) {
        const m = this.interactiveObjects[i];
        if (m.currentGlow > 0.001 || m.targetGlow > 0.001) { active = true; break; }
      }
    }
    if (!active) return; // nothing to update this frame
    const highlightColor = new THREE.Color(0xffd54f); // Warm accent
    this.interactiveObjects.forEach(meta => {
      meta.currentGlow += (meta.targetGlow - meta.currentGlow) * 0.15; // easing factor
      if (!meta.object.material) return;
      const mat = meta.object.material;
      if (mat.emissive) {
        const base = meta.original.emissive ? meta.original.emissive.clone() : new THREE.Color(0x000000);
        mat.emissive.copy(base.lerp(highlightColor, meta.currentGlow));
      } else if (mat.color && meta.original.color) {
        mat.color.copy(meta.original.color.clone().lerp(highlightColor, meta.currentGlow * 0.5));
      }
    });
  }

  // Placeholder methods for debug panels (will be overridden when debug module loads)
  createInteractionDebugOverlay() {
    // Will be overridden by debug panels module
  }

  runInteractionDiagnostics() {
    // Will be overridden by debug panels module
    return {
      totalMapped: Object.keys(this.stationMapping||{}).length,
      interactiveCount: this.interactiveObjects?.length || 0,
      missing: [],
      duplicatedMaterials: 0
    };
  }

  // Trigger modal by creating (if needed) a temporary hidden element
  triggerModal(modalId, stationKey = '') {
    if (!modalId) {
      console.warn('⚠️ triggerModal called without modalId');
      return;
    }

    // Debounce repeated rapid triggers for same station
    const now = performance.now();
    this._lastModalTriggerMap = this._lastModalTriggerMap || new Map();
    const lastTime = this._lastModalTriggerMap.get(modalId) || 0;
    if (now - lastTime < 400) return; // debounce duplicate rapid triggers
    this._lastModalTriggerMap.set(modalId, now);

    // Find existing triggers (could be multiple)
    const matches = Array.from(document.querySelectorAll(`[data-modal-trigger="${modalId}"]`));
    let triggerEl = null;
    if (matches.length > 0) {
      // Prefer visible element with anchor/button child
      triggerEl = matches.find(el => this._isElementVisible(el)) || matches[0];
    }

    let created = false;
    if (!triggerEl) {
      // Create a temporary structural element closer to example markup (li > a)
      const temp = document.createElement('li');
      temp.dataset.modalTrigger = modalId;
      temp.setAttribute('aria-hidden', 'true');
      temp.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;top:auto;overflow:hidden;';
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = 'auto-trigger';
      temp.appendChild(a);
      document.body.appendChild(temp);
      triggerEl = temp;
      created = true;
    }

    // Determine best dispatch target (anchor/button inside or the element itself)
    let targetEl = triggerEl.matches('a,button') ? triggerEl : triggerEl.querySelector('a,button') || triggerEl;

    // Full synthetic interaction sequence to maximize compatibility
    const eventOptions = { bubbles: true, cancelable: true };
    const sequence = ['pointerdown', 'mousedown', 'mouseup', 'click'];
    sequence.forEach(type => { try { targetEl.dispatchEvent(new MouseEvent(type, eventOptions)); } catch (e) { /* ignore */ } });

    // Fallback: if a global modal open function exists, call it
    if (typeof window.openModal === 'function') {
      try {
        window.openModal(modalId);
      } catch (e) { /* ignore */ }
    }

    // Attempt to lazy load assets for this modal after dispatch (modal may mount asynchronously)
    this.lazyLoadModalAssets(modalId);

    // Clean temporary element
    if (created) {
      setTimeout(() => {
        if (triggerEl && triggerEl.parentNode) triggerEl.parentNode.removeChild(triggerEl);
      }, 1500);
    }
  }

  _isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // ============================================================================================
  // LAZY LOADING FOR MODAL / STATION CONTENT
  // ============================================================================================
  // Usage pattern for HTML inside modal:
  // <img data-src="/path/heavy.jpg" alt="..." width="400" height="300" />
  // <source data-srcset="/path/heavy@1x.jpg 1x, /path/heavy@2x.jpg 2x" type="image/jpeg" />
  // <div data-bg-src="/path/bg.jpg"></div>
  // <video data-src="/video/clip.mp4" poster="/video/poster.jpg"></video>
  // On first user click for that station/modal, assets are populated.

  lazyLoadModalAssets(modalId, attempt = 0) {
    if (!modalId) return;
    this._lazyLoadedModals = this._lazyLoadedModals || new Set();
    if (this._lazyLoadedModals.has(modalId)) return; // already done

    const selectors = [
      `[data-modal-id="${modalId}"]`,
      `[data-modal="${modalId}"]`,
      `#${modalId}`
    ];
    let modalEl = null;
    for (const sel of selectors) {
      modalEl = document.querySelector(sel);
      if (modalEl) break;
    }

    // If modal not yet in DOM (maybe created lazily by framework), retry up to 10 times
    if (!modalEl) {
      if (attempt < 10) {
        setTimeout(() => this.lazyLoadModalAssets(modalId, attempt + 1), 120);
      }
      return;
    }

    // Images
    const imgs = modalEl.querySelectorAll('img[data-src]');
    imgs.forEach(img => {
      if (!img.getAttribute('src')) {
        img.setAttribute('src', img.getAttribute('data-src'));
      }
      const ds = img.getAttribute('data-srcset');
      if (ds && !img.getAttribute('srcset')) img.setAttribute('srcset', ds);
    });

    // Picture sources
    const sources = modalEl.querySelectorAll('source[data-srcset]');
    sources.forEach(src => {
      if (!src.getAttribute('srcset')) src.setAttribute('srcset', src.getAttribute('data-srcset'));
    });

    // Background images
    const bgEls = modalEl.querySelectorAll('[data-bg-src]');
    bgEls.forEach(el => {
      if (!el.dataset.bgLoaded) {
        el.style.backgroundImage = `url('${el.getAttribute('data-bg-src')}')`;
        el.dataset.bgLoaded = '1';
      }
    });

    // Videos
    const videos = modalEl.querySelectorAll('video[data-src]');
    videos.forEach(v => {
      if (!v.getAttribute('src')) {
        v.setAttribute('src', v.getAttribute('data-src'));
        try { v.load(); } catch (e) { /* ignore */ }
      }
    });

    // Any element with data-inline-html pointing to a URL to fetch (optional enhancement)
    const inline = modalEl.querySelectorAll('[data-inline-html]');
    inline.forEach(el => {
      if (!el.dataset.inlineLoaded) {
        const url = el.getAttribute('data-inline-html');
        fetch(url).then(r => r.text()).then(html => { el.innerHTML = html; }).catch(()=>{});
        el.dataset.inlineLoaded = '1';
      }
    });

    this._lazyLoadedModals.add(modalId);
  }
}

// =============================================================================
// GLOBAL HELPER FUNCTIONS
// =============================================================================
// These are simple global functions that will be enhanced when debug panels load

// Global method to enable debug panels
window.enableDebugPanels = async function() {
  const loader = window.simple3DLoader;
  if (!loader) {
    console.warn('⚠️ Simple3DLoader not found');
    return;
  }
  await loader.enableDebugPanels();
};

// Auto-initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.simple3DLoader = new Simple3DLoader();
  });
} else {
  window.simple3DLoader = new Simple3DLoader();
}

// Export for manual initialization if needed
window.Simple3DLoader = Simple3DLoader;

console.log('📦 Simple 3D Loader with Configuration script loaded');
console.log('🧩 Use enableDebugPanels() or window.enableDebugPanels() to load debug tools');