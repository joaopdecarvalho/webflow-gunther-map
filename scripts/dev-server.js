#!/usr/bin/env node
/**
 * Smart Dev Server Starter
 * Checks if dev server is already running before starting a new one
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkPortInUse(port) {
  try {
    // Use netstat to check if port is in use
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    return stdout.trim() !== '';
  } catch (error) {
    return false;
  }
}

async function checkServerResponse(port) {
  try {
    const response = await fetch(`http://localhost:${port}/`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function startDevServer() {
  console.log('🔍 Checking if development server is already running...');
  
  // Check ports 8080, 8081, 8082
  const portsToCheck = [8080, 8081, 8082];
  let runningPort = null;
  
  for (const port of portsToCheck) {
    const isInUse = await checkPortInUse(port);
    if (isInUse) {
      const isViteServer = await checkServerResponse(port);
      if (isViteServer) {
        runningPort = port;
        break;
      }
    }
  }
  
  if (runningPort) {
    console.log(`✅ Development server is already running on port ${runningPort}`);
    console.log(`🌐 Test interface: http://localhost:${runningPort}/Advanced-3D-Testing-Suite.html`);
    console.log(`📁 Main page: http://localhost:${runningPort}/`);
    console.log('');
    console.log('💡 To stop the server, press Ctrl+C in the terminal where it\'s running');
    return;
  }
  
  console.log('🚀 Starting new development server...');
  
  // Start Vite dev server
  const vite = exec('vite');
  
  vite.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  vite.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  vite.on('close', (code) => {
    console.log(`Development server exited with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping development server...');
    vite.kill();
    process.exit(0);
  });
}

startDevServer().catch(console.error);