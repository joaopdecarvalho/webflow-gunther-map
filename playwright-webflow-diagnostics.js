/**
 * Playwright 3D Model Diagnostic Script
 * Comprehensive testing script to diagnose 3D model loading issues on Webflow staging site
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

class PlaywrightWebflowDiagnostics {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            url: null,
            pageLoad: {},
            networkRequests: [],
            consoleMessages: [],
            screenshots: [],
            diagnostics: {}
        };
    }

    async init() {
        console.log('🚀 Initializing Playwright diagnostics...');
        
        this.browser = await chromium.launch({
            headless: false, // Show browser for debugging
            devtools: true,
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport
        await this.page.setViewportSize({ width: 1920, height: 1080 });
        
        // Monitor network requests
        this.page.on('request', (request) => {
            this.results.networkRequests.push({
                type: 'request',
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                timestamp: Date.now()
            });
        });
        
        this.page.on('response', (response) => {
            this.results.networkRequests.push({
                type: 'response',
                url: response.url(),
                status: response.status(),
                contentType: response.headers()['content-type'],
                timestamp: Date.now()
            });
        });
        
        // Monitor console messages
        this.page.on('console', (msg) => {
            const message = {
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
                timestamp: Date.now()
            };
            
            this.results.consoleMessages.push(message);
            
            // Log important messages
            if (msg.type() === 'error') {
                console.log(`🔴 Console Error: ${msg.text()}`);
            } else if (msg.type() === 'warning') {
                console.log(`🟡 Console Warning: ${msg.text()}`);
            }
        });
        
        // Monitor page errors
        this.page.on('pageerror', (error) => {
            console.log(`🔴 Page Error: ${error.message}`);
            this.results.consoleMessages.push({
                type: 'pageerror',
                text: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        });
    }

    async diagnoseWebflowSite(url) {
        console.log(`🔍 Starting diagnostics for: ${url}`);
        this.results.url = url;
        
        try {
            await this.init();
            
            // Step 1: Navigate and wait for load
            await this.navigateAndWait(url);
            
            // Step 2: Take initial screenshot
            await this.takeScreenshot('01-initial-load');
            
            // Step 3: Wait for scripts to load
            await this.waitForScripts();
            
            // Step 4: Inject and run diagnostic script
            await this.runDiagnostics();
            
            // Step 5: Take post-diagnostics screenshot
            await this.takeScreenshot('02-post-diagnostics');
            
            // Step 6: Check for 3D canvas
            await this.check3DCanvas();
            
            // Step 7: Monitor for model loading
            await this.monitorModelLoading();
            
            // Step 8: Take final screenshot
            await this.takeScreenshot('03-final-state');
            
            // Step 9: Generate comprehensive report
            await this.generateReport();
            
        } catch (error) {
            console.error('🔴 Diagnostic error:', error);
            await this.takeScreenshot('error-state');
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
        
        return this.results;
    }

    async navigateAndWait(url) {
        console.log('📍 Navigating to staging site...');
        
        const startTime = Date.now();
        
        await this.page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        this.results.pageLoad = {
            duration: Date.now() - startTime,
            title: await this.page.title(),
            url: this.page.url()
        };
        
        console.log(`✅ Page loaded: ${this.results.pageLoad.title} (${this.results.pageLoad.duration}ms)`);
    }

    async waitForScripts() {
        console.log('⏳ Waiting for scripts to load...');
        
        // Wait for potential script loading
        await this.page.waitForTimeout(5000);
        
        // Check for router script
        const routerLoaded = await this.page.evaluate(() => {
            return Array.from(document.querySelectorAll('script')).some(script => 
                script.src.includes('router') || script.textContent.includes('router')
            );
        });
        
        console.log(`Router script loaded: ${routerLoaded ? '✅' : '❌'}`);
        
        // Wait a bit more for dynamic script loading
        if (routerLoaded) {
            await this.page.waitForTimeout(3000);
        }
    }

    async runDiagnostics() {
        console.log('🔍 Running diagnostic script...');
        
        // Read and inject our diagnostic script
        const diagnosticScript = fs.readFileSync(
            path.join(process.cwd(), 'webflow-3d-diagnostics.js'), 
            'utf8'
        );
        
        await this.page.addScriptTag({ content: diagnosticScript });
        
        // Wait for diagnostics to complete
        await this.page.waitForTimeout(2000);
        
        // Get diagnostic results
        this.results.diagnostics = await this.page.evaluate(() => {
            return window.diagnosticsResults || { error: 'Diagnostics not completed' };
        });
        
        console.log('✅ Diagnostics completed');
    }

    async check3DCanvas() {
        console.log('🎯 Checking for 3D canvas...');
        
        const canvasInfo = await this.page.evaluate(() => {
            const canvases = Array.from(document.querySelectorAll('canvas'));
            const container = document.getElementById('map-container') || document.getElementById('canvas-3d');
            
            return {
                canvasCount: canvases.length,
                canvases: canvases.map(canvas => ({
                    id: canvas.id,
                    className: canvas.className,
                    width: canvas.width,
                    height: canvas.height,
                    clientWidth: canvas.clientWidth,
                    clientHeight: canvas.clientHeight,
                    hasWebGL: !!canvas.getContext('webgl')
                })),
                container: container ? {
                    id: container.id,
                    className: container.className,
                    width: container.offsetWidth,
                    height: container.offsetHeight,
                    children: container.children.length
                } : null
            };
        });
        
        this.results.canvas = canvasInfo;
        console.log(`Canvas elements found: ${canvasInfo.canvasCount}`);
        console.log(`Container found: ${canvasInfo.container ? '✅' : '❌'}`);
    }

    async monitorModelLoading() {
        console.log('🎯 Monitoring for model loading...');
        
        // Monitor network requests for 3D models
        const modelRequests = this.results.networkRequests.filter(req => 
            req.url && (req.url.includes('.glb') || req.url.includes('.gltf'))
        );
        
        console.log(`Model requests found: ${modelRequests.length}`);
        modelRequests.forEach(req => {
            console.log(`  ${req.type}: ${req.url} (${req.status || 'pending'})`);
        });
        
        // Check for Three.js and model instances
        const threeJSInfo = await this.page.evaluate(() => {
            return {
                threeAvailable: typeof window.THREE !== 'undefined',
                threeVersion: window.THREE ? window.THREE.REVISION : null,
                mapInstances: window.gunther3DMap ? 
                    (Array.isArray(window.gunther3DMap) ? window.gunther3DMap.length : 1) : 0,
                globalScripts: window.globalScripts || [],
                pageScripts: window.pageScripts || {}
            };
        });
        
        this.results.threeJS = threeJSInfo;
        console.log(`Three.js available: ${threeJSInfo.threeAvailable ? '✅' : '❌'}`);
        if (threeJSInfo.threeAvailable) {
            console.log(`Three.js version: r${threeJSInfo.threeVersion}`);
        }
    }

    async takeScreenshot(name) {
        const filename = `diagnostic-${name}-${Date.now()}.png`;
        const filepath = path.join(process.cwd(), 'screenshots', filename);
        
        // Ensure screenshots directory exists
        if (!fs.existsSync(path.dirname(filepath))) {
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
        }
        
        await this.page.screenshot({ 
            path: filepath,
            fullPage: true 
        });
        
        this.results.screenshots.push({
            name,
            filename,
            filepath,
            timestamp: Date.now()
        });
        
        console.log(`📸 Screenshot saved: ${filename}`);
    }

    async generateReport() {
        console.log('\n📊 COMPREHENSIVE DIAGNOSTIC REPORT');
        console.log('=====================================');
        
        console.log(`\n📍 SITE INFORMATION:`);
        console.log(`URL: ${this.results.url}`);
        console.log(`Title: ${this.results.pageLoad?.title}`);
        console.log(`Load Time: ${this.results.pageLoad?.duration}ms`);
        
        console.log(`\n🌐 NETWORK ANALYSIS:`);
        const requests = this.results.networkRequests.filter(r => r.type === 'request');
        const responses = this.results.networkRequests.filter(r => r.type === 'response');
        const failed = responses.filter(r => r.status >= 400);
        const models = requests.filter(r => r.url.includes('.glb') || r.url.includes('.gltf'));
        const scripts = requests.filter(r => r.resourceType === 'script');
        
        console.log(`Total Requests: ${requests.length}`);
        console.log(`Failed Requests: ${failed.length}`);
        console.log(`Script Requests: ${scripts.length}`);
        console.log(`Model Requests: ${models.length}`);
        
        if (failed.length > 0) {
            console.log('\n❌ FAILED REQUESTS:');
            failed.forEach(req => {
                console.log(`  ${req.status} - ${req.url}`);
            });
        }
        
        if (models.length > 0) {
            console.log('\n🎯 MODEL REQUESTS:');
            models.forEach(req => {
                const response = responses.find(r => r.url === req.url);
                console.log(`  ${response?.status || 'pending'} - ${req.url}`);
            });
        }
        
        console.log(`\n📝 CONSOLE MESSAGES:`);
        const errors = this.results.consoleMessages.filter(m => m.type === 'error');
        const warnings = this.results.consoleMessages.filter(m => m.type === 'warning');
        
        console.log(`Errors: ${errors.length}`);
        console.log(`Warnings: ${warnings.length}`);
        
        if (errors.length > 0) {
            console.log('\n🔴 CONSOLE ERRORS:');
            errors.slice(0, 5).forEach(error => {
                console.log(`  ${error.text}`);
            });
        }
        
        console.log(`\n🎮 THREE.JS STATUS:`);
        console.log(`Available: ${this.results.threeJS?.threeAvailable ? '✅' : '❌'}`);
        if (this.results.threeJS?.threeAvailable) {
            console.log(`Version: r${this.results.threeJS.threeVersion}`);
            console.log(`Map Instances: ${this.results.threeJS.mapInstances}`);
        }
        
        console.log(`\n🎯 CANVAS STATUS:`);
        console.log(`Canvas Elements: ${this.results.canvas?.canvasCount || 0}`);
        console.log(`3D Container: ${this.results.canvas?.container ? '✅' : '❌'}`);
        
        if (this.results.canvas?.canvases?.length > 0) {
            this.results.canvas.canvases.forEach((canvas, i) => {
                console.log(`  Canvas ${i + 1}: ${canvas.width}x${canvas.height} WebGL:${canvas.hasWebGL ? '✅' : '❌'}`);
            });
        }
        
        console.log(`\n📸 SCREENSHOTS:`);
        this.results.screenshots.forEach(screenshot => {
            console.log(`  ${screenshot.name}: ${screenshot.filename}`);
        });
        
        // Save full report to file
        const reportPath = path.join(process.cwd(), `diagnostic-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Full report saved to: ${reportPath}`);
        
        this.generateRecommendations();
    }

    generateRecommendations() {
        console.log(`\n💡 RECOMMENDATIONS:`);
        const recommendations = [];
        
        // Check for basic issues
        if (!this.results.canvas?.container) {
            recommendations.push('❌ No 3D container found - ensure #map-container or #canvas-3d exists in your Webflow page');
        }
        
        if (!this.results.threeJS?.threeAvailable) {
            recommendations.push('❌ Three.js not loaded - check CDN availability and script loading order');
        }
        
        const scriptErrors = this.results.consoleMessages.filter(m => 
            m.type === 'error' && (m.text.includes('script') || m.text.includes('THREE'))
        );
        if (scriptErrors.length > 0) {
            recommendations.push('❌ Script loading errors detected - check console for details');
        }
        
        const modelRequests = this.results.networkRequests.filter(r => 
            r.url && (r.url.includes('.glb') || r.url.includes('.gltf'))
        );
        if (modelRequests.length === 0) {
            recommendations.push('❌ No 3D model requests detected - check if router.js is loading correctly');
        }
        
        const failedModels = this.results.networkRequests.filter(r => 
            r.type === 'response' && r.status >= 400 && 
            (r.url.includes('.glb') || r.url.includes('.gltf'))
        );
        if (failedModels.length > 0) {
            recommendations.push('❌ 3D model loading failed - check file paths and CORS settings');
        }
        
        if (this.results.canvas?.canvasCount === 0) {
            recommendations.push('❌ No canvas elements found - 3D rendering cannot occur');
        }
        
        if (this.results.canvas?.canvases?.some(c => !c.hasWebGL)) {
            recommendations.push('⚠️ WebGL context issues detected - browser may not support WebGL');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ Basic setup appears correct - check timing and initialization order');
        }
        
        recommendations.forEach(rec => console.log(`  ${rec}`));
    }
}

// Usage
const diagnostics = new PlaywrightWebflowDiagnostics();

// Export for external use
export default PlaywrightWebflowDiagnostics;