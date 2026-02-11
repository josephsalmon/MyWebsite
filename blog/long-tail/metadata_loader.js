// Shared metadata loader for PlantNet-300K
// Loads CSV and authors data once and caches it

let metadataCache = null;

/**
 * Load and parse PlantNet-300K metadata
 * Returns: { hashToAuthorId: Map, authorsData: Object }
 */
export async function loadMetadata() {
  // Return cached data if available
  if (metadataCache) {
    console.log('[Metadata] Returning cached data');
    return metadataCache;
  }

  console.log('[Metadata] Loading metadata for the first time...');
  try {
    // Fetch CSV and authors data in parallel
    console.log('[Metadata] Fetching CSV and JSON...');
    const [csvResponse, authorsResponse] = await Promise.all([
      fetch(new URL('tiny_plantnet300k_metadata.csv', import.meta.url)),
      fetch(new URL('Metadata/authors.json', import.meta.url))
    ]);
    
    console.log(`[Metadata] CSV response: ${csvResponse.ok ? 'OK' : 'FAILED'} (${csvResponse.status})`);
    console.log(`[Metadata] Authors response: ${authorsResponse.ok ? 'OK' : 'FAILED'} (${authorsResponse.status})`);
    
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status}`);
    }
    
    const csvText = await csvResponse.text();
    const authorsData = authorsResponse.ok ? await authorsResponse.json() : {};
    
    console.log(`[Metadata] CSV loaded: ${csvText.split('\n').length} lines`);
    console.log(`[Metadata] Authors loaded: ${Object.keys(authorsData).length} entries`);
    
    // Parse CSV to build hash -> metadata map
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const imageIndex = headers.indexOf('image');
    const speciesIndex = headers.indexOf('species');
    
    console.log(`[Metadata] CSV headers: ${headers.join(', ')}`);
    console.log(`[Metadata] Column indices - image: ${imageIndex}, species: ${speciesIndex}`);
    
    const hashToSpecies = new Map();
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const imagePath = values[imageIndex];
      const species = values[speciesIndex];
      
      if (imagePath) {
        // Extract hash from path like "tiny_plantnet300k_v2/1/9cf6b7997a95b2bab8d840e70397b98dc8321106.jpg"
        const hash = imagePath.split('/').pop().replace('.jpg', '');
        
        if (species) {
          hashToSpecies.set(hash, species);
        }
      }
    }
    
    console.log(`[Metadata] Parsed ${hashToSpecies.size} species mappings`);
    console.log(`[Metadata] Authors data has ${Object.keys(authorsData).length} entries`);
    
    // Cache the result - authorsData already maps hash -> {author: "name"}
    metadataCache = { hashToSpecies, authorsData };
    return metadataCache;
    
  } catch (error) {
    console.error('Error loading metadata:', error);
    return { hashToSpecies: new Map(), authorsData: {} };
  }
}

/**
 * Get author name for an image hash
 * @param {string} hash - Image hash
 * @param {Object} metadata - Result from loadMetadata()
 * @returns {string|null} - Author name or null
 */
export function getAuthorName(hash, metadata) {
  const { authorsData } = metadata;
  
  if (authorsData[hash] && authorsData[hash].author) {
    return authorsData[hash].author;
  }
  
  return null;
}

/**
 * Get species name for an image hash
 * @param {string} hash - Image hash
 * @param {Object} metadata - Result from loadMetadata()
 * @returns {string|null} - Species name or null
 */
export function getSpeciesName(hash, metadata) {
  const { hashToSpecies } = metadata;
  return hashToSpecies.get(hash) || null;
}

/**
 * Create an author overlay element
 * @param {string} authorName - Name of the author
 * @returns {HTMLElement} - Overlay div element
 */
export function createAuthorOverlay(authorName) {
  const overlay = document.createElement('div');
  overlay.className = 'img-author-overlay';
  overlay.textContent = `© ${authorName}`;
  overlay.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.6);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    pointer-events: none;
    z-index: 10;
  `;
  return overlay;
}
