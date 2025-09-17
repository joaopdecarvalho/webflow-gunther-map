(function () {
  // ---- helpers -------------------------------------------------------------
  function log(){ console.log.apply(console, ["[cms-gallery]"].concat([].slice.call(arguments))); }
  function warn(){ console.warn.apply(console, ["[cms-gallery]"].concat([].slice.call(arguments))); }
  function err(){ console.error.apply(console, ["[cms-gallery]"].concat([].slice.call(arguments))); }

  function redrawSlider() {
    try {
      if (window.Webflow && Webflow.require) {
        var sliderLib = Webflow.require('slider');
        if (sliderLib && typeof sliderLib.redraw === 'function') {
          log("Calling Webflow slider.redraw()");
          sliderLib.redraw();
        } else {
          warn("sliderLib present but no redraw()");
        }
      } else {
        warn("Webflow slider lib not available");
      }
    } catch (e) { err("redrawSlider error:", e); }
  }

  // Given a multi-image list element, find a sibling/nearby slider
  function findNearbySlider(sourceList) {
    // 1) Same parent
    var parent = sourceList.parentElement;
    if (parent) {
      var s = parent.querySelector('.station-gallery-slider');
      if (s) return s;
    }
    // 2) Closest Collection Item (or modal block) then search inside it
    var root = sourceList.closest('.w-dyn-item') || sourceList.closest('.modal-grid') || sourceList.closest('.modal_content') || document.body;
    if (root) {
      // Prefer a slider that is AFTER the list in DOM, otherwise fallback to any
      var all = Array.from(root.querySelectorAll('.station-gallery-slider'));
      if (!all.length) return null;
      var idx = all.findIndex(function(el){ return el.compareDocumentPosition(sourceList) & Node.DOCUMENT_POSITION_FOLLOWING; });
      return idx > -1 ? all[idx] : all[0];
    }
    return null;
  }

  function buildFromList(sourceList, index) {
    if (!sourceList) return;
    if (sourceList.dataset.cmsBuilt === '1') {
      log("List #" + index + " already built, skipping");
      return;
    }

    var sliderEl = findNearbySlider(sourceList);
    if (!sliderEl) { warn("No .station-gallery-slider found for list #"+index, sourceList); return; }

    var mask = sliderEl.querySelector('.w-slider-mask');
    if (!mask) { warn("No .w-slider-mask inside slider for list #"+index, sliderEl); return; }

    // Collect images the Multi-image element rendered
    // (Webflow outputs <div class="w-dyn-items"><div class="w-dyn-item">…</div>…)
    var imgs = Array.from(sourceList.querySelectorAll('img'));
    log("List #"+index+" → found", imgs.length, "images");

    if (!imgs.length) {
      warn("No images in list #"+index+"; removing empty slider");
      sliderEl.remove();
      sourceList.dataset.cmsBuilt = '1';
      return;
    }

    // Clear placeholder slides
    while (mask.firstChild) mask.removeChild(mask.firstChild);

    // Build slides
    imgs.forEach(function (img, i) {
      var slide = document.createElement('div');
      slide.className = 'w-slide';

      var picture = img.closest('picture');
      var node = picture ? picture.cloneNode(true) : img.cloneNode(true);

      var innerImg = node.querySelector ? node.querySelector('img') : node;
      if (innerImg) {
        innerImg.removeAttribute('loading');
        innerImg.setAttribute('loading', 'eager');
        innerImg.classList.remove('lazyload','lazyloading','lazyloaded');
        // Ensure responsive behavior when no picture wrapper
        innerImg.style.width = '100%';
        innerImg.style.height = 'auto';
        innerImg.style.display = 'block';
      }

      slide.appendChild(node);
      mask.appendChild(slide);
      log("Added slide", i+1, "to slider for list #"+index);
    });

    sliderEl.classList.add('is-ready');
    sourceList.dataset.cmsBuilt = '1';
    log("Finished building slider for list #"+index);

    // Redraw now and when it becomes visible (useful for modals)
    redrawSlider();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          log("Slider for list #"+index+" became visible → redraw");
          redrawSlider();
        }
      });
    }, { threshold: 0.1 });
    io.observe(sliderEl);
  }

  function buildAll() {
    var lists = document.querySelectorAll('.station-gallery-list');
    log("Found", lists.length, ".station-gallery-list elements total");
    lists.forEach(buildFromList);
  }

  // Run after DOM and after Webflow finished rendering lists
  function start() {
    log("Boot");
    buildAll();
    // Safety retries (Webflow Designer/IX can re-render)
    setTimeout(buildAll, 100);
    setTimeout(buildAll, 400);
    document.addEventListener('readystatechange', function(){
      if (document.readyState === 'complete') buildAll();
    });
  }

  document.addEventListener('DOMContentLoaded', start);
})();
