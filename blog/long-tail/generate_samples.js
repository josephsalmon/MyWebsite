// generate_samples.js - Generate samples and save to JSON
import seedrandom from 'seedrandom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Parameters: load from gaussian_params.js
import { n_samples, priors, means, covs } from './gaussian_params.js';


const n_classes = means.length;

// Cholesky for 2x2
function cholesky2x2(cov) {
    const a = cov[0][0], b = cov[0][1], c = cov[1][0], d = cov[1][1];
    const l11 = Math.sqrt(a);
    const l21 = c / l11;
    const l22 = Math.sqrt(d - l21 * l21);
    return [[l11, 0], [l21, l22]];
}

// Generate data
function generateData(n, mean, cov, rng) {
    const L = cholesky2x2(cov);
    let X = [];
    function randn_bm_seeded() {
        let u = 0, v = 0;
        while(u === 0) u = rng();
        while(v === 0) v = rng();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    for (let i = 0; i < n; i++) {
        const z = [randn_bm_seeded(), randn_bm_seeded()];
        X.push([
            L[0][0]*z[0] + L[0][1]*z[1] + mean[0],
            L[1][0]*z[0] + L[1][1]*z[1] + mean[1]
        ]);
    }
    return X;
}

// Generate samples
const seed = 0;
const rng = seedrandom(seed);
let X = [], y = [];
for (let i = 0; i < n_classes; i++) {
    const count = Math.floor(n_samples * priors[i]);
    const Xi = generateData(count, means[i], covs[i], rng);
    X.push(...Xi);
    y.push(...Array(count).fill(i));
}

// Save to JSON

// Save to samples.json
fs.writeFileSync('samples.json', JSON.stringify({X, y}));
console.log('Samples saved to samples.json');

// Also update shared_samples.js for ES module import
const sharedPath = path.join(__dirname, 'shared_samples.js');
function jsArray(arr) {
    return JSON.stringify(arr, null, 2);
}
const jsContent = `// Auto-generated from samples.json. Do not edit directly.\nexport const X = ${jsArray(X)};\nexport const y = ${jsArray(y)};\n`;
fs.writeFileSync(sharedPath, jsContent);
console.log('shared_samples.js updated from samples.json');

// Also export parameters to gaussian_params.json for Quarto integration
const params = { n_samples, priors, means, covs };
const paramsPath = path.join(__dirname, 'gaussian_params.json');
fs.writeFileSync(paramsPath, JSON.stringify(params, null, 2));
console.log('gaussian_params.json updated for Quarto integration');


// Also create gaussian_params_description.qmd for Quarto integration
const qmdPath = path.join(__dirname, 'gaussian_params_description.qmd');
const latex = `\n\nWe generate $n = ${n_samples}$ samples from a mixture of $K=3$ Gaussians:\n\n- Class priors:\n$\\pi_1 = ${priors[0]},\\ \\pi_2 = ${priors[1]},\\ \\pi_3 = ${priors[2]}$\n\n- Means:\n$\\mu_1 = \\begin{pmatrix} ${means[0][0]} \\ ${means[0][1]} \\end{pmatrix},\\\n\\mu_2 = \\begin{pmatrix} ${means[1][0]} \\ ${means[1][1]} \\end{pmatrix},\\\n\\mu_3 = \\begin{pmatrix} ${means[2][0]} \\ ${means[2][1]} \\end{pmatrix}$\n\n- Covariances:\n$\\Sigma_1 = \\begin{pmatrix} ${covs[0][0][0]} & ${covs[0][0][1]} \\\\ ${covs[0][1][0]} & ${covs[0][1][1]} \\end{pmatrix},\\\n\\Sigma_2 = \\begin{pmatrix} ${covs[1][0][0]} & ${covs[1][0][1]} \\\\ ${covs[1][1][0]} & ${covs[1][1][1]} \\end{pmatrix},\\\n\\Sigma_3 = \\begin{pmatrix} ${covs[2][0][0]} & ${covs[2][0][1]} \\\\ ${covs[2][1][0]} & ${covs[2][1][1]} \\end{pmatrix}$\n`;
fs.writeFileSync(qmdPath, latex);
console.log('gaussian_params_description.qmd updated for Quarto integration');
