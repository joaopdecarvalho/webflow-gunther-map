import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Get all script files dynamically
const getScriptEntries = () => {
  const entries = {
    router: './src/router.js'
  };
  
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
    host: '127.0.0.1',
    cors: {
      origin: [
        'http://localhost:*',
        'https://*.webflow.io',
        'https://*.webflow.com'
      ],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  },
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
