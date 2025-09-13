/**
 * Simplified 3D Map Implementation for Webflow
 * Uses bundled Three.js for better compatibility
 */

(function() {
  'use strict';

  function createFallbackDisplay() {
    const container = document.querySelector('#webgl-container') || 
                     document.querySelector('.w-webgl-container') ||
                     document.querySelector('[data-webgl-container]');
    
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          text-align: center;
          border-radius: 12px;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        ">
          <div class="content" style="position: relative; z-index: 2;">
            <div style="font-size: 64px; margin-bottom: 24px; animation: bounce 2s infinite;">🏗️</div>
            <div style="font-size: 28px; font-weight: 600; margin-bottom: 16px;">
              Interaktive 3D-Karte
            </div>
            <div style="font-size: 18px; opacity: 0.9; margin-bottom: 24px;">
              Erkunden Sie das Goetheviertel in 3D
            </div>
            <div style="font-size: 14px; opacity: 0.7; max-width: 400px; line-height: 1.5;">
              Die 3D-Visualisierung wird geladen. Bei Problemen wenden Sie sich bitte an den technischen Support.
            </div>
          </div>
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\" viewBox=\"0 0 60 60\"><g fill=\"none\" fill-rule=\"evenodd\"><g fill=\"%23ffffff\" fill-opacity=\"0.1\"><polygon points=\"0,0 60,0 60,30 0,30\"/></g></g></svg>') repeat;
            animation: slide 20s linear infinite;
          "></div>
          
          <style>
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
            }
            @keyframes slide {
              0% { transform: translateX(0); }
              100% { transform: translateX(60px); }
            }
          </style>
        </div>
      `;
    }
  }

  // Simple Three.js loading with better error handling
  function loadThreeJS() {
    if (typeof THREE !== 'undefined') {
      console.log('✅ Three.js already loaded, initializing...');
      initializeSimple3D();
      return;
    }

    console.log('🔄 Loading Three.js...');
    
    // Try the most reliable CDN first
    const threeScript = document.createElement('script');
    threeScript.src = 'https://unpkg.com/three@0.158.0/build/three.min.js';
    
    const timeout = setTimeout(() => {
      console.warn('⏰ Three.js loading timeout, showing fallback');
      createFallbackDisplay();
    }, 10000);
    
    threeScript.onload = () => {
      clearTimeout(timeout);
      if (typeof THREE !== 'undefined') {
        console.log('✅ Three.js loaded successfully');
        // Give it a moment to fully initialize
        setTimeout(initializeSimple3D, 500);
      } else {
        console.error('❌ Three.js loaded but not available');
        createFallbackDisplay();
      }
    };
    
    threeScript.onerror = () => {
      clearTimeout(timeout);
      console.error('❌ Failed to load Three.js');
      createFallbackDisplay();
    };
    
    document.head.appendChild(threeScript);
  }

  function initializeSimple3D() {
    console.log('🎯 Initializing simple 3D scene...');
    
    const container = document.querySelector('#webgl-container') || 
                     document.querySelector('.w-webgl-container') ||
                     document.querySelector('[data-webgl-container]');
    
    if (!container) {
      console.error('❌ No container found for 3D scene');
      return;
    }

    try {
      // Create scene, camera, renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x87CEEB, 0.3); // Light blue background
      container.appendChild(renderer.domElement);
      
      // Add some basic lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      // Create a simple placeholder geometry (representing a building/district)
      const geometry = new THREE.BoxGeometry(2, 1, 2);
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xDAA520,  // Goldenrod color
        transparent: true,
        opacity: 0.8
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      // Add some additional buildings
      for (let i = 0; i < 5; i++) {
        const buildingGeometry = new THREE.BoxGeometry(
          Math.random() * 1 + 0.5,
          Math.random() * 2 + 0.5,
          Math.random() * 1 + 0.5
        );
        const buildingMaterial = new THREE.MeshLambertMaterial({
          color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.7, 0.6),
          transparent: true,
          opacity: 0.7
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(
          (Math.random() - 0.5) * 8,
          0,
          (Math.random() - 0.5) * 8
        );
        scene.add(building);
      }
      
      // Position camera
      camera.position.set(5, 3, 5);
      camera.lookAt(0, 0, 0);
      
      // Simple mouse controls
      let mouseX = 0;
      let mouseY = 0;
      const targetRotationX = 0;
      const targetRotationY = 0;
      
      container.addEventListener('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        mouseX = (event.clientX - rect.left - rect.width / 2) / rect.width;
        mouseY = (event.clientY - rect.top - rect.height / 2) / rect.height;
      });
      
      // Animation loop
      let animationId;
      function animate() {
        animationId = requestAnimationFrame(animate);
        
        // Rotate based on mouse position
        cube.rotation.y = mouseX * 0.5;
        cube.rotation.x = mouseY * 0.5;
        
        // Gentle auto-rotation
        scene.rotation.y += 0.005;
        
        renderer.render(scene, camera);
      }
      
      // Handle window resize
      function onWindowResize() {
        if (container) {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        }
      }
      
      window.addEventListener('resize', onWindowResize);
      
      // Start animation
      animate();
      
      console.log('✅ Simple 3D scene initialized successfully');
      
      // Add a subtle loading completion indicator
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        z-index: 1000;
        animation: fadeInOut 3s ease-out;
      `;
      indicator.innerHTML = '✨ 3D Ready';
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
      
      container.style.position = 'relative';
      container.appendChild(indicator);
      
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 3000);
      
      // Expose for debugging
      window.simple3DScene = {
        scene,
        camera,
        renderer,
        cleanup: () => {
          if (animationId) cancelAnimationFrame(animationId);
          window.removeEventListener('resize', onWindowResize);
          if (renderer) renderer.dispose();
        }
      };
      
    } catch (error) {
      console.error('❌ Error initializing 3D scene:', error);
      createFallbackDisplay();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadThreeJS);
  } else {
    loadThreeJS();
  }

})();