/**
 * Three.js GLB Loader for Webflow Integration

/**
 * Simple Station Modal Image Preloader
 * Preloads images in station modal sliders after page load
 */
class SimpleModalImagePreloader {
  constructor() {
    this.preloadDelay = 800; // ms after window load
    this.maxConcurrent = 4;  // parallel preloads
    this.isEnabled = true;
    this.isInitialized = false;
  }

  initialize() {
    if (!this.isEnabled || this.isInitialized) return;
    this.isInitialized = true;
    
    window.addEventListener('load', () => {
      setTimeout(() => this.preloadStationImages(), this.preloadDelay);
    });
  }

  async preloadStationImages() {
    // Find all images in station modal sliders
    const selectors = [
      '[id^="station-"] .w-slider img',
      '[id^="station-"] .w-slide img', 
      '.station-gallery-image'
    ];

    const images = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(img => {
        if (img.src && !img.dataset.preloaded) {
          images.push(img);
        }
      });
    });

    if (!images.length) {
      console.log('ℹ️ No station modal images found to preload');
      return;
    }

    console.log(`🚀 Preloading ${images.length} station modal images`);

    // Preload with concurrency control
    await this.preloadWithConcurrency(images);
    
    console.log('✅ Station modal images preloaded');
  }

  async preloadWithConcurrency(images) {
    let index = 0;
    const inProgress = [];

    const preloadNext = async () => {
      if (index >= images.length) return;
      
      const img = images[index++];
      const promise = this.preloadImage(img);
      inProgress.push(promise);
      
      try {
        await promise;
        img.dataset.preloaded = 'true';
      } catch (error) {
        console.warn('Failed to preload image:', img.src, error);
      }
      
      const promiseIndex = inProgress.indexOf(promise);
      if (promiseIndex > -1) {
        inProgress.splice(promiseIndex, 1);
      }
    };

    // Start initial batch
    while (inProgress.length < this.maxConcurrent && index < images.length) {
      preloadNext();
    }

    // Continue until all done
    while (inProgress.length > 0 || index < images.length) {
      if (inProgress.length < this.maxConcurrent && index < images.length) {
        preloadNext();
      }
      if (inProgress.length > 0) {
        await Promise.race(inProgress.filter(p => p));
      }
    }
  }

  preloadImage(img) {
    return new Promise((resolve, reject) => {
      const preloader = new Image();
      preloader.onload = () => resolve();
      preloader.onerror = () => reject(new Error('Failed to load'));
      
      // Handle srcset if present
      if (img.srcset) {
        preloader.srcset = img.srcset;
        preloader.sizes = img.sizes || '100vw';
      }
      preloader.src = img.src;
    });
  }

  dispose() {
    this.isInitialized = false;
    console.log('✅ Simple Modal Image Preloader disposed');
  }
}

// =============================================================================
// PHASE 2B: SIMPLE MODAL IMAGE PRELOADER - Image and Modal Asset Optimization  
// =============================================================================
// Handles image preloading for station modal sliders after page load.
// Uses lightweight approach with controlled concurrency and preload delay.
    /* this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a video or contains videos
            const videos = node.tagName === 'VIDEO' ? [node] : node.querySelectorAll?.('video[src]') || [];

            videos.forEach((video) => {
              if (video.src && !video.hasAttribute('data-lazy-src')) {
                console.log('🔄 Intercepting dynamically added video:', video.src);
                const originalSrc = video.src;
                video.removeAttribute('src');
                video.setAttribute('data-lazy-src', originalSrc);

                const placeholder = this.createVideoPlaceholder();
                video.appendChild(placeholder);
                this.videoPlaceholders.set(video, originalSrc);
              }
            });
          }
        });
      }); */
// Global modal image preloader instance
const globalModalImagePreloader = new SimpleModalImagePreloader();

// Initialize preloader when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    globalModalImagePreloader.initialize();
  });
} else {
  globalModalImagePreloader.initialize();
}

// =============================================================================
// PHASE 2B: (Removed) ASSET RESOURCE MANAGER - Image and Modal Asset Optimization
// =============================================================================
// The Asset Resource Manager has been removed as it's no longer needed.
// Image preloading is now handled by the SimpleModalImagePreloader class above.

// Asset manager removed: no global instance or scheduling

// =============================================================================
// PHASE 3: (Removed) Smart Loading Manager
// =============================================================================
// The previous SmartLoadingManager (connection/device/preference-aware throttling)
// has been fully removed per performance strategy shift: load as fast as possible.
// If future selective prefetch or prioritization is required, implement targeted
// helpers instead of a monolithic manager to keep baseline logic lean.

