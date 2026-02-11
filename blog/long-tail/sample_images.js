// Initialize author overlays for sample images
import { loadMetadata, getAuthorName, getSpeciesName, createAuthorOverlay } from './metadata_loader.js';

async function initSampleImages() {
  console.log('[Sample Images] Starting initialization...');
  try {
    const metadata = await loadMetadata();
    console.log('[Sample Images] Metadata loaded successfully');
    
    const container = document.getElementById('sample-images-grid');
    
    if (!container) {
      console.warn('[Sample Images] Container not found!');
      return;
    }
    
    console.log('[Sample Images] Container found');
    const figures = container.querySelectorAll('figure');
    console.log(`[Sample Images] Found ${figures.length} figures`);
    
    figures.forEach((figure, idx) => {
      const img = figure.querySelector('img[data-hash]');
      const figcaption = figure.querySelector('figcaption');
      
      if (!img) {
        console.warn(`[Sample Images] No img in figure ${idx}`);
        return;
      }
      
      const hash = img.getAttribute('data-hash');
      console.log(`[Sample Images] Processing hash: ${hash}`);
      
      const authorName = getAuthorName(hash, metadata);
      const speciesName = getSpeciesName(hash, metadata);
      
      console.log(`[Sample Images] Hash: ${hash}, Species: ${speciesName}, Author: ${authorName}`);
      
      // Update species name in figcaption if available
      if (speciesName && figcaption) {
        figcaption.innerHTML = `<em>${speciesName}</em>`;
        console.log(`[Sample Images] Updated figcaption with: ${speciesName}`);
      }
      
      // Add author overlay if available
      if (authorName) {
        const overlay = createAuthorOverlay(authorName);
        figure.appendChild(overlay);
        console.log(`[Sample Images] Added author overlay: ${authorName}`);
      }
    });
    
    console.log('[Sample Images] Initialization complete!');
  } catch (error) {
    console.error('[Sample Images] Error during initialization:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  console.log('[Sample Images] Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initSampleImages);
} else {
  console.log('[Sample Images] DOM already loaded, initializing now...');
  initSampleImages();
}
