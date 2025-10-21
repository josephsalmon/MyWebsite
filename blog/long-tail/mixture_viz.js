// mixture_viz2.js
// Based on subplot_viz.js, adapted for: left = contour plot, right = scatter plot with colored region
import { generateGrid, predict_proba, colors, n_discr, generateData } from "./data_generation.js";
import { n_samples, priors, means, covs, n_classes } from "./gaussian_params.js";
import { X, y } from "./shared_samples.js";
import { getPlotlyFontConfig } from './font_utils.js';

const { x_grid, y_grid, gridPoints } = generateGrid();

// y is now imported from shared_samples.js
const gridProbs = predict_proba(gridPoints, means, covs, priors);

// --- Contour plot for left subplot ---
// --- Left subplot: use mixture_viz.js content ---
// Re-implement component contours, mixture contour, Bayes boundary
function gaussian2D(xArr, yArr, mean = [0, 0], cov = [[1, 0], [0, 1]]) {
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
function getComponentTraces() {
    return means.map((mean, i) => {
        const Z = gaussian2D(x_grid, y_grid, mean, covs[i]);
        const maxZ = Math.max(...Z.flat());
        return {
            x: x_grid, y: y_grid, z: Z,
            type: 'contour',
            contours: { coloring: 'fill', showlines: false, start: 0, end: maxZ, size: maxZ / 12 },
            colorscale: [[0, 'rgba(255,255,255,0)'], [1, colors[i]]],
            zsmooth: 'best',
            showscale: false,
            opacity: 1,
            name: `Class ${i + 1} (density)`,
            legendgroup: `class${i+1}`,
            showlegend: true,
            xaxis: 'x1',
            yaxis: 'y1',
        };
    });
}

// Mixture contour
function gaussian2D_single(x, y, mean = [0, 0], cov = [[1, 0], [0, 1]]) {
    const det = cov[0][0] * cov[1][1] - cov[0][1] * cov[1][0];
    const inv = [
        [cov[1][1] / det, -cov[0][1] / det],
        [-cov[1][0] / det, cov[0][0] / det],
    ];
    const dx = x - mean[0], dy = y - mean[1];
    const exponent = -0.5 * (dx * inv[0][0] * dx + dx * inv[0][1] * dy + dy * inv[1][0] * dx + dy * inv[1][1] * dy);
    return (1 / (2 * Math.PI * Math.sqrt(det))) * Math.exp(exponent);
}

function getMixtureTrace() {
    const Z_mixture = [];
    for (let yi = 0; yi < n_discr; yi++) {
        const row = [];
        for (let xi = 0; xi < n_discr; xi++) {
            let sum = 0;
            for (let k = 0; k < priors.length; k++) {
                sum += priors[k] * gaussian2D_single(x_grid[xi], y_grid[yi], means[k], covs[k]);
            }
            row.push(sum);
        }
        Z_mixture.push(row);
    }
    const maxMixture = Math.max(...Z_mixture.flat());
    return {
        x: x_grid, y: y_grid, z: Z_mixture,
        type: 'contour',
        contours: { coloring: 'lines', showlines: true, start: 0, end: maxMixture, size: maxMixture / 12 },
        colorscale: [[0, '#cccccc'], [1, 'black']],
        zsmooth: 'best',
        line: { width: 2 },
        showscale: false,
        name: 'Mixture density',
        opacity: 0.5,
        // legendgroup: 'theory',
        // legendrank: 100,
        showlegend: true,
        xaxis: 'x1',
        yaxis: 'y1',
    };
}

// Bayes boundary
function separationContour() {
    const argGrid = gridProbs.map(p => p.indexOf(Math.max(...p)));
    const zArgmax = [];
    for (let yi=0; yi<n_discr; yi++) zArgmax.push(argGrid.slice(yi*n_discr,(yi+1)*n_discr));
    return {
        x: x_grid, y: y_grid, z: zArgmax,
        type: 'contour', showscale: false,
        line: { color:'red', width:2 },
        contours: { coloring:'none', showlines:true, start:0.5, end:n_classes-0.5, size:1 },
        name: 'Bayes boundary',
        showlegend: true,
        legendgroup: 'separation'
    };
}

function leftSubplotTraces() {
    const mixtureTrace = getMixtureTrace();
    const separationTraceLeft = { ...separationContour(), xaxis: 'x1', yaxis: 'y1', legendgroup: 'separation', name: 'Bayes boundary', showlegend: true };
    return [
        ...getComponentTraces(),
        mixtureTrace,
        separationTraceLeft
    ];
}

// --- Scatter plot with colored region for right subplot ---
function scatterRegionTraces() {
    // Prediction regions
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
            legendgroup: `class${i+1}`,
            showlegend: false,
            xaxis: 'x2', yaxis: 'y2'
        });
    }
    // Scatter points
    const scatterTraces = Array.from({ length: n_classes }, (_, i) => {
        const Xi = X.filter((_, idx) => y[idx] === i);
        return {
            x: Xi.map(d => d[0]),
            y: Xi.map(d => d[1]),
            mode: 'markers',
            type: 'scatter',
            marker: { color: colors[i], size: 4, opacity: 0.7 },
            name: `Class ${i+1} (samples)`,
            // legendgroup: 'class',
            // legendrank: i,
            showlegend: true,
            xaxis: 'x2', yaxis: 'y2'
        };
    });
    // Bayes boundary for right subplot
    const bayesContourRight = {
        ...separationContour(),
        xaxis: 'x2',
        yaxis: 'y2',
        legendgroup: 'separation',
        name: 'Separation',
        showlegend: false
    };
    return [...regionTraces, ...scatterTraces, bayesContourRight];
}

