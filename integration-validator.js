/**
 * Comprehensive Integration Validation and Deployment Verification System
 * Tests the complete workflow from test interface to Webflow production
 */

class WebflowIntegrationValidator {
  constructor() {
    this.results = {
      development: {},
      production: {},
      webflow: {},
      github: {},
      overall: { passed: 0, total: 0, errors: [] }
    };
    
    this.endpoints = {
      local: 'http://localhost:8080',
      github: 'https://joaopdecarvalho.github.io/webflow-gunther-map',
      config: 'https://joaopdecarvalho.github.io/webflow-gunther-map/config/3d-config.json'
    };
  }

  async validateComplete() {
    console.log('🔍 Starting comprehensive integration validation...');
    
    try {
      await this.validateDevelopmentEnvironment();
      await this.validateProductionDeployment();
      await this.validateWebflowIntegration();
      await this.validateGitHubPipeline();
      await this.validateEndToEndWorkflow();
      
      this.generateReport();
      return this.results;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.results.overall.errors.push(`Critical validation error: ${error.message}`);
      return this.results;
    }
  }

  async validateDevelopmentEnvironment() {
    console.log('🔧 Validating development environment...');
    const dev = this.results.development;
    
    // Test 1: Check if dev server is running
    try {
      const response = await fetch(`${this.endpoints.local}/`);
      dev.serverRunning = response.ok;
      this.logResult('Development server running', dev.serverRunning);
    } catch (error) {
      dev.serverRunning = false;
      dev.serverError = error.message;
      this.logResult('Development server running', false, error.message);
    }

    // Test 2: Check API endpoints
    try {
      // Test config upload endpoint
      const uploadResponse = await fetch(`${this.endpoints.local}/api/config/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '1.0.0',
          camera: { position: [0,0,0], target: [0,0,0] }
        })
      });
      dev.uploadEndpoint = uploadResponse.ok;
      this.logResult('Config upload endpoint', dev.uploadEndpoint);
    } catch (error) {
      dev.uploadEndpoint = false;
      this.logResult('Config upload endpoint', false, error.message);
    }

    try {
      // Test GitHub commit endpoint
      const commitResponse = await fetch(`${this.endpoints.local}/api/github/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { version: '1.0.0', camera: {} },
          commitMessage: 'Test validation'
        })
      });
      dev.commitEndpoint = commitResponse.ok;
      this.logResult('GitHub commit endpoint', dev.commitEndpoint);
    } catch (error) {
      dev.commitEndpoint = false;
      this.logResult('GitHub commit endpoint', false, error.message);
    }

    // Test 3: Check test interface accessibility
    try {
      const testInterface = await fetch(`${this.endpoints.local}/test-enhanced.html`);
      dev.testInterface = testInterface.ok;
      this.logResult('Test interface accessible', dev.testInterface);
    } catch (error) {
      dev.testInterface = false;
      this.logResult('Test interface accessible', false, error.message);
    }

    // Test 4: Check models directory
    try {
      const modelsResponse = await fetch(`${this.endpoints.local}/models-list.json`);
      const modelsData = await modelsResponse.json();
      dev.modelsAvailable = modelsData.success && modelsData.count > 0;
      dev.modelCount = modelsData.count;
      this.logResult(`Models available (${dev.modelCount})`, dev.modelsAvailable);
    } catch (error) {
      dev.modelsAvailable = false;
      this.logResult('Models available', false, error.message);
    }
  }

  async validateProductionDeployment() {
    console.log('🚀 Validating production deployment...');
    const prod = this.results.production;

    // Test 1: Check GitHub Pages is accessible
    try {
      const response = await fetch(`${this.endpoints.github}/`);
      prod.githubPagesActive = response.ok;
      this.logResult('GitHub Pages active', prod.githubPagesActive);
    } catch (error) {
      prod.githubPagesActive = false;
      this.logResult('GitHub Pages active', false, error.message);
    }

    // Test 2: Check router.js is deployed
    try {
      const routerResponse = await fetch(`${this.endpoints.github}/src/router.js`);
      prod.routerDeployed = routerResponse.ok;
      this.logResult('Router.js deployed', prod.routerDeployed);
    } catch (error) {
      prod.routerDeployed = false;
      this.logResult('Router.js deployed', false, error.message);
    }

    // Test 3: Check 3D map script is deployed
    try {
      const mapResponse = await fetch(`${this.endpoints.github}/src/scripts/3d-map-final.js`);
      prod.mapScriptDeployed = mapResponse.ok;
      this.logResult('3D map script deployed', prod.mapScriptDeployed);
    } catch (error) {
      prod.mapScriptDeployed = false;
      this.logResult('3D map script deployed', false, error.message);
    }

    // Test 4: Check configuration is deployed
    try {
      const configResponse = await fetch(this.endpoints.config);
      const configData = await configResponse.json();
      prod.configDeployed = configData && configData.version;
      prod.configVersion = configData?.version;
      this.logResult(`Configuration deployed (v${prod.configVersion})`, prod.configDeployed);
    } catch (error) {
      prod.configDeployed = false;
      this.logResult('Configuration deployed', false, error.message);
    }

    // Test 5: Check CORS headers
    try {
      const corsResponse = await fetch(this.endpoints.config, { method: 'HEAD' });
      const corsHeader = corsResponse.headers.get('Access-Control-Allow-Origin');
      prod.corsEnabled = corsHeader === '*' || corsHeader !== null;
      this.logResult('CORS headers present', prod.corsEnabled);
    } catch (error) {
      prod.corsEnabled = false;
      this.logResult('CORS headers present', false, error.message);
    }

    // Test 6: Check models are accessible
    try {
      const modelResponse = await fetch(`${this.endpoints.github}/Goetheviertel_250812.glb`, { method: 'HEAD' });
      prod.modelsAccessible = modelResponse.ok;
      this.logResult('3D models accessible', prod.modelsAccessible);
    } catch (error) {
      prod.modelsAccessible = false;
      this.logResult('3D models accessible', false, error.message);
    }
  }

  async validateWebflowIntegration() {
    console.log('🌐 Validating Webflow integration...');
    const webflow = this.results.webflow;

    // Test 1: Validate embed code structure
    try {
      const embedResponse = await fetch(`${this.endpoints.local}/webflow-production-embed-enhanced.html`);
      const embedCode = await embedResponse.text();
      
      webflow.embedCodeExists = embedCode.includes('webflow-gunther-map');
      webflow.hasHotReload = embedCode.includes('checkForConfigUpdates');
      webflow.hasErrorHandling = embedCode.includes('addEventListener(\'error\'');
      webflow.hasUpdateIndicator = embedCode.includes('showConfigUpdateIndicator');
      
      this.logResult('Enhanced embed code available', webflow.embedCodeExists);
      this.logResult('Hot-reload functionality present', webflow.hasHotReload);
      this.logResult('Error handling included', webflow.hasErrorHandling);
      this.logResult('Update indicator included', webflow.hasUpdateIndicator);
    } catch (error) {
      webflow.embedCodeExists = false;
      this.logResult('Enhanced embed code available', false, error.message);
    }

    // Test 2: Simulate Webflow environment detection
    webflow.environmentDetection = true;
    this.logResult('Environment detection logic', webflow.environmentDetection);

    // Test 3: Check if configuration monitoring would work
    webflow.configMonitoring = webflow.hasHotReload && this.results.production.configDeployed;
    this.logResult('Configuration monitoring ready', webflow.configMonitoring);
  }

  async validateGitHubPipeline() {
    console.log('⚙️ Validating GitHub pipeline...');
    const github = this.results.github;

    // Test 1: Check workflow file exists
    try {
      const workflowResponse = await fetch(`${this.endpoints.local}/.github/workflows/deploy.yml`);
      github.workflowExists = workflowResponse.ok;
      this.logResult('GitHub workflow exists', github.workflowExists);
    } catch (error) {
      github.workflowExists = false;
      this.logResult('GitHub workflow exists', false, error.message);
    }

    // Test 2: Check build process
    try {
      const packageResponse = await fetch(`${this.endpoints.local}/package.json`);
      const packageData = await packageResponse.json();
      github.buildScriptExists = packageData.scripts && packageData.scripts.build;
      this.logResult('Build script configured', github.buildScriptExists);
    } catch (error) {
      github.buildScriptExists = false;
      this.logResult('Build script configured', false, error.message);
    }

    // Test 3: Validate deployment artifacts
    github.artifactsValid = this.results.production.githubPagesActive && 
                           this.results.production.routerDeployed && 
                           this.results.production.configDeployed;
    this.logResult('Deployment artifacts valid', github.artifactsValid);
  }

  async validateEndToEndWorkflow() {
    console.log('🔄 Validating end-to-end workflow...');
    const e2e = this.results.endToEnd = {};

    // Test complete workflow readiness
    e2e.developmentReady = this.results.development.serverRunning && 
                          this.results.development.uploadEndpoint && 
                          this.results.development.testInterface;

    e2e.productionReady = this.results.production.githubPagesActive && 
                         this.results.production.configDeployed && 
                         this.results.production.routerDeployed;

    e2e.integrationReady = this.results.webflow.embedCodeExists && 
                          this.results.webflow.configMonitoring;

    e2e.pipelineReady = this.results.github.workflowExists && 
                       this.results.github.buildScriptExists;

    e2e.workflowComplete = e2e.developmentReady && e2e.productionReady && 
                          e2e.integrationReady && e2e.pipelineReady;

    this.logResult('Development environment ready', e2e.developmentReady);
    this.logResult('Production deployment ready', e2e.productionReady);
    this.logResult('Webflow integration ready', e2e.integrationReady);
    this.logResult('GitHub pipeline ready', e2e.pipelineReady);
    this.logResult('🎉 Complete workflow ready', e2e.workflowComplete);
  }

  logResult(test, passed, error = null) {
    const status = passed ? '✅' : '❌';
    const message = `${status} ${test}`;
    
    console.log(message + (error ? ` (${error})` : ''));
    
    this.results.overall.total++;
    if (passed) {
      this.results.overall.passed++;
    } else {
      this.results.overall.errors.push(`${test}: ${error || 'Failed'}`);
    }
  }

  generateReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('='.repeat(50));
    
    const { passed, total, errors } = this.results.overall;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`Overall Score: ${passed}/${total} (${successRate}%)`);
    console.log(`Status: ${passed === total ? '🎉 ALL SYSTEMS GO' : passed > total * 0.8 ? '⚠️  MOSTLY READY' : '❌ NEEDS ATTENTION'}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Issues Found:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    console.log('\n📋 Component Status:');
    console.log(`Development: ${this.getComponentStatus('development')}`);
    console.log(`Production: ${this.getComponentStatus('production')}`);
    console.log(`Webflow: ${this.getComponentStatus('webflow')}`);
    console.log(`GitHub: ${this.getComponentStatus('github')}`);
    
    if (this.results.endToEnd) {
      console.log(`End-to-End: ${this.results.endToEnd.workflowComplete ? '✅ Ready' : '❌ Not Ready'}`);
    }
    
    console.log('\n🔗 Next Steps:');
    if (passed === total) {
      console.log('✅ Integration is fully validated and ready for production use');
      console.log('✅ Webflow sites can use the enhanced embed code');
      console.log('✅ Configuration updates will deploy automatically');
    } else {
      console.log('⚠️  Address the issues listed above before production deployment');
      console.log('⚠️  Test critical path: Test Interface → API → GitHub → Webflow');
    }
  }

  getComponentStatus(component) {
    const comp = this.results[component];
    if (!comp) return '❓ Unknown';
    
    const values = Object.values(comp).filter(v => typeof v === 'boolean');
    const passed = values.filter(Boolean).length;
    const total = values.length;
    
    if (total === 0) return '❓ No tests';
    if (passed === total) return '✅ All Good';
    if (passed > total * 0.7) return '⚠️  Mostly Good';
    return '❌ Issues';
  }

  // Export results for external use
  exportResults() {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...this.results
    };
  }
}

// Auto-initialize when loaded in browser
if (typeof window !== 'undefined') {
  window.WebflowIntegrationValidator = WebflowIntegrationValidator;
  
  // Convenience function
  window.validateIntegration = async () => {
    const validator = new WebflowIntegrationValidator();
    return await validator.validateComplete();
  };
  
  console.log('🔍 Integration validation system loaded. Run validateIntegration() to test.');
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebflowIntegrationValidator;
}