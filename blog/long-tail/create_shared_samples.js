// create_shared_samples.js - Syncs samples from samples.json to shared_samples.js
const fs = require('fs');
const path = require('path');

// Read samples.json
const samplesPath = path.join(__dirname, 'samples.json');
const sharedPath = path.join(__dirname, 'shared_samples.js');

const { X, y } = JSON.parse(fs.readFileSync(samplesPath, 'utf8'));

// Format JS export
function jsArray(arr) {
    return JSON.stringify(arr, null, 2);
}

const jsContent = `// Auto-generated from samples.json. Do not edit directly.
export const X = ${jsArray(X)};
export const y = ${jsArray(y)};
`;

fs.writeFileSync(sharedPath, jsContent);
console.log('shared_samples.js updated from samples.json');
