// Moved from src/scripts/debug-panels.js as part of Phase 1 modular refactor
// Wrapper that re-exports original implementation for backward compatibility
// NOTE: Original file will remain temporarily until migration stabilized

import '../legacy-shim.js'; // (optional future use)

export function attachDebugPanels(loader) {
  try {
    if (!loader) {
      console.warn('[3D Debug] attachDebugPanels called without loader instance');
      return;
    }
    // If legacy global already defined (e.g., loaded via old path), reuse it
    if (window.attachDebugPanels && window.attachDebugPanels !== attachDebugPanels) {
      return window.attachDebugPanels(loader);
    }
    // Lightweight inline (defer full implementation until old file removed)
    loader.debugPanelsEnabled = true;
    console.log('🧩 (Stub) Debug panels module attached - using legacy implementation file if present');
  } catch (e) {
    console.warn('Failed to attach (stub) debug panels:', e);
  }
}

window.attachDebugPanels = window.attachDebugPanels || attachDebugPanels;
