/**
 * CMS Data Integration Script
 * Integrates exported Webflow CMS data with the static site
 */

class CMSDataIntegration {
  constructor() {
    this.stationData = null;
    this.isLocal = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
    this.baseUrl = this.isLocal
      ? 'http://localhost:8080'
      : 'https://webflow-gunther-map.vercel.app';

    // Immediately close any open modals
    this.closeAllModals();

    this.init();
  }

  closeAllModals() {
    // Only close modals that shouldn't be open, but don't break the modal system
    const closeModals = () => {
      // Only target specific problematic modals, not all modals
      const problematicModals = document.querySelectorAll('.modal_dialog[open]:not([data-station-modal])');
      problematicModals.forEach(modal => {
        modal.removeAttribute('open');
        modal.style.display = 'none';
      });

      // Don't disable body overflow - modals need to control this
      console.log('🔒 Problematic modals closed, station modals preserved');
    };

    // Run once, gently
    setTimeout(closeModals, 100);
  }

  async init() {
    try {
      await this.loadStationData();
      // Wait a bit for the page to fully load
      setTimeout(() => {
        this.populateStationData();
        console.log('CMS Data Integration: Successfully loaded station data');
      }, 500);
    } catch (error) {
      console.error('CMS Data Integration: Failed to load station data', error);
    }
  }

  async loadStationData() {
    try {
      // Try to load from CSV data endpoint first
      const csvUrl = `${this.baseUrl}/Go Goethe Quartier - Stationen.csv`;
      console.log('Attempting to load CSV from:', csvUrl);
      const response = await fetch(csvUrl);

      if (response.ok) {
        const csvText = await response.text();
        console.log('CSV loaded successfully, parsing...');
        this.stationData = this.parseCSV(csvText);
        console.log('Parsed stations:', this.stationData.length);
      } else {
        console.warn('CSV request failed, using embedded data');
        // Fallback to embedded data
        this.stationData = this.getEmbeddedStationData();
      }
    } catch (error) {
      console.warn('Failed to load CSV, using embedded data:', error);
      this.stationData = this.getEmbeddedStationData();
    }
  }

  parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const stations = [];

