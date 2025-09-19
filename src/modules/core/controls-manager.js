// Controls Manager Module (Phase 1 extraction)
// Provides: loader.setupControls(), loader.setupBasicControls() override if needed

export function attachControlsManager(loader) {
  if (!loader) return;
  if (loader.controlsManagerAttached) {
    console.log('♻️ attachControlsManager: already attached');
    return;
  }

  loader.setupControls = function setupControls() {
    if (!window.OrbitControls) {
      console.warn('⚠️ (module) OrbitControls not available, using basic controls');
      this.setupBasicControls && this.setupBasicControls();
      return;
    }
    const cameraConfig = this.config.camera;
    const controlsConfig = this.config.controls;
    this.controls = new window.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = controlsConfig.enableDamping;
    this.controls.dampingFactor = controlsConfig.dampingFactor;
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(controlsConfig.minPolarAngle);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(controlsConfig.maxPolarAngle);
    this.controls.minDistance = controlsConfig.minDistance;
    this.controls.maxDistance = controlsConfig.maxDistance;
    this.controls.enableZoom = controlsConfig.enableZoom;
    this.controls.enableRotate = controlsConfig.enableRotate;
    this.controls.enablePan = controlsConfig.enablePan;
    this.controls.target.set(...cameraConfig.target);
    this.controls.update();
    console.log('🎮 (module) Controls setup complete');
  };

  // Optional helper to force an update (future expansion)
  loader.updateControls = function updateControls() {
    if (this.controls && this.controls.update) this.controls.update();
  };

  loader.controlsManagerAttached = true;
  console.log('🧩 attachControlsManager(loader) attached');
}

window.attachControlsManager = attachControlsManager;
