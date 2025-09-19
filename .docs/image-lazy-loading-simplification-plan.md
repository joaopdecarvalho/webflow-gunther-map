# Image Lazy Loading Simplification Plan (Updated)

## Objective
Only preload images that live inside the sliders of station modals, after the page finishes loading and before the user opens any modal. Do not intercept or rewrite other images, backgrounds, sources, or videos.

## Current State (simple-3d-loader.js)
- Simple preloader already exists: `SimpleModalImagePreloader` at `src/scripts/simple-3d-loader.js:22` and is initialized.
- Heavy system still active: `AssetResourceManager` (intercepts images/backgrounds/sources, mutation observers, modal asset loader, modal slide preload scheduler).
- Legacy video hooks referenced: `this.videoManager = globalVideoManager` and `this.videoManager.loadModalVideo(...)` but the manager isn’t defined in this repo.

## What To Keep
- Keep `SimpleModalImagePreloader` and its `window.load + 800ms` preloading of station modal slider images.
- Keep the Three.js loader and station-modal triggering logic unchanged functionally.

## What To Remove Or Stub
- Remove/stub everything that changes non-station images or videos.
- Specifically:
  - `AssetResourceManager` class: remove its interception logic, mutation observer, background/source handling, and complex preload routine. If full removal is risky, replace with a no‑op stub preserving the same public methods.
  - Global asset manager wiring: creation, `initialize()` calls, and `scheduleModalSlidePreload()` listener.
  - Video manager usage: remove `this.videoManager = globalVideoManager` and the call to `this.videoManager.loadModalVideo(modalEl)`, or provide a no‑op `globalVideoManager` with `loadModalVideo()` to avoid runtime errors.

## Minimal Implementation Blueprint
1) Keep the simple preloader (already present)

```js
// Already in file
class SimpleModalImagePreloader {
  constructor() { this.preloadDelay = 800; this.maxConcurrent = 4; this.isEnabled = true; this.isInitialized = false; }
  initialize() { if (this.isEnabled && !this.isInitialized) { this.isInitialized = true; window.addEventListener('load', () => { setTimeout(() => this.preloadStationImages(), this.preloadDelay); }); } }
  async preloadStationImages() { const sels = ["[id^='station-'] .w-slider img","[id^='station-'] .w-slide img",".station-gallery-image"]; const imgs = []; sels.forEach(s => document.querySelectorAll(s).forEach(img => { if (img.src && !img.dataset.preloaded) imgs.push(img); })); if (!imgs.length) return; await this.preloadWithConcurrency(imgs); }
  async preloadWithConcurrency(imgs){ let i=0; const inFlight=[]; const next=async()=>{ if(i>=imgs.length) return; const img=imgs[i++]; const p=this.preloadImage(img); inFlight.push(p); try{ await p; img.dataset.preloaded='true'; }finally{ const k=inFlight.indexOf(p); if(k>-1) inFlight.splice(k,1); } }; while(inFlight.length<this.maxConcurrent && i<imgs.length) next(); while(inFlight.length>0 || i<imgs.length){ if(inFlight.length<this.maxConcurrent && i<imgs.length) next(); if(inFlight.length) await Promise.race(inFlight); } }
  preloadImage(img){ return new Promise((res,rej)=>{ const tmp=new Image(); tmp.onload=()=>res(); tmp.onerror=()=>rej(new Error('Failed to load')); if(img.srcset){ tmp.srcset=img.srcset; tmp.sizes=img.sizes||'100vw'; } tmp.src=img.src; }); }
}
```

2) Remove or stub asset/video managers

- Delete `class AssetResourceManager { ... }` and its usage; or replace with a safe stub:

```js
// Minimal no-op stub to avoid breakage during cleanup
class AssetResourceManager {
  constructor(){ this.modalPreloadDebug=false; }
  initialize(){}
  scheduleModalSlidePreload(){}
  loadModalAssets(){ /* no-op */ }
  dispose(){}
}
```

- Provide a no-op video manager (only if any call sites remain):

```js
const globalVideoManager = { loadModalVideo: () => {} };
```

3) Unwire the heavy system

- Remove these patterns in `src/scripts/simple-3d-loader.js`:
  - Global instance and init: `const globalAssetManager = new AssetResourceManager();` and its `initialize()` calls and the `window.addEventListener('load', ...)` that calls `scheduleModalSlidePreload()`.
  - In `Simple3DLoader` constructor: remove `this.assetManager = globalAssetManager;` and `this.videoManager = globalVideoManager;`.
  - In `lazyLoadModalAssets(...)`: remove `globalAssetManager.loadModalAssets(modalEl);` and the line calling `this.videoManager.loadModalVideo(modalEl);`.

4) Optional minimal compatibility

- If legacy `data-src` exists inside modals, keep a tiny helper to set `src` from `data-src` when a modal opens. Otherwise, remove that code path entirely.

## Resulting Behavior
- On `window.load + 800ms`, all images inside `[id^='station-']` slider containers (or with `.station-gallery-image`) are quietly preloaded via `new Image()`.
- Opening any station modal shows slider images immediately from cache.
- No other images, backgrounds, sources, or videos are intercepted or modified.

## QA Checklist
- Station modal images fetch after load; network shows background preloads.
- First open of any station modal displays images without visible wait.
- No console errors related to `videoManager` or `AssetResourceManager`.
- Other images/backgrounds on the page remain untouched.

## Notes
- Avoid line-number coupling; search by class and calls as listed above.
- Start with stubbing to de-risk; then remove code blocks in a follow-up pass once verified.

