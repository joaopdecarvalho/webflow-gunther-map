/**
 * Quick Test Script for Simple 3D Loader
 * Tests if the 3D scene initializes properly
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testSimple3DLoader() {
  console.log('🧪 Testing Simple 3D Loader');
  console.log('============================');
  
  try {
    // Test if dev server is running
    console.log('📡 Testing dev server...');
    const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/src/scripts/simple-3d-loader.js');
    
    if (stdout.trim() === '200') {
      console.log('✅ Dev server is serving the script correctly');
    } else {
      console.log('❌ Dev server issue - HTTP status:', stdout.trim());
      return;
    }
    
    // Test if staging site loads
    console.log('🌐 Testing staging site...');
    const { stdout: siteStatus } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/webflow-staging-site-files/index.html');
    
    if (siteStatus.trim() === '200') {
      console.log('✅ Staging site loads correctly');
    } else {
      console.log('❌ Staging site issue - HTTP status:', siteStatus.trim());
      return;
    }
    
    console.log('\n🎯 Manual Testing Instructions:');
    console.log('1. Open: http://localhost:8080/webflow-staging-site-files/index.html');
    console.log('2. Open browser console (F12)');
    console.log('3. Look for these messages:');
    console.log('   ✅ "Simple 3D Loader script loaded"');
    console.log('   ✅ "Container found"');
    console.log('   ✅ "Three.js loaded successfully" OR "Simplified modules loaded"');
    console.log('   ✅ "Placeholder model created" OR "Model loaded successfully"');
    console.log('   ✅ "Scene setup complete"');
    console.log('\n4. You should see either:');
    console.log('   - A colorful 3D building scene (if Three.js loads)');
    console.log('   - A gradient background (if Three.js fails but container works)');
    
    console.log('\n📊 Current Setup Summary:');
    console.log('- Script Type: Simple, self-contained 3D loader');
    console.log('- CDN Strategy: ES modules → UMD fallback → multiple CDN sources');
    console.log('- Model Fallback: Placeholder 3D buildings if GLB loading fails');
    console.log('- Controls Fallback: Basic mouse controls if OrbitControls fails');
    console.log('- Container: Fixed full-screen overlay with #webgl-container');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testSimple3DLoader();