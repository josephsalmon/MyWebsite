import { generateGrid, generateData, cholesky2x2 } from "./data_generation.js";
import { n_samples, priors, means, covs, n_classes } from "./gaussian_params.js";

export function generateHarmonizedSamples(seed = 42) {
    const totalSamples = n_samples;
    const allSamples = generateData(totalSamples, [0,0], [[1,0],[0,1]], seed);
    let X = [], y = [];
    let idx = 0;
    for (let i = 0; i < n_classes; i++) {
        const count = Math.floor(n_samples * priors[i]);
        for (let j = 0; j < count; j++) {
            // Shift and transform each sample for its class
            const mean = means[i], cov = covs[i];
            const L = cholesky2x2(cov);
            const z = allSamples[idx++];
            X.push([
                L[0][0]*z[0] + L[0][1]*z[1] + mean[0],
                L[1][0]*z[0] + L[1][1]*z[1] + mean[1]
            ]);
            y.push(i);
        }
    }
    return { X, y };
}

// Compute axis limits
export function getAxisLimits(X, x_grid, y_grid) {
    const allX = [...X.map(p => p[0]), ...x_grid];
    const allY = [...X.map(p => p[1]), ...y_grid];
    return {
        xMin: Math.min(...allX),
        xMax: Math.max(...allX),
        yMin: Math.min(...allY),
        yMax: Math.max(...allY)
    };
}

// Gaussian PDF for contours
export function gaussian2D(xArr, yArr, mean = [0, 0], cov = [[1, 0], [0, 1]]) {
    const det = cov[0][0] * cov[1][1] - cov[0][1] * cov[1][0];
    const inv = [
        [cov[1][1] / det, -cov[0][1] / det],
        [-cov[1][0] / det, cov[0][0] / det],
    ];
    return yArr.map(yi =>
        xArr.map(xi => {
            const dx = xi - mean[0], dy = yi - mean[1];
            const exponent = -0.5 * (dx * inv[0][0] * dx + dx * inv[0][1] * dy + dy * inv[1][0] * dx + dy * inv[1][1] * dy);
            return (1 / (2 * Math.PI * Math.sqrt(det))) * Math.exp(exponent);
        })
    );
}

// Component contours
export function getComponentTraces(x_grid, y_grid) {
    return means.map((mean, i) => {
        const Z = gaussian2D(x_grid, y_grid, mean, covs[i]);
        const maxZ = Math.max(...Z.flat());
        return {
            x: x_grid, y: y_grid, z: Z,
            type: 'contour',
            contours: { coloring: 'fill', showlines: false, start: 0, end: maxZ, size: maxZ / 12 },
            colorscale: [[0, 'rgba(255,255,255,0)'], [1, colors[i]]],
            showscale: false,
            opacity: 1,
            name: `Class ${i + 1}`,
            legendgroup: 'class',
            showlegend: true
        };
    });
}

// Mixture contour
export function getMixtureTrace(x_grid, y_grid) {
    const Z_mixture = y_grid.map((_, yi) =>
        x_grid.map((_, xi) => priors.reduce((sum, p, k) => sum + p * gaussian2D([x_grid[xi]], [y_grid[yi]], means[k], covs[k])[0][0], 0))
    );
    const maxMixture = Math.max(...Z_mixture.flat());
    return {
        x: x_grid, y: y_grid, z: Z_mixture,
        type: 'contour',
        contours: { coloring: 'lines', showlines: true, start: 0, end: maxMixture, size: maxMixture / 12 },
        colorscale: [[0, 'darkgray'], [1, 'black']],
        line: { width: 2 },
        showscale: false,
        name: 'Mixture',
        legendgroup: 'theory',
        showlegend: true
    };
}

// Bayes boundary contour
export function getBayesContour(x_grid, y_grid) {
    const gridPoints = [];
    for (let yi = 0; yi < y_grid.length; yi++) {
        for (let xi = 0; xi < x_grid.length; xi++) {
            gridPoints.push([x_grid[xi], y_grid[yi]]);
        }
    }
    const probs = predict_proba(gridPoints, means, covs, priors);
    const z = [];
    for (let yi = 0; yi < y_grid.length; yi++) {
        const row = [];
        for (let xi = 0; xi < x_grid.length; xi++) {
            const idx = yi * x_grid.length + xi;
            const maxProb = Math.max(...probs[idx]);
            const decision = probs[idx].indexOf(maxProb);
            row.push(decision);
        }
        z.push(row);
    }
    return {
        x: x_grid,
        y: y_grid,
        z: z,
        type: 'contour',
        contours: {
            coloring: 'none',
            showlines: true,
            start: 0.5,
            end: n_classes - 0.5,
            size: 1
        },
        line: {
            width: 2,
            color: 'red'
        },
        showscale: false,
        name: 'Bayes Boundary',
        legendgroup: 'theory',
        showlegend: true
    };
}

// Prediction region contours for each class
export function getPredictionRegionTraces(x_grid, y_grid, gridProbs) {
    const argGrid = gridProbs.map(p => p.indexOf(Math.max(...p)));
    const regionTraces = [];
    for (let i = 0; i < n_classes; i++) {
        const z = argGrid.map(pred => pred === i ? 1 : 0);
        const z2d = [];
        for (let yi = 0; yi < n_discr; yi++) z2d.push(z.slice(yi*n_discr, (yi+1)*n_discr));
        regionTraces.push({
            x: x_grid, y: y_grid, z: z2d,
            type: 'contour', showscale: false,
            colorscale: [[0,'rgba(255,255,255,0)'], [1, colors[i]]],
            opacity: 1,
            contours: { start:0, end:1, size:1 },
            name: `Region ${i+1}`,
            legendgroup: `region-${i}`,
            showlegend: false
        });
    }
    return regionTraces;
}

// Scatter traces for each class
export function getScatterTraces(X, y) {
    return Array.from({ length: n_classes }, (_, i) => {
        const Xi = X.filter((_, idx) => y[idx] === i);
        return {
            x: Xi.map(d => d[0]),
            y: Xi.map(d => d[1]),
            mode: 'markers',
            type: 'scatter',
            marker: { color: colors[i], size: 4, opacity: 0.7 },
            name: `Class ${i+1} Points`,
            legendgroup: 'class',
            showlegend: true
        };
    });
}
