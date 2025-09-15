/**
 * Final Production 3D Map Implementation for Webflow
 * Ready for deployment with GitHub-hosted models and DRACO support
 */

(function() {
  'use strict';

  // Load Three.js and required modules from CDN with multiple fallbacks
  function loadThreeJS() {
    if (typeof THREE !== 'undefined') {
      console.log('Three.js already loaded, initializing map...');
      initializeMap();
      return;
    }

    console.log('Loading Three.js from CDN with fallbacks...');
    
    // Multiple CDN sources for better reliability - using ES modules for r158+
    const scripts = [
      {
        name: 'THREE.js Core',
        urls: [
          'https://unpkg.com/three@0.158.0/build/three.min.js',
          'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js'
        ],
        check: () => typeof THREE !== 'undefined'
      },
      {
        name: 'GLTFLoader',
        urls: [
          'https://cdn.jsdelivr.net/npm/three@0.137.0/examples/js/loaders/GLTFLoader.js'
        ],
        check: () => typeof THREE !== 'undefined' && THREE.GLTFLoader
      },
      {
        name: 'DRACOLoader',
        urls: [
          'https://cdn.jsdelivr.net/npm/three@0.137.0/examples/js/loaders/DRACOLoader.js'
        ],
        check: () => typeof THREE !== 'undefined' && THREE.DRACOLoader
      },
      {
        name: 'OrbitControls',
        urls: [
          'https://cdn.jsdelivr.net/npm/three@0.137.0/examples/js/controls/OrbitControls.js'
        ],
        check: () => typeof THREE !== 'undefined' && THREE.OrbitControls
      }
    ];

    let scriptIndex = 0;
    
    function loadNextScript() {
      if (scriptIndex >= scripts.length) {
        console.log('All Three.js scripts loaded successfully');
        setTimeout(initializeMap, 100);
        return;
      }

      const scriptInfo = scripts[scriptIndex];
      let urlIndex = 0;
      
      function tryNextUrl() {
        if (urlIndex >= scriptInfo.urls.length) {
          console.error(`❌ Failed to load ${scriptInfo.name} from all CDN sources`);
          scriptIndex++;
          loadNextScript();
          return;
        }
        
        const script = document.createElement('script');
        script.src = scriptInfo.urls[urlIndex];
        
        const timeout = setTimeout(() => {
          console.warn(`⏰ Timeout loading ${scriptInfo.name} from ${scriptInfo.urls[urlIndex]}`);
          document.head.removeChild(script);
          urlIndex++;
          tryNextUrl();
        }, 8000); // 8 second timeout
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log(`✅ Loaded ${scriptInfo.name} from ${scriptInfo.urls[urlIndex]}`);
          
          // Verify the script loaded what we expected
          if (scriptInfo.check()) {
            scriptIndex++;
            setTimeout(loadNextScript, 100);
          } else {
            console.warn(`⚠️ ${scriptInfo.name} loaded but dependency not available, trying next URL`);
            urlIndex++;
            tryNextUrl();
          }
        };
        
        script.onerror = () => {
          clearTimeout(timeout);
          console.warn(`❌ Failed to load ${scriptInfo.name} from ${scriptInfo.urls[urlIndex]}`);
          urlIndex++;
          tryNextUrl();
        };
        
        document.head.appendChild(script);
      }
      
      tryNextUrl();
    }

    loadNextScript();
  }

  function initializeMap() {
    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded');
      return;
    }

    console.log('Initializing 3D Map...');

    class Map3D {
      constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.container = null;
        this.animationId = null;
        
        // Production model URLs from GitHub (with absolute texture and bin file URLs)
        this.modelUrls = {
          goetheviertel: 'https://raw.githubusercontent.com/joaopdecarvalho/webflow-gunther-map/master/public/Goetheviertel_250812_with-textures_webp25.glb'
        };
        
        // Default configuration (fallback)
        this.config = {
          version: "1.0.0",
          camera: {
            position: [0, 80, 150],
            target: [0, 0, 0],
            fov: 60,
            minDistance: 20,
            maxDistance: 800,
            enablePan: true,
            enableZoom: true,
            enableRotate: true,
            enableDamping: true,
            dampingFactor: 0.05,
            minPolarAngle: 0,
            maxPolarAngle: 1.5707963267948966,
            autoRotate: false,
            autoRotateSpeed: 0.5
          },
          lighting: {
            warmAmbient: { enabled: false, intensity: 0.6, skyColor: "#404040", groundColor: "#404040" },
            mainLight: { enabled: false, intensity: 1.0, castShadows: false },
            fillLight: { enabled: false, intensity: 0.4, color: "#87ceeb" },
            ambientLight: { enabled: true, intensity: 0.6 }
          },
          models: { primary: "goetheviertel" },
          animations: {
            welcomeAnimation: {
              enabled: false,
              duration: 3000,
              easing: "easeInOutCubic",
              startPosition: [200, 200, 200],
              endPosition: [0, 80, 150],
              startTarget: [0, 0, 0],
              endTarget: [0, 0, 0]
            }
          },
          performance: { 
            qualityLevel: "high", 
            targetFPS: 60, 
            enableAntialiasing: true, 
            pixelRatio: 1,
            shadowMapEnabled: false,
            shadowMapType: "PCFSoftShadowMap"
          },
          ui: { 
            showLoadingProgress: true, 
            enableControls: true, 
            enableZoom: true, 
            enableRotate: true, 
            enablePan: true,
            showPerformanceStats: false,
            theme: "light"
          },
          accessibility: { 
            respectMotionPreference: true, 
            keyboardControls: true, 
            ariaLabels: true,
            screenReaderSupport: true,
            focusManagement: true,
            colorContrast: "high"
          }
        };
        
        // Environment-aware configuration URL (same as embed code)
        const isDev = location.hostname.includes('.webflow.io') || location.hostname.includes('localhost');
        const baseUrl = window.SCRIPT_BASE_URL || (isDev 
          ? 'http://localhost:8080/src' 
          : 'https://joaopdecarvalho.github.io/webflow-gunther-map/src');
        this.configUrl = baseUrl + '/config/3d-config.json';
        
        this.currentModelUrl = this.modelUrls[this.config.models.primary];
        this.isInitialized = false;
        
        console.log('Map3D constructor called');
        this.init();
      }

      async init() {
        const initSteps = [
          { name: 'Configuration Loading', fn: () => this.loadConfiguration() },
          { name: 'Container Creation', fn: () => this.createContainer() },
          { name: 'Scene Setup', fn: () => this.setupScene() },
          { name: 'Camera Setup', fn: () => this.setupCamera() },
          { name: 'Renderer Setup', fn: () => this.setupRenderer() },
          { name: 'Controls Setup', fn: () => this.setupControls() },
          { name: 'Lighting Setup', fn: () => this.setupLighting() },
          { name: 'Model Loading', fn: () => this.loadModel() },
          { name: 'Event Listeners', fn: () => this.setupEventListeners() },
          { name: 'Animation Start', fn: () => this.animate() },
          { name: 'Welcome Animation', fn: () => this.playWelcomeAnimation() }
        ];
        
        let criticalError = false;
        let completedSteps = 0;
        
        console.log('Starting Map3D initialization...');
        
        for (const [index, step] of initSteps.entries()) {
          try {
            console.log(`${index + 1}/${initSteps.length} - ${step.name}...`);
            
            // Handle async steps
            if (step.name === 'Configuration Loading' || 
                step.name === 'Model Loading' || 
                step.name === 'Welcome Animation') {
              await step.fn();
            } else {
              step.fn();
            }
            
            completedSteps++;
            console.log(`✅ ${step.name} completed`);
            
          } catch (error) {
            const isCritical = ['Scene Setup', 'Camera Setup', 'Renderer Setup'].includes(step.name);
            
            if (isCritical) {
              console.error(`❌ Critical error in ${step.name}:`, error);
              criticalError = true;
              this.showErrorFallback(`Failed to initialize 3D Map: ${step.name} error`);
              return;
            } else {
              console.warn(`⚠️  Non-critical error in ${step.name}:`, error.message);
              // Continue with remaining steps
            }
          }
        }
        
        if (!criticalError) {
          this.isInitialized = true;
          console.log(`🎉 3D Map initialized successfully! (${completedSteps}/${initSteps.length} steps completed)`);
          
          // Dispatch initialization event for other scripts
          window.dispatchEvent(new CustomEvent('map3dInitialized', {
            detail: { 
              instance: this,
              completedSteps,
              totalSteps: initSteps.length,
              config: this.config
            }
          }));
        }
      }
      
      showErrorFallback(message) {
        console.error('Showing error fallback:', message);
        
        // Create error display
        if (this.container) {
          this.container.innerHTML = `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            ">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🏗️</div>
              <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem;">3D Map Temporarily Unavailable</h3>
              <p style="margin: 0 0 1.5rem 0; opacity: 0.9; max-width: 400px; line-height: 1.4;">
                We're experiencing technical difficulties loading the interactive 3D map. 
                Please try refreshing the page.
              </p>
              <button 
                onclick="window.location.reload()" 
                style="
                  background: rgba(255,255,255,0.2);
                  border: 2px solid rgba(255,255,255,0.3);
                  color: white;
                  padding: 12px 24px;
                  border-radius: 25px;
                  cursor: pointer;
                  font-size: 1rem;
                  transition: all 0.3s ease;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                onmouseout="this.style.background='rgba(255,255,255,0.2)'"
              >
                Refresh Page
              </button>
              <p style="margin: 2rem 0 0 0; font-size: 0.8rem; opacity: 0.6;">
                Error: ${message}
              </p>
            </div>
          `;
        }
      }

      async loadConfiguration(maxRetries = 2) {
        const attemptLoad = async (attempt) => {
          try {
            console.log(`Loading configuration from: ${this.configUrl} (attempt ${attempt + 1})`);
            
            // Add cache busting to ensure we get the latest configuration
            const cacheBuster = `?v=${Date.now()}&attempt=${attempt}`;
            const response = await fetch(this.configUrl + cacheBuster, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              },
              timeout: 5000 // 5 second timeout
            });
            
            if (response.ok) {
              const externalConfig = await response.json();
              
              // Validate basic structure
              if (!externalConfig || typeof externalConfig !== 'object') {
                throw new Error('Invalid configuration format received');
              }
              
              // Merge external configuration with defaults (external config takes precedence)
              this.config = this.mergeConfiguration(this.config, externalConfig);
              
              // Update model URL based on configuration
              if (this.config.models?.primary && this.modelUrls[this.config.models.primary]) {
                this.currentModelUrl = this.modelUrls[this.config.models.primary];
              }
              
              console.log('✅ Configuration loaded successfully:', {
                version: this.config.version,
                source: 'external',
                camera: this.config.camera,
                lighting: Object.keys(this.config.lighting).filter(key => this.config.lighting[key]?.enabled),
                animations: this.config.animations?.welcomeAnimation?.enabled ? 'enabled' : 'disabled'
              });
              
              return true; // Success
              
            } else if (response.status === 404) {
              console.warn(`⚠️  Configuration file not found (404), using defaults`);
              return false; // Don't retry on 404
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
          } catch (error) {
            if (error.name === 'AbortError') {
              throw new Error('Configuration loading timeout');
            }
            throw error;
          }
        };
        
        // Try to load configuration with retries
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const success = await attemptLoad(attempt);
            if (success) return; // Configuration loaded successfully
            if (attempt === 0) break; // Don't retry on 404
          } catch (error) {
            const isLastAttempt = attempt === maxRetries;
            if (isLastAttempt) {
              console.error(`❌ Configuration loading failed after ${maxRetries + 1} attempts:`, error.message);
              break;
            } else {
              console.warn(`⚠️  Attempt ${attempt + 1} failed, retrying... (${error.message})`);
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
          }
        }
        
        // Fallback: ensure we have a valid configuration
        this.validateAndRepairConfiguration();
        
        console.log('ℹ️  Using fallback configuration:', {
          version: this.config.version,
          source: 'default',
          camera: this.config.camera,
          lighting: Object.keys(this.config.lighting).filter(key => this.config.lighting[key]?.enabled),
          animations: this.config.animations?.welcomeAnimation?.enabled ? 'enabled' : 'disabled'
        });
      }
      
      validateAndRepairConfiguration() {
        console.log('Validating and repairing configuration...');
        
        // Ensure essential properties exist with safe defaults
        if (!this.config.camera) {
          this.config.camera = { position: [0, 80, 150], target: [0, 0, 0], fov: 60 };
        }
        
        if (!this.config.lighting) {
          this.config.lighting = { ambientLight: { enabled: true, intensity: 0.6 } };
        }
        
        if (!this.config.models) {
          this.config.models = { primary: "goetheviertel" };
        }
        
        // Ensure at least one light is enabled
        const hasEnabledLight = Object.values(this.config.lighting).some(light => light?.enabled);
        if (!hasEnabledLight) {
          console.log('No lights enabled, enabling ambient light as fallback');
          if (!this.config.lighting.ambientLight) {
            this.config.lighting.ambientLight = {};
          }
          this.config.lighting.ambientLight.enabled = true;
          this.config.lighting.ambientLight.intensity = 0.6;
        }
        
        // Ensure model URL is valid
        if (this.config.models.primary && this.modelUrls[this.config.models.primary]) {
          this.currentModelUrl = this.modelUrls[this.config.models.primary];
        } else {
          this.currentModelUrl = this.modelUrls.goetheviertel;
          this.config.models.primary = "goetheviertel";
        }
        
        console.log('✅ Configuration validated and repaired');
      }
      
      mergeConfiguration(defaultConfig, externalConfig) {
        // Deep merge function to combine configurations
        function deepMerge(target, source) {
          const output = { ...target };
          if (source && typeof source === 'object' && !Array.isArray(source)) {
            Object.keys(source).forEach(key => {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!(key in target)) {
                  output[key] = source[key];
                } else {
                  output[key] = deepMerge(target[key], source[key]);
                }
              } else {
                output[key] = source[key];
              }
            });
          }
          return output;
        }
        
        return deepMerge(defaultConfig, externalConfig);
      }

      createContainer() {
        console.log('Creating 3D map container...');
        
        // First try to use existing webgl-container by class or ID
        this.container = document.querySelector('.webgl-container') || document.querySelector('#webgl-container');
        
        if (this.container) {
          console.log('Found existing webgl-container, using it');
          // Configure the existing container
          this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1;
            background: linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #F0E68C 100%);
            overflow: hidden;
            pointer-events: auto;
          `;
        } else {
          console.log('No existing webgl-container found, creating new one');
          // Fallback: create new container
          this.container = document.createElement('div');
          this.container.id = 'map-3d-container';
          this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1;
            background: linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #F0E68C 100%);
            overflow: hidden;
            pointer-events: auto;
          `;
          document.body.insertBefore(this.container, document.body.firstChild);
        }
        
        this.ensureUILayering();
      }

      ensureUILayering() {
        const pageWrap = document.querySelector('[class*="page_wrap"], .page_wrap, #page_wrap');
        if (pageWrap) {
          pageWrap.style.position = 'relative';
          pageWrap.style.zIndex = '10';
          pageWrap.style.pointerEvents = 'auto';
        }

        const contentSelectors = [
          '[class*="main"]', '[class*="content"]', '.main-content',
          'main', 'header', 'nav', 'footer'
        ];

        contentSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el && el !== this.container) {
              el.style.position = el.style.position || 'relative';
              el.style.zIndex = el.style.zIndex || '5';
            }
          });
        });
      }

      setupScene() {
        console.log('Setting up Three.js scene...');
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 1000);
      }

      setupCamera() {
        const camConfig = this.config.camera;
        
        this.camera = new THREE.PerspectiveCamera(
          camConfig.fov || 60,
          window.innerWidth / window.innerHeight,
          0.1,
          2000
        );
        
        // Set camera position from configuration
        if (camConfig.position && Array.isArray(camConfig.position) && camConfig.position.length === 3) {
          this.camera.position.set(camConfig.position[0], camConfig.position[1], camConfig.position[2]);
        } else {
          this.camera.position.set(0, 80, 150);
        }
        
        // Set camera target from configuration
        if (camConfig.target && Array.isArray(camConfig.target) && camConfig.target.length === 3) {
          this.camera.lookAt(camConfig.target[0], camConfig.target[1], camConfig.target[2]);
        } else {
          this.camera.lookAt(0, 0, 0);
        }
        
        console.log('Camera configured:', {
          position: this.camera.position,
          fov: this.camera.fov,
          target: camConfig.target
        });
      }

      setupRenderer() {
        console.log('Setting up Three.js renderer...');
        this.renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        if (this.renderer.shadowMap) {
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        if (this.renderer.toneMapping !== undefined) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1;
        }
        
        if (this.renderer.outputEncoding !== undefined) {
          this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
        
        this.container.appendChild(this.renderer.domElement);
      }

      setupControls() {
        if (!THREE.OrbitControls) {
          console.warn('OrbitControls not available, camera controls disabled');
          return;
        }
        
        console.log('Setting up camera controls...');
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        const camConfig = this.config.camera;
        const uiConfig = this.config.ui;
        
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        
        // Use configuration values for distance limits
        this.controls.minDistance = camConfig.minDistance || 20;
        this.controls.maxDistance = camConfig.maxDistance || 800;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        
        // Set camera target for controls
        if (camConfig.target && Array.isArray(camConfig.target) && camConfig.target.length === 3) {
          this.controls.target.set(camConfig.target[0], camConfig.target[1], camConfig.target[2]);
        }
        
        // Configure interaction based on UI settings
        this.controls.enableZoom = uiConfig.enableZoom !== false;
        this.controls.enableRotate = uiConfig.enableRotate !== false;
        this.controls.enablePan = uiConfig.enablePan !== false;
        
        console.log('Controls configured:', {
          minDistance: this.controls.minDistance,
          maxDistance: this.controls.maxDistance,
          target: this.controls.target,
          zoom: this.controls.enableZoom,
          rotate: this.controls.enableRotate,
          pan: this.controls.enablePan
        });
      }

      setupLighting() {
        console.log('Setting up scene lighting...');
        
        const lightingConfig = this.config.lighting;
        
        // Store light references for potential future updates
        this.lights = {};
        
        // Warm Ambient Light (Hemisphere Light)
        if (lightingConfig.warmAmbient && lightingConfig.warmAmbient.enabled) {
          const skyColor = lightingConfig.warmAmbient.skyColor || '#fff5f5';
          const groundColor = lightingConfig.warmAmbient.groundColor || '#bd9a1f';
          const intensity = lightingConfig.warmAmbient.intensity || 3.9;
          
          this.lights.warmAmbient = new THREE.HemisphereLight(
            new THREE.Color(skyColor),
            new THREE.Color(groundColor),
            intensity
          );
          this.scene.add(this.lights.warmAmbient);
          console.log('✅ Warm ambient light added:', { skyColor, groundColor, intensity });
        }
        
        // Main Directional Light
        if (lightingConfig.mainLight && lightingConfig.mainLight.enabled) {
          const intensity = lightingConfig.mainLight.intensity || 1.0;
          const castShadows = lightingConfig.mainLight.castShadows || false;
          
          this.lights.mainLight = new THREE.DirectionalLight(0xffffff, intensity);
          this.lights.mainLight.position.set(200, 200, 100);
          
          if (castShadows && this.lights.mainLight.shadow) {
            this.lights.mainLight.castShadow = true;
            this.lights.mainLight.shadow.mapSize.width = 2048;
            this.lights.mainLight.shadow.mapSize.height = 2048;
            this.lights.mainLight.shadow.camera.near = 0.5;
            this.lights.mainLight.shadow.camera.far = 1000;
            this.lights.mainLight.shadow.camera.left = -200;
            this.lights.mainLight.shadow.camera.right = 200;
            this.lights.mainLight.shadow.camera.top = 200;
            this.lights.mainLight.shadow.camera.bottom = -200;
          }
          
          this.scene.add(this.lights.mainLight);
          console.log('✅ Main directional light added:', { intensity, castShadows });
        }
        
        // Fill Light
        if (lightingConfig.fillLight && lightingConfig.fillLight.enabled) {
          const color = lightingConfig.fillLight.color || '#87ceeb';
          const intensity = lightingConfig.fillLight.intensity || 0.4;
          
          this.lights.fillLight = new THREE.DirectionalLight(new THREE.Color(color), intensity);
          this.lights.fillLight.position.set(-100, 50, -100);
          this.scene.add(this.lights.fillLight);
          console.log('✅ Fill light added:', { color, intensity });
        }
        
        // Ambient Light (basic)
        if (lightingConfig.ambientLight && lightingConfig.ambientLight.enabled) {
          const intensity = lightingConfig.ambientLight.intensity || 0.6;
          
          this.lights.ambientLight = new THREE.AmbientLight(0x404040, intensity);
          this.scene.add(this.lights.ambientLight);
          console.log('✅ Ambient light added:', { intensity });
        }
        
        // If no lights are enabled, add a basic fallback
        const hasAnyLight = Object.keys(this.lights).length > 0;
        if (!hasAnyLight) {
          console.warn('⚠️  No lights enabled in configuration, adding fallback ambient light');
          this.lights.fallback = new THREE.AmbientLight(0x404040, 0.6);
          this.scene.add(this.lights.fallback);
        }
        
        console.log('Lighting configuration applied:', Object.keys(this.lights));
      }

      playWelcomeAnimation() {
        const animConfig = this.config.animations?.welcomeAnimation;
        
        // Check if animation is enabled and motion preference is respected
        if (!animConfig?.enabled) {
          console.log('Welcome animation disabled in configuration');
          return Promise.resolve();
        }
        
        // Respect motion preference
        if (this.config.accessibility?.respectMotionPreference && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          console.log('Welcome animation skipped due to reduced motion preference');
          return Promise.resolve();
        }
        
        console.log('Starting welcome animation...');
        
        return new Promise((resolve) => {
          const duration = animConfig.duration || 3000;
          const easing = animConfig.easing || 'easeInOutCubic';
          
          // Get start and end positions from configuration
          const startPos = animConfig.startPosition || [200, 200, 200];
          const endPos = animConfig.endPosition || this.config.camera.position || [100, 100, 100];
          const startTarget = animConfig.startTarget || [0, 0, 0];
          const endTarget = animConfig.endTarget || this.config.camera.target || [0, 0, 0];
          
          // Set initial camera position
          this.camera.position.set(...startPos);
          if (this.controls && this.controls.target) {
            this.controls.target.set(...startTarget);
          }
          
          const startTime = Date.now();
          
          const animateFrame = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply easing function
            let easedProgress = progress;
            if (easing === 'easeInOut' || easing === 'easeInOutCubic') {
              easedProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            } else if (easing === 'easeOut') {
              easedProgress = 1 - Math.pow(1 - progress, 3);
            } else if (easing === 'easeIn') {
              easedProgress = progress * progress * progress;
            }
            
            // Interpolate camera position
            const currentPos = [
              startPos[0] + (endPos[0] - startPos[0]) * easedProgress,
              startPos[1] + (endPos[1] - startPos[1]) * easedProgress,
              startPos[2] + (endPos[2] - startPos[2]) * easedProgress
            ];
            
            const currentTarget = [
              startTarget[0] + (endTarget[0] - startTarget[0]) * easedProgress,
              startTarget[1] + (endTarget[1] - startTarget[1]) * easedProgress,
              startTarget[2] + (endTarget[2] - startTarget[2]) * easedProgress
            ];
            
            // Update camera and controls
            this.camera.position.set(...currentPos);
            if (this.controls && this.controls.target) {
              this.controls.target.set(...currentTarget);
              this.controls.update();
            }
            
            if (progress < 1) {
              requestAnimationFrame(animateFrame);
            } else {
              console.log('Welcome animation completed');
              resolve();
            }
          };
          
          requestAnimationFrame(animateFrame);
        });
      }

      async loadModel() {
        if (!THREE.GLTFLoader || !THREE.DRACOLoader) {
          console.error('Required loaders not available');
          return;
        }

        const loader = new THREE.GLTFLoader();
        const loadingDiv = this.createLoadingIndicator();
        
        // Set up DRACO loader for compressed models
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        dracoLoader.preload();
        loader.setDRACOLoader(dracoLoader);
        
        try {
          console.log('Loading 3D model from GitHub:', this.currentModelUrl);
          
          const gltf = await new Promise((resolve, reject) => {
            loader.load(
              this.currentModelUrl,
              resolve,
              (progress) => {
                if (progress.total > 0) {
                  const percent = Math.round((progress.loaded / progress.total) * 100);
                  console.log(`Loading progress: ${percent}%`);
                  if (loadingDiv) {
                    loadingDiv.textContent = `Loading 3D Map: ${percent}%`;
                  }
                }
              },
              reject
            );
          });

          this.model = gltf.scene;
          
          // Scale and position the model appropriately
          const box = new THREE.Box3().setFromObject(this.model);
          const size = box.getSize(new THREE.Vector3());
          const maxSize = Math.max(size.x, size.y, size.z);
          const scale = 100 / maxSize;
          
          this.model.scale.setScalar(scale);
          
          // Center the model
          const center = box.getCenter(new THREE.Vector3());
          this.model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          
          // Enhance materials and enable shadows
          let meshCount = 0;
          this.model.traverse((child) => {
            if (child.isMesh) {
              meshCount++;
              child.castShadow = true;
              child.receiveShadow = true;
              
              if (child.material) {
                child.material.needsUpdate = true;
                if (child.material.map && this.renderer.capabilities) {
                  child.material.map.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                }
              }
            }
          });

          this.scene.add(this.model);
          
          // Remove loading indicator
          if (loadingDiv) {
            loadingDiv.remove();
          }
          
          console.log(`3D model loaded successfully! Meshes: ${meshCount}, Scale: ${scale.toFixed(2)}x`);
          
          // Dispatch event for other scripts
          window.dispatchEvent(new CustomEvent('map3dLoaded', {
            detail: { model: this.model, scene: this.scene, meshCount, scale }
          }));
          
        } catch (error) {
          console.error('Failed to load 3D model:', error);
          if (loadingDiv) {
            loadingDiv.textContent = 'Failed to load 3D map. Please refresh the page.';
            loadingDiv.style.color = '#ff6b6b';
          }
        }
      }

      createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 24px 32px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          font-weight: 500;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        `;
        loadingDiv.textContent = 'Loading 3D Map...';
        document.body.appendChild(loadingDiv);
        return loadingDiv;
      }

      setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.pauseAnimation();
          } else {
            this.resumeAnimation();
          }
        });
      }

      onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }

      animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        if (this.controls) {
          this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      }

      pauseAnimation() {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
      }

      resumeAnimation() {
        if (!this.animationId) {
          this.animate();
        }
      }

      // Public API methods
      switchModel(modelKey) {
        if (this.modelUrls[modelKey]) {
          this.currentModelUrl = this.modelUrls[modelKey];
          if (this.model) {
            this.scene.remove(this.model);
          }
          this.loadModel();
        }
      }

      show() {
        if (this.container) {
          this.container.style.display = 'block';
          this.resumeAnimation();
        }
      }

      hide() {
        if (this.container) {
          this.container.style.display = 'none';
          this.pauseAnimation();
        }
      }

      destroy() {
        this.pauseAnimation();
        
        if (this.controls) {
          this.controls.dispose();
        }
        
        if (this.renderer) {
          this.renderer.dispose();
        }
        
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        
        window.removeEventListener('resize', this.onWindowResize);
      }
      
      // Hot-reload configuration method for live updates
      async reload() {
        console.log('🔄 Reloading 3D configuration...');
        
        try {
          // Pause current animations
          this.pauseAnimation();
          
          // Reload configuration from server
          await this.loadConfiguration();
          
          // Apply new lighting settings
          this.setupLighting();
          
          // Update camera position if specified in config
          if (this.config && this.config.camera) {
            const { position, target, fov, distance } = this.config.camera;
            
            if (position && this.camera) {
              this.camera.position.set(position[0], position[1], position[2]);
            }
            
            if (fov && this.camera) {
              this.camera.fov = fov;
              this.camera.updateProjectionMatrix();
            }
            
            if (this.controls) {
              if (target) {
                this.controls.target.set(target[0], target[1], target[2]);
              }
              
              if (distance) {
                this.controls.minDistance = this.config.camera.minDistance || distance * 0.5;
                this.controls.maxDistance = this.config.camera.maxDistance || distance * 3;
              }
              
              this.controls.update();
            }
          }
          
          // Restart welcome animation if enabled
          if (this.config.animations && this.config.animations.autoplay) {
            setTimeout(() => this.playWelcomeAnimation(), 500);
          }
          
          console.log('✅ Configuration reloaded successfully');
          
          // Dispatch custom event for external listeners
          window.dispatchEvent(new CustomEvent('3d-config-reloaded', {
            detail: { config: this.config }
          }));
          
        } catch (error) {
          console.error('❌ Failed to reload configuration:', error);
        }
      }
    }

    // Initialize the 3D map
    let map3d = null;

    function initMap() {
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      
      if (isHomePage && !map3d) {
        console.log('Initializing Map3D instance for homepage...');
        map3d = new Map3D();
        
        // Update global references
        window.map3dInstance = map3d;
        if (window.webflow3DScene) {
          window.webflow3DScene.getInstance = () => map3d;
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMap);
    } else {
      initMap();
    }

    // Expose globally for debugging and external control
    window.Map3D = Map3D;
    window.map3dInstance = map3d;
    
    // Global interface for Webflow embed code integration
    window.webflow3DScene = {
      getInstance: () => map3d,
      reload: async () => {
        if (map3d && map3d.reload) {
          await map3d.reload();
        } else {
          console.warn('3D scene not yet initialized or reload method not available');
        }
      },
      isReady: () => map3d !== null,
      getConfig: () => map3d ? map3d.config : null
    };

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (map3d) {
        map3d.destroy();
      }
    });

  } // end initializeMap function

  // Start loading Three.js
  loadThreeJS();

})(); // end IIFE