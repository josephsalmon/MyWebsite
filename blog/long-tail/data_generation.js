// data_generation.js
import { cholesky2x2, randn_bm } from "./math_tool.js";

// export const colors = ["#E69F00", "#56B4E9", "#009E73"];
// export const colors = ["#1f77b4", "#ff7f0e", "#2ca02c"]; // blue, orange, green
export const colors = ["#1f77b4", "#179917ff", "#ff7f0e"]; // bleu, vert très foncé, orange
// export const colors = ["#1f77b4", "#003300", "#ff7f0e"]; // bleu, vert très très foncé, orange

export const n_discr = 230;
export const x_min = -6.1, x_max = 6.1, y_min = -4.1, y_max = 8.1;

export function generateGrid() {
    const x_grid = Array.from({length: n_discr}, (_, i) => x_min + i*(x_max-x_min)/(n_discr-1));
    const y_grid = Array.from({length: n_discr}, (_, i) => y_min + i*(y_max-y_min)/(n_discr-1));
    const gridPoints = [];
    for (let yy of y_grid) for (let xx of x_grid) gridPoints.push([xx, yy]);
    return { x_grid, y_grid, gridPoints };
}

export function generateData(n, mean, cov) {
    const L = cholesky2x2(cov);
    let X = [];
    // Use deterministic PRNG if seed is provided
    let random = Math.random;
    if (typeof seed === 'number') {
        // Import Mulberry32 and randn_bm_seeded
        // This assumes prng_tool.js is loaded as a module
        if (typeof window !== 'undefined' && window.mulberry32 && window.randn_bm_seeded) {
            random = window.mulberry32(seed);
        } else if (typeof require !== 'undefined') {
            const { mulberry32, randn_bm_seeded } = require('./prng_tool.js');
            random = mulberry32(seed);
        }
    }
    for (let i = 0; i < n; i++) {
        let z;
        if (typeof seed === 'number' && typeof window !== 'undefined' && window.randn_bm_seeded) {
            z = [window.randn_bm_seeded(random), window.randn_bm_seeded(random)];
        } else if (typeof seed === 'number' && typeof require !== 'undefined') {
            const { randn_bm_seeded } = require('./prng_tool.js');
            z = [randn_bm_seeded(random), randn_bm_seeded(random)];
        } else {
            z = [randn_bm(), randn_bm()];
        }
        X.push([
            L[0][0]*z[0] + L[0][1]*z[1] + mean[0],
            L[1][0]*z[0] + L[1][1]*z[1] + mean[1]
        ]);
    }
    return X;
}

export function predict_proba(points, means, covs, priors) {
    const n_classes = means.length;
    const probs = [];
    for (let p of points) {
        let scores = [];
        for (let i = 0; i < n_classes; i++) {
            const diff = [p[0]-means[i][0], p[1]-means[i][1]];
            const cov = covs[i];
            const det = cov[0][0]*cov[1][1] - cov[0][1]*cov[1][0];
            const inv = [
                [cov[1][1]/det, -cov[0][1]/det],
                [-cov[1][0]/det, cov[0][0]/det]
            ];
            const term = -0.5*(diff[0]*(inv[0][0]*diff[0] + inv[0][1]*diff[1]) +
                               diff[1]*(inv[1][0]*diff[0] + inv[1][1]*diff[1]));
            scores.push(term - 0.5*Math.log(det) + Math.log(priors[i]));
        }
        const maxScore = Math.max(...scores);
        const expScores = scores.map(s => Math.exp(s - maxScore));
        const sumExp = expScores.reduce((a,b)=>a+b,0);
        probs.push(expScores.map(e => e/sumExp));
    }
    return probs;
}


// compute the mixture density at given points
export function mixture_pdf(points, means, covs, priors) {
    const n_classes = means.length;
    const densities = [];

    for (let p of points) {
        let density = 0;
        for (let i = 0; i < n_classes; i++) {
            const diff = [p[0]-means[i][0], p[1]-means[i][1]];
            const cov = covs[i];
            const det = cov[0][0]*cov[1][1] - cov[0][1]*cov[1][0];
            const inv = [
                [ cov[1][1]/det, -cov[0][1]/det ],
                [ -cov[1][0]/det, cov[0][0]/det ]
            ];
            const exponent = -0.5 * (
                diff[0]*(inv[0][0]*diff[0] + inv[0][1]*diff[1]) +
                diff[1]*(inv[1][0]*diff[0] + inv[1][1]*diff[1])
            );
            const coef = 1 / (2 * Math.PI * Math.sqrt(det));
            density += priors[i] * coef * Math.exp(exponent);
        }
        densities.push(density);
    }
    return densities;
}