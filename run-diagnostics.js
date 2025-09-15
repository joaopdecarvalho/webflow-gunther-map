/**
 * Diagnostic Runner - Run 3D Model Diagnostics on Webflow Site
 */

import PlaywrightWebflowDiagnostics from './playwright-webflow-diagnostics.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function main() {
    console.log('🎯 Webflow 3D Model Diagnostic Tool');
    console.log('=====================================');
    console.log('This tool will diagnose why your 3D model isn\'t showing on your staging site.\n');
    
    try {
        // Get staging site URL from user
        let url = await askQuestion('Enter your Webflow staging site URL: ');
        
        // Validate URL
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        
        console.log(`\n🔍 Starting diagnostics for: ${url}\n`);
        
        // Run diagnostics
        const diagnostics = new PlaywrightWebflowDiagnostics();
        const results = await diagnostics.diagnoseWebflowSite(url);
        
        console.log('\n✅ Diagnostics completed!');
        console.log('Check the screenshots folder and diagnostic report for detailed results.');
        
    } catch (error) {
        console.error('🔴 Error running diagnostics:', error.message);
        console.error(error.stack);
    } finally {
        rl.close();
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Diagnostics interrupted by user');
    rl.close();
    process.exit(0);
});

// Run the diagnostic tool
main().catch(console.error);