// --- Fixed axis limits for consistent visualization ---
const xMin = -6.1, xMax = 6.1;
const yMin = -4.1, yMax = 8.1;

document.addEventListener('DOMContentLoaded', function() {
    const plotsDiv = document.getElementById('plots');
    if (!plotsDiv) return;
    plotsDiv.style.display = 'flex';
    plotsDiv.style.flexDirection = 'column';
    plotsDiv.style.alignItems = 'center';
    plotsDiv.style.width = '100%';
    plotsDiv.style.maxWidth = '700px';
    plotsDiv.style.margin = '0 auto';
    const container = document.createElement('div');
    container.id = 'plotContainer';
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.height = 'auto';
    plotsDiv.appendChild(container);

    function getResponsiveLayout() {
        const containerWidth = container.offsetWidth || plotsDiv.offsetWidth || 700;
        const fontConfig = getPlotlyFontConfig();
        
        return {
            grid: { rows: 1, columns: 2, pattern: 'independent', xgap: 0.10 },
            width: containerWidth,
            height: Math.round(containerWidth / 2) + 70,
            xaxis: { scaleanchor: 'y', scaleratio: 1, range: [xMin, xMax], domain: [0.03, 0.46] },
            xaxis2: { scaleanchor: 'y2', scaleratio: 1, range: [xMin, xMax], domain: [0.54, 0.95] },
            yaxis: { range: [yMin, yMax], domain: [0, 1.0] },
            yaxis2: { range: [yMin, yMax], domain: [0, 1.0] },
            margin: { t: 50, r: 20, b: 120, l: 50 },
            font: { family: fontConfig.family },
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.25,
                xanchor: 'center',
                yanchor: 'top',
                font: { size: 15, family: fontConfig.family },
                itemsizing: 'constant',
                traceorder: 'normal',
                ncol: 3
            },
            annotations: [
                {
                    text: 'Density and level sets',
                    x: 0.27,
                    y: 1.08,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { size: 16, family: fontConfig.family, color: '#222' },
                    xanchor: 'center',
                    yanchor: 'bottom'
                },
                {
                    text: 'Samples and (Bayes) classifier',
                    x: 0.73,
                    y: 1.08,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { size: 16, family: fontConfig.family, color: '#222' },
                    xanchor: 'center',
                    yanchor: 'bottom'
                }
            ],
            uirevision: 'keep-state'
        };
    }
    function createTraces() {
        // Get left subplot traces, move Mixture and Separation to the end for legend order
        const leftTraces = leftSubplotTraces();
        // Mixture and Separation are last two traces
        const leftMain = leftTraces.slice(0, leftTraces.length - 2);
        const leftLast = leftTraces.slice(-2);
        return [
            ...leftMain,
            ...scatterRegionTraces(),
            ...leftLast
        ];
    }
    function drawPlot() {
        Plotly.newPlot(container, createTraces(), getResponsiveLayout(), {responsive: true}).then(() => {
            // --- Zoom/pan synchronization ---
            container.removeAllListeners && container.removeAllListeners('plotly_relayout');
            let syncing = false;
            container.on('plotly_relayout', (eventData) => {
                if (syncing) return;
                syncing = true;
                const update = {};
                if (eventData['xaxis.range[0]'] !== undefined) {
                    update['xaxis2.range'] = [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']];
                } else if (eventData['xaxis2.range[0]'] !== undefined) {
                    update['xaxis.range'] = [eventData['xaxis2.range[0]'], eventData['xaxis2.range[1]']];
                }
                if (eventData['yaxis.range[0]'] !== undefined) {
                    update['yaxis2.range'] = [eventData['yaxis.range[0]'], eventData['yaxis.range[1]']];
                } else if (eventData['yaxis2.range[0]'] !== undefined) {
                    update['yaxis.range'] = [eventData['yaxis2.range[0]'], eventData['yaxis2.range[1]']];
                }
                if (Object.keys(update).length > 0) {
                    Plotly.relayout(container, update).finally(() => { syncing = false; });
                } else {
                    syncing = false;
                }
            });
        });
    }
    drawPlot();
    // Debounce resize event to avoid stack overflow
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(drawPlot, 200);
    });
});
