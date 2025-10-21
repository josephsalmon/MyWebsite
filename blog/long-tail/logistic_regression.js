// subplot_viz_plotly.js
// Simple, responsive Plotly subplot visualization for Quarto
import { generateGrid, predict_proba, colors, n_discr, generateData } from "./data_generation.js";
import { quantile } from "./math_tool.js";
import { n_samples, priors, means, covs, n_classes } from "./gaussian_params.js";
import { X, y } from "./shared_samples.js";

// --- Generate data and grid ---
const { x_grid, y_grid, gridPoints } = generateGrid();
// Harmonized: use shared hard-coded samples
const ZX = predict_proba(X, means, covs, priors);

// Compute empirical estimates from the observed data X, y
// Empirical priors (class frequencies)
const priors_obs = [];
for (let i = 0; i < n_classes; i++) {
    const count = y.filter(label => label === i).length;
    priors_obs.push(count / y.length);
}

// Empirical means (class-wise sample means)
const means_obs = [];
for (let i = 0; i < n_classes; i++) {
    const class_data = X.filter((_, idx) => y[idx] === i);
    if (class_data.length > 0) {
        const mean_x = class_data.reduce((sum, point) => sum + point[0], 0) / class_data.length;
        const mean_y = class_data.reduce((sum, point) => sum + point[1], 0) / class_data.length;
        means_obs.push([mean_x, mean_y]);
    } else {
        means_obs.push([0, 0]); // fallback for empty classes
    }
}

// Empirical covariances (class-wise sample covariances)
const covs_obs = [];
for (let i = 0; i < n_classes; i++) {
    const class_data = X.filter((_, idx) => y[idx] === i);
    if (class_data.length > 1) {
        const mean = means_obs[i];
        let cov_xx = 0, cov_xy = 0, cov_yy = 0;
        for (const point of class_data) {
            const dx = point[0] - mean[0];
            const dy = point[1] - mean[1];
            cov_xx += dx * dx;
            cov_xy += dx * dy;
            cov_yy += dy * dy;
        }
        const n = class_data.length - 1; // sample covariance (Bessel's correction)
        covs_obs.push([[cov_xx / n, cov_xy / n], [cov_xy / n, cov_yy / n]]);
    } else {
        covs_obs.push([[1, 0], [0, 1]]); // fallback identity matrix
    }
}

const gridProbs = predict_proba(gridPoints, means_obs, covs_obs, priors_obs);
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
function alphaContoursFast(alpha) {
        let newTraces = [];
        for (let i = 0; i < n_classes; i++) {
            const classPoints = X.filter((_, idx) => y[idx] === i);
            const probs_class = predict_proba(classPoints, means, covs, priors).map(p => p[i]);
            const threshold = quantile(probs_class, alpha);
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
                // legendgroup removed
                showlegend: true
            });
        }
        return newTraces;
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
            name: `Contour ${i}`,
               // legendgroup removed
            showlegend: false
        });
    }
    return newTraces;
}


function alphaContoursMacro(alpha) {
    let newTraces = [];
    for (let i = 0; i < n_classes; i++) {
        // macro_score = ZX[idx, int(y[idx])] / priors[int(y[idx])]
        const macro_score = ZX.map((probs, idx) => probs[y[idx]] / priors[y[idx]]);
        // threshold = min(1, np.quantile(macro_score, alpha) * priors[i])
        const threshold = Math.min(1, quantile(macro_score, alpha) * priors[i]);
        // mask = predictions[:, i] >= threshold
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
            name: `Class ${i+1} (macro)`,
            showlegend: true
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
        name: 'Separation',
        showlegend: true,
        // legendgroup removed
    };
}
const allX = X.map(p => p[0]);
const allY = X.map(p => p[1]);
const xMin = Math.min(...allX), xMax = Math.max(...allX);
const yMin = Math.min(...allY), yMax = Math.max(...allY);

