/**
 * Auto-Diagnostic Runner - Automatically run diagnostics on known staging site
 */

import PlaywrightWebflowDiagnostics from './playwright-webflow-diagnostics.js';

async function runAutoDiagnostics() {
    // Based on your Webflow site info
    const stagingUrl = 'https://go-goethe-quartier-ebde32.webflow.io';
    
    console.log('🎯 Webflow 3D Model Auto-Diagnostic Tool');
    console.log('==========================================');
    console.log(`Target Site: ${stagingUrl}`);
    console.log('Site ID: 68bfde35f384360748d87167');
    console.log('Applied Script: 3D Map Final Fix v4.0.0\n');
    
    try {
        console.log('🚀 Starting automated diagnostics...\n');
        
        const diagnostics = new PlaywrightWebflowDiagnostics();
        const results = await diagnostics.diagnoseWebflowSite(stagingUrl);
        
        console.log('\n✅ Automated diagnostics completed!');
        console.log('📊 Results summary:');
        console.log(`   - Page loaded: ${results.pageLoad?.duration}ms`);
        console.log(`   - Network requests: ${results.networkRequests.length}`);
        console.log(`   - Console messages: ${results.consoleMessages.length}`);
        console.log(`   - Screenshots taken: ${results.screenshots.length}`);
        console.log(`   - Three.js available: ${results.threeJS?.threeAvailable ? '✅' : '❌'}`);
        console.log(`   - Canvas elements: ${results.canvas?.canvasCount || 0}`);
        
        return results;
        
    } catch (error) {
        console.error('🔴 Error running auto-diagnostics:', error.message);
        throw error;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAutoDiagnostics().catch(console.error);
}

export default runAutoDiagnostics;