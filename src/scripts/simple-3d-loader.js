/**
 * Simple Three.js GLB Loader for Webflow Integration with Default Configuration
 * 
 * This script provides a clean, straightforward implementation to load
 * a GLB model into the webgl-container element using Three.js with your custom configuration.
 * 
 * Last Updated: September 16, 2025 - Removed placeholder model fallback
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
        },
        "mainLight": {
          "enabled": false,
          "intensity": 1,
          "castShadows": false
        },
        "fillLight": {
          "enabled": false,
          "intensity": 0.4,
          "color": "#87ceeb"
        },
        "ambientLight": {
          "enabled": false,
          "intensity": 0.6
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
    
    // Model URL - using Vercel URL for faster loading and updates
    this.modelUrl = 'https://webflow-gunther-map.vercel.app/Goetheviertel_250812_with-textures_webp25.glb';
    
    this.init();
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
      
      // Handle window resize
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

  playWelcomeAnimation() {
    const animConfig = this.config.animations.welcomeAnimation;
    console.log('🎬 Playing welcome animation with custom start/end positions (smooth expo.inOut easing)...');
    
    // Custom animation parameters from user specification
    const startPos = new THREE.Vector3(27.7, 41.2, 42.6);
    const startTarget = new THREE.Vector3(-0.4, -36.6, -9.4);
    const endPos = new THREE.Vector3(10.3, 21.9, 16.0);
    const endTarget = new THREE.Vector3(-6.5, -34.2, -11.8);
    
    // Set initial camera position and target
    this.camera.position.copy(startPos);
    this.controls.target.copy(startTarget);
    this.controls.update();
    
    // Animation parameters
    const startTime = Date.now();
    const duration = animConfig.duration; // 1700ms
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
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
    const startTime = Date.now();
    
    const fadeAnimation = () => {
      const elapsed = Date.now() - startTime;
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
    return new Promise((resolve, reject) => {
      if (window.THREE) {
        console.log('✅ Three.js already loaded');
        resolve();
        return;
      }

      console.log('📦 Loading Three.js from CDN...');
      
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
          console.warn('⚠️ Three.js loading timeout, trying fallback...');
          this.loadThreeJSFallback().then(resolve).catch(reject);
        }
      }, 10000);
    });
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

    // Add lights
    this.setupLighting();

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

    // Main directional light (optional)
    if (lightingConfig.mainLight.enabled) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, lightingConfig.mainLight.intensity);
      directionalLight.position.set(100, 100, 100);
      directionalLight.castShadow = lightingConfig.mainLight.castShadows;
      
      if (lightingConfig.mainLight.castShadows) {
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
      }
      
      this.scene.add(directionalLight);
      console.log('💡 Main directional light added');
    }

    // Fill light (optional)
    if (lightingConfig.fillLight.enabled) {
      const fillLight = new THREE.DirectionalLight(
        lightingConfig.fillLight.color, 
        lightingConfig.fillLight.intensity
      );
      fillLight.position.set(-50, 50, 50);
      this.scene.add(fillLight);
      console.log('💡 Fill light added');
    }

    // Standard ambient light (fallback)
    if (lightingConfig.ambientLight.enabled) {
      const ambientLight = new THREE.AmbientLight(0xffffff, lightingConfig.ambientLight.intensity);
      this.scene.add(ambientLight);
      console.log('💡 Standard ambient light added');
    }

    console.log('✅ Lighting setup complete with configuration');
  }

  async loadModel() {
    return new Promise((resolve, reject) => {
      console.log('📁 Loading GLB model:', this.modelUrl);
      
      if (!window.GLTFLoader) {
        console.error('❌ GLTFLoader not available, cannot load model');
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
    window.addEventListener('resize', () => this.onWindowResize());
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
    requestAnimationFrame(() => this.animate());

    // Update controls
    if (this.controls && this.controls.update) {
      this.controls.update();
    } else if (this.updateBasicControls) {
      this.updateBasicControls();
    }

    // Update camera info panel (DEVELOPMENT ONLY - remove for production if not needed)
    this.updateCameraInfo();

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