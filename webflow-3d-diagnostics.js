/**
 * Webflow 3D Model Diagnostics Script
 * Comprehensive diagnostic tool to check why 3D model isn't loading on staging site
 */

class WebflowDiagnostics {
    constructor() {
        this.results = {
            pageInfo: {},
            scripts: [],
            networkRequests: [],
            consoleMessages: [],
            dom: {},
            threejs: {},
            models: {},
            performance: {},
            errors: []
        };
    }

    async diagnose(url) {
        console.log(`🔍 Starting comprehensive diagnostics for: ${url}`);
        
        try {
            // Step 1: Navigate to the page
            await this.navigateToPage(url);
            
            // Step 2: Wait for page load and initial scripts
            await this.waitForInitialLoad();
            
            // Step 3: Check basic page structure
            await this.checkPageStructure();
            
            // Step 4: Analyze script loading
            await this.analyzeScripts();
            
            // Step 5: Check Three.js availability
            await this.checkThreeJS();
            
            // Step 6: Check 3D container
            await this.check3DContainer();
            
            // Step 7: Monitor network requests
            await this.analyzeNetworkRequests();
            
            // Step 8: Check console messages
            await this.analyzeConsoleMessages();
            
            // Step 9: Check model loading
            await this.checkModelLoading();
            
            // Step 10: Performance analysis
            await this.analyzePerformance();
            
            // Step 11: Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('Diagnostic error:', error);
            this.results.errors.push({
                type: 'diagnostic_error',
                message: error.message,
                stack: error.stack
            });
        }
        
        return this.results;
    }

    async navigateToPage(url) {
        console.log(`📍 Navigating to: ${url}`);
        this.results.pageInfo.url = url;
        this.results.pageInfo.timestamp = new Date().toISOString();
    }

