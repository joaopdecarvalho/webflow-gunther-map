/**
 * Test script to verify Phase 4 API endpoints
 * Run this from the browser console when the dev server is running
 */

// Test configuration upload endpoint
async function testConfigUpload() {
  console.log('🧪 Testing config upload endpoint...');
  
  const testConfig = {
    version: "1.0.0",
    camera: {
      position: [100, 50, 100],
      target: [0, 0, 0],
      distance: 120,
      fov: 75,
      minDistance: 10,
      maxDistance: 500
    },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.4 },
      directional: { color: "#ffffff", intensity: 0.8, position: [1, 1, 0] }
    },
    models: {
      primary: "goetheviertel"
    },
    animations: {
      autoplay: true,
      speed: 1.0,
      loop: true
    },
    performance: {
      qualityLevel: "high",
      maxTriangles: 100000,
      targetFPS: 60
    }
  };

  try {
    const response = await fetch('/api/config/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig)
    });

    const result = await response.json();
    console.log('✅ Config upload result:', result);
    return result;
  } catch (error) {
    console.error('❌ Config upload failed:', error);
    return null;
  }
}

// Test GitHub commit endpoint
async function testGitHubCommit() {
  console.log('🧪 Testing GitHub commit endpoint...');
  
  const testConfig = {
    version: "1.0.0",
    camera: {
      position: [100, 50, 100],
      target: [0, 0, 0],
      distance: 120,
      fov: 75
    },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.4 }
    }
  };

  try {
    const response = await fetch('/api/github/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: testConfig,
        commitMessage: 'Test configuration update from API endpoint'
      })
    });

    const result = await response.json();
    console.log('✅ GitHub commit result:', result);
    return result;
  } catch (error) {
    console.error('❌ GitHub commit failed:', error);
    return null;
  }
}

// Test both endpoints
async function runAllTests() {
  console.log('🚀 Running Phase 4 API endpoint tests...');
  
  const uploadResult = await testConfigUpload();
  const commitResult = await testGitHubCommit();
  
  console.log('📊 Test Summary:');
  console.log('- Config Upload:', uploadResult ? '✅ PASS' : '❌ FAIL');
  console.log('- GitHub Commit:', commitResult ? '✅ PASS' : '❌ FAIL');
  
  if (uploadResult && commitResult) {
    console.log('🎉 All Phase 4 endpoints working correctly!');
  } else {
    console.log('⚠️ Some endpoints need attention');
  }
}

// Auto-run if in test environment
if (window.location.hostname === 'localhost' && window.location.port === '8080') {
  console.log('🔧 Phase 4 API test script loaded. Run runAllTests() to test endpoints.');
}

// Export functions for manual testing
window.phase4Tests = {
  testConfigUpload,
  testGitHubCommit,
  runAllTests
};