// Backwards compatibility no-ops (avoid errors if templates still call old globals)
window.getAssetCategorizationReport = () => ({ removed: true });
window.loadStationWithPriority = () => Promise.resolve();
window.getStationAssetMap = () => undefined;

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

    // (Phase 1 Cleanup) Removed legacy flag POI system (flags & flagCoordinates)

    // Performance and development flags
    this.isDevelopment = this.detectDevelopmentMode();
    this.lastDebugUpdate = 0;
    this.pauseRendering = false;

    // Phase 1: Lazy Loading Implementation
    this.lazyLoadingEnabled = true;
    this.intersectionObserver = null;
    this.loadingState = 'pending'; // pending, loading, loaded, error
    this.loadTriggers = {
      viewport: true,      // Load when container comes into viewport
      userInteraction: true, // Load on first click/touch
      delay: false,        // Load after a delay
      manual: false        // Load only when explicitly called
    };
    this.delayTimer = null;
    this.userHasInteracted = false;

    // Video lazy loading system
    this.interceptedVideos = null; // Will be initialized in initVideoLazyLoading
    this.videoMutationObserver = null;

  // Phase 3 (Removed): smart loading manager no longer used
  this.smartLoadingManager = null;

  // Master toggle for on-screen debug panels (camera, controls, stations)
  // Kept in codebase but disabled by default per current requirement.
  // Set to true (e.g., via console: loader.debugPanelsEnabled = true) and refresh to re-enable.
  this.debugPanelsEnabled = false;


    // =====================================================================
    // Phase 3: New Interactive Station System (Skeleton Implementation)
    // =====================================================================
    // Mapping of model object names to modal trigger IDs
    this.stationMapping = {
      'Station01': 'station-1-goethestr-45',
      'Station02': 'station-2-afz-theo',
      'Station03': 'station-3-rueckenwind',
      'Station04': 'station-4-beet',
      'Station05': 'station-5-zolli',
      'Station06': 'station-6-starthaus',
      'Station07': 'station-7-studierendenhaus-h34',
      'Station08': 'station-8-quartiersmeisterei-lehe',
      'Station09': 'station-9-kulturbahnhof-lehe',
      'Station10': 'station-10-goethestrasse-60'
    };

    // Interaction system core properties (populated in Phase 4)
    this.interactiveObjects = []; // Array of THREE.Object3D that can be interacted with
    this.hoveredObject = null;    // Currently hovered object reference

    // Raycasting utilities (initialized after Three.js + scene setup)
    this.raycaster = null;
    this.mouse = null; // Normalized device coordinates vector
    this.interactionSystemInitialized = false;
    
    // Default configuration based on your 3d-config.json
    this.config = {
      "version": "1.0.0",
      "camera": {
        "position": [10.3, 1.2, 85.4],
        "target": [-14.0, -61.5, 33.4],
        "fov": 60,
        "minDistance": 85,
        "maxDistance": 125
      },
      "controls": {
        "minPolarAngle": 27,
        "maxPolarAngle": 54,
        "minDistance": 85,
        "maxDistance": 125,
        "enableZoom": true,
        "enableRotate": true,
        "enablePan": true,
        "dampingFactor": 0.02,
        "enableDamping": true
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
          "easing": "easeInOut",
          "startPosition": [30.7, 20.7, 107.5],
          "startTarget": [-18.7, -72.1, 39.8],
          "endPosition": [10.3, 1.2, 85.4],
          "endTarget": [-14.0, -61.5, 33.4]
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
      },
      "lazyLoading": {
        "enabled": true,
        "triggers": {
          "viewport": true,
          "userInteraction": true,
          "delay": false
        },
        "delay": 2000
      }
    };
    
    // Model URL - environment-aware with fallback
    this.modelUrls = {
      local: 'http://localhost:8080/Goetheviertel_250919_with_flags_webp80.glb',
      production: 'https://webflow-gunther-map.vercel.app/Goetheviertel_250919_with_flags_webp80.glb'
    };
    this.modelUrl = this.isDevelopment ? this.modelUrls.local : this.modelUrls.production;

    // Initialize video lazy loading system before anything else
    this.initVideoLazyLoading();

    // Phase 1: Initialize lazy loading or direct loading based on configuration
    const lazyConfig = this.config.lazyLoading;
    if (this.lazyLoadingEnabled && lazyConfig.enabled) {
      // Override load triggers with configuration
      this.loadTriggers = { ...this.loadTriggers, ...lazyConfig.triggers };
      this.initLazyLoading();
    } else {
      this.init();
    }
  }

  detectDevelopmentMode() {
    // Check for localhost, development domains, Webflow domains, or debug flags
    return location.hostname === 'localhost' ||
           location.hostname === '127.0.0.1' ||
           location.hostname.includes('dev') ||
           location.hostname.includes('webflow.io') || // Enable on Webflow staging/preview
           location.hostname.includes('webflow.com') || // Enable on Webflow editor
           location.search.includes('debug=true') ||
           location.hostname.includes('5173'); // Vite dev server
  }

  // =====================================================================
  // Video Lazy Loading System - Prevents modal videos from downloading before 3D model
  // =====================================================================
  initVideoLazyLoading() {
    console.log('📹 Initializing video lazy loading system...');
    
    // Use pre-intercepted videos from embed script if available
    this.interceptedVideos = window.interceptedVideos || new Map();
    
    // If no pre-intercepted videos, do manual interception
    if (this.interceptedVideos.size === 0) {
      this.interceptModalVideos();
    } else {
      console.log('📹 Using pre-intercepted videos:', this.interceptedVideos.size);
    }
    
    // Set up mutation observer to catch any additional videos
    this.setupVideoMutationObserver();
    
    console.log('✅ Video lazy loading system initialized');
  }

  interceptModalVideos() {
    // Find videos in modal containers that have src attributes
    const modalContainers = document.querySelectorAll('[id^="station-"], [data-modal], [data-modal-id]');
    
    modalContainers.forEach(container => {
      const videos = container.querySelectorAll('video[src]');
      
      videos.forEach(video => {
        if (!video.hasAttribute('data-lazy-src')) {
          console.log('🚫 Intercepting modal video:', video.src);
          
          // Store original src and remove it to prevent loading
          const originalSrc = video.src;
          video.removeAttribute('src');
          video.setAttribute('data-lazy-src', originalSrc);
          
          // Store reference for later restoration
          this.interceptedVideos.set(video, originalSrc);
          
          // Add a visual placeholder
          this.addVideoPlaceholder(video);
        }
      });
    });
  }

  setupVideoMutationObserver() {
    // Watch for dynamically added videos
    this.videoMutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a video or contains videos
            const videos = node.tagName === 'VIDEO' ? [node] : node.querySelectorAll?.('video[src]') || [];
            
            videos.forEach((video) => {
              // Only intercept videos in modal containers
              const modalContainer = video.closest('[id^="station-"], [data-modal], [data-modal-id]');
              if (modalContainer && video.src && !video.hasAttribute('data-lazy-src')) {
                console.log('🔄 Intercepting dynamically added modal video:', video.src);
                
                const originalSrc = video.src;
                video.removeAttribute('src');
                video.setAttribute('data-lazy-src', originalSrc);
                this.interceptedVideos.set(video, originalSrc);
                this.addVideoPlaceholder(video);
              }
            });
          }
        });
      });
    });

    this.videoMutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addVideoPlaceholder(video) {
    // Add a subtle placeholder overlay
    const placeholder = document.createElement('div');
    placeholder.className = 'video-lazy-placeholder';
    placeholder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      pointer-events: none;
      z-index: 1;
    `;
    placeholder.innerHTML = '📹';
    
    // Ensure parent has relative positioning
    const parent = video.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    
    parent?.appendChild(placeholder);
    
    // Store placeholder reference for cleanup
    video.setAttribute('data-placeholder-id', 'video-lazy-placeholder');
  }

  restoreVideoSrc(modalId) {
    console.log('📹 Restoring video sources for modal:', modalId);
    
    // Find modal container
    const selectors = [
      `[data-modal-id="${modalId}"]`,
      `[data-modal="${modalId}"]`,
      `#${modalId}`
    ];
    
    let modalEl = null;
    for (const sel of selectors) {
      modalEl = document.querySelector(sel);
      if (modalEl) break;
    }
    
    if (!modalEl) {
      console.warn('⚠️ Could not find modal element for video restoration:', modalId);
      return;
    }
    
    // Restore videos in this modal
    const lazyVideos = modalEl.querySelectorAll('video[data-lazy-src]');
    
    lazyVideos.forEach(video => {
      const lazySrc = video.getAttribute('data-lazy-src');
      if (lazySrc) {
        console.log('✅ Restoring video src:', lazySrc);
        video.setAttribute('src', lazySrc);
        video.removeAttribute('data-lazy-src');
        
        // Remove placeholder
        const placeholder = video.parentElement?.querySelector('.video-lazy-placeholder');
        if (placeholder) {
          placeholder.remove();
        }
        
        // Clean up our tracking
        this.interceptedVideos.delete(video);
      }
    });
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

  // Phase 1: Lazy Loading Initialization
  initLazyLoading() {
    try {
      // Find the container element first
      this.container = document.querySelector('#webgl-container') ||
                       document.querySelector('.webgl-container') ||
                       document.querySelector('[data-webgl-container]');

      if (!this.container) {
        console.error('WebGL container not found! Loading disabled.');
        return;
      }

      console.log('🔄 Lazy loading initialized for:', this.container);
      this.showLoadingPlaceholder();

      // Set up triggers based on configuration
      if (this.loadTriggers.viewport) {
        this.setupViewportTrigger();
      }

      if (this.loadTriggers.userInteraction) {
        this.setupInteractionTriggers();
      }

      if (this.loadTriggers.delay) {
        this.setupDelayTrigger();
      }

      // If manual mode, just wait for explicit load call
      if (this.loadTriggers.manual) {
        console.log('📋 Manual loading mode - call loader.load() to start');
      }

    } catch (error) {
      console.error('❌ Error initializing lazy loading:', error);
      // Fallback to direct loading
      this.init();
    }
  }

  showLoadingPlaceholder() {
    if (!this.container) return;

    // Apply initial styling
    this.applyInitialStyling();

    // Create a minimal loading placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'lazy-loading-placeholder';
    placeholder.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 2;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        "></div>
        <div style="font-size: 14px; font-weight: 500;">Loading 3D Experience</div>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">Interactive map preparing...</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    this.container.appendChild(placeholder);
    console.log('📍 Loading placeholder displayed');
  }

  setupViewportTrigger() {
    if (!this.container || !('IntersectionObserver' in window)) {
      console.warn('⚠️ IntersectionObserver not supported, using fallback');
      // Fallback: load immediately if intersection observer not supported
      setTimeout(() => this.triggerLoad('viewport-fallback'), 100);
      return;
    }

    const options = {
      root: null,
      rootMargin: '100px', // Start loading 100px before entering viewport
      threshold: 0.1
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.loadingState === 'pending') {
          console.log('👁️ Container entered viewport - triggering load');
          this.triggerLoad('viewport');
        }
      });
    }, options);

    this.intersectionObserver.observe(this.container);
    console.log('👁️ Viewport trigger setup complete');
  }

  setupInteractionTriggers() {
    if (!this.container) return;

    const triggerLoad = (type) => {
      if (this.loadingState === 'pending' && !this.userHasInteracted) {
        this.userHasInteracted = true;
        console.log(`🖱️ User interaction detected (${type}) - triggering load`);
        this.triggerLoad('interaction');
      }
    };

    // Mouse events
    this.container.addEventListener('click', () => triggerLoad('click'), { once: true });
    this.container.addEventListener('mouseenter', () => triggerLoad('hover'), { once: true });

    // Touch events
    this.container.addEventListener('touchstart', () => triggerLoad('touch'), { once: true, passive: true });

    // Keyboard events (for accessibility)
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        triggerLoad('keyboard');
      }
    }, { once: true });

    console.log('🖱️ Interaction triggers setup complete');
  }

  setupDelayTrigger() {
    const delay = this.config.lazyLoading?.delay || 2000; // Default 2 seconds

    this.delayTimer = setTimeout(() => {
      if (this.loadingState === 'pending') {
        console.log(`⏰ Delay trigger activated (${delay}ms) - triggering load`);
        this.triggerLoad('delay');
      }
    }, delay);

    console.log(`⏰ Delay trigger setup complete (${delay}ms)`);
  }

  triggerLoad(trigger) {
    if (this.loadingState !== 'pending') {
      console.log(`⚠️ Load already triggered (state: ${this.loadingState})`);
      return;
    }

    console.log(`🚀 Loading triggered by: ${trigger}`);
    this.loadingState = 'loading';

    // Clear any delay timer
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }

    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Update placeholder to show loading state
    this.updateLoadingState('Loading 3D Model...');

    // Start the actual loading process
    this.init();
  }

  updateLoadingState(message) {
    const placeholder = this.container?.querySelector('.lazy-loading-placeholder');
    if (placeholder) {
      const textElement = placeholder.querySelector('div:last-child');
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }

  removeLazyLoadingPlaceholder() {
    const placeholder = this.container?.querySelector('.lazy-loading-placeholder');
    if (placeholder) {
      placeholder.remove();
      console.log('✅ Loading placeholder removed');
    }
  }

  // Public method to manually trigger loading
  load() {
    this.triggerLoad('manual');
  }

  showErrorState(error) {
    this.removeLazyLoadingPlaceholder();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'lazy-loading-error';
    errorDiv.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: rgba(255, 255, 255, 0.9);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 2;
        max-width: 400px;
        padding: 20px;
      ">
        <div style="
          font-size: 48px;
          margin-bottom: 15px;
        ">⚠️</div>
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">Loading Failed</div>
        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 15px; line-height: 1.4;">
          Unable to load the 3D experience. Please check your connection and try again.
        </div>
        <button onclick="location.reload()" style="
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'"
           onmouseout="this.style.backgroundColor='rgba(255,255,255,0.1)'">
          Retry
        </button>
      </div>
    `;

    if (this.container) {
      this.container.appendChild(errorDiv);
    }

    console.log('❌ Error state displayed');
  }

  async init() {
    try {
      // Find the container element (if not already found in lazy loading)
      if (!this.container) {
        this.container = document.querySelector('#webgl-container') ||
                         document.querySelector('.webgl-container') ||
                         document.querySelector('[data-webgl-container]');
      }

      if (!this.container) {
        console.error('WebGL container not found! Looking for #webgl-container');
        this.loadingState = 'error';
        return;
      }

      console.log('✅ Container found:', this.container);

      // Apply initial styling to prevent gradient flash (if not already applied)
      if (this.loadingState !== 'loading') {
        this.applyInitialStyling();
      }

      // Optionally attach debug panels if requested (via URL/global flag)
      await this.maybeAttachDebugPanels();

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

      // Optionally create debug panels (disabled by default)
      if (this.isDevelopment && this.debugPanelsEnabled) {
        this.createCameraInfoPanel && this.createCameraInfoPanel();
        this.createControlsPanel && this.createControlsPanel();
      }

      // Mark loading as complete
      this.loadingState = 'loaded';

      console.log('✅ 3D scene initialized successfully!');

    } catch (error) {
      console.error('❌ Error initializing 3D scene:', error);
      this.loadingState = 'error';
      this.showErrorState(error);
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

      // Optionally attach debug panels if requested (via URL/global flag)
      await this.maybeAttachDebugPanels();

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
    console.log('🎬 Playing welcome animation with updated start/end positions (smooth expo.inOut easing)...');
    
    // Use configuration values for animation positions
    const startPos = new THREE.Vector3(...animConfig.startPosition);
    const startTarget = new THREE.Vector3(...animConfig.startTarget);
    const endPos = new THREE.Vector3(...animConfig.endPosition);
    const endTarget = new THREE.Vector3(...animConfig.endTarget);
    
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
        console.log('✅ Welcome animation complete - new camera positions applied');
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

    // Remove lazy loading placeholder if it exists
    this.removeLazyLoadingPlaceholder();

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

    // (Phase 2 Cleanup) POI mapping initialization removed

  // Initialize new interaction system core (Phase 3 skeleton)
  this.initializeInteractionSystem();

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

          // (Phase 1 Cleanup) Flag POI system initialization removed

          // Phase 5.1: Initialize interactive stations automatically after model load
          try {
            if (this.interactionSystemInitialized) {
              this.setupInteractiveObjects();
              console.log('🧭 Phase 5.1: Interactive objects auto-setup after model load');
            } else {
              console.warn('⚠️ Phase 5.1: Interaction system not initialized yet when model loaded');
            }
          } catch (e) {
            console.error('❌ Phase 5.1: Failed to setup interactive objects:', e);
          }

          // Start fade-in animation for the model
          this.fadeInModel();

          resolve();
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`📊 Loading progress: ${percent}%`);

          // Update loading placeholder with progress
          this.updateLoadingState(`Loading 3D Model... ${percent}%`);
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
    const controlsConfig = this.config.controls;
    const uiConfig = this.config.ui;
    
    this.controls = new window.OrbitControls(this.camera, this.renderer.domElement);
    
    // Apply enhanced configuration settings
    this.controls.enableDamping = controlsConfig.enableDamping;
    this.controls.dampingFactor = controlsConfig.dampingFactor;
    
    // Apply updated polar angle restrictions
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(controlsConfig.minPolarAngle); // 22 degrees
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(controlsConfig.maxPolarAngle); // 104 degrees
    
    // Apply updated distance constraints
    this.controls.minDistance = controlsConfig.minDistance; // 50
    this.controls.maxDistance = controlsConfig.maxDistance; // 125
    
    // Enable/disable controls based on configuration
    this.controls.enableZoom = controlsConfig.enableZoom;
    this.controls.enableRotate = controlsConfig.enableRotate;
    this.controls.enablePan = controlsConfig.enablePan;
    
    // Set camera target from configuration
    this.controls.target.set(...cameraConfig.target);
    this.controls.update();

    console.log('🎮 Camera controls setup complete with updated configuration:', {
      minPolarAngle: controlsConfig.minPolarAngle + '°',
      maxPolarAngle: controlsConfig.maxPolarAngle + '°',
      minDistance: controlsConfig.minDistance,
      maxDistance: controlsConfig.maxDistance,
      dampingFactor: controlsConfig.dampingFactor
    });
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

  // Conditionally load and attach debug panels module
  async maybeAttachDebugPanels() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const shouldEnable = Boolean(
        window.ENABLE_3D_DEBUG_PANELS ||
        params.has('debug3d') ||
        params.get('debug-panels') === '1' ||
        params.get('debug') === '3d'
      );
      if (!shouldEnable) return;

      // Dynamic import to keep main bundle lean
      const mod = await import('./debug-panels.js');
      if (mod && typeof mod.attachDebugPanels === 'function') {
        mod.attachDebugPanels(this);
        this.debugPanelsEnabled = true;
        console.log('🧩 Debug panels module loaded');
      }
    } catch (e) {
      console.warn('Failed to load debug panels module:', e);
    }
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

    // Throttled debug updates (development only and only if panels enabled)
    if (
      this.isDevelopment &&
      this.debugPanelsEnabled &&
      typeof this.updateCameraInfo === 'function' &&
      (now - this.lastDebugUpdate) > 100
    ) {
      this.updateCameraInfo();
      this.lastDebugUpdate = now;
    }

    // Phase 5.1: Per-frame interaction visuals update (hover glow easing)
    if (this.updateInteractionVisuals) {
      this.updateInteractionVisuals();
    }

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // =============================================================================
  // Debug Panels moved to separate module: src/scripts/debug-panels.js
  // Methods (createCameraInfoPanel, updateCameraInfo, createControlsPanel,
  // setupControlsListeners) are attached by that module when enabled.
  // =============================================================================

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

    // Clean up lazy loading resources
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }

    // Clean up video lazy loading resources
    if (this.videoMutationObserver) {
      this.videoMutationObserver.disconnect();
      this.videoMutationObserver = null;
    }

    if (this.interceptedVideos) {
      this.interceptedVideos.clear();
      this.interceptedVideos = null;
    }

    // Remove any lazy loading UI elements
    this.removeLazyLoadingPlaceholder();
    const errorElement = this.container?.querySelector('.lazy-loading-error');

    // Cleanup: no external managers remain in simplified build
    this.smartLoadingManager = null;
    if (errorElement) {
      errorElement.remove();
    }

  // Phase 3: Interaction system disposal
  this.disposeInteractionSystem && this.disposeInteractionSystem();

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

  // =====================================================================
  // Phase 3: Interactive Station System (Skeleton)
  // =====================================================================
  // NOTE: This phase only introduces the foundational plumbing (raycaster,
  // event listeners, mapping object). Actual object detection, hover effects,
  // and modal triggering will be implemented in Phase 4.

  initializeInteractionSystem() {
    if (this.interactionSystemInitialized) {
      return; // Prevent duplicate initialization
    }
    if (!window.THREE || !this.renderer || !this.camera) {
      console.warn('⚠️ Interaction system postponed (Three.js or scene not ready yet)');
      return;
    }

    try {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      // Basic throttling for mouse move to avoid excessive calculations
      this._lastPointerMove = 0;
      this._pointerMoveThrottleMs = 50; // Adjust in Phase 5 if needed
      // Phase 5.3 performance metrics
      this._lastPointerActivity = performance.now();
      this._pointerIdleThresholdMs = 1500; // ms
      this._lastRaycastTime = 0;
      this._raycastIntervalMs = 50; // ms

      // Phase 5.2 touch interaction state
      this._touchState = {
        active: false,
        startX: 0,
        startY: 0,
        moved: false,
        startTime: 0,
        tapMovementThreshold: 10,
        tapDurationThreshold: 500
      };

      // Phase 4: Wire handlers to actual interaction logic methods
      this._interactionHandlers = {
        pointerMove: (event) => {
          const now = performance.now();
          if (now - this._lastPointerMove < this._pointerMoveThrottleMs) return;
          this._lastPointerMove = now;
          this.onPointerMove(event);
        },
        click: (event) => {
          this.onClick(event);
        },
        touchStart: (event) => {
          if (!event.touches || event.touches.length === 0) return;
          const touch = event.touches[0];
          this._touchState.active = true;
          this._touchState.startX = touch.clientX;
          this._touchState.startY = touch.clientY;
          this._touchState.startTime = performance.now();
          this._touchState.moved = false;
          // Immediate hover feedback
          this.onPointerMove(touch);
        },
        touchMove: (event) => {
          if (!event.touches || event.touches.length === 0) return;
          const touch = event.touches[0];
          const dx = touch.clientX - this._touchState.startX;
          const dy = touch.clientY - this._touchState.startY;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this._touchState.moved = true;
          if (!this._touchState.moved) this.onPointerMove(touch);
        },
        touchEnd: (event) => {
          if (!this._touchState.active) return;
          const duration = performance.now() - this._touchState.startTime;
          const wasTap = !this._touchState.moved && duration < this._touchState.tapDurationThreshold;
          this._touchState.active = false;
          if (wasTap && event.changedTouches && event.changedTouches.length > 0) {
            this.onClick(event.changedTouches[0]);
          }
        }
      };

      // Attach listeners to canvas element for scoped interaction
      const el = this.renderer.domElement;
      el.addEventListener('mousemove', this._interactionHandlers.pointerMove);
      el.addEventListener('click', this._interactionHandlers.click);
      el.addEventListener('touchstart', this._interactionHandlers.touchStart, { passive: true });
      el.addEventListener('touchmove', this._interactionHandlers.touchMove, { passive: true });
      el.addEventListener('touchend', this._interactionHandlers.touchEnd, { passive: true });

      this.interactionSystemInitialized = true;
      console.log('🧩 Phase 3 interaction system skeleton initialized');
    } catch (err) {
      console.error('❌ Failed to initialize interaction system skeleton:', err);
    }
  }

  updateNormalizedPointer(event) {
    if (!this.mouse || !this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  disposeInteractionSystem() {
    if (!this.interactionSystemInitialized || !this.renderer) return;
    const el = this.renderer.domElement;
    if (this._interactionHandlers) {
      el.removeEventListener('mousemove', this._interactionHandlers.pointerMove);
      el.removeEventListener('click', this._interactionHandlers.click);
      el.removeEventListener('touchstart', this._interactionHandlers.touchStart);
      el.removeEventListener('touchmove', this._interactionHandlers.touchMove);
      el.removeEventListener('touchend', this._interactionHandlers.touchEnd);
    }
    this.raycaster = null;
    this.mouse = null;
    this.hoveredObject = null;
    this.interactiveObjects = [];
    this.interactionSystemInitialized = false;
    console.log('🧹 Phase 3 interaction system skeleton disposed');
  }

  // =====================================================================
  // Phase 4: Interactive Station System - Functional Implementation
  // =====================================================================
  // Provides: object detection, hover feedback, cursor changes, modal triggers
  // NOTE: Not yet auto-invoked after model load (that will be Phase 5 task 5.1)

  // Discover interactive station objects within the loaded model
  setupInteractiveObjects() {
    if (!this.model) {
      console.warn('⚠️ Cannot setup interactive objects before model loads');
      return;
    }
    if (!this.stationMapping) {
      console.warn('⚠️ Station mapping not defined');
      return;
    }

    this.interactiveObjects = [];
    this._interactiveMetaMap = new Map();

    const stationKeys = Object.keys(this.stationMapping);
    let foundCount = 0;

    const foundKeys = new Set();

    this.model.traverse((child) => {
      if (!child.isMesh || !child.name) return;
      for (const key of stationKeys) {
        // Allow partial / case-insensitive match (e.g., 'Station01', 'station01_mesh')
        if (child.name.toLowerCase().includes(key.toLowerCase())) {
          // Clone material to prevent shared-material side effects when highlighting
            if (child.material && !child.material._isClonedForInteraction) {
              child.material = child.material.clone();
              child.material._isClonedForInteraction = true;
            }

          const meta = {
            object: child,
            stationKey: key,
            modalId: this.stationMapping[key],
            original: {
              color: child.material && child.material.color ? child.material.color.clone() : null,
              emissive: child.material && child.material.emissive ? child.material.emissive.clone() : null
            },
            currentGlow: 0,
            targetGlow: 0,
            highlighted: false
          };
          this.interactiveObjects.push(meta);
          this._interactiveMetaMap.set(child.uuid, meta);
          foundCount++;
          foundKeys.add(key);
          break; // Stop checking other keys for this child
        }
      }
    });

    console.log(`🧭 Interactive stations setup complete: ${foundCount} objects mapped`);

    // Phase 5.1: Log warnings for any missing mapped stations
    const missing = stationKeys.filter(k => !foundKeys.has(k));
    if (missing.length > 0) {
      console.warn('⚠️ Missing station objects for mapping keys:', missing);
    } else {
      console.log('✅ All station mapping keys found in model');
    }
    // Development overlay (stations debug) - only if debug panels enabled
    if (this.debugPanelsEnabled) {
      this.createInteractionDebugOverlay && this.createInteractionDebugOverlay(foundKeys, missing);
    }
  }

  // Handle pointer movement for hover detection
  onPointerMove(event) {
    if (!this.raycaster || !this.mouse || !this.camera) return;
    const now = performance.now();
    this._lastPointerActivity = now;
    this.updateNormalizedPointer(event);

    if (!this.interactiveObjects || this.interactiveObjects.length === 0) {
      // Silent early exit until setupInteractiveObjects is called (Phase 5)
      return;
    }

  if (now - this._lastRaycastTime < this._raycastIntervalMs) return; // interval gating
  if (now - this._lastPointerActivity > this._pointerIdleThresholdMs) return; // idle gating
  this._lastRaycastTime = now;
  this.raycaster.setFromCamera(this.mouse, this.camera);
    const candidates = this.interactiveObjects.map(m => m.object);
    const intersections = this.raycaster.intersectObjects(candidates, true);

    const top = intersections.length > 0 ? intersections[0].object : null;

    if (top && (!this.hoveredObject || this.hoveredObject.uuid !== top.uuid)) {
      // New hover target
      this.clearHover();
      this.applyHover(top);
    } else if (!top && this.hoveredObject) {
      // Pointer left any interactive object
      this.clearHover();
    }
  }

  // Handle click / touch interaction
  onClick(event) {
    if (!this.raycaster || !this.mouse || !this.camera) return;
    this.updateNormalizedPointer(event);

    if (!this.interactiveObjects || this.interactiveObjects.length === 0) {
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const candidates = this.interactiveObjects.map(m => m.object);
    const intersections = this.raycaster.intersectObjects(candidates, true);
    if (intersections.length === 0) return;

    const hit = intersections[0].object;
    const meta = this._interactiveMetaMap && this._interactiveMetaMap.get(hit.uuid);
    if (meta) {
      console.log(`🖱️ Station clicked: ${meta.stationKey} -> modal '${meta.modalId}'`);
      this.triggerModal(meta.modalId, meta.stationKey);
    }
  }

  applyHover(object) {
    this.hoveredObject = object;
    if (!this._interactiveMetaMap) return;
    const meta = this._interactiveMetaMap.get(object.uuid);
    if (!meta) return;
    meta.targetGlow = 1; // Animate towards highlight
    meta.highlighted = true;
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.cursor = 'pointer';
    }
  }

  clearHover() {
    if (!this.hoveredObject || !this._interactiveMetaMap) return;
    const meta = this._interactiveMetaMap.get(this.hoveredObject.uuid);
    if (meta) {
      meta.targetGlow = 0;
      meta.highlighted = false;
    }
    this.hoveredObject = null;
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  // Smooth visual feedback executed each frame from animate()
  updateInteractionVisuals() {
    if (!this.interactiveObjects || this.interactiveObjects.length === 0) return;
    let active = this.hoveredObject != null;
    if (!active) {
      for (let i = 0; i < this.interactiveObjects.length; i++) {
        const m = this.interactiveObjects[i];
        if (m.currentGlow > 0.001 || m.targetGlow > 0.001) { active = true; break; }
      }
    }
    if (!active) return; // nothing to update this frame
    const highlightColor = new THREE.Color(0xffd54f); // Warm accent
    this.interactiveObjects.forEach(meta => {
      meta.currentGlow += (meta.targetGlow - meta.currentGlow) * 0.15; // easing factor
      if (!meta.object.material) return;
      const mat = meta.object.material;
      if (mat.emissive) {
        const base = meta.original.emissive ? meta.original.emissive.clone() : new THREE.Color(0x000000);
        mat.emissive.copy(base.lerp(highlightColor, meta.currentGlow));
      } else if (mat.color && meta.original.color) {
        mat.color.copy(meta.original.color.clone().lerp(highlightColor, meta.currentGlow * 0.5));
      }
    });
  }

  // Development helper overlay & diagnostics moved to debug-panels.js

  // Trigger modal by creating (if needed) a temporary hidden element
  triggerModal(modalId, stationKey = '') {
    if (!modalId) {
      console.warn('⚠️ triggerModal called without modalId');
      return;
    }

    // Debounce repeated rapid triggers for same station
    const now = performance.now();
    this._lastModalTriggerMap = this._lastModalTriggerMap || new Map();
    const lastTime = this._lastModalTriggerMap.get(modalId) || 0;
    if (now - lastTime < 400) return; // debounce duplicate rapid triggers
    this._lastModalTriggerMap.set(modalId, now);

    // Find existing triggers (could be multiple)
    const matches = Array.from(document.querySelectorAll(`[data-modal-trigger="${modalId}"]`));
    let triggerEl = null;
    if (matches.length > 0) {
      // Prefer visible element with anchor/button child
      triggerEl = matches.find(el => this._isElementVisible(el)) || matches[0];
    }

    let created = false;
    if (!triggerEl) {
      // Create a temporary structural element closer to example markup (li > a)
      const temp = document.createElement('li');
      temp.dataset.modalTrigger = modalId;
      temp.setAttribute('aria-hidden', 'true');
      temp.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;top:auto;overflow:hidden;';
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = 'auto-trigger';
      temp.appendChild(a);
      document.body.appendChild(temp);
      triggerEl = temp;
      created = true;
    }

    // Determine best dispatch target (anchor/button inside or the element itself)
    let targetEl = triggerEl.matches('a,button') ? triggerEl : triggerEl.querySelector('a,button') || triggerEl;

    // Full synthetic interaction sequence to maximize compatibility
    const eventOptions = { bubbles: true, cancelable: true };
    const sequence = ['pointerdown', 'mousedown', 'mouseup', 'click'];
    sequence.forEach(type => { try { targetEl.dispatchEvent(new MouseEvent(type, eventOptions)); } catch (e) { /* ignore */ } });

    // Fallback: if a global modal open function exists, call it
    if (typeof window.openModal === 'function') {
      try {
        window.openModal(modalId);
      } catch (e) { /* ignore */ }
    }

    // Attempt to lazy load assets for this modal after dispatch (modal may mount asynchronously)
    this.lazyLoadModalAssets(modalId);

    // Clean temporary element
    if (created) {
      setTimeout(() => {
        if (triggerEl && triggerEl.parentNode) triggerEl.parentNode.removeChild(triggerEl);
      }, 1500);
    }
  }

  _isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // ============================================================================================
  // LAZY LOADING FOR MODAL / STATION CONTENT
  // ============================================================================================
  // Usage pattern for HTML inside modal:
  // <img data-src="/path/heavy.jpg" alt="..." width="400" height="300" />
  // <source data-srcset="/path/heavy@1x.jpg 1x, /path/heavy@2x.jpg 2x" type="image/jpeg" />
  // <div data-bg-src="/path/bg.jpg"></div>
  // <video data-src="/video/clip.mp4" poster="/video/poster.jpg"></video>
  // On first user click for that station/modal, assets are populated.

  lazyLoadModalAssets(modalId, attempt = 0) {
    if (!modalId) return;
    this._lazyLoadedModals = this._lazyLoadedModals || new Set();
    if (this._lazyLoadedModals.has(modalId)) return; // already done

    const selectors = [
      `[data-modal-id="${modalId}"]`,
      `[data-modal="${modalId}"]`,
      `#${modalId}`
    ];
    let modalEl = null;
    for (const sel of selectors) {
      modalEl = document.querySelector(sel);
      if (modalEl) break;
    }

    // If modal not yet in DOM (maybe created lazily by framework), retry up to 10 times
    if (!modalEl) {
      if (attempt < 10) {
        setTimeout(() => this.lazyLoadModalAssets(modalId, attempt + 1), 120);
      }
      return;
    }

    // Minimal legacy support only (no heavy asset manager)

    // Restore intercepted videos for this modal (NEW)
    this.restoreVideoSrc(modalId);

    // Legacy support: Images with data-src (Webflow format)
    const imgs = modalEl.querySelectorAll('img[data-src]');
    imgs.forEach(img => {
      if (!img.getAttribute('src')) {
        img.setAttribute('src', img.getAttribute('data-src'));
      }
      const ds = img.getAttribute('data-srcset');
      if (ds && !img.getAttribute('srcset')) img.setAttribute('srcset', ds);
    });

    // Legacy support: Picture sources with data-srcset
    const sources = modalEl.querySelectorAll('source[data-srcset]');
    sources.forEach(src => {
      if (!src.getAttribute('srcset')) src.setAttribute('srcset', src.getAttribute('data-srcset'));
    });

    // Legacy support: Videos with data-src (additional fallback)
    const videos = modalEl.querySelectorAll('video[data-src]');
    videos.forEach(video => {
      if (!video.getAttribute('src')) {
        video.setAttribute('src', video.getAttribute('data-src'));
      }
    });

    // Backgrounds/videos/inline HTML handling removed per simplification

    this._lazyLoadedModals.add(modalId);
    console.log('📹 Modal assets loaded for:', modalId);
  }

  /**
   * Helper method to get station key from modal ID
   */
  getStationKeyFromModalId(modalId) {
    // Reverse lookup from modal ID to station key
    const stationMapping = {
      'station-1': 'station_1',
      'station-2': 'station_2',
      'station-3': 'station_3',
      'station-4': 'station_4',
      'station-5': 'station_5',
      'station-6': 'station_6',
      'station-7': 'station_7',
      'station-8': 'station_8',
      'station-9': 'station_9',
      'station-10': 'station_10'
    };

    return stationMapping[modalId] || null;
  }
}

// =============================================================================
// Optional Debug Panels Loader (on-demand)
// =============================================================================
// Call from the console to enable debug UI without reloading:
//   enable3DDebugPanels()
// Or add ?debug3d to the URL to auto-enable
window.enable3DDebugPanels = async function enable3DDebugPanels() {
  try {
    const mod = await import('./debug-panels.js');
    if (mod && typeof mod.attachDebugPanels === 'function') {
      if (!window.simple3DLoader) {
        console.warn('simple3DLoader not initialized yet. Try again after it loads.');
        return;
      }
      mod.attachDebugPanels(window.simple3DLoader);
      window.simple3DLoader.debugPanelsEnabled = true;
      console.log('🧩 3D Debug Panels enabled');
    }
  } catch (e) {
    console.warn('Failed to dynamically load debug panels module:', e);
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
