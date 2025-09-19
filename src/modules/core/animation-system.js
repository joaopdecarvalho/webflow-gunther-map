// Animation System Module (Phase 2 - Task 2.1.2 initial extraction)
// Provides: loader.playWelcomeAnimation() replacing legacy method.

export function attachAnimationSystem(loader) {
  if (!loader) return;
  if (loader.animationSystemAttached) {
    console.log('♻️ attachAnimationSystem: already attached');
    return;
  }

  loader.playWelcomeAnimation = function playWelcomeAnimation() {
    const animConfig = this.config.animations.welcomeAnimation;
    if (!animConfig?.enabled) return;
    if (!this.camera || !this.controls || !window.THREE) {
      console.warn('⚠️ (module) Cannot run welcome animation yet');
      return;
    }
    console.log('🎬 (module) Playing welcome animation...');
    const startPos = new THREE.Vector3(...animConfig.startPosition);
    const startTarget = new THREE.Vector3(...animConfig.startTarget);
    const endPos = new THREE.Vector3(...animConfig.endPosition);
    const endTarget = new THREE.Vector3(...animConfig.endTarget);
    this.camera.position.copy(startPos);
    this.controls.target.copy(startTarget);
    this.controls.update();
    const startTime = performance.now();
    const duration = animConfig.duration;
    const animateCamera = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      let easedProgress = progress;
      if (animConfig.easing === 'easeInOut') {
        if (progress === 0) easedProgress = 0; else if (progress === 1) easedProgress = 1; else if (progress < 0.5) {
          easedProgress = Math.pow(2, 12 * progress - 6) / 2;
        } else {
          easedProgress = (2 - Math.pow(2, -12 * progress + 6)) / 2;
        }
      }
      this.camera.position.lerpVectors(startPos, endPos, easedProgress);
      this.controls.target.lerpVectors(startTarget, endTarget, easedProgress);
      this.controls.update();
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        this.camera.position.copy(endPos);
        this.controls.target.copy(endTarget);
        this.controls.update();
        console.log('✅ (module) Welcome animation complete');
      }
    };
    requestAnimationFrame(animateCamera);
  };

  loader.animationSystemAttached = true;
  console.log('🧩 attachAnimationSystem(loader) attached');
}

window.attachAnimationSystem = attachAnimationSystem;