    async waitForInitialLoad() {
        console.log('⏳ Waiting for initial page load...');
        // Wait for DOM and initial scripts
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    async checkPageStructure() {
        console.log('🏗️ Checking page structure...');
        
        // Check for key elements
        const checks = [
            { selector: '#map-container', name: 'Map Container' },
            { selector: '#canvas-3d', name: '3D Canvas' },
            { selector: 'canvas', name: 'Canvas Element' },
            { selector: 'script[src*="router"]', name: 'Router Script' },
            { selector: 'script[src*="three"]', name: 'Three.js Script' }
        ];
        
        this.results.dom.elements = {};
        
        for (const check of checks) {
            const element = document.querySelector(check.selector);
            this.results.dom.elements[check.name] = {
                found: !!element,
                selector: check.selector,
                attributes: element ? this.getElementAttributes(element) : null
            };
        }
    }

    getElementAttributes(element) {
        const attrs = {};
        for (const attr of element.attributes) {
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }

    async analyzeScripts() {
        console.log('📜 Analyzing script loading...');
        
        const scripts = Array.from(document.querySelectorAll('script')).map(script => ({
            src: script.src || 'inline',
            type: script.type || 'text/javascript',
            async: script.async,
            defer: script.defer,
            loaded: true, // If we can see it, it's loaded
            content: script.src ? null : script.textContent.substring(0, 200) + '...'
        }));
        
        this.results.scripts = scripts;
        
        // Check for specific scripts
        const routerScript = scripts.find(s => s.src.includes('router'));
        const threeScript = scripts.find(s => s.src.includes('three'));
        
        this.results.scripts.analysis = {
            routerFound: !!routerScript,
            threeJSFound: !!threeScript,
            totalScripts: scripts.length
        };
    }

    async checkThreeJS() {
        console.log('🎮 Checking Three.js availability...');
        
        this.results.threejs = {
            available: typeof window.THREE !== 'undefined',
            version: window.THREE ? window.THREE.REVISION : null,
            classes: {}
        };
        
        if (window.THREE) {
            // Check for essential Three.js classes
            const requiredClasses = [
                'Scene', 'Camera', 'WebGLRenderer', 'OrbitControls',
                'GLTFLoader', 'DRACOLoader', 'PerspectiveCamera'
            ];
            
            requiredClasses.forEach(className => {
                this.results.threejs.classes[className] = {
                    available: !!window.THREE[className] || !!window[className],
                    type: typeof (window.THREE[className] || window[className])
                };
            });
        }
    }

    async check3DContainer() {
        console.log('📦 Checking 3D container setup...');
        
        const container = document.getElementById('map-container') || document.getElementById('canvas-3d');
        
        this.results.dom.container = {
            found: !!container,
            id: container ? container.id : null,
            className: container ? container.className : null,
            dimensions: container ? {
                width: container.offsetWidth,
                height: container.offsetHeight,
                clientWidth: container.clientWidth,
                clientHeight: container.clientHeight
            } : null,
            styles: container ? window.getComputedStyle(container) : null,
            children: container ? container.children.length : 0
        };
        
        // Check for canvas inside container
        const canvas = container ? container.querySelector('canvas') : document.querySelector('canvas');
        this.results.dom.canvas = {
            found: !!canvas,
            context: canvas ? canvas.getContext('webgl') !== null : false,
            dimensions: canvas ? {
                width: canvas.width,
                height: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight
            } : null
        };
    }

    async analyzeNetworkRequests() {
        console.log('🌐 Analyzing network requests...');
        
        // This will be populated by Playwright's network monitoring
        this.results.networkRequests = {
            total: 0,
            scripts: [],
            models: [],
            failed: [],
            pending: []
        };
    }

    async analyzeConsoleMessages() {
        console.log('📝 Analyzing console messages...');
        
        // This will be populated by Playwright's console monitoring
        this.results.consoleMessages = {
            errors: [],
            warnings: [],
            logs: [],
            info: []
        };
    }

    async checkModelLoading() {
        console.log('🎯 Checking model loading...');
        
        // Check if any 3D map instances exist
        const mapInstances = window.gunther3DMap || window.map3D || [];
        
        this.results.models = {
            instances: Array.isArray(mapInstances) ? mapInstances.length : (mapInstances ? 1 : 0),
            status: 'unknown',
            urls: [],
            errors: []
        };
        
        // Check for GLTF/GLB requests in network
        // This will be enhanced with actual network data
    }

    async analyzePerformance() {
        console.log('⚡ Analyzing performance...');
        
        this.results.performance = {
            timing: performance.timing ? {
                domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime || null
            } : null,
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            resources: performance.getEntriesByType('resource').length
        };
    }

    generateReport() {
        console.log('\n🔍 DIAGNOSTIC REPORT');
        console.log('=====================');
        
        console.log('\n📍 PAGE INFO:');
        console.log(`URL: ${this.results.pageInfo.url}`);
        console.log(`Timestamp: ${this.results.pageInfo.timestamp}`);
        
        console.log('\n🏗️ DOM STRUCTURE:');
        Object.entries(this.results.dom.elements || {}).forEach(([name, info]) => {
            console.log(`${name}: ${info.found ? '✅' : '❌'} (${info.selector})`);
        });
        
        console.log('\n📦 CONTAINER STATUS:');
        const container = this.results.dom.container;
        console.log(`Container found: ${container.found ? '✅' : '❌'}`);
        if (container.found) {
            console.log(`Dimensions: ${container.dimensions.width}x${container.dimensions.height}`);
            console.log(`Children: ${container.children}`);
        }
        
        console.log('\n🎮 THREE.JS STATUS:');
        console.log(`Available: ${this.results.threejs.available ? '✅' : '❌'}`);
        if (this.results.threejs.available) {
            console.log(`Version: r${this.results.threejs.version}`);
            Object.entries(this.results.threejs.classes).forEach(([className, info]) => {
                console.log(`${className}: ${info.available ? '✅' : '❌'}`);
            });
        }
        
        console.log('\n📜 SCRIPTS:');
        console.log(`Total scripts: ${this.results.scripts.length}`);
        console.log(`Router script: ${this.results.scripts.analysis?.routerFound ? '✅' : '❌'}`);
        console.log(`Three.js script: ${this.results.scripts.analysis?.threeJSFound ? '✅' : '❌'}`);
        
        console.log('\n❌ ERRORS:');
        this.results.errors.forEach(error => {
            console.log(`${error.type}: ${error.message}`);
        });
        
        console.log('\n💡 RECOMMENDATIONS:');
        this.generateRecommendations();
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.results.dom.container.found) {
            recommendations.push('❌ 3D container element not found - check if #map-container or #canvas-3d exists');
        }
        
        if (!this.results.threejs.available) {
            recommendations.push('❌ Three.js not loaded - check script loading and CDN availability');
        }
        
        if (!this.results.scripts.analysis?.routerFound) {
            recommendations.push('❌ Router script not found - check if router.js is being loaded');
        }
        
        if (this.results.dom.container.found && this.results.dom.container.dimensions.width === 0) {
            recommendations.push('⚠️ Container has zero width - check CSS styling');
        }
        
        if (this.results.dom.canvas.found && !this.results.dom.canvas.context) {
            recommendations.push('❌ WebGL context not available - browser may not support WebGL');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ Basic setup looks good - check console for runtime errors');
        }
        
        recommendations.forEach(rec => console.log(rec));
    }
}

// Export for use in Playwright
window.WebflowDiagnostics = WebflowDiagnostics;

// Auto-run if in browser context
if (typeof document !== 'undefined') {
    const diagnostics = new WebflowDiagnostics();
    diagnostics.diagnose(window.location.href).then(results => {
        window.diagnosticsResults = results;
        console.log('Diagnostics complete! Results available in window.diagnosticsResults');
    });
}