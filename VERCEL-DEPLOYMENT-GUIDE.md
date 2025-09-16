# 🚀 Vercel Deployment Guide for Webflow Gunther Map

## Quick Setup Steps

### 1. **Install Vercel CLI** (if not already installed)
```bash
npm install -g vercel
```

### 2. **Login to Vercel**
```bash
vercel login
```

### 3. **Deploy Your Project**

**Option A: Auto-deploy from GitHub** ⭐ (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" 
3. Import your `webflow-gunther-map` repository
4. Vercel will auto-detect Vite configuration
5. Click "Deploy"

**Option B: Deploy from CLI**
```bash
# First time setup
vercel

# Production deployments
npm run deploy:vercel
```

## 🎯 **Enhanced Configuration Features**

### **Optimized Routes**
- `/test` → `Advanced-3D-Testing-Suite.html` (Your 3D testing suite)
- `/staging` → `webflow-staging-site-files/index.html` (Your staging environment)

### **CORS Headers** 
✅ Scripts accessible from any Webflow domain
✅ 3D models (GLB/GLTF) have proper CORS headers
✅ Public assets directory accessible

### **Caching Strategy**
- **Scripts**: 1 hour browser cache, 24 hour CDN cache (for updates)
- **3D Models**: 1 year cache with immutable flag (large files)
- **Other Assets**: Standard Vercel caching

### **Build Optimization**
- Framework: Vite (auto-detected)
- Build command: `npm run build` 
- Output directory: `dist`

## 🌐 **Your Deployed URLs Will Be**

After deployment, you'll get URLs like:
- **Main site**: `https://your-project-name.vercel.app`
- **Testing suite**: `https://your-project-name.vercel.app/test`
- **Staging**: `https://your-project-name.vercel.app/staging`
- **Scripts**: `https://your-project-name.vercel.app/src/scripts/simple-3d-loader.js`

## 🔧 **Integration with Webflow**

### **Update Your Script URLs**
In your Webflow custom code, update the script base URL:

```html
<!-- In Webflow Custom Code (Head) -->
<script>
  // For Vercel deployment, update this line:
  window.SCRIPT_BASE_URL = 'https://your-project-name.vercel.app/src/scripts';
  
  // Keep the router script
  (function() {
    const script = document.createElement('script');
    script.src = window.SCRIPT_BASE_URL + '/router.js';
    document.head.appendChild(script);
  })();
</script>
```

## 📊 **Advantages of Vercel vs GitHub Pages**

| Feature | GitHub Pages | Vercel |
|---------|--------------|--------|
| **Deploy Speed** | 2-5 minutes | 30 seconds |
| **CORS Headers** | Basic | Full control |
| **Caching** | GitHub CDN | Optimized edge caching |
| **Custom Domains** | Free | Free + advanced |
| **Analytics** | None | Built-in |
| **Preview Deployments** | No | Yes (per PR/branch) |

## 🚨 **Important Notes**

1. **Domain Change**: Update Webflow scripts to use your Vercel domain
2. **Environment Variables**: Can be set in Vercel dashboard for different configs
3. **Automatic Deploys**: Set up GitHub integration for auto-deploy on push
4. **Preview Deployments**: Each GitHub branch gets its own preview URL

## 🔍 **Testing Your Deployment**

After deployment, test these URLs:
```bash
# Your 3D testing suite
curl -I https://your-project-name.vercel.app/test

# Your script (should have CORS headers)
curl -I https://your-project-name.vercel.app/src/scripts/simple-3d-loader.js

# Your 3D model (should have CORS headers)  
curl -I https://your-project-name.vercel.app/public/Goetheviertel_250812_with-textures_webp25.glb
```

## 🎉 **Next Steps**

1. Deploy to Vercel using one of the methods above
2. Update your Webflow script URLs to point to Vercel
3. Test the 3D animation on your Webflow staging site
4. Enjoy faster deploys and better performance!

---

**Need help?** The Vercel configuration is optimized for your 3D mapping project with proper CORS, caching, and build settings.