document.addEventListener('DOMContentLoaded', function() {
    const plotsDiv = document.getElementById('plots3');
    if (!plotsDiv) return;
    plotsDiv.style.display = 'flex';
    plotsDiv.style.flexDirection = 'column';
    plotsDiv.style.alignItems = 'center';
    plotsDiv.style.width = '100%';
    plotsDiv.style.maxWidth = '800px';
    plotsDiv.style.margin = '0 auto';
    const container = document.createElement('div');
    container.id = 'plotContainer';
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.height = 'auto';
    plotsDiv.appendChild(container);

    function getResponsiveLayout() {
        const containerWidth = container.offsetWidth || plotsDiv.offsetWidth || 700;
            return {
                grid: { rows: 1, columns: 3, pattern: 'independent', xgap: 0.25 },
                width: containerWidth,
                height: Math.round(containerWidth / 2) + 70,
                xaxis: { scaleanchor: 'y', scaleratio: 1, range: [xMin, xMax], domain: [0.00, 0.29] },
                xaxis2: { scaleanchor: 'y2', scaleratio: 1, range: [xMin, xMax], domain: [0.33, 0.62] },
                xaxis3: { scaleanchor: 'y3', scaleratio: 1, range: [xMin, xMax], domain: [0.66, 0.95] },
                yaxis: { range: [yMin, yMax], domain: [0, 1.0] },
                yaxis2: { range: [yMin, yMax], domain: [0, 1.0] },
                yaxis3: { range: [yMin, yMax], domain: [0, 1.0] },
                margin: { t: 50, r: 20, b: 120, l: 50 },
                font: { family: 'Inter, sans-serif' },
                legend: {
                    orientation: 'h',
                    x: 0.5,
                    y: -0.25,
                    xanchor: 'center',
                    yanchor: 'top',
                    font: { size: 15 },
                    itemsizing: 'constant',
                    traceorder: 'normal',
                    ncol: 3
                },
                annotations: [
                    {
                        text: 'Conditional',
                        x: 0.17,
                        y: 1.08,
                        xref: 'paper',
                        yref: 'paper',
                        showarrow: false,
                        font: { size: 16, family: 'Inter, sans-serif', color: '#222' },
                        xanchor: 'center',
                        yanchor: 'bottom'
                    },
                    {
                        text: 'Marginal',
                        x: 0.5,
                        y: 1.08,
                        xref: 'paper',
                        yref: 'paper',
                        showarrow: false,
                        font: { size: 16, family: 'Inter, sans-serif', color: '#222' },
                        xanchor: 'center',
                        yanchor: 'bottom'
                    },
                    {
                        text: 'Macro',
                        x: 0.83,
                        y: 1.08,
                        xref: 'paper',
                        yref: 'paper',
                        showarrow: false,
                        font: { size: 16, family: 'Inter, sans-serif', color: '#222' },
                        xanchor: 'center',
                        yanchor: 'bottom'
                    }
                ],
                uirevision: 'keep-state'
            };
    }
    let currentAlpha = 0.05;
    function createTraces(alpha) {
        // Left subplot: macro or conditional
        const scatterLeft = scatterTraces().map((t, i) => ({...t, xaxis:'x1', yaxis:'y1', legendgroup:`scatter${i}`}));
        const contourLeft = alphaContoursFast(alpha).map((t, i) => ({...t, xaxis:'x1', yaxis:'y1', legendgroup:`contour${i}`}));
        const sepLeft = {...separationContour(), xaxis:'x1', yaxis:'y1', legendgroup:'sep'};

        // Middle subplot: marginal
        const scatterMiddle = scatterTraces().map((t, i) => ({...t, xaxis:'x2', yaxis:'y2', legendgroup:`scatter${i}`, showlegend: false}));
        const contourMiddle = alphaContoursMarginal(alpha).map((t, i) => ({...t, xaxis:'x2', yaxis:'y2', legendgroup:`contour${i}`, showlegend: false}));
        const sepMiddle = {...separationContour(), xaxis:'x2', yaxis:'y2', legendgroup:'sep', showlegend: false};

        // Right subplot: duplicate marginal
        const scatterRight = scatterTraces().map((t, i) => ({...t, xaxis:'x3', yaxis:'y3', legendgroup:`scatter${i}`, showlegend: false}));
        const contourRight = alphaContoursMacro(alpha).map((t, i) => ({...t, xaxis:'x3', yaxis:'y3', legendgroup:`contour${i}`, showlegend: false}));
        const sepRight = {...separationContour(), xaxis:'x3', yaxis:'y3', legendgroup:'sep', showlegend: false};

        return [
            ...scatterLeft,
            ...contourLeft,
            sepLeft,
            ...scatterMiddle,
            ...contourMiddle,
            sepMiddle,
            ...scatterRight,
            ...contourRight,
            sepRight
        ];
    }
    function attachRelayoutHandler() {
        container.removeAllListeners && container.removeAllListeners('plotly_relayout');
        let syncing = false;
        container.on('plotly_relayout', (eventData) => {
            if (syncing) return;
            syncing = true;
            const update = {};
            // x-axis sync for all three subplots
            if (eventData['xaxis.range[0]'] !== undefined) {
                update['xaxis2.range'] = [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']];
                update['xaxis3.range'] = [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']];
            } else if (eventData['xaxis2.range[0]'] !== undefined) {
                update['xaxis.range'] = [eventData['xaxis2.range[0]'], eventData['xaxis2.range[1]']];
                update['xaxis3.range'] = [eventData['xaxis2.range[0]'], eventData['xaxis2.range[1]']];
            } else if (eventData['xaxis3.range[0]'] !== undefined) {
                update['xaxis.range'] = [eventData['xaxis3.range[0]'], eventData['xaxis3.range[1]']];
                update['xaxis2.range'] = [eventData['xaxis3.range[0]'], eventData['xaxis3.range[1]']];
            }
            // y-axis sync for all three subplots
            if (eventData['yaxis.range[0]'] !== undefined) {
                update['yaxis2.range'] = [eventData['yaxis.range[0]'], eventData['yaxis.range[1]']];
                update['yaxis3.range'] = [eventData['yaxis.range[0]'], eventData['yaxis.range[1]']];
            } else if (eventData['yaxis2.range[0]'] !== undefined) {
                update['yaxis.range'] = [eventData['yaxis2.range[0]'], eventData['yaxis2.range[1]']];
                update['yaxis3.range'] = [eventData['yaxis2.range[0]'], eventData['yaxis2.range[1]']];
            } else if (eventData['yaxis3.range[0]'] !== undefined) {
                update['yaxis.range'] = [eventData['yaxis3.range[0]'], eventData['yaxis3.range[1]']];
                update['yaxis2.range'] = [eventData['yaxis3.range[0]'], eventData['yaxis3.range[1]']];
            }
            if (Object.keys(update).length > 0) {
                Plotly.relayout(container, update).finally(() => { syncing = false; });
            } else {
                syncing = false;
            }
        });
    }
    function drawPlot() {
        Plotly.newPlot(container, createTraces(currentAlpha), getResponsiveLayout(), {responsive: true}).then(attachRelayoutHandler);
    }
    drawPlot();
    window.addEventListener('resize', drawPlot);
    // --- Slider ---
    const slider = document.getElementById('alphaSlider2');
    const alphaDisplay = document.getElementById('alphaValue2');
    slider.value = currentAlpha;
    if (alphaDisplay) alphaDisplay.textContent = currentAlpha.toFixed(3);
    slider.addEventListener('input', (e) => {
        const alpha = parseFloat(e.target.value);
        currentAlpha = alpha;
        if (alphaDisplay) alphaDisplay.textContent = alpha.toFixed(3);
        Plotly.react(container, createTraces(alpha), getResponsiveLayout(), {responsive: true}).then(attachRelayoutHandler);
    });
});
