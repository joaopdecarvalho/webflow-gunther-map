import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Get all script files dynamically
const getScriptEntries = () => {
  const entries = {};
  
  const scriptsDir = './src/scripts';
  if (fs.existsSync(scriptsDir)) {
    const files = fs.readdirSync(scriptsDir);
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const name = file.replace('.js', '');
        entries[`scripts/${name}`] = `${scriptsDir}/${file}`;
      }
    });
  }
  
  return entries;
};

export default defineConfig({
  server: {
    port: 8080,
    host: '0.0.0.0', // Allow external connections
    https: false, // Set to true for HTTPS if needed
    cors: {
      origin: true, // Allow all origins during development
      credentials: false,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    }
  },
  plugins: [
    {
      name: 'models-list-endpoint',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/models-list.json') {
            try {
              const publicDir = path.join(process.cwd(), 'public');
              const files = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [];
              const modelFiles = files.filter((f) =>
                f.toLowerCase().endsWith('.glb') || f.toLowerCase().endsWith('.gltf')
              );
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({ success: true, models: modelFiles, count: modelFiles.length })
              );
            } catch (error) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({ success: false, error: String(error), models: [], count: 0 })
              );
            }
            return;
          }
          next();
        });
      },
    },
    {
      name: 'configuration-upload-endpoint',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/config/upload' && req.method === 'POST') {
            try {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', () => {
                try {
                  const configData = JSON.parse(body);
                  
                  // Validate configuration structure
                  if (!configData.version || !configData.camera) {
                    throw new Error('Invalid configuration structure');
                  }
                  
                  // Write to config directory
                  const configDir = path.join(process.cwd(), 'config');
                  if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                  }
                  
                  const configFile = path.join(configDir, '3d-config.json');
                  fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));
                  
                  console.log('✅ Configuration uploaded successfully');
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Configuration uploaded successfully',
                    timestamp: new Date().toISOString()
                  }));
                } catch (error) {
                  console.error('❌ Configuration upload error:', error);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                  }));
                }
              });
            } catch (error) {
              console.error('❌ Configuration upload error:', error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Internal server error' 
              }));
            }
            return;
          }
          next();
        });
      },
    },
    {
      name: 'github-commit-endpoint',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/github/commit' && req.method === 'POST') {
            try {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                try {
                  const { config, commitMessage } = JSON.parse(body);
                  
                  // Validate configuration
                  if (!config || !config.version) {
                    throw new Error('Invalid configuration data');
                  }
                  
                  // Write to config directory first
                  const configDir = path.join(process.cwd(), 'config');
                  if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                  }
                  
                  const configFile = path.join(configDir, '3d-config.json');
                  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
                  
                  // Simulate GitHub commit (would use GitHub API in production)
                  console.log('📝 Configuration saved locally');
                  console.log('📄 Commit message:', commitMessage || 'Update 3D configuration');
                  console.log('⚠️  Manual step: Commit and push this configuration to trigger deployment');
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Configuration prepared for commit',
                    action: 'Configuration saved locally. Manual git commit required.',
                    timestamp: new Date().toISOString()
                  }));
                } catch (error) {
                  console.error('❌ GitHub commit error:', error);
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                  }));
                }
              });
            } catch (error) {
              console.error('❌ GitHub commit error:', error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Internal server error' 
              }));
            }
            return;
          }
          next();
        });
      },
    },
    {
      name: 'copy-config-files',
      writeBundle() {
        // Copy config directory to dist
        const configSrc = path.join(process.cwd(), 'config');
        const configDest = path.join(process.cwd(), 'dist', 'config');
        
        if (fs.existsSync(configSrc)) {
          if (!fs.existsSync(configDest)) {
            fs.mkdirSync(configDest, { recursive: true });
          }
          
          const files = fs.readdirSync(configSrc);
          files.forEach(file => {
            const srcFile = path.join(configSrc, file);
            const destFile = path.join(configDest, file);
            fs.copyFileSync(srcFile, destFile);
            console.log(`Copied config file: ${file}`);
          });
        }
      }
    },
    {
      name: 'copy-modules-directory',
      writeBundle() {
        const modulesSrc = path.join(process.cwd(), 'src', 'modules');
        const modulesDest = path.join(process.cwd(), 'dist', 'src', 'modules');
        try {
          if (fs.existsSync(modulesSrc)) {
            const copyRecursive = (srcDir, destDir) => {
              if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
              const entries = fs.readdirSync(srcDir, { withFileTypes: true });
              for (const entry of entries) {
                const srcPath = path.join(srcDir, entry.name);
                const destPath = path.join(destDir, entry.name);
                if (entry.isDirectory()) {
                  copyRecursive(srcPath, destPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                  fs.copyFileSync(srcPath, destPath);
                  console.log(`[modules] Copied: ${path.relative(process.cwd(), destPath)}`);
                }
              }
            };
            copyRecursive(modulesSrc, modulesDest);
          }
        } catch (err) {
          console.warn('⚠️ Failed to copy modules directory:', err.message);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: getScriptEntries(),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    minify: true,
    sourcemap: false
  },
  base: './'
});
