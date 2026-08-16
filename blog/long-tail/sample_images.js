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
        // Split species name into taxonomic part (genus + species) and author part
        // Match trailing parentheses like "Genus species (L.)"
        const parenMatch = speciesName.match(/^(.*?)(\s*\(.*\))$/);
        let formattedSpecies;
        
        if (parenMatch) {
          // Has parentheses: italicize the part before, keep author normal
          formattedSpecies = `<em>${parenMatch[1].trim()}</em>${parenMatch[2]}`;
        } else {
          // No parentheses: first two words are binomial (italicized), rest is author (normal)
          const parts = speciesName.trim().split(/\s+/);
          if (parts.length <= 2) {
            formattedSpecies = `<em>${speciesName}</em>`;
          } else {
            const binomial = parts.slice(0, 2).join(' ');
            const author = parts.slice(2).join(' ');
            formattedSpecies = `<em>${binomial}</em> ${author}`;
          }
        }
        
        figcaption.innerHTML = formattedSpecies;
        console.log(`[Sample Images] Updated figcaption with: ${formattedSpecies}`);
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