    console.log('CSV Headers:', headers);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = this.parseCSVLine(line);
      if (values.length > 1 && values[0].trim()) { // Make sure first column (name) exists
        const station = {};
        headers.forEach((header, index) => {
          station[header.trim()] = values[index] ? values[index].trim() : '';
        });
        stations.push(station);
        console.log('Parsed station:', station['Name der Station']);
      }
    }

    console.log('Total stations parsed:', stations.length);
    return stations;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  getEmbeddedStationData() {
    // Embedded station data as fallback
    return [
      {
        "Name der Station": "AFZ-Theo",
        "Slug": "station-2-afz-theo",
        "Nummer der Station": "Station 2",
        "Adresse": "Lutherstraße 7, 27576 Bremerhaven",
        "Beschreibung": "Die AFZ Theo in der Lutherstraße 7, Bremerhaven, ist ein sozialer Knotenpunkt mit vielfältigen Bildungs-, Beratungs- und Kulturangeboten.",
        "Website Link": "https://www.die-theo.de/",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca720d7c34159fdac84087_20230913_104847_result15.webp"
      },
      {
        "Name der Station": "Goethestr. 45",
        "Slug": "station-1-goethestr-45",
        "Nummer der Station": "Station 1",
        "Adresse": "Goethestr. 45, 27576 Bremerhaven",
        "Beschreibung": "Die Galerie Goethe 45 in Bremerhaven ist ein kreativer Hotspot für zeitgenössische Kunst, Kunstvermittlung und kulturelle Begegnung.",
        "Website Link": "https://www.quartiersmeisterei-lehe.de/atelier-goethe-45/",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca72537b3186130ef7e3cf_20230914_085455_result15.webp"
      },
      {
        "Name der Station": "Rückenwind",
        "Slug": "station-3-rueckenwind",
        "Nummer der Station": "Station 3",
        "Adresse": "Lutherstraße 7, 27576 Bremerhaven",
        "Beschreibung": "Der Rückenwind Verein in Bremerhaven setzt sich seit Jahren für Kinder und Jugendliche in sozial benachteiligten Stadtteilen ein.",
        "Website Link": "http://s423244503.website-start.de/",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca74acfe01c79b90c7f76b_20230911_130808_result15.webp"
      },
      {
        "Name der Station": "Beet",
        "Slug": "station-4-beet",
        "Nummer der Station": "Station 4",
        "Adresse": "Zollinlandplatz, Kistnerstraße 54, 27576 Bremerhaven",
        "Beschreibung": "Moritz Alber hat 2020 das Beet ins Leben gerufen, welches er zusammen mit Hauke Arntz leitet.",
        "Website Link": "https://dasbeet.info/",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca74d57d1a4230f0c7eca4_DAS_TEAM_2024_Website-1280x909_result15.webp"
      },
      {
        "Name der Station": "Zolli",
        "Slug": "station-5-zolli",
        "Nummer der Station": "Station 5",
        "Adresse": "Kistnerstraße 54, 27576 Bremerhaven",
        "Beschreibung": "Der Zolli e.V. in Bremerhaven ist ein lebendiger Ort, der Natur, Kultur und Gemeinschaft vereint.",
        "Website Link": "https://zollibremerhaven.de/",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca74fb5d1ad184feba8caa_Flowmarkt_September_2023_1-1920x1280_result15.webp"
      },
      {
        "Name der Station": "Starthaus",
        "Slug": "station-6-starthaus",
        "Nummer der Station": "Station 6",
        "Adresse": "Uhlandstraße 25, 27576 Bremerhaven",
        "Beschreibung": "Das Starthaus Bremerhaven ist die zentrale Anlaufstelle für Gründer:innen, Start-ups und junge Unternehmen in Bremerhaven.",
        "Website Link": "https://www.starthaus-bremen.de/de/page/bremerhaven",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca75536bec777c948ba6ee_Social%20entrepreneur%20Titelfoto.jpg.67932_result15.webp"
      },
      {
        "Name der Station": "Studierendenhaus #H34",
        "Slug": "station-7-studierendenhaus-h34",
        "Nummer der Station": "Station 7",
        "Adresse": "Heinrichstraße 34, 27576 Bremerhaven",
        "Beschreibung": "Das Studierendenhaus H34 in Bremerhaven ist mehr als nur ein Wohnheim: Es verbindet modernes studentisches Wohnen mit gesellschaftlichem Engagement.",
        "Website Link": "https://www.stw-bremen.de/de/wohnen/wohnanlagen-bremerhaven/h34/",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca756c0e16dcd2da2e1aa1_edd0342844eed46b67982e733c94faf1_result15.webp"
      },
      {
        "Name der Station": "Quartiersmeisterei Lehe",
        "Slug": "station-8-quartiersmeisterei-lehe",
        "Nummer der Station": "Station 8",
        "Adresse": "Goethestraße 44a, 27576 Bremerhaven",
        "Beschreibung": "Die Quartiersmeisterei Lehe in Bremerhaven ist ein lebendiger Begegnungsort und sozialer Impulsgeber im Stadtteil.",
        "Website Link": "https://www.quartiersmeisterei-lehe.de",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca7582b81bbe1f7d288de6_Leher-Pausenhof-800x600_result15.webp"
      },
      {
        "Name der Station": "Kulturbahnhof Lehe",
        "Slug": "station-9-kulturbahnhof-lehe",
        "Nummer der Station": "Station 9",
        "Adresse": "Moltkestraße 13, 27576 Bremerhaven",
        "Beschreibung": "Der Kulturbahnhof Lehe in Bremerhaven ist ein lebendiger Kultur- und Kreativort im Stadtteil Lehe.",
        "Website Link": "https://www.kuba-lehe.de",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca7595ddbc9cccbee224ec_kevin-ricke-betreibt-den-kulturbahnhof-in-der-moltkestrasse-525725h_result15.webp"
      },
      {
        "Name der Station": "Goethestraße 60",
        "Slug": "station-10-goethestrasse-60",
        "Nummer der Station": "Station 10",
        "Adresse": "Goethestraße 60, 27576 Bremerhaven",
        "Beschreibung": "Bei einem Besuch des Stadtarchivs entdeckte ich Fotos aus der Industriellen Zeit, als Hafenarbeiter*innen und Pferdekutschen noch das Stadtbild bestimmten.",
        "Website Link": "",
        "Thumbnail": "https://cdn.prod.website-files.com/68c55d0194d4d9cb1e5f29c7/68ca75a140397736b13d5a08_20230914_143614_result15.webp"
      },
      {
        "Name der Station": "Modenschau/Workshop",
        "Slug": "station-11-modenschau-workshop",
        "Nummer der Station": "Station 11",
        "Adresse": "Goethestraße 60, 27576 Bremerhaven",
        "Beschreibung": "Aktuell noch keine Informationen vorhanden.",
        "Website Link": "",
        "Thumbnail": ""
      }
    ];
  }

  populateStationData() {
    if (!this.stationData) return;

    // Check if we're on a station detail page
    const urlParams = new URLSearchParams(window.location.search);
    const stationSlug = urlParams.get('station');

    if (stationSlug) {
      this.populateStationDetail(stationSlug);
    } else {
      // Check for Webflow CMS structure
      this.populateWebflowStations();
      this.populateStationList();
    }
  }

  populateStationDetail(slug) {
    const station = this.stationData.find(s => s.Slug === slug);
    if (!station) return;

    // Update page title
    document.title = station['Name der Station'] + ' - Go Goethe Quartier';

    // Populate station details
    this.updateTextContent('[data-station="name"]', station['Name der Station']);
    this.updateTextContent('[data-station="number"]', station['Nummer der Station']);
    this.updateTextContent('[data-station="address"]', station['Adresse']);
    this.updateTextContent('[data-station="description"]', station['Beschreibung']);

    // Update links
    this.updateLink('[data-station="website"]', station['Website Link']);
    this.updateLink('[data-station="instagram"]', station['Instagram Link']);
    this.updateLink('[data-station="facebook"]', station['Facebook Link']);

    // Update images
    this.updateImage('[data-station="thumbnail"]', station['Thumbnail'], station['Name der Station']);

    // Handle gallery images
    if (station['Bildergalerie']) {
      this.populateGallery(station['Bildergalerie'], station['Name der Station']);
    }
  }

  populateWebflowStations() {
    // Find Webflow CMS structure
    const stationListContainer = document.querySelector('.station-list.w-dyn-items');
    const stationTemplate = document.querySelector('.station-item.w-dyn-item');

    if (!stationListContainer || !stationTemplate) {
      console.log('Webflow CMS structure not found');
      return;
    }

    // Clear existing content except template
    const existingItems = stationListContainer.querySelectorAll('.station-item.w-dyn-item');
    existingItems.forEach((item, index) => {
      if (index > 0) item.remove(); // Keep first as template
    });

    // Hide the "No items found" message
    const emptyState = document.querySelector('.w-dyn-empty');
    if (emptyState) {
      emptyState.style.display = 'none';
    }

    // Show the station list wrapper and make sure it's visible
    const stationListWrapper = document.querySelector('.station_list_wrapper.w-dyn-list');
    if (stationListWrapper) {
      stationListWrapper.style.display = 'block';
      stationListWrapper.style.visibility = 'visible';
      stationListWrapper.style.opacity = '1';
      stationListWrapper.style.position = 'relative';
      stationListWrapper.style.zIndex = 'auto';
    }

    // Ensure the nav component is visible and positioned correctly
    const navComponent = document.querySelector('.nav_component');
    if (navComponent) {
      navComponent.style.position = 'relative';
      navComponent.style.zIndex = '10';
      navComponent.style.display = 'block';
      navComponent.style.visibility = 'visible';
    }

    // Ensure the body background is visible and 3D container works
    document.body.style.background = '';
    document.body.style.backgroundColor = '';

    // Make sure 3D container is visible
    const webglContainer = document.querySelector('#webgl-container, .webgl-container');
    if (webglContainer) {
      webglContainer.style.display = 'block';
      webglContainer.style.visibility = 'visible';
      webglContainer.style.position = 'fixed';
      webglContainer.style.top = '0';
      webglContainer.style.left = '0';
      webglContainer.style.width = '100%';
      webglContainer.style.height = '100%';
      webglContainer.style.zIndex = '0';
      console.log('🌍 3D container visibility restored');
    }

    // Clone and populate for each station
    this.stationData.forEach((station, index) => {
      const stationItem = index === 0 ? stationTemplate : stationTemplate.cloneNode(true);

      // Populate station number
      const eyebrowText = stationItem.querySelector('.eyebrow_text.w-dyn-bind-empty');
      if (eyebrowText) {
        eyebrowText.textContent = station['Nummer der Station'] || '';
        eyebrowText.classList.remove('w-dyn-bind-empty');
      }

      // Populate station name
      const stationName = stationItem.querySelector('.u-text-style-h4.w-dyn-bind-empty');
      if (stationName) {
        stationName.textContent = station['Name der Station'] || '';
        stationName.classList.remove('w-dyn-bind-empty');
      }

      // Populate address and other info
      const infoElements = stationItem.querySelectorAll('.u-text-style-small.w-dyn-bind-empty');
      if (infoElements.length >= 2) {
        // First one is address
        infoElements[0].textContent = station['Adresse'] || '';
        infoElements[0].classList.remove('w-dyn-bind-empty');

        // Second one could be date or other info
        infoElements[1].textContent = station['Datum der Umsetzung'] || '';
        infoElements[1].classList.remove('w-dyn-bind-empty');
      }

      // Populate description
      const description = stationItem.querySelector('.station-description.w-dyn-bind-empty');
      if (description) {
        description.innerHTML = station['Beschreibung'] || '';
        description.classList.remove('w-dyn-bind-empty');
      }

      // Populate social links
      this.populateStationSocialLinks(stationItem, station);

      // Populate gallery
      this.populateStationGallery(stationItem, station);

      // Add modal trigger functionality
      this.setupStationModal(stationItem, station);

      // Add to container if it's a clone
      if (index > 0) {
        stationListContainer.appendChild(stationItem);
      }
    });

    console.log(`✅ Populated ${this.stationData.length} stations in Webflow structure`);

    // Add CSS to ensure visibility
    this.addVisibilityCSS();

    // Debug: Log the structure we found
    console.log('Station list container:', stationListContainer);
    console.log('Station template:', stationTemplate);
    console.log('Station list wrapper visibility:', stationListWrapper ? getComputedStyle(stationListWrapper).display : 'not found');
  }

  addVisibilityCSS() {
    const css = `
      /* Ensure background content is visible behind modals */
      .station_list_wrapper, .nav_component {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
      }

      /* Ensure 3D container is visible */
      #webgl-container, .webgl-container {
        display: block !important;
        visibility: visible !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 0 !important;
      }

      /* Ensure nav is above 3D but below modals */
      .nav_component {
        position: relative !important;
        z-index: 5 !important;
      }

      /* Station items should be visible */
      .station-item.w-dyn-item {
        display: block !important;
        visibility: visible !important;
      }

      /* Modal backdrop should be semi-transparent, not black */
      .modal_backdrop {
        background-color: rgba(0, 0, 0, 0.3) !important;
        backdrop-filter: blur(2px) !important;
      }

      /* Ensure background content is visible */
      body {
        background-color: transparent !important;
      }

      /* Make sure station content is visible behind modal */
      .station_list_wrapper {
        background-color: white !important;
        padding: 20px !important;
        margin: 20px !important;
        border-radius: 8px !important;
        position: relative !important;
        z-index: 1 !important;
      }

      /* Ensure the page has a proper background */
      html, body {
        background-color: #f5f5f5 !important;
      }

      /* Fix slider navigation */
      .station-gallery-slider .w-slider-arrow-left,
      .station-gallery-slider .w-slider-arrow-right {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 100 !important;
        pointer-events: auto !important;
      }

      /* Station modals should work normally */
      .modal_dialog {
        z-index: 1000 !important;
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    console.log('🎨 Visibility CSS injected - 3D and modals preserved');
  }

  populateStationSocialLinks(stationItem, station) {
    const socialLinks = stationItem.querySelectorAll('.station-social-web-wrap a');

    if (socialLinks.length >= 3) {
      // Instagram
      if (station['Instagram Link']) {
        socialLinks[0].href = station['Instagram Link'];
        socialLinks[0].style.display = 'inline-block';
      } else {
        socialLinks[0].style.display = 'none';
      }

      // Facebook
      if (station['Facebook Link']) {
        socialLinks[1].href = station['Facebook Link'];
        socialLinks[1].style.display = 'inline-block';
      } else {
        socialLinks[1].style.display = 'none';
      }

      // Website
      if (station['Website Link']) {
        socialLinks[2].href = station['Website Link'];
        socialLinks[2].style.display = 'inline-block';
      } else {
        socialLinks[2].style.display = 'none';
      }
    }
  }

  populateStationGallery(stationItem, station) {
    // Populate gallery list (hidden list for slider source)
    const galleryList = stationItem.querySelector('.station-gallery-list .w-dyn-items');
    const galleryTemplate = stationItem.querySelector('.station-gallery-image.w-dyn-bind-empty');

    if (galleryList && station['Bildergalerie']) {
      const images = station['Bildergalerie'].split(';').map(url => url.trim()).filter(url => url);

      console.log('Populating gallery for', station['Name der Station'], 'with', images.length, 'images');

      // Clear existing
      galleryList.innerHTML = '';

      // Add each image
      images.forEach((imageUrl, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.setAttribute('role', 'listitem');
        galleryItem.className = 'w-dyn-item';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `${station['Name der Station']} - Image ${index + 1}`;
        img.className = 'station-gallery-image';
        img.loading = 'lazy';

        galleryItem.appendChild(img);
        galleryList.appendChild(galleryItem);
      });

      // Also populate the slider directly if it exists
      this.populateSliderDirectly(stationItem, images, station['Name der Station']);

    } else if (galleryTemplate && station['Thumbnail']) {
      // Fallback to thumbnail
      console.log('Using thumbnail fallback for', station['Name der Station']);
      galleryTemplate.src = station['Thumbnail'];
      galleryTemplate.alt = station['Name der Station'];
      galleryTemplate.classList.remove('w-dyn-bind-empty');

      // Also add thumbnail to slider
      this.populateSliderDirectly(stationItem, [station['Thumbnail']], station['Name der Station']);
    } else if (station['Thumbnail']) {
      // Just use thumbnail if nothing else
      this.populateSliderDirectly(stationItem, [station['Thumbnail']], station['Name der Station']);
    }
  }

  populateSliderDirectly(stationItem, imageUrls, stationName) {
    const slider = stationItem.querySelector('.station-gallery-slider');
    const sliderMask = stationItem.querySelector('.station-gallery-slider .w-slider-mask');

    if (!slider || !sliderMask || !imageUrls.length) return;

    console.log('Populating slider for', stationName, 'with', imageUrls.length, 'images');

    // Clear existing slides
    sliderMask.innerHTML = '';

    // Add each image as a slide
    imageUrls.forEach((imageUrl, index) => {
      const slide = document.createElement('div');
      slide.className = 'w-slide';

      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = `${stationName} - Image ${index + 1}`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.loading = 'lazy';

      slide.appendChild(img);
      sliderMask.appendChild(slide);
    });

    // Trigger Webflow slider redraw
    setTimeout(() => {
      if (window.Webflow && window.Webflow.require) {
        const sliderLib = window.Webflow.require('slider');
        if (sliderLib && sliderLib.redraw) {
          sliderLib.redraw();
          console.log('Webflow slider redrawn for', stationName);
        }
      }
    }, 100);
  }

  setupStationModal(stationItem, station) {
    // Find the modal container (it might be .station-modal or .modal_dialog)
    const modalContainer = stationItem.querySelector('.station-modal, .modal_dialog');

    if (modalContainer) {
      // Convert .station-modal to .modal_dialog for compatibility
      if (modalContainer.classList.contains('station-modal')) {
        modalContainer.classList.add('modal_dialog');
        modalContainer.setAttribute('data-modal-target', station['Slug']);
        console.log('Converted station-modal to modal_dialog for:', station['Name der Station']);
      }

      modalContainer.setAttribute('data-station-modal', station['Slug']);
      modalContainer.setAttribute('data-station-name', station['Name der Station']);
    }

    // Setup modal trigger with proper data attribute
    const modalTrigger = stationItem.querySelector('[data-modal-trigger]');
    if (modalTrigger && !modalTrigger.getAttribute('data-modal-trigger')) {
      modalTrigger.setAttribute('data-modal-trigger', station['Slug']);
    }

    // Also setup any clickable elements to trigger the modal
    const clickableElements = stationItem.querySelectorAll('[data-button], .station-item, .station-card');
    clickableElements.forEach(element => {
      if (!element.getAttribute('data-modal-trigger')) {
        element.setAttribute('data-modal-trigger', station['Slug']);
        element.style.cursor = 'pointer';
      }
    });

    // Custom modal opening logic
    if (modalTrigger) {
      modalTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.populateModalContent(stationItem, station);

        // Try to use the existing modal system
        if (window.lumos && window.lumos.modal) {
          window.lumos.modal.open(station['Slug']);
        }

        console.log('Opening modal for:', station['Name der Station']);
      });
    }
  }

  populateModalContent(stationItem, station) {
    const modal = stationItem.querySelector('.modal_dialog, .station-modal');
    if (!modal) return;

    console.log('Populating modal content for:', station['Name der Station']);

    // Populate modal text content
    const modalTitle = modal.querySelector('.u-text-style-h4');
    if (modalTitle) {
      modalTitle.textContent = station['Name der Station'];
    }

    const modalEyebrow = modal.querySelector('.eyebrow_text');
    if (modalEyebrow) {
      modalEyebrow.textContent = station['Nummer der Station'];
    }

    const modalDescription = modal.querySelector('.station-description');
    if (modalDescription) {
      modalDescription.innerHTML = station['Beschreibung'] || '';
    }

    // Populate modal address info
    const addressElements = modal.querySelectorAll('.u-text-style-small');
    if (addressElements.length >= 2) {
      addressElements[0].textContent = station['Adresse'] || '';
      addressElements[1].textContent = station['Datum der Umsetzung'] || '';
    }

    // Populate modal social links
    const modalSocialLinks = modal.querySelectorAll('.station-social-web-wrap a');
    if (modalSocialLinks.length >= 3) {
      if (station['Instagram Link']) {
        modalSocialLinks[0].href = station['Instagram Link'];
        modalSocialLinks[0].style.display = 'inline-block';
      } else {
        modalSocialLinks[0].style.display = 'none';
      }

      if (station['Facebook Link']) {
        modalSocialLinks[1].href = station['Facebook Link'];
        modalSocialLinks[1].style.display = 'inline-block';
      } else {
        modalSocialLinks[1].style.display = 'none';
      }

      if (station['Website Link']) {
        modalSocialLinks[2].href = station['Website Link'];
        modalSocialLinks[2].style.display = 'inline-block';
      } else {
        modalSocialLinks[2].style.display = 'none';
      }
    }

    // Populate modal gallery/slider with correct images
    this.populateModalGallery(modal, station);
  }

  populateModalGallery(modal, station) {
    const slider = modal.querySelector('.station-gallery-slider');
    const sliderMask = modal.querySelector('.station-gallery-slider .w-slider-mask');

    if (!slider || !sliderMask) {
      console.warn('No slider found in modal for', station['Name der Station']);
      return;
    }

    // Get images for this specific station
    let images = [];
    if (station['Bildergalerie']) {
      images = station['Bildergalerie'].split(';').map(url => url.trim()).filter(url => url);
    }

    // Fallback to thumbnail if no gallery
    if (images.length === 0 && station['Thumbnail']) {
      images = [station['Thumbnail']];
    }

    if (images.length === 0) {
      console.warn('No images found for station:', station['Name der Station']);
      return;
    }

    console.log('Populating modal slider for', station['Name der Station'], 'with', images.length, 'images:', images);

    // Clear existing slides
    sliderMask.innerHTML = '';

    // Add each image as a slide
    images.forEach((imageUrl, index) => {
      const slide = document.createElement('div');
      slide.className = 'w-slide';

      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = `${station['Name der Station']} - Image ${index + 1}`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.loading = 'lazy';

      slide.appendChild(img);
      sliderMask.appendChild(slide);
    });

    // Force Webflow slider to reinitialize
    setTimeout(() => {
      this.reinitializeSlider(slider);
    }, 200);
  }

  reinitializeSlider(slider) {
    try {
      if (window.Webflow && window.Webflow.require) {
        const sliderLib = window.Webflow.require('slider');
        if (sliderLib) {
          // Force Webflow to recognize this slider
          sliderLib.ready();
          sliderLib.redraw();
          console.log('Webflow slider reinitialized');
        }
      }

      // Also trigger a manual redraw
      const event = new Event('resize');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error reinitializing slider:', error);
    }
  }

  populateStationList() {
    const stationListContainer = document.querySelector('[data-station-list]');
    if (!stationListContainer) return;

    this.stationData.forEach(station => {
      const stationElement = this.createStationElement(station);
      stationListContainer.appendChild(stationElement);
    });
  }

  createStationElement(station) {
    const stationDiv = document.createElement('div');
    stationDiv.className = 'station-item';
    stationDiv.innerHTML = `
      <div class="station-card">
        <img src="${station['Thumbnail']}" alt="${station['Name der Station']}" class="station-thumbnail">
        <div class="station-info">
          <h3 class="station-name">${station['Name der Station']}</h3>
          <p class="station-number">${station['Nummer der Station']}</p>
          <p class="station-address">${station['Adresse']}</p>
          <p class="station-description">${this.truncateText(station['Beschreibung'], 150)}</p>
          <a href="detail_station.html?station=${station['Slug']}" class="station-link">Mehr erfahren</a>
        </div>
      </div>
    `;
    return stationDiv;
  }

  updateTextContent(selector, content) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (content) {
        el.innerHTML = content;
      }
    });
  }

  updateLink(selector, url) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (url && url.trim()) {
        el.href = url;
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  updateImage(selector, src, alt) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (src && src.trim()) {
        el.src = src;
        el.alt = alt || '';
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  populateGallery(galleryString, altText) {
    if (!galleryString) return;

    const images = galleryString.split(';').map(url => url.trim()).filter(url => url);
    const galleryContainer = document.querySelector('[data-station-gallery]');

    if (galleryContainer && images.length > 0) {
      galleryContainer.innerHTML = '';
      images.forEach((imageUrl, index) => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `${altText} - Bild ${index + 1}`;
        img.className = 'gallery-image';
        galleryContainer.appendChild(img);
      });
    }
  }

  truncateText(text, length) {
    if (!text) return '';
    const cleanText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return cleanText.length > length ? cleanText.substring(0, length) + '...' : cleanText;
  }

  // Public API methods
  getStationBySlug(slug) {
    return this.stationData?.find(s => s.Slug === slug);
  }

  getAllStations() {
    return this.stationData || [];
  }

  getStationByNumber(number) {
    return this.stationData?.find(s => s['Nummer der Station'] === number);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cmsData = new CMSDataIntegration();
  });
} else {
  window.cmsData = new CMSDataIntegration();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CMSDataIntegration;
}