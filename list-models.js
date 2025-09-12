// Simple API endpoint to list all GLB and GLTF files in public directory
import { readdir } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
    try {
        const publicDir = join(process.cwd(), 'public');
        const files = await readdir(publicDir);
        
        // Filter for GLB and GLTF files
        const modelFiles = files.filter(file => 
            file.toLowerCase().endsWith('.glb') || 
            file.toLowerCase().endsWith('.gltf')
        );
        
        res.json({ 
            success: true, 
            models: modelFiles,
            count: modelFiles.length
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message,
            models: [],
            count: 0
        });
    }
}