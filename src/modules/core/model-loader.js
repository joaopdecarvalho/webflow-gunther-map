// Model Loader Module (Phase 1 extraction)
// Provides: loader.loadModel(), loader.centerModel()
// Pattern: function-based attachment; safe to load multiple times.

export function attachModelLoader(loader) {
  if (!loader) return;
  if (loader.modelLoaderAttached) {
    console.log('♻️ attachModelLoader: already attached');
    return;
  }

  // Extracted from monolithic simple-3d-loader.js (loadModel & centerModel methods)
  loader.loadModel = function loadModel() {
    return new Promise((resolve, reject) => {
      // Get primary and fallback URLs based on environment
      const primaryUrl = this.modelUrl;
      const fallbackUrl = this.getFallbackModelUrl ? this.getFallbackModelUrl() : this.getAlternativeModelUrl();
      
      console.log('📁 (module) Loading GLB model:', primaryUrl);
      if (fallbackUrl) {
        console.log('🔄 (module) Fallback URL available:', fallbackUrl);
      }

      if (!window.GLTFLoader) {
        console.error('❌ GLTFLoader not available');
        reject(new Error('GLTFLoader not available'));
        return;
      }

      // Attempt to load model with fallback
      this.attemptModelLoad(primaryUrl, fallbackUrl, resolve, reject);
    });
  };

  // Helper method to attempt model loading with fallback
  loader.attemptModelLoad = function attemptModelLoad(primaryUrl, fallbackUrl, resolve, reject) {
    const gltfLoader = new window.GLTFLoader();

    gltfLoader.load(
      primaryUrl,
      (gltf) => {
        console.log('✅ (module) Model loaded successfully from primary URL');
        this.processLoadedModel(gltf, resolve);
      },
      (progress) => {
        if (progress && progress.total) {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`📊 (module) Loading progress: ${percent}%`);
        }
      },
      (error) => {
        console.warn('⚠️ (module) Primary URL failed:', primaryUrl, error.message);
        
        // Try fallback URL if available
        if (fallbackUrl && fallbackUrl !== primaryUrl) {
          console.log('🔄 (module) Attempting fallback URL:', fallbackUrl);
          this.loadModelFromFallback(fallbackUrl, resolve, reject);
        } else {
          console.error('❌ (module) No fallback available, rejecting');
          reject(error);
        }
      }
    );
  };

  // Helper method to load from fallback URL
  loader.loadModelFromFallback = function loadModelFromFallback(fallbackUrl, resolve, reject) {
    const gltfLoader = new window.GLTFLoader();

    gltfLoader.load(
      fallbackUrl,
      (gltf) => {
        console.log('✅ (module) Model loaded successfully from fallback URL');
        this.processLoadedModel(gltf, resolve);
      },
      (progress) => {
        if (progress && progress.total) {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`📊 (module) Fallback loading progress: ${percent}%`);
        }
      },
      (error) => {
        console.error('❌ (module) Fallback URL also failed:', fallbackUrl, error);
        reject(error);
      }
    );
  };

  // Helper method to process successfully loaded model
  loader.processLoadedModel = function processLoadedModel(gltf, resolve) {
    this.model = gltf.scene;

    // Initialize flag arrays for billboard functionality
    this.flags = [];
    console.log('🔍 Starting flag detection process...');

    // Prepare meshes (shadow + fade-in start) and collect flags
    this.model.traverse((child) => {
      // Log all objects with names for debugging
      if (child.name) {
        console.log('🔍 Found named object:', child.name, 'type:', child.type);
      }
      
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.transparent = true;
        child.material.opacity = 0;
      }
      
      // Detect flag objects by name patterns
      if (child.name && (
        child.name.toLowerCase().includes('flag') ||
        child.name.toLowerCase().includes('flagge') ||
        child.name.toLowerCase().includes('banner')
      )) {
        this.flags.push(child);
        console.log('🚩 Found flag object:', child.name, 'position:', child.position, 'rotation:', child.rotation);
      }
    });

    console.log(`🏴 Billboard system: Detected ${this.flags.length} flag objects`);
    console.log('🏴 Flags array:', this.flags.map(f => ({ name: f.name, uuid: f.uuid })));

    // IMPORTANT: Store flags reference in main class for billboard access
    if (window.simple3DLoaderInstance) {
      window.simple3DLoaderInstance.flags = this.flags;
      console.log('🏴 Flags array copied to main instance');
    }

    this.scene.add(this.model);
    this.centerModel();

    // Auto interactive object setup if interaction system already initialized
    try {
      if (this.interactionSystemInitialized && typeof this.setupInteractiveObjects === 'function') {
        this.setupInteractiveObjects();
      }
    } catch (e) {
      console.warn('⚠️ (module) setupInteractiveObjects failed:', e.message);
    }

    // Use existing fadeInModel if present
    if (typeof this.fadeInModel === 'function') {
      this.fadeInModel();
    }
    resolve();
  };

  // Helper method to get alternative model URL (fallback logic)
  loader.getAlternativeModelUrl = function getAlternativeModelUrl() {
    // If we have modelUrls object with local/production, use the opposite
    if (this.modelUrls) {
      if (this.isDevelopment) {
        return this.modelUrls.production; // Fallback to Vercel in development
      } else {
        return this.modelUrls.local; // Fallback to localhost in production (rarely used)
      }
    }
    
    // Fallback pattern based on current URL
    const currentUrl = this.modelUrl;
    if (currentUrl && currentUrl.includes('localhost')) {
      // Switch localhost to Vercel
      return currentUrl.replace('http://localhost:8080', 'https://webflow-gunther-map.vercel.app');
    } else if (currentUrl && currentUrl.includes('vercel.app')) {
      // Switch Vercel to localhost (unlikely but for completeness)
      return currentUrl.replace('https://webflow-gunther-map.vercel.app', 'http://localhost:8080');
    }
    
    // No fallback available
    return null;
  };

  loader.centerModel = function centerModel() {
    if (!this.model) return;
    const box = new THREE.Box3().setFromObject(this.model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    console.log('📐 (module) Model dimensions:', { center, size, maxDimension: Math.max(size.x, size.y, size.z) });
    this.model.position.sub(center);
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetSize = 80;
    const scale = targetSize / maxDimension;
    this.model.scale.setScalar(scale);
    if (this.camera) {
      this.camera.position.set(...this.config.camera.position);
      this.camera.lookAt(...this.config.camera.target);
    }
    console.log('✅ (module) Model centered & scaled');
  };

  loader.modelLoaderAttached = true;
  console.log('🧩 attachModelLoader(loader) attached');
}

// Global exposure for non-module environments
window.attachModelLoader = attachModelLoader;
