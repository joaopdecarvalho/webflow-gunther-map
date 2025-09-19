// Lighting System Module (Phase 2 - Task 2.1.1 initial extraction)
// Provides: loader.setupLighting() replacing legacy method.

export function attachLightingSystem(loader) {
  if (!loader) return;
  if (loader.lightingSystemAttached) {
    console.log('♻️ attachLightingSystem: already attached');
    return;
  }

  // Override lighting with module implementation
  loader.setupLighting = function setupLighting() {
    if (!window.THREE || !this.scene) return;
    const lightingConfig = this.config.lighting;
    if (lightingConfig?.warmAmbient?.enabled) {
      const ambientLight = new THREE.HemisphereLight(
        lightingConfig.warmAmbient.skyColor,
        lightingConfig.warmAmbient.groundColor,
        lightingConfig.warmAmbient.intensity
      );
      this.scene.add(ambientLight);
      console.log('💡 (module) Warm ambient lighting added');
    }
    console.log('✅ (module) Lighting setup complete with configuration');
  };

  loader.lightingSystemAttached = true;
  console.log('🧩 attachLightingSystem(loader) attached');
}

window.attachLightingSystem = attachLightingSystem;
