/**
 * In-browser 3D Diagnostics Script
 * This script runs inside the browser to diagnose 3D model issues
 */

(function() {
  'use strict';
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    webgl: {},
    threejs: {},
    containers: {},
    models: {},
    errors: [],
    performance: {}
  };
  
  // WebGL Support Check
  function checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      
      diagnostics.webgl = {
        supported: !!gl,
        version: gl ? gl.getParameter(gl.VERSION) : null,
        vendor: gl ? gl.getParameter(gl.VENDOR) : null,
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
        maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
        maxVertexAttribs: gl ? gl.getParameter(gl.MAX_VERTEX_ATTRIBS) : 0
      };
    } catch (error) {
      diagnostics.webgl = { supported: false, error: error.message };
      diagnostics.errors.push(`WebGL Error: ${error.message}`);
    }
  }
  
  // Three.js Check
  function checkThreeJS() {
    diagnostics.threejs = {
      loaded: typeof THREE !== 'undefined',
      version: typeof THREE !== 'undefined' ? THREE.REVISION : null,
      hasGLTFLoader: typeof THREE !== 'undefined' && !!THREE.GLTFLoader,
      hasDRACOLoader: typeof THREE !== 'undefined' && !!THREE.DRACOLoader,
      hasOrbitControls: typeof THREE !== 'undefined' && !!THREE.OrbitControls
    };
    
    if (typeof THREE === 'undefined') {
      diagnostics.errors.push('Three.js is not loaded');
    }
  }
  
  // Container Check
  function checkContainers() {
    const containers = [
      { selector: '#webgl-container', name: 'Main WebGL Container' },
      { selector: '.webgl-container', name: 'WebGL Container Class' },
      { selector: '.w-webgl-container', name: 'Webflow WebGL Container' },
      { selector: '[data-webgl-container]', name: 'Data WebGL Container' }
    ];
    
    diagnostics.containers.found = [];
    diagnostics.containers.canvases = [];
    
    containers.forEach(({ selector, name }) => {
      const element = document.querySelector(selector);
      if (element) {
        const canvas = element.querySelector('canvas');
        const rect = element.getBoundingClientRect();
        
        diagnostics.containers.found.push({
          name,
          selector,
          hasCanvas: !!canvas,
          dimensions: {
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          },
          innerHTML: element.innerHTML.substring(0, 200),
          styles: {
            display: getComputedStyle(element).display,
            visibility: getComputedStyle(element).visibility,
            position: getComputedStyle(element).position,
            zIndex: getComputedStyle(element).zIndex
          }
        });
        
        if (canvas) {
          diagnostics.containers.canvases.push({
            width: canvas.width,
            height: canvas.height,
            style: canvas.style.cssText,
            hasWebGLContext: !!canvas.getContext('webgl')
          });
        }
      }
    });
  }
  
  // Model Loading Check
  function checkModels() {
    diagnostics.models = {
      loadingAttempts: window.webflow3DModelAttempts || 0,
      loadedModels: window.webflow3DLoadedModels || [],
      currentScene: !!window.webflow3DScene,
      sceneObjects: 0
    };
    
    if (window.webflow3DScene && window.webflow3DScene.children) {
      diagnostics.models.sceneObjects = window.webflow3DScene.children.length;
    }
  }
  
  // Performance Check
  function checkPerformance() {
    const timing = performance.getEntriesByType('navigation')[0];
    if (timing) {
      diagnostics.performance = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')
          .find(entry => entry.name === 'first-paint')?.startTime || 0
      };
    }
    
    // Check for any long tasks
    const longTasks = performance.getEntriesByType('longtask');
    if (longTasks.length > 0) {
      diagnostics.performance.longTasks = longTasks.length;
      diagnostics.errors.push(`Performance: ${longTasks.length} long tasks detected`);
    }
  }
  
  // Error Collection
  function checkErrors() {
    // Check for console errors (this might not catch all errors but will try)
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
      errorCount++;
      diagnostics.errors.push(`Console Error: ${args.join(' ')}`);
      return originalError.apply(console, args);
    };
    
    // Check for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      diagnostics.errors.push(`Unhandled Promise Rejection: ${event.reason}`);
    });
    
    // Restore original console.error after a short delay
    setTimeout(() => {
      console.error = originalError;
    }, 1000);
  }
  
  // Run all diagnostics
  function runDiagnostics() {
    console.log('🔍 Running in-browser 3D diagnostics...');
    
    checkWebGLSupport();
    checkThreeJS();
    checkContainers();
    checkModels();
    checkPerformance();
    checkErrors();
    
    // Add to window for external access
    window.webflow3DDiagnostics = diagnostics;
    
    console.log('📊 3D Diagnostics Results:', diagnostics);
    
    // Return for external use
    return diagnostics;
  }
  
  // Auto-run after a short delay to allow page to initialize
  setTimeout(runDiagnostics, 2000);
  
  // Also expose function for manual execution
  window.runWebflow3DDiagnostics = runDiagnostics;
  
})();