// subplot_viz_mono.js
// Mono-plot for marginal conformal prediction visualization - exact copy of marginal subplot
import { generateGrid, predict_proba, colors, n_discr, generateData } from "./data_generation.js";
import { quantile } from "./math_tool.js";
import { n_samples, priors, means, covs, n_classes } from "./gaussian_params.js";
import { X, y } from "./shared_samples.js";
import { getPlotlyFontConfig } from './font_utils.js';

// --- Generate data and grid ---
const { x_grid, y_grid, gridPoints } = generateGrid();
// Harmonized: use shared hard-coded samples
const ZX = predict_proba(X, means, covs, priors);
const gridProbs = predict_proba(gridPoints, means, covs, priors);
const marginal_score = ZX.map((probs, idx) => probs[y[idx]]);

function scatterTraces() {
        return Array.from({ length: n_classes }, (_, i) => {
            const Xi = X.filter((_, idx) => y[idx] === i);
            return {
                x: Xi.map(d => d[0]),
                y: Xi.map(d => d[1]),
                mode: 'markers',
                type: 'scatter',
                marker: { color: colors[i], size: 4, opacity: 0.7 },
                name: `Class ${i+1} (samples)`,
                // legendgroup removed
                showlegend: true
            };
        });
}

function alphaContoursMarginal(alpha) {
    const threshold = quantile(marginal_score, alpha);
    let newTraces = [];
        for (let i = 0; i < n_classes; i++) {
            const z = gridProbs.map(p => p[i] >= threshold ? 1 : 0);
            const z2d = [];
            for (let yi = 0; yi < n_discr; yi++) z2d.push(z.slice(yi*n_discr, (yi+1)*n_discr));
            newTraces.push({
                x: x_grid, y: y_grid, z: z2d,
                type: 'contour', showscale: false,
                colorscale: [[0,'rgba(255,255,255,0)'], [1, colors[i]]],
                zsmooth: 'fast',
                opacity: 1,
                contours: { start:0, end:1, size:1 },
                line: { width:1, color:'black' },
                name: `Class ${i+1} (predicted)`,
                legendgroup: `predicted${i+1}`,
                showlegend: true,
                legendrank: i
            });
    }
    return newTraces;
}

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
        legendrank: 9999,
        legendgroup: 'bayesboundary',
    };
}

// Fixed axis limits for consistent visualization
const xMin = -6, xMax = 6;
const yMin = -4, yMax = 8;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('plots2mono');
    if (!container) return;
    container.style.width = 'auto';
    container.style.maxWidth = '650px';
    container.style.margin = '0 auto';

    function getResponsiveLayout() {
        const containerWidth = container.offsetWidth || plotsDiv.offsetWidth || 1200;
        const fontConfig = getPlotlyFontConfig();
        
        return {
            width: containerWidth,
            height: containerWidth/1.345, // Make it more square-like for better visibility
                xaxis: { scaleanchor: 'y', scaleratio: 1, range: [xMin, xMax], domain: [0, 1] },
            yaxis: { range: [yMin, yMax], domain: [0, 1.0] },
            margin: { t: 50, r: 20, b: 50, l: 50 },
            font: { family: fontConfig.family },
            legend: {
                    orientation: 'v',
                    x: 1.05,
                    y: 0.5,
                    xanchor: 'left',
                    yanchor: 'middle',
                    font: { size: Math.max(12, Math.round(containerWidth * 0.025)), family: fontConfig.family },
                    itemsizing: 'constant',
                    traceorder: 'normal',
                    ncol: 1
                },
            annotations: [
                {
                    text: 'Standard',
                    x: 0.5,
                    y: 1.03,
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

    let currentAlpha = 0.15;

    function createTraces(alpha) {
        // Use same trace creation as the right subplot in subplot_viz.js
        const scatterRight = scatterTraces().map((t, i) => ({
            ...t,
            xaxis:'x1',
            yaxis:'y1',
            legendgroup:`scatter${i}`,
            legendrank: 0
        }));
            // Add Class k (predicted) traces for prediction region, ensure legend entries
            const contourRight = alphaContoursMarginal(alpha).map((t, i) => ({
                ...t,
                xaxis:'x1',
                yaxis:'y1',
                legendgroup:`predicted${i+1}`,
                showlegend:true,
                name:`Class ${i+1} (predicted)`,
                legendrank: 1
            }));
            const sepRight = {...separationContour(), xaxis:'x1', yaxis:'y1', legendgroup:'bayesboundary', legendrank: 9999};

        return [
            ...scatterRight,
            ...contourRight,
            sepRight
        ];
    }

    function drawPlot() {
        Plotly.newPlot(container, createTraces(currentAlpha), getResponsiveLayout(), {responsive: true});
    }

    drawPlot();
    window.addEventListener('resize', drawPlot);

    // --- Slider ---
    const slider = document.getElementById('alphaSliderMono');
    const alphaDisplay = document.getElementById('alphaValueMono');
    slider.value = currentAlpha;
    if (alphaDisplay) alphaDisplay.textContent = currentAlpha.toFixed(3);
    
    slider.addEventListener('input', (e) => {
        const alpha = parseFloat(e.target.value);
        currentAlpha = alpha;
        if (alphaDisplay) alphaDisplay.textContent = alpha.toFixed(3);
        Plotly.react(container, createTraces(alpha), getResponsiveLayout(), {responsive: true});
    });
});
