import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
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

// Copy HTML files to dist
console.log('📁 Copying static files for Vercel deployment...');

try {
  // Copy main HTML files
  const htmlFiles = ['index.html', 'Advanced-3D-Testing-Suite.html'];
  
  for (const file of htmlFiles) {
    try {
      copyFileSync(file, join('dist', file));
      console.log(`✅ Copied ${file}`);
    } catch (err) {
      console.warn(`⚠️ Could not copy ${file}:`, err.message);
    }
  }
  
  // Copy webflow-staging-site-files directory
  try {
    copyDir('webflow-staging-site-files', join('dist', 'webflow-staging-site-files'));
    console.log('✅ Copied webflow-staging-site-files/');
  } catch (err) {
    console.warn('⚠️ Could not copy webflow-staging-site-files:', err.message);
  }
  
  // Copy public directory
  try {
    copyDir('public', join('dist', 'public'));
    console.log('✅ Copied public/');
  } catch (err) {
    console.warn('⚠️ Could not copy public:', err.message);
  }
  
  console.log('🎉 Static files copied successfully for Vercel deployment!');
  
} catch (error) {
  console.error('❌ Error copying static files:', error);
  process.exit(1);
}