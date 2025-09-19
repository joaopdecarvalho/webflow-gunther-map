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

    // =============================================================================
    // PRODUCTION - FLAG POI SYSTEM
    // =============================================================================
    this.flags = [];
    this.flagCoordinates = [
      { id: 1, position: { x: -10.02, y: -7.89, z: 15.98 }, flagFile: "Fahne1.svg" },
      { id: 2, position: { x: 0.87, y: -7.04, z: 5.25 }, flagFile: "Fahne2.svg" },
      { id: 3, position: { x: 3.83, y: -7.24, z: -0.31 }, flagFile: "Fahne3.svg" },
      { id: 4, position: { x: -2.08, y: -7.06, z: -2.12 }, flagFile: "Fahne4.svg" },
      { id: 5, position: { x: 0.96, y: -7.21, z: -3.3 }, flagFile: "Fahne5.svg" },
      { id: 6, position: { x: 3.44, y: -7.14, z: -5.94 }, flagFile: "Fahne6.svg" },
      { id: 7, position: { x: 13.31, y: -7.22, z: 3.47 }, flagFile: "Fahne7.svg" },
      { id: 8, position: { x: 14.92, y: -7.61, z: -0.03 }, flagFile: "Fahne8.svg" },
      { id: 9, position: { x: 14.49, y: -7.24, z: -4.19 }, flagFile: "Fahne9.svg" },
      { id: 10, position: { x: 18.04, y: -7.28, z: -12.59 }, flagFile: "Fahne10.svg" }
    ];

    // Performance and development flags
    this.isDevelopment = this.detectDevelopmentMode();
    this.lastDebugUpdate = 0;
    this.pauseRendering = false;

    // =============================================================================
    // DEVELOPMENT ONLY - POI MAPPING SYSTEM
    // =============================================================================
    // PRODUCTION NOTE: Remove this entire section for production deployment
    if (this.isDevelopment) {
      this.poiMappingMode = false;
      this.tempPOIs = [];
      this.poiMarkers = [];
      this.raycaster = null;
      this.mouse = null; // Will be initialized after Three.js loads
      console.log('🎯 POI Mapping System initialized (DEV ONLY)');
    }
    
    // Default configuration based on your 3d-config.json
    this.config = {
      "version": "1.0.0",
      "camera": {
        "position": [10.3, 21.9, 16.0],
        "target": [-6.5, -34.2, -11.8],
        "fov": 60,
        "minDistance": 50,
        "maxDistance": 90
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
          "easing": "easeInOut"
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
      local: 'http://localhost:8080/Goetheviertel_250919_with_flags_webp80-positioned.glb',
      production: 'https://webflow-gunther-map.vercel.app/Goetheviertel_250919_with_flags_webp80-positioned.glb'
    };
    this.modelUrl = this.isDevelopment ? this.modelUrls.local : this.modelUrls.production;
    
    this.init();
  }

  detectDevelopmentMode() {
    // Check for localhost, development domains, or debug flags
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

      // Load Three.js from CDN
      await this.loadThreeJS();
      
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

    } catch (error) {
      console.error('❌ Error initializing 3D scene:', error);
    }
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

  playWelcomeAnimation() {
    const animConfig = this.config.animations.welcomeAnimation;
    console.log('🎬 Playing welcome animation with custom start/end positions (smooth expo.inOut easing)...');
    
    // Custom animation parameters from user specification
    const startPos = new THREE.Vector3(26.6, 29.9, 43.7);
    const startTarget = new THREE.Vector3(-0.8, -37.3, -9.4);
    const endPos = new THREE.Vector3(10.3, 21.9, 16.0);
    const endTarget = new THREE.Vector3(-6.5, -34.2, -11.8);
    
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
        console.log('✅ Welcome animation complete - synced with Advanced Suite');
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
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📦 Loading Three.js (attempt ${attempt}/${maxRetries})...`);
        await this.attemptThreeJSLoad();
        console.log('✅ Three.js loaded successfully!');
        return;
      } catch (error) {
        console.warn(`❌ Three.js loading attempt ${attempt} failed:`, error.message);

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

    // Create scene
    this.scene = new THREE.Scene();
    // Start with transparent background to prevent gradient flash
    this.scene.background = null; // Will be set after loading

    // Create camera using configuration
    const cameraConfig = this.config.camera;
    this.camera = new THREE.PerspectiveCamera(
      cameraConfig.fov, 
      width / height, 
      0.1, 
      1000
    );
    this.camera.position.set(...cameraConfig.position);

    // Create renderer with configuration
    const performanceConfig = this.config.performance;
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: performanceConfig.enableAntialiasing,
      alpha: true,
      premultipliedAlpha: false // Prevent alpha blending issues
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(performanceConfig.pixelRatio);
    this.renderer.setClearColor(0x000000, 0); // Transparent clear color initially
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add renderer to container
    this.container.appendChild(this.renderer.domElement);

    // Detect capabilities and adapt quality settings
    this.adaptQualitySettings();

    // Add lights
    this.setupLighting();

    // =============================================================================
    // DEVELOPMENT ONLY - POI MAPPING INITIALIZATION
    // =============================================================================
    // PRODUCTION NOTE: Remove this section for production deployment
    if (this.isDevelopment) {
      this.initializePOIMapping();
    }

    console.log('✅ Scene setup complete');
  }

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

  async loadModel() {
    return new Promise((resolve, reject) => {
      console.log('📁 Loading GLB model:', this.modelUrl);
      
      if (!window.GLTFLoader) {
        console.error('❌ GLTFLoader not available');
        reject(new Error('GLTFLoader not available'));
        return;
      }
      
      const loader = new window.GLTFLoader();
      
      loader.load(
        this.modelUrl,
        (gltf) => {
          console.log('✅ Model loaded successfully!');
          this.model = gltf.scene;
          
          // Enable shadows on all meshes and set initial opacity to 0
          this.model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Make model invisible initially for fade-in effect
              child.material.transparent = true;
              child.material.opacity = 0;
            }
          });
          
          // Add model to scene
          this.scene.add(this.model);
          
          // Center and scale model
          this.centerModel();

          // Initialize flag POI system
          this.initializeFlags();

          // Start fade-in animation for the model
          this.fadeInModel();

          resolve();
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`📊 Loading progress: ${percent}%`);
        },
        (error) => {
          console.error('❌ Error loading model:', error);
          reject(error);
        }
      );
    });
  }

  centerModel() {
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

  setupControls() {
    if (!window.OrbitControls) {
      console.warn('⚠️ OrbitControls not available, using basic mouse controls');
      this.setupBasicControls();
      return;
    }

    const cameraConfig = this.config.camera;
    const uiConfig = this.config.ui;
    
    this.controls = new window.OrbitControls(this.camera, this.renderer.domElement);
    
    // Apply configuration settings
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Restrict vertical rotation to prevent looking under the model
    this.controls.minPolarAngle = Math.PI * 0.1; // 18 degrees from top (prevents looking too far down)
    this.controls.maxPolarAngle = Math.PI * 0.34; // 81 degrees (prevents looking under the model)
    
    this.controls.minDistance = cameraConfig.minDistance;
    this.controls.maxDistance = cameraConfig.maxDistance;
    
    // Enable/disable controls based on configuration
    this.controls.enableZoom = uiConfig.enableZoom;
    this.controls.enableRotate = uiConfig.enableRotate;
    this.controls.enablePan = uiConfig.enablePan;
    
    // Set camera target from configuration
    this.controls.target.set(...cameraConfig.target);
    this.controls.update();

    console.log('🎮 Camera controls setup complete with configuration');
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

    // Throttled debug updates (development only)
    if (this.isDevelopment && (now - this.lastDebugUpdate) > 100) {
      this.updateCameraInfo();
      this.lastDebugUpdate = now;
    }

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // =============================================================================
  // DEVELOPMENT/DEBUG FUNCTIONS - Camera Position Panel
  // =============================================================================
  // These functions support the camera position panel for development/debugging.
  // Safe to remove for production if camera panel HTML is not included.
  // Panel is currently HIDDEN in staging via CSS but functions remain active.
  
  updateCameraInfo() {
    if (!this.camera || !this.controls) return;
    
    const pos = this.camera.position;
    const target = this.controls.target;
    const distance = pos.distanceTo(target);
    
    // Calculate rotation in degrees
    const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    const rotX = THREE.MathUtils.radToDeg(euler.x);
    const rotY = THREE.MathUtils.radToDeg(euler.y);
    
    // Update DOM elements if they exist
    const posElement = document.getElementById('camera-position');
    const targetElement = document.getElementById('camera-target');
    const distanceElement = document.getElementById('camera-distance');
    const rotationElement = document.getElementById('camera-rotation');
    
    if (posElement) {
      posElement.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
    }
    if (targetElement) {
      targetElement.textContent = `${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}`;
    }
    if (distanceElement) {
      distanceElement.textContent = distance.toFixed(1);
    }
    if (rotationElement) {
      rotationElement.textContent = `${rotX.toFixed(1)}°, ${rotY.toFixed(1)}°`;
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

    // Clean up flags
    this.disposeFlags();

    // =============================================================================
    // DEVELOPMENT ONLY - POI CLEANUP
    // =============================================================================
    // PRODUCTION NOTE: Remove this section for production deployment
    if (this.isDevelopment) {
      this.disposePOIMapping();
    }

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

  // =============================================================================
  // PRODUCTION - FLAG POI SYSTEM METHODS
  // =============================================================================

  initializeFlags() {
    console.log('🚩 Initializing flag POI system...');

    this.flagCoordinates.forEach((flagData, index) => {
      this.createFlag(flagData, index);
    });

    console.log(`✅ ${this.flags.length} flags created and positioned`);
  }

  createFlag(flagData, index) {
    // Create 3D flag group to hold all components
    const flagGroup = new THREE.Group();

    // =============================================================================
    // 1. CREATE FLAG POLE (VERTICAL CYLINDER)
    // =============================================================================
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4, 8); // radius, height, segments
    const poleMaterial = new THREE.MeshLambertMaterial({
      color: 0xffe886 // Same yellow as flag (#ffe886)
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2; // Center pole vertically
    flagGroup.add(pole);

    // =============================================================================
    // 2. CREATE FLAG SHAPE (CURVED TRIANGULAR)
    // =============================================================================
    // Create custom flag geometry based on SVG path analysis
    const flagShape = new THREE.Shape();

    // Scale down the SVG coordinates to reasonable 3D size (original was 334x434)
    const scale = 0.01; // Scale factor to convert SVG to 3D units

    // Recreate the curved triangular flag shape from SVG path
    flagShape.moveTo(16.988 * scale, 0);
    flagShape.lineTo((16.988 + 82.193) * scale, 4.364 * scale);

    // Create curved edge using quadratic curves to approximate the SVG path
    flagShape.quadraticCurveTo(
      (16.988 + 82.193 + 100) * scale, 30 * scale,
      (16.988 + 82.193 + 150) * scale, 60 * scale
    );
    flagShape.quadraticCurveTo(
      (16.988 + 82.193 + 200) * scale, 100 * scale,
      (16.988 + 82.193 + 226.731) * scale, (4.364 + 84.821) * scale
    );

    // Complete the flag outline with more curved sections
    flagShape.quadraticCurveTo(
      250 * scale, 150 * scale,
      200 * scale, 200 * scale
    );
    flagShape.quadraticCurveTo(
      150 * scale, 230 * scale,
      100 * scale, 230 * scale
    );
    flagShape.lineTo(16.988 * scale, 230 * scale);
    flagShape.lineTo(16.988 * scale, 0);

    const flagGeometry = new THREE.ExtrudeGeometry(flagShape, {
      depth: 0.05, // Thin flag
      bevelEnabled: false
    });

    const flagMaterial = new THREE.MeshLambertMaterial({
      color: 0xffe886, // Yellow color from SVG (#ffe886)
      side: THREE.DoubleSide
    });

    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);

    // Position flag next to pole
    flagMesh.position.x = 1.2; // Offset from pole
    flagMesh.position.y = 2.8; // Upper part of pole
    flagMesh.rotation.y = Math.PI / 2; // Face outward from pole

    flagGroup.add(flagMesh);

    // =============================================================================
    // 3. CREATE 3D NUMBER TEXT
    // =============================================================================
    // Create a canvas-based number texture for the flag
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');

    // Draw number on canvas
    context.fillStyle = '#000000'; // Black text
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(flagData.id.toString(), 64, 64);

    // Create texture from canvas
    const numberTexture = new THREE.CanvasTexture(canvas);
    const numberGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const numberMaterial = new THREE.MeshLambertMaterial({
      map: numberTexture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
    numberMesh.position.x = 1.8; // On the flag
    numberMesh.position.y = 3.2; // Upper area of flag
    numberMesh.rotation.y = Math.PI / 2; // Face same direction as flag

    flagGroup.add(numberMesh);

    // =============================================================================
    // POSITION THE ENTIRE FLAG GROUP
    // =============================================================================
    flagGroup.position.set(
      flagData.position.x,
      flagData.position.y + 2.1, // Adjust height so base of pole touches ground
      flagData.position.z
    );

    // Store references
    this.flags.push({
      flag: flagGroup,
      data: flagData
    });

    // Add to scene
    this.scene.add(flagGroup);

    console.log(`📍 3D Flag ${flagData.id} created at (${flagData.position.x}, ${flagData.position.y}, ${flagData.position.z})`);
  }

  animateFlags() {
    // No animation needed - flags are static
  }

  disposeFlags() {
    console.log('🧹 Cleaning up flags...');

    this.flags.forEach(flagObj => {
      // Remove from scene
      this.scene.remove(flagObj.flag);

      // Dispose geometries and materials
      flagObj.flag.geometry.dispose();
      flagObj.flag.material.dispose();
      if (flagObj.flag.material.map) {
        flagObj.flag.material.map.dispose();
      }
    });

    this.flags = [];
    console.log('✅ Flags disposed');
  }

  // =============================================================================
  // DEVELOPMENT ONLY - POI MAPPING METHODS
  // =============================================================================
  // PRODUCTION NOTE: Remove this entire section for production deployment

  initializePOIMapping() {
    if (!this.isDevelopment) return;

    console.log('🎯 Initializing POI mapping system...');

    // Initialize raycaster and mouse vector for 3D intersection detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Add click event listener for POI placement
    this.renderer.domElement.addEventListener('click', (event) => {
      if (this.poiMappingMode) {
        this.placePOI(event);
      }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.key === 'p' && event.ctrlKey && event.altKey) {
        event.preventDefault();
        this.togglePOIMappingMode();
      }
      if (event.key === 'c' && event.ctrlKey && this.poiMappingMode) {
        event.preventDefault();
        this.clearAllPOIs();
      }
    });

    console.log('✅ POI mapping system ready (Ctrl+Alt+P to toggle, Ctrl+C to clear)');
  }

  togglePOIMappingMode() {
    if (!this.isDevelopment) return;

    this.poiMappingMode = !this.poiMappingMode;

    if (this.poiMappingMode) {
      console.log('🎯 POI Mapping Mode: ENABLED - Click on the 3D model to place POIs');
      this.showPOIMappingNotification('POI Mapping Mode: ENABLED\nClick on the 3D model to place POIs\nCtrl+C to clear all POIs');

      // Change cursor to crosshair
      this.renderer.domElement.style.cursor = 'crosshair';

      // Disable orbit controls to prevent interference
      if (this.controls) {
        this.controls.enabled = false;
      }
    } else {
      console.log('🎯 POI Mapping Mode: DISABLED');
      this.showPOIMappingNotification('POI Mapping Mode: DISABLED');

      // Restore normal cursor
      this.renderer.domElement.style.cursor = 'default';

      // Re-enable orbit controls
      if (this.controls) {
        this.controls.enabled = true;
      }
    }
  }

  placePOI(event) {
    if (!this.isDevelopment || !this.model) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the raycaster with camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate intersections with the model
    const intersects = this.raycaster.intersectObject(this.model, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const position = intersection.point;

      // Create POI data
      const poiData = {
        id: this.tempPOIs.length + 1,
        position: {
          x: parseFloat(position.x.toFixed(2)),
          y: parseFloat(position.y.toFixed(2)),
          z: parseFloat(position.z.toFixed(2))
        },
        name: `POI ${this.tempPOIs.length + 1}`,
        type: 'default',
        timestamp: new Date().toISOString()
      };

      // Add to temporary POI list
      this.tempPOIs.push(poiData);

      // Create visual marker
      this.createPOIMarker(poiData);

      console.log('🎯 POI placed:', poiData);
      this.updatePOIExport();
    }
  }

  createPOIMarker(poiData) {
    if (!this.isDevelopment) return;

    // Create a visual marker at the POI position
    const markerGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    marker.position.set(poiData.position.x, poiData.position.y, poiData.position.z);
    marker.userData = { poiId: poiData.id, isPOIMarker: true };

    this.scene.add(marker);
    this.poiMarkers.push(marker);

    // Create text label
    this.createPOILabel(poiData, marker);
  }

  createPOILabel(poiData, marker) {
    if (!this.isDevelopment) return;

    // Create a simple text label using CSS3D (simplified approach)
    // This is a basic implementation - could be enhanced with HTML labels
    const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);

    label.position.copy(marker.position);
    label.position.y += 1; // Position above the marker
    label.lookAt(this.camera.position);

    this.scene.add(label);
    this.poiMarkers.push(label);
  }

  clearAllPOIs() {
    if (!this.isDevelopment) return;

    console.log('🧹 Clearing all POI markers...');

    // Remove visual markers from scene
    this.poiMarkers.forEach(marker => {
      this.scene.remove(marker);
      if (marker.geometry) marker.geometry.dispose();
      if (marker.material) marker.material.dispose();
    });

    // Clear arrays
    this.tempPOIs = [];
    this.poiMarkers = [];

    this.updatePOIExport();
    console.log('✅ All POI markers cleared');
  }

  updatePOIExport() {
    if (!this.isDevelopment) return;

    // Update export data display in console
    if (this.tempPOIs.length > 0) {
      console.log('📊 Current POIs:', this.tempPOIs);
      console.log('📋 Export data:', JSON.stringify(this.tempPOIs, null, 2));
    }
  }

  showPOIMappingNotification(message) {
    if (!this.isDevelopment) return;

    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-line;
      z-index: 10000;
      max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Add POI cleanup to existing dispose method
  disposePOIMapping() {
    if (!this.isDevelopment) return;

    console.log('🧹 Cleaning up POI mapping system...');

    // Clear all POI markers
    this.clearAllPOIs();

    // Remove event listeners (handled by main dispose method)
    this.poiMappingMode = false;
    this.raycaster = null;
  }
}

// =============================================================================
// DEVELOPMENT/DEBUG GLOBAL FUNCTIONS - Camera Position Panel
// =============================================================================
// These global functions are attached to window for camera panel interaction.
// PRODUCTION NOTE: Safe to remove these functions if camera panel is not needed:
// - window.toggleCameraPanel
// - window.copyCurrentPosition
// Functions will not error if DOM elements don't exist.

// Global functions for camera panel interaction
window.toggleCameraPanel = function() {
  const content = document.getElementById('camera-content');
  const btn = document.getElementById('camera-btn');
  
  if (content && btn) {
    const isHidden = content.classList.contains('hidden');
    
    if (isHidden) {
      content.classList.remove('hidden');
      btn.textContent = '−';
    } else {
      content.classList.add('hidden');
      btn.textContent = '+';
    }
  }
};

window.copyCurrentPosition = async function() {
  const loader = window.simple3DLoader;
  if (!loader || !loader.camera || !loader.controls) return;
  
  const pos = loader.camera.position;
  const target = loader.controls.target;
  const jsCode = `// Camera position for Webflow\n`+
`camera.position.set(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)});\n`+
`camera.lookAt(${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)});\n`+
`controls.target.set(${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)});`;
  
  try {
    await navigator.clipboard.writeText(jsCode);
    console.log('📋 Camera position copied to clipboard!');
    
    // Show visual feedback
    const btn = document.querySelector('.copy-btn');
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '✅ Copied!';
      btn.style.background = '#059669';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#374151';
      }, 2000);
    }
  } catch (err) {
    console.warn('Copy failed, code logged to console:', jsCode);
    alert('Copy failed - check console for camera position code');
  }
};

