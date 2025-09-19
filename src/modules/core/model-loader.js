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
      const modelUrl = this.modelUrl;
      console.log('📁 (module) Loading GLB model:', modelUrl);

      if (!window.GLTFLoader) {
        console.error('❌ GLTFLoader not available');
        reject(new Error('GLTFLoader not available'));
        return;
      }

      const gltfLoader = new window.GLTFLoader();

      gltfLoader.load(
        modelUrl,
        (gltf) => {
          console.log('✅ (module) Model loaded successfully');
          this.model = gltf.scene;

          // Prepare meshes (shadow + fade-in start)
            this.model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.transparent = true;
                child.material.opacity = 0;
              }
            });

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
        },
        (progress) => {
          if (progress && progress.total) {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            console.log(`📊 (module) Loading progress: ${percent}%`);
          }
        },
        (error) => {
          console.error('❌ (module) Error loading model:', error);
          reject(error);
        }
      );
    });
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
