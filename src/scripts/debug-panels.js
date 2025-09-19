// Debug Panels module for Simple3DLoader
// Loaded on-demand to keep production bundle lean

export function attachDebugPanels(loader) {
  try {
    if (!loader) {
      console.warn('[3D Debug] attachDebugPanels called without loader instance');
      return;
    }

    // Mark as enabled so existing checks in the loader work
    loader.debugPanelsEnabled = true;

    // ---------------------------------------------------------------------------
    // Camera Debug Panel methods
    // ---------------------------------------------------------------------------
    loader.createCameraInfoPanel = function() {
      if (document.getElementById('camera-debug-panel')) {
        console.log('📊 Camera panel already exists');
        return;
      }

      console.log('📊 Creating camera info panel for development...');

      const panel = document.createElement('div');
      panel.id = 'camera-debug-panel';
      panel.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          z-index: 10000;
          min-width: 250px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 8px;
          ">
            <strong style="color: #4CAF50;">📷 Camera Debug</strong>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
              background: rgba(255, 255, 255, 0.1);
              border: none;
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              cursor: pointer;
            ">×</button>
          </div>
          <div><strong>Position:</strong> <span id="camera-position">-</span></div>
          <div><strong>Target:</strong> <span id="camera-target">-</span></div>
          <div><strong>Distance:</strong> <span id="camera-distance">-</span></div>
          <div><strong>Rotation:</strong> <span id="camera-rotation">-</span></div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
            <button class="copy-btn" onclick="window.copyCurrentPosition && window.copyCurrentPosition()" style="
              background: #2196F3;
              border: none;
              color: white;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
              width: 100%;
            ">📋 Copy Position</button>
          </div>
        </div>
      `;

      document.body.appendChild(panel);
      console.log('✅ Camera info panel created and visible');
    };

    loader.updateCameraInfo = function() {
      if (!this.camera || !this.controls || !window.THREE) return;

      const pos = this.camera.position;
      const target = this.controls.target;
      const distance = pos.distanceTo(target);

      // Calculate rotation in degrees
      const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
      const rotX = THREE.MathUtils.radToDeg(euler.x);
      const rotY = THREE.MathUtils.radToDeg(euler.y);

      // Update DOM elements if they exist
      const posElement = document.getElementById('camera-position');
      const targetElement = document.getElementById('camera-target');
      const distanceElement = document.getElementById('camera-distance');
      const rotationElement = document.getElementById('camera-rotation');

      if (posElement) {
        posElement.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
      }
      if (targetElement) {
        targetElement.textContent = `${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}`;
      }
      if (distanceElement) {
        distanceElement.textContent = distance.toFixed(1);
      }
      if (rotationElement) {
        rotationElement.textContent = `${rotX.toFixed(1)}°, ${rotY.toFixed(1)}°`;
      }
    };

    // ---------------------------------------------------------------------------
    // Controls Debug Panel methods
    // ---------------------------------------------------------------------------
    loader.createControlsPanel = function() {
      if (document.getElementById('controls-debug-panel')) {
        console.log('🎮 Controls panel already exists');
        return;
      }

      console.log('🎮 Creating controls debug panel...');

      const panel = document.createElement('div');
      panel.id = 'controls-debug-panel';
      panel.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          z-index: 10000;
          min-width: 280px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 8px;
          ">
            <strong style="color: #FF9800;">🎮 Controls Debug</strong>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
              background: rgba(255, 255, 255, 0.1);
              border: none;
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              cursor: pointer;
            ">×</button>
          </div>

          <!-- Rotation Limits -->
          <div style="margin-bottom: 8px;">
            <div style="color: #FFC107; margin-bottom: 4px;"><strong>Rotation Limits:</strong></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <label style="width: 45%;">Min Polar (°):</label>
              <input type="range" id="minPolar" min="0" max="90" step="1" value="27" style="width: 40%;">
              <span id="minPolarValue" style="width: 10%; text-align: right;">27</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <label style="width: 45%;">Max Polar (°):</label>
              <input type="range" id="maxPolar" min="45" max="180" step="1" value="54" style="width: 40%;">
              <span id="maxPolarValue" style="width: 10%; text-align: right;">54</span>
            </div>
          </div>

          <!-- Distance Limits -->
          <div style="margin-bottom: 8px;">
            <div style="color: #4CAF50; margin-bottom: 4px;"><strong>Distance Limits:</strong></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <label style="width: 45%;">Min Distance:</label>
              <input type="range" id="minDistance" min="10" max="150" step="5" value="85" style="width: 40%;">
              <span id="minDistanceValue" style="width: 10%; text-align: right;">85</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <label style="width: 45%;">Max Distance:</label>
              <input type="range" id="maxDistance" min="50" max="200" step="5" value="125" style="width: 40%;">
              <span id="maxDistanceValue" style="width: 10%; text-align: right;">125</span>
            </div>
          </div>

          <!-- Control Toggles -->
          <div style="margin-bottom: 8px;">
            <div style="color: #2196F3; margin-bottom: 4px;"><strong>Control Options:</strong></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <label>Enable Zoom:</label>
              <input type="checkbox" id="enableZoom" checked style="margin-left: auto;">
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <label>Enable Rotate:</label>
              <input type="checkbox" id="enableRotate" checked style="margin-left: auto;">
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <label>Enable Pan:</label>
              <input type="checkbox" id="enablePan" checked style="margin-left: auto;">
            </div>
          </div>

          <!-- Damping -->
          <div style="margin-bottom: 8px;">
            <div style="color: #9C27B0; margin-bottom: 4px;"><strong>Damping:</strong></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <label style="width: 45%;">Damping Factor:</label>
              <input type="range" id="dampingFactor" min="0.01" max="0.2" step="0.01" value="0.02" style="width: 40%;">
              <span id="dampingFactorValue" style="width: 10%; text-align: right;">0.02</span>
            </div>
          </div>

          <!-- Export Button -->
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
            <button onclick="window.exportControlsConfig && window.exportControlsConfig()" style="
              background: #4CAF50;
              border: none;
              color: white;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
              width: 100%;
            ">📋 Export Controls Config</button>
          </div>
        </div>
      `;

      document.body.appendChild(panel);
      this.setupControlsListeners();

      console.log('✅ Controls debug panel created');
    };

    loader.setupControlsListeners = function() {
      if (!window.document) return;
      const minPolarSlider = document.getElementById('minPolar');
      const maxPolarSlider = document.getElementById('maxPolar');
      const minPolarValue = document.getElementById('minPolarValue');
      const maxPolarValue = document.getElementById('maxPolarValue');

      if (minPolarSlider) {
        minPolarSlider.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (minPolarValue) minPolarValue.textContent = value;
          if (this.controls && window.THREE) {
            this.controls.minPolarAngle = THREE.MathUtils.degToRad(value);
          }
        });
      }

      if (maxPolarSlider) {
        maxPolarSlider.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (maxPolarValue) maxPolarValue.textContent = value;
          if (this.controls && window.THREE) {
            this.controls.maxPolarAngle = THREE.MathUtils.degToRad(value);
          }
        });
      }

      const minDistanceSlider = document.getElementById('minDistance');
      const maxDistanceSlider = document.getElementById('maxDistance');
      const minDistanceValue = document.getElementById('minDistanceValue');
      const maxDistanceValue = document.getElementById('maxDistanceValue');

      if (minDistanceSlider) {
        minDistanceSlider.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (minDistanceValue) minDistanceValue.textContent = value;
          if (this.controls) {
            this.controls.minDistance = value;
          }
        });
      }

      if (maxDistanceSlider) {
        maxDistanceSlider.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (maxDistanceValue) maxDistanceValue.textContent = value;
          if (this.controls) {
            this.controls.maxDistance = value;
          }
        });
      }

      const enableZoom = document.getElementById('enableZoom');
      const enableRotate = document.getElementById('enableRotate');
      const enablePan = document.getElementById('enablePan');

      if (enableZoom) {
        enableZoom.addEventListener('change', (e) => {
          if (this.controls) this.controls.enableZoom = e.target.checked;
        });
      }
      if (enableRotate) {
        enableRotate.addEventListener('change', (e) => {
          if (this.controls) this.controls.enableRotate = e.target.checked;
        });
      }
      if (enablePan) {
        enablePan.addEventListener('change', (e) => {
          if (this.controls) this.controls.enablePan = e.target.checked;
        });
      }

      const dampingFactorSlider = document.getElementById('dampingFactor');
      const dampingFactorValue = document.getElementById('dampingFactorValue');
      if (dampingFactorSlider) {
        dampingFactorSlider.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (dampingFactorValue) dampingFactorValue.textContent = value;
          if (this.controls) this.controls.dampingFactor = value;
        });
      }

      console.log('✅ Controls panel event listeners setup');
    };

    // ---------------------------------------------------------------------------
    // Interaction Debug Overlay & Diagnostics
    // ---------------------------------------------------------------------------
    loader.createInteractionDebugOverlay = function(foundKeys, missingKeys) {
      if (!this.isDevelopment || !this.debugPanelsEnabled) return;
      if (document.getElementById('interaction-debug-overlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'interaction-debug-overlay';
      overlay.style.cssText = 'position:fixed;left:20px;bottom:20px;z-index:10001;font:11px/1.4 monospace;background:rgba(0,0,0,0.65);color:#fff;padding:10px 12px;border:1px solid rgba(255,255,255,0.15);border-radius:6px;max-width:260px;backdrop-filter:blur(6px)';
      const foundList = Array.from(foundKeys || []).sort().join(', ') || '—';
      const missingList = (missingKeys && missingKeys.length) ? missingKeys.join(', ') : 'None';
      overlay.innerHTML = `
        <div style="font-weight:bold;margin-bottom:4px;color:#ffd54f;">Stations Debug</div>
        <div><strong>Found:</strong> ${foundList}</div>
        <div><strong>Missing:</strong> <span style="color:${(missingKeys && missingKeys.length)?'#ff8080':'#8bc34a'};">${missingList}</span></div>
        <div><strong>Interactive Objects:</strong> ${this.interactiveObjects?.length || 0}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
          <button id="reload-interactive" style="flex:1 1 auto;background:#374151;color:#fff;border:1px solid #555;padding:4px 6px;border-radius:4px;cursor:pointer;">Reload</button>
          <button id="diag-interactive" style="flex:1 1 auto;background:#2563eb;color:#fff;border:1px solid #1d4ed8;padding:4px 6px;border-radius:4px;cursor:pointer;">Diag</button>
          <button id="close-interactive" style="flex:0 1 auto;background:#555;color:#fff;border:1px solid #666;padding:4px 6px;border-radius:4px;cursor:pointer;">×</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#reload-interactive').addEventListener('click', () => { try { this.setupInteractiveObjects && this.setupInteractiveObjects(); } catch(e){ console.error(e);} });
      overlay.querySelector('#diag-interactive').addEventListener('click', () => { this.runInteractionDiagnostics && this.runInteractionDiagnostics(); });
      overlay.querySelector('#close-interactive').addEventListener('click', () => overlay.remove());
    };

    loader.runInteractionDiagnostics = function() {
      const results = { totalMapped: Object.keys(this.stationMapping||{}).length, interactiveCount: this.interactiveObjects?.length || 0, missing: [], duplicatedMaterials: 0 };
      const found = new Set((this.interactiveObjects || []).map(m => m.stationKey));
      Object.keys(this.stationMapping||{}).forEach(k => { if (!found.has(k)) results.missing.push(k); });
      const matUsage = new Map();
      (this.interactiveObjects || []).forEach(meta => { const mat = meta.object?.material; if (!mat) return; matUsage.set(mat.uuid, (matUsage.get(mat.uuid)||0)+1); });
      matUsage.forEach(count => { if (count>1) results.duplicatedMaterials++; });
      console.log('🧪 Interaction Diagnostics:', results);
      if (results.missing.length) console.warn('⚠️ Missing station mapping keys:', results.missing); else console.log('✅ All station mapping keys present.');
      if (results.duplicatedMaterials>0) console.warn('⚠️ Some interactive objects still share materials:', results.duplicatedMaterials); else console.log('✅ All interactive materials properly cloned.');
      return results;
    };

    // ---------------------------------------------------------------------------
    // Global helpers (bound to current loader instance)
    // ---------------------------------------------------------------------------
    window.toggleCameraPanel = function() {
      const content = document.getElementById('camera-content');
      const btn = document.getElementById('camera-btn');
      if (content && btn) {
        const isHidden = content.classList.contains('hidden');
        if (isHidden) {
          content.classList.remove('hidden');
          btn.textContent = '−';
        } else {
          content.classList.add('hidden');
          btn.textContent = '+';
        }
      }
    };

    window.copyCurrentPosition = async function() {
      const l = window.simple3DLoader || loader;
      if (!l || !l.camera || !l.controls) return;
      const pos = l.camera.position;
      const target = l.controls.target;
      const jsCode = `// Camera position for Webflow\n`+
        `camera.position.set(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)});\n`+
        `camera.lookAt(${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)});\n`+
        `controls.target.set(${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)});`;

      try {
        await navigator.clipboard.writeText(jsCode);
        console.log('📋 Camera position copied to clipboard!');
        const btn = document.querySelector('.copy-btn');
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = '✅ Copied!';
          btn.style.background = '#059669';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#374151';
          }, 2000);
        }
      } catch (err) {
        console.warn('Copy failed, code logged to console:', jsCode);
        alert('Copy failed - check console for camera position code');
      }
    };

    window.exportControlsConfig = function() {
      const l = window.simple3DLoader || loader;
      if (!l || !l.controls || !window.THREE) {
        console.warn('⚠️ No controls or THREE found');
        return;
      }

      const minPolar = document.getElementById('minPolar')?.value || THREE.MathUtils.radToDeg(l.controls.minPolarAngle);
      const maxPolar = document.getElementById('maxPolar')?.value || THREE.MathUtils.radToDeg(l.controls.maxPolarAngle);
      const minDistance = document.getElementById('minDistance')?.value || l.controls.minDistance;
      const maxDistance = document.getElementById('maxDistance')?.value || l.controls.maxDistance;
      const enableZoom = document.getElementById('enableZoom')?.checked !== undefined ? document.getElementById('enableZoom').checked : l.controls.enableZoom;
      const enableRotate = document.getElementById('enableRotate')?.checked !== undefined ? document.getElementById('enableRotate').checked : l.controls.enableRotate;
      const enablePan = document.getElementById('enablePan')?.checked !== undefined ? document.getElementById('enablePan').checked : l.controls.enablePan;
      const dampingFactor = document.getElementById('dampingFactor')?.value || l.controls.dampingFactor;

      const controlsConfig = {
        exportedAt: new Date().toISOString(),
        controls: {
          minPolarAngle: parseFloat(minPolar),
          maxPolarAngle: parseFloat(maxPolar),
          minDistance: parseFloat(minDistance),
          maxDistance: parseFloat(maxDistance),
          enableZoom: enableZoom,
          enableRotate: enableRotate,
          enablePan: enablePan,
          dampingFactor: parseFloat(dampingFactor),
          enableDamping: true
        },
        current3DState: {
          cameraPosition: {
            x: l.camera?.position.x,
            y: l.camera?.position.y,
            z: l.camera?.position.z
          },
          target: {
            x: l.controls?.target.x,
            y: l.controls?.target.y,
            z: l.controls?.target.z
          }
        },
        usage: 'Apply these settings to OrbitControls in production'
      };

      const exportData = JSON.stringify(controlsConfig, null, 2);
      try {
        navigator.clipboard.writeText(exportData).then(() => {
          console.log('📋 Controls configuration copied to clipboard!');
          console.log('🎮 Controls Config:', controlsConfig);
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(76, 175, 80, 0.95);
              color: white;
              padding: 15px 25px;
              border-radius: 8px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              z-index: 20000;
              text-align: center;
              backdrop-filter: blur(10px);
            ">
              ✅ Controls Config Exported!<br>
              <small>Configuration copied to clipboard</small>
            </div>
          `;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 2000);
        }).catch(() => {
          console.warn('Copy failed, controls data logged to console:', exportData);
          alert('Copy failed - check console for controls configuration');
        });
      } catch (err) {
        console.warn('Copy failed, controls data logged to console:', exportData);
        alert('Copy failed - check console for controls configuration');
      }
    };

    // If loader already finished, show panels immediately on attach
    if (loader.isDevelopment && loader.loadingState === 'loaded') {
      try {
        loader.createCameraInfoPanel?.();
        loader.createControlsPanel?.();
        // Create interaction overlay if interactive objects are available
        if (Array.isArray(loader.interactiveObjects) && loader.interactiveObjects.length) {
          const foundKeys = new Set(loader.interactiveObjects.map(m => m.stationKey).filter(Boolean));
          const allKeys = Object.keys(loader.stationMapping || {});
          const missingKeys = allKeys.filter(k => !foundKeys.has(k));
          loader.createInteractionDebugOverlay?.(foundKeys, missingKeys);
        }
      } catch (_) {}
    }

    console.log('🧩 3D Debug Panels attached');
  } catch (e) {
    console.warn('Failed to attach 3D Debug Panels:', e);
  }
}

// Convenience global for manual enabling from console if module is loaded directly
export async function enableDebugPanelsImmediate() {
  if (window.simple3DLoader) {
    attachDebugPanels(window.simple3DLoader);
  }
}
