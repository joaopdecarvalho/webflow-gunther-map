/**
 * Simple Three.js GLB Loader for Webflow Integration with Default Configuration
 * 
 * This script provides a clean, straightforward implementation to load
 * a GLB model into the webgl-container element using Three.js with your custom configuration.
 */

class Simple3DLoader {
  constructor() {
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
        "position": [15.2, 31.7, 17.3],
        "target": [-0.8, -33.2, -15.3],
        "fov": 60,
        "minDistance": 20,
        "maxDistance": 800
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
          "duration": 1700,
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
    
    // Model URL - using GitHub raw URL for CORS-free loading
    this.modelUrl = 'https://raw.githubusercontent.com/joaopdecarvalho/webflow-gunther-map/master/public/Goetheviertel_250812_with-textures_webp25.glb';
    
    this.init();
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
      
      console.log('✅ 3D scene initialized successfully!');
      
    } catch (error) {
      console.error('❌ Error initializing 3D scene:', error);
    }
  }

  playWelcomeAnimation() {
    const animConfig = this.config.animations.welcomeAnimation;
    console.log('🎬 Playing welcome animation...');
    
    // Store original camera position
    const originalPos = this.camera.position.clone();
    const targetPos = new THREE.Vector3(...this.config.camera.position);
    
    // Start from a different position for animation
    this.camera.position.set(
      originalPos.x * 1.5,
      originalPos.y * 1.2,
      originalPos.z * 1.5
    );
    
    // Animate camera to configured position
    const startTime = Date.now();
    const duration = animConfig.duration;
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing (simplified easeInOut)
      let easedProgress = progress;
      if (animConfig.easing === 'easeInOut') {
        easedProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      }
      
      // Interpolate camera position
      this.camera.position.lerpVectors(
        this.camera.position.clone(),
        targetPos,
        easedProgress * 0.1
      );
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        this.camera.position.copy(targetPos);
        console.log('✅ Welcome animation complete');
      }
    };
    
    animateCamera();
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
    
    // Get container dimensions
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

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
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(performanceConfig.pixelRatio);
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
        console.warn('⚠️ GLTFLoader not available, creating placeholder');
        this.createPlaceholderModel();
        resolve();
        return;
      }
      
      const loader = new window.GLTFLoader();
      
      loader.load(
        this.modelUrl,
        (gltf) => {
          console.log('✅ Model loaded successfully!');
          this.model = gltf.scene;
          
          // Enable shadows on all meshes
          this.model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Add model to scene
          this.scene.add(this.model);
          
          // Center and scale model
          this.centerModel();
          
          resolve();
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`📊 Loading progress: ${percent}%`);
        },
        (error) => {
          console.error('❌ Error loading model:', error);
          console.log('🔄 Creating placeholder model instead...');
          this.createPlaceholderModel();
          resolve(); // Continue with placeholder instead of rejecting
        }
      );
    });
  }

  createPlaceholderModel() {
    console.log('🏗️ Creating placeholder 3D model...');
    
    // Create a simple building-like structure as placeholder
    const buildingGroup = new THREE.Group();
    
    // Base building
    const buildingGeometry = new THREE.BoxGeometry(20, 30, 15);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8bc34a });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 15;
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(12, 8, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xd32f2f });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 34;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    buildingGroup.add(roof);
    
    // Add some smaller buildings
    for (let i = 0; i < 5; i++) {
      const smallGeometry = new THREE.BoxGeometry(8, 15 + Math.random() * 10, 8);
      const colors = [0x2196f3, 0xff9800, 0x9c27b0, 0x4caf50, 0xff5722];
      const smallMaterial = new THREE.MeshLambertMaterial({ color: colors[i] });
      const smallBuilding = new THREE.Mesh(smallGeometry, smallMaterial);
      
      const angle = (i / 5) * Math.PI * 2;
      const radius = 25;
      smallBuilding.position.x = Math.cos(angle) * radius;
      smallBuilding.position.z = Math.sin(angle) * radius;
      smallBuilding.position.y = smallBuilding.geometry.parameters.height / 2;
      smallBuilding.castShadow = true;
      smallBuilding.receiveShadow = true;
      
      buildingGroup.add(smallBuilding);
    }
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    buildingGroup.add(ground);
    
    this.model = buildingGroup;
    this.scene.add(this.model);
    
    // Position camera to view the placeholder
    this.camera.position.set(50, 40, 50);
    this.camera.lookAt(0, 15, 0);
    
    console.log('✅ Placeholder model created and added to scene');
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
    this.controls.maxPolarAngle = Math.PI / 2;
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
    if (!this.container || !this.camera || !this.renderer) return;

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

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

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
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

// Auto-initialize when DOM is ready
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