// =============================================================================
// DEVELOPMENT ONLY - POI MAPPING GLOBAL FUNCTIONS
// =============================================================================
// PRODUCTION NOTE: Remove this entire section for production deployment

window.togglePOIMapping = function() {
  const loader = window.simple3DLoader;
  if (!loader || !loader.isDevelopment) return;

  loader.togglePOIMappingMode();
};

window.clearPOIs = function() {
  const loader = window.simple3DLoader;
  if (!loader || !loader.isDevelopment) return;

  loader.clearAllPOIs();
};

window.exportPOIs = async function() {
  const loader = window.simple3DLoader;
  if (!loader || !loader.isDevelopment || loader.tempPOIs.length === 0) {
    console.log('No POIs to export');
    return;
  }

  const poiConfig = {
    pois: loader.tempPOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      type: poi.type,
      position: poi.position,
      // Template for additional POI data
      content: {
        title: poi.name,
        description: "Add POI description here",
        image: "path/to/poi/image.jpg",
        website: "https://example.com"
      }
    })),
    exportedAt: new Date().toISOString(),
    totalPOIs: loader.tempPOIs.length
  };

  const exportData = JSON.stringify(poiConfig, null, 2);

  try {
    await navigator.clipboard.writeText(exportData);
    console.log('📋 POI configuration copied to clipboard!');
    console.log('📊 Exported POIs:', poiConfig);

    // Show notification
    if (loader.showPOIMappingNotification) {
      loader.showPOIMappingNotification(`✅ ${poiConfig.totalPOIs} POIs exported to clipboard!\n\nPaste into your POI configuration file.`);
    }
  } catch (err) {
    console.warn('Copy failed, POI data logged to console:', exportData);
    alert('Copy failed - check console for POI configuration');
  }
};

// Console helper commands
if (typeof window !== 'undefined' && window.simple3DLoader && window.simple3DLoader.isDevelopment) {
  console.log(`
🎯 POI Mapping Commands Available:
- togglePOIMapping() - Enable/disable POI placement mode
- clearPOIs() - Remove all placed POI markers
- exportPOIs() - Copy POI configuration to clipboard
- Ctrl+Alt+P - Toggle POI mapping mode
- Ctrl+C - Clear all POIs (when in POI mode)
  `);
}

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