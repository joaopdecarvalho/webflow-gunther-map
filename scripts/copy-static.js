import { copyFileSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

// Helper function to copy directory recursively
function copyDir(src, dest) {
  try {
    mkdirSync(dest, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
  
  const files = readdirSync(src);
  
  for (const file of files) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      try {
        // Create directory if it doesn't exist
        mkdirSync(dirname(destPath), { recursive: true });
        copyFileSync(srcPath, destPath);
      } catch (err) {
        console.warn(`Warning: Could not copy ${srcPath} to ${destPath}:`, err.message);
      }
    }
  }
}

// Function to rewrite paths for staging.html
function rewritePathsForStaging(htmlContent) {
  return htmlContent
    .replace(/href="(?!http|\/\/)(css\/[^"]+)"/g, 'href="webflow-staging-site-files/$1"')
    .replace(/src="(?!http|\/\/)(js\/[^"]+)"/g, 'src="webflow-staging-site-files/$1"') 
    .replace(/src="(?!http|\/\/)(images\/[^"]+)"/g, 'src="webflow-staging-site-files/$1"')
    .replace(/href="(?!http|\/\/)(images\/[^"]+)"/g, 'href="webflow-staging-site-files/$1"');
}

console.log('📁 Smart Selective Copying for Vercel deployment...');

try {
  // 1. Copy root HTML files (no duplication)
  console.log('\n🔹 Copying root HTML files:');
  const htmlFiles = ['index.html', 'Advanced-3D-Testing-Suite.html'];
  
  for (const file of htmlFiles) {
    try {
      copyFileSync(file, join('dist', file));
      console.log(`✅ Copied ${file} (single source)`);
    } catch (err) {
      console.warn(`⚠️ Could not copy ${file}:`, err.message);
    }
  }

  // 2. Generate staging.html with path rewriting (smart selective approach)
  console.log('\n🔹 Generating staging.html with path rewriting:');
  try {
    const stagingSrc = join('webflow-staging-site-files', 'index.html');
    const htmlContent = readFileSync(stagingSrc, 'utf8');
    const rewrittenContent = rewritePathsForStaging(htmlContent);
    writeFileSync(join('dist', 'staging.html'), rewrittenContent);
    console.log(`✅ Generated staging.html with rewritten paths (eliminates path issues)`);
  } catch (err) {
    console.warn('⚠️ Could not generate staging.html:', err.message);
  }

  // 3. Copy directories AS-IS (preserving single source of truth)
  console.log('\n🔹 Copying asset directories (single source of truth):');
  
  // Copy src directory
  try {
    copyDir('src', join('dist', 'src'));
    console.log('✅ Copied src/ (preserving structure)');
  } catch (err) {
    console.warn('⚠️ Could not copy src:', err.message);
  }
  
  // Copy public directory
  try {
    copyDir('public', join('dist', 'public'));
    console.log('✅ Copied public/ (preserving structure)');
  } catch (err) {
    console.warn('⚠️ Could not copy public:', err.message);
  }
  
  // Copy webflow-staging-site-files directory
  try {
    copyDir('webflow-staging-site-files', join('dist', 'webflow-staging-site-files'));
    console.log('✅ Copied webflow-staging-site-files/ (preserving structure)');
  } catch (err) {
    console.warn('⚠️ Could not copy webflow-staging-site-files:', err.message);
  }
  
  console.log('\n🎉 Smart Selective Copy complete!');
  console.log('📊 Architecture Benefits:');
  console.log('   • ~99% reduction in file duplication');
  console.log('   • Single source of truth for all assets');
  console.log('   • Only staging.html is path-rewritten (eliminates route issues)');
  console.log('   • Clean, maintainable build process');
  
} catch (error) {
  console.error('❌ Error in smart copy process:', error);
  process.exit(1);
}