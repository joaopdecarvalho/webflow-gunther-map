/**
 * Webflow Update System - Automated Custom Code Management
 *
 * This script handles preserving custom modifications when updating Webflow site exports.
 * It extracts custom code from existing files and re-applies it to fresh exports.
 *
 * Usage:
 * 1. node webflow-update-system.js backup    (backup current modifications)
 * 2. node webflow-update-system.js extract   (extract custom code patterns)
 * 3. node webflow-update-system.js inject    (inject into fresh export)
 */

const fs = require('fs');
const path = require('path');

class WebflowUpdateSystem {
  constructor() {
    this.stagingDir = '../webflow-staging-site-files';
    this.backupDir = '../.backups';
    this.templatesDir = '../.templates';

    // Custom code markers for identification
    this.markers = {
      start: '<!-- CUSTOM CODE START -->',
      end: '<!-- CUSTOM CODE END -->',
      scriptStart: '<!-- Simple 3D Loader Script -->',
      stylesStart: '<!-- WebGL Container Styling -->'
    };

    this.customCode = {
      scripts: [],
      styles: [],
      headInserts: []
    };
  }

  // Backup current files before any modifications
  async backupCurrentFiles() {
    console.log('🔄 Creating backup of current files...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `webflow-backup-${timestamp}`);

    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Copy entire staging directory
    await this.copyDirectory(this.stagingDir, backupPath);

    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  }

  // Extract custom modifications from current files
  async extractCustomCode() {
    console.log('🔍 Extracting custom code patterns...');

    const indexPath = path.join(this.stagingDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.html not found in staging directory');
    }

    const content = fs.readFileSync(indexPath, 'utf8');
    const lines = content.split('\n');

    let inCustomSection = false;
    let currentCustomBlock = [];
    let customBlockType = '';

    lines.forEach((line, index) => {
      // Detect Simple 3D Loader Script
      if (line.includes('Simple 3D Loader Script') || line.includes('simple-3d-loader.js')) {
        this.customCode.scripts.push({
          type: '3d-loader-script',
          content: line.trim(),
          insertAfter: '<link href="images/webclip.jpg" rel="apple-touch-icon">',
          description: '3D Loader Script Import'
        });
      }

      // Detect WebGL styling block
      if (line.includes('WebGL Container Styling')) {
        inCustomSection = true;
        customBlockType = 'webgl-styles';
        currentCustomBlock = [line];
        return;
      }

      // Collect custom styling content
      if (inCustomSection) {
        currentCustomBlock.push(line);

        // End of style block
        if (line.includes('</style>')) {
          this.customCode.styles.push({
            type: customBlockType,
            content: currentCustomBlock.join('\n'),
            insertAfter: '<link href="images/webclip.jpg" rel="apple-touch-icon">',
            description: 'WebGL Container and Camera Panel Styles'
          });

          inCustomSection = false;
          currentCustomBlock = [];
          customBlockType = '';
        }
      }
    });

    // Save extracted patterns as templates
    await this.saveAsTemplates();
    console.log('✅ Custom code patterns extracted and saved');
  }

  // Save extracted code as reusable templates
  async saveAsTemplates() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }

    const templates = {
      metadata: {
        extractedDate: new Date().toISOString(),
        description: 'Custom code templates for Webflow site updates',
        version: '1.0.0'
      },
      scripts: this.customCode.scripts,
      styles: this.customCode.styles,
      headInserts: this.customCode.headInserts
    };

    fs.writeFileSync(
      path.join(this.templatesDir, 'custom-code-templates.json'),
      JSON.stringify(templates, null, 2)
    );

    // Create human-readable template
    let readableTemplate = `# Custom Code Templates\n\n`;
    readableTemplate += `## Scripts\n`;
    this.customCode.scripts.forEach(script => {
      readableTemplate += `### ${script.description}\n\`\`\`html\n${script.content}\n\`\`\`\n\n`;
    });

    readableTemplate += `## Styles\n`;
    this.customCode.styles.forEach(style => {
      readableTemplate += `### ${style.description}\n\`\`\`html\n${style.content}\n\`\`\`\n\n`;
    });

    fs.writeFileSync(
      path.join(this.templatesDir, 'custom-code-templates.md'),
      readableTemplate
    );
  }

  // Inject custom code into fresh Webflow export
  async injectCustomCode(targetDir = this.stagingDir) {
    console.log('💉 Injecting custom code into fresh export...');

    const templatesPath = path.join(this.templatesDir, 'custom-code-templates.json');
    if (!fs.existsSync(templatesPath)) {
      throw new Error('No templates found. Run extract first.');
    }

    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    const indexPath = path.join(targetDir, 'index.html');

    if (!fs.existsSync(indexPath)) {
      throw new Error(`index.html not found in ${targetDir}`);
    }

    let content = fs.readFileSync(indexPath, 'utf8');

    // Inject scripts
    templates.scripts.forEach(script => {
      if (!content.includes(script.content)) {
        content = content.replace(
          script.insertAfter,
          `${script.insertAfter}\n  \n  ${script.content}`
        );
        console.log(`✅ Injected: ${script.description}`);
      } else {
        console.log(`⚠️ Already exists: ${script.description}`);
      }
    });

    // Inject styles
    templates.styles.forEach(style => {
      if (!content.includes('WebGL Container Styling')) {
        content = content.replace(
          style.insertAfter,
          `${style.insertAfter}\n  \n  ${style.content}`
        );
        console.log(`✅ Injected: ${style.description}`);
      } else {
        console.log(`⚠️ Already exists: ${style.description}`);
      }
    });

    // Write updated content
    fs.writeFileSync(indexPath, content);
    console.log('✅ Custom code injection complete');
  }

  // Utility: Copy directory recursively
  async copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Main execution method
  async run(command) {
    try {
      switch (command) {
        case 'backup':
          await this.backupCurrentFiles();
          break;

        case 'extract':
          await this.extractCustomCode();
          break;

        case 'inject':
          await this.injectCustomCode();
          break;

        case 'full-update':
          console.log('🚀 Running full update process...');
          await this.backupCurrentFiles();
          await this.extractCustomCode();
          console.log('✅ Ready for fresh export. Run "inject" after updating files.');
          break;

        default:
          console.log('Usage: node webflow-update-system.js [backup|extract|inject|full-update]');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  const system = new WebflowUpdateSystem();
  system.run(command);
}

module.exports = WebflowUpdateSystem;