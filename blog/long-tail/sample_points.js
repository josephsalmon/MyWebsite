// sample_points.js
import { generateData } from "./data_generation.js";
import { n_samples, priors, means, covs, n_classes } from "./gaussian_params.js";

const seed = 0;
if (typeof window === 'undefined' || typeof window.seedrandom !== 'function') {
    throw new Error('seedrandom is not loaded. Make sure the CDN script is included before this module runs.');
}
const rng = window.seedrandom(seed);
let X = [], y = [];
for (let i = 0; i < n_classes; i++) {
    const count = Math.floor(n_samples * priors[i]);
    const Xi = generateData(count, means[i], covs[i], rng);
    X.push(...Xi);
    y.push(...Array(count).fill(i));
}
export { X, y };
