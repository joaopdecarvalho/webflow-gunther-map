/**
 * 3D Map Implementation using Three.js
 * Loads a GLTF model and displays it as a fullscreen background
 * UI elements remain above the 3D scene
 */

(function() {
  'use strict';

  // Load Three.js and required modules from CDN
  function loadThreeJS() {
    if (typeof THREE !== 'undefined') {
      console.log('Three.js already loaded, initializing map...');
      initializeMap();
      return;
    }

    console.log('Loading Three.js from CDN...');
    const scripts = [
      {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js',
        check: () => typeof THREE !== 'undefined'
      },
      {
        url: 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/loaders/GLTFLoader.js',
        check: () => typeof THREE !== 'undefined' && THREE.GLTFLoader
      },
      {
        url: 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/controls/OrbitControls.js',
        check: () => typeof THREE !== 'undefined' && THREE.OrbitControls
      }
    ];

    let loadedCount = 0;
    
    function loadNextScript() {
      if (loadedCount >= scripts.length) {
        console.log('All Three.js scripts loaded successfully');
        setTimeout(initializeMap, 100);
        return;
      }

      const scriptInfo = scripts[loadedCount];
      const script = document.createElement('script');
      script.src = scriptInfo.url;
      
      script.onload = () => {
        console.log(`Loaded: ${scriptInfo.url}`);
        loadedCount++;
        
        // Check if this script loaded what we expected
        if (scriptInfo.check()) {
          loadNextScript();
        } else {
          console.warn(`Script loaded but dependency not available: ${scriptInfo.url}`);
          // Try to continue anyway
          setTimeout(() => {
            loadedCount++;
            loadNextScript();
          }, 500);
        }
      };
      
      script.onerror = (error) => {
        console.error(`Failed to load: ${scriptInfo.url}`, error);
        // Try to continue with next script
        loadedCount++;
        loadNextScript();
      };
      
      document.head.appendChild(script);
    }

    loadNextScript();
  }

  function initializeMap() {
    // Final check that all dependencies are available
    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded');
      updateStatus && updateStatus('Failed: Three.js not loaded', '#dc3545');
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
        
        // Configuration
        this.modelUrl = 'https://d3uoa9ify8080u.cloudfront.net/Bremerhaven_250731.gltf';
        this.isInitialized = false;
        
        console.log('Map3D constructor called');
        this.init();
      }

      init() {
        try {
          console.log('Starting Map3D initialization...');
          this.createContainer();
          this.setupScene();
          this.setupCamera();
          this.setupRenderer();
          this.setupControls();
          this.setupLighting();
          this.loadModel();
          this.setupEventListeners();
          this.animate();
          
          this.isInitialized = true;
          console.log('3D Map initialized successfully');
          
          // Update status if available
          if (typeof updateStatus === 'function') {
            updateStatus('3D Map initialized', '#17a2b8');
          }
        } catch (error) {
          console.error('Failed to initialize 3D Map:', error);
          if (typeof updateStatus === 'function') {
            updateStatus('Initialization failed: ' + error.message, '#dc3545');
          }
        }
      }

      createContainer() {
        console.log('Creating 3D map container...');
        
        // Create container for the 3D scene
        this.container = document.createElement('div');
        this.container.id = 'map-3d-container';
        this.container.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
          pointer-events: auto;
        `;
        
        // Insert at the beginning of body to ensure it's behind everything
        document.body.insertBefore(this.container, document.body.firstChild);
        
        // Ensure page_wrap and other UI elements have proper z-index
        this.ensureUILayering();
      }

      ensureUILayering() {
        // Find and style the page_wrap div to ensure it stays above the 3D map
        const pageWrap = document.querySelector('[class*="page_wrap"], .page_wrap, #page_wrap');
        if (pageWrap) {
          pageWrap.style.position = 'relative';
          pageWrap.style.zIndex = '10';
          pageWrap.style.pointerEvents = 'auto';
        }

        // Also ensure any other main content containers are above the map
        const contentSelectors = [
          '[class*="main"]', 
          '[class*="content"]', 
          '.main-content',
          'main',
          'header',
          'nav',
          'footer'
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
        this.scene.fog = new THREE.Fog(0x667eea, 100, 2000);
      }

      setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
          60,
          window.innerWidth / window.innerHeight,
          0.1,
          10000
        );
        this.camera.position.set(0, 150, 300);
        this.camera.lookAt(0, 0, 0);
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
        
        // Enable shadows if supported
        if (this.renderer.shadowMap) {
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Set tone mapping if supported
        if (this.renderer.toneMapping !== undefined) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1;
        }
        
        // Set encoding if supported
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
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 2000;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Smooth controls
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
      }

      setupLighting() {
        console.log('Setting up scene lighting...');
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(200, 300, 200);
        
        if (directionalLight.shadow) {
          directionalLight.castShadow = true;
          directionalLight.shadow.mapSize.width = 2048;
          directionalLight.shadow.mapSize.height = 2048;
          directionalLight.shadow.camera.near = 0.5;
          directionalLight.shadow.camera.far = 1000;
          directionalLight.shadow.camera.left = -500;
          directionalLight.shadow.camera.right = 500;
          directionalLight.shadow.camera.top = 500;
          directionalLight.shadow.camera.bottom = -500;
        }
        
        this.scene.add(directionalLight);

        // Additional fill light
        const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
        fillLight.position.set(-100, 100, -100);
        this.scene.add(fillLight);
      }

      async loadModel() {
        if (!THREE.GLTFLoader) {
          console.error('GLTFLoader not available');
          if (typeof updateStatus === 'function') {
            updateStatus('GLTFLoader not available', '#dc3545');
          }
          return;
        }

        const loader = new THREE.GLTFLoader();
        const loadingDiv = this.createLoadingIndicator();
        
        try {
          console.log('Loading 3D model from:', this.modelUrl);
          if (typeof updateStatus === 'function') {
            updateStatus('Loading 3D model...', '#ffc107');
          }
          
          const gltf = await new Promise((resolve, reject) => {
            loader.load(
              this.modelUrl,
              resolve,
              (progress) => {
                if (progress.total > 0) {
                  const percent = Math.round((progress.loaded / progress.total) * 100);
                  console.log(`Loading progress: ${percent}%`);
                  if (loadingDiv) {
                    loadingDiv.textContent = `Loading 3D Map: ${percent}%`;
                  }
                  if (typeof updateStatus === 'function') {
                    updateStatus(`Loading model: ${percent}%`, '#ffc107');
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
          
          // Enable shadows
          this.model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Enhance material properties
              if (child.material) {
                child.material.needsUpdate = true;
              }
            }
          });

          this.scene.add(this.model);
          
          // Remove loading indicator
          if (loadingDiv) {
            loadingDiv.remove();
          }
          
          console.log('3D model loaded successfully');
          if (typeof updateStatus === 'function') {
            updateStatus('3D map loaded successfully! 🎉', '#28a745');
          }
          
          // Dispatch event for other scripts
          window.dispatchEvent(new CustomEvent('map3dLoaded', {
            detail: { model: this.model, scene: this.scene }
          }));
          
        } catch (error) {
          console.error('Failed to load 3D model:', error);
          if (loadingDiv) {
            loadingDiv.textContent = 'Failed to load 3D map. Please refresh the page.';
            loadingDiv.style.color = '#ff6b6b';
          }
          if (typeof updateStatus === 'function') {
            updateStatus('Failed to load model: ' + error.message, '#dc3545');
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
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 20px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          font-size: 16px;
          text-align: center;
        `;
        loadingDiv.textContent = 'Loading 3D Map...';
        document.body.appendChild(loadingDiv);
        return loadingDiv;
      }

      setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Handle visibility change to pause/resume animation
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
    }

    // Initialize the 3D map when this script loads
    let map3d = null;

    // Wait for DOM to be ready
    function initMap() {
      // Only initialize on the home page (or all pages if desired)
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      
      if (isHomePage && !map3d) {
        console.log('Initializing Map3D instance...');
        map3d = new Map3D();
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