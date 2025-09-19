# POI System Revamp Implementation Plan

## Overview
Revamp the POI system in `src/scripts/simple-3d-loader.js` to remove the old flag system and POI mapping tools, replacing them with a direct interaction system using the 3D model's separate station and flag objects.

## Phase 1: Remove Existing Flag System

Status: ✅ Completed (legacy flag POI system fully removed from `simple-3d-loader.js` on implementation date)

### 1.1 Remove Flag Coordinates and Properties
- [x] Remove `flagCoordinates` array (lines 34-45) — removed and replaced with Phase 1 cleanup comment
- [x] Remove `flags` array initialization in constructor — removed
- [x] Remove flag-related properties from constructor — no other flag-specific props remain

### 1.2 Remove Flag Initialization
- [x] Remove `initializeFlags()` method call from `loadModel()` (line 936) — replaced with comment
- [x] Remove `initializeFlags()` method (lines 1597-1605) — entire flag methods block removed

### 1.3 Remove Flag Creation Methods
- [x] Remove `createFlag()` method (lines 1607-1727) — removed
- [x] Remove `animateFlags()` method (lines 1729-1731) — removed

### 1.4 Remove Flag Cleanup
- [x] Remove `disposeFlags()` method (lines 1733-1750) — removed with flag methods block
- [x] Remove `disposeFlags()` call from main `dispose()` method (line 1508) — replaced with comment

## Phase 2: Remove POI Mapping System

### 2.1 Remove POI Mapping Variables
- [x] Remove POI mapping variables from constructor (lines 56-63)
- [x] Remove `poiMappingMode`, `tempPOIs`, `poiMarkers` properties
- [x] Remove `raycaster` and `mouse` properties for POI mapping

### 2.2 Remove POI Mapping Initialization
- [x] Remove `initializePOIMapping()` call from `setupScene()` (lines 876-878)
- [x] Remove `initializePOIMapping()` method (lines 1757-1786)

### 2.3 Remove POI Mapping Methods
- [x] Remove `togglePOIMappingMode()` method (lines 1788-1816)
- [x] Remove `placePOI()` method (lines 1818-1858)
- [x] Remove `createPOIMarker()` method (lines 1860-1880)
- [x] Remove `createPOILabel()` method (lines 1882-1901)
- [x] Remove `clearAllPOIs()` method (lines 1903-1921)
- [x] Remove `updatePOIExport()` method (lines 1923-1931)
- [x] Remove `showPOIMappingNotification()` method (lines 1933-1962)

### 2.4 Remove POI Cleanup
- [x] Remove `disposePOIMapping()` method (lines 1965-1976)
- [x] Remove POI cleanup from main `dispose()` method (lines 1514-1516)

### 2.5 Remove POI Global Functions
- [x] Remove `window.togglePOIMapping` function (lines 2043-2048)
- [x] Remove `window.clearPOIs` function (lines 2050-2055)
- [x] Remove `window.exportPOIs` function (lines 2057-2097)
- [x] Remove POI console helper commands (lines 2188-2197)

## Phase 3: Implement New Interactive Station System

### 3.1 Create Station Mapping Configuration
- [x] Add station mapping object to constructor (Phase 3 skeleton implemented):
```javascript
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
```

### 3.2 Add Interaction Properties
- [x] Add `interactiveObjects` array to store clickable objects (initialized empty)
- [x] Add `hoveredObject` property to track current hover state
- [x] Add `raycaster` and `mouse` properties for new interaction system (created in initializer)

### 3.3 Initialize Interaction System
- [x] Create `initializeInteractionSystem()` method
- [x] Initialize raycaster and mouse vector
- [x] Add event listeners for mouse/touch events (mousemove, click, touchstart) with throttled pointer move
- [x] Call method from `setupScene()` (end of scene setup)

Status Note: Phase 3 delivers a non-functional skeleton (no raycast selection yet). Full interaction logic, object gathering, visual feedback, and modal triggering deferred to Phase 4.

## Phase 4: Implement Interaction Features

### 4.1 Object Detection and Setup
- [x] Create `setupInteractiveObjects()` method
- [x] Identify Station objects (case-insensitive partial match against keys in `stationMapping`)
- [x] Store references to interactive objects with their modal triggers (`_interactiveMetaMap` + `interactiveObjects` array)
- [x] Add visual hover indicators (emissive / color lerp highlight system with smooth easing)

Implementation Notes:
* Materials are cloned per interactive mesh to avoid unintended shared state across stations.
* Highlight uses emissive where available; otherwise falls back to color tint (half intensity).
* Metadata tracks original colors for safe reset and includes progressive glow easing values.

### 4.2 Mouse/Touch Event Handlers
- [x] Create `onPointerMove()` (named `onPointerMove` for unified mouse/touch logic) for hover detection
- [x] Create `onClick()` method for click/touch interaction (touchstart funnels into click logic)
- [x] Implement raycasting to detect object intersections (top-most intersected station used)
- [x] Add cursor changes for interactive elements (pointer/default on enter/leave)

Implementation Notes:
* Pointer move throttled (50ms) using `_lastPointerMove` & `_pointerMoveThrottleMs` (tunable in Phase 5 performance optimization).
* Hover transitions triggered by adjusting `targetGlow` with smoothing applied in `updateInteractionVisuals()`.

### 4.3 Modal Trigger System
- [x] Create `triggerModal()` method
- [x] Generates hidden trigger element only if a matching one does not already exist
- [x] Dispatches synthetic bubbling/cancelable MouseEvent('click')
- [x] Cleans up auto-created trigger after 1s (defer allows modal listeners to attach or read attributes)

Implementation Notes:
* Respects existing site modal trigger elements if already present.
* Logs modal dispatch with station key for debugging.

### 4.4 Visual Feedback
- [x] Add hover effects (emissive/color lerp highlight; warm accent #FFD54F)
- [x] Reset hover effects when mouse leaves object (reverts `targetGlow` to 0 and cursor to default)
- [x] Add smooth transitions via per-frame easing in `updateInteractionVisuals()` (15% lerp each frame)

Implementation Notes:
* Glow stored as `currentGlow`/`targetGlow` on metadata objects.
* Material cloning prevents highlight color bleed across shared materials.
* No outline pass yet (optional future enhancement Phase 5+/deferred).

## Phase 5: Integration and Testing

### 5.1 Update Model Loading
- [x] Modify `loadModel()` method to call `setupInteractiveObjects()` plus hook animation frame update for `updateInteractionVisuals()`
- [x] Ensure interaction system initializes after model is fully loaded (auto-call now attempts setup; logs warning if system not yet initialized)
- [x] Add error handling for missing station objects (logs warning listing missing keys)

Implementation Notes (Phase 5.1 Completed):
* `loadModel()` now attempts `setupInteractiveObjects()` once the model is added and centered.
* Animation loop calls `updateInteractionVisuals()` every frame for hover glow easing.
* Missing station mapping keys produce a consolidated warning; full coverage success message logged when all present.
* Graceful handling if interaction system somehow not initialized (warns but does not break model load).

Current Status Note: Phase 4 implemented all logic but invocation after model load is pending (will be executed in this task). Temporary workaround: run `simple3DLoader.setupInteractiveObjects()` manually in console after load, and optionally patch `animate()` to call `updateInteractionVisuals()` (next phase).

### 5.2 Mobile Optimization
 [x] Test touch interactions on mobile devices (initial implementation; further real device validation pending)
 [x] Ensure touch events work properly with orbit controls (movement vs tap distinguished)
 [x] Add appropriate touch event handlers (`touchstart`, `touchmove`, `touchend`) with tap detection

 Implementation Notes (Phase 5.2 Completed):
 * Tap vs drag differentiation using movement (<10px) and duration (<500ms).
 * Immediate hover feedback on touchstart if finger hasn't moved to aid discoverability.
 * OrbitControls drag gestures unaffected (movement >5px flags as drag, suppressing tap click dispatch).
 * Touch triggers reuse core click logic ensuring consistent modal dispatch.


 Implementation Notes (Phase 5.3 Completed):
 * Raycast gating: min interval (50ms) + idle threshold (1.5s) prevents unnecessary intersections.
 * Visual update short‑circuits when all glow values at rest and no hovered object.
 * Materials cloned per station; diagnostics verify no shared material state.
 * Overlay provides quick reload and diagnostics actions for station mapping.
- [x] Add new interaction system cleanup to `dispose()` method (calls `disposeInteractionSystem()`)
## Phase 6: Testing and Validation

### 6.1 Functionality Testing
- [ ] Test hover effects on all stations and flags
- [ ] Test click interactions trigger correct modals
- [ ] Test mobile touch interactions
- [ ] Verify no console errors

### 6.2 Integration Testing
- [ ] Test with existing modal system
- [ ] Ensure camera controls still work properly
- [ ] Test in both development and production environments
- [ ] Verify performance impact is minimal

### 6.3 Cross-browser Testing
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Verify touch interactions work consistently

## Expected Code Reduction
- **Removed**: ~800 lines of old flag and POI mapping code
- **Added**: ~200 lines of new interaction system
- **Net reduction**: ~600 lines of code
- **Improved**: More direct, maintainable interaction system

## Success Criteria
- [ ] All old flag rendering code removed
- [ ] All POI mapping development tools removed
- [ ] New station interaction system working
- [ ] Hover effects provide visual feedback
- [ ] Click/touch triggers correct modals via `data-modal-trigger`
- [ ] Mobile touch interactions work properly
- [ ] No performance regression
- [ ] Clean, maintainable code structure