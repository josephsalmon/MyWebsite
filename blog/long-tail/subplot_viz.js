// subplot_viz_plotly.js
// Generate barplot traces for class-conditional per class
function classConditionalBarTraces(alpha) {
    let traces = [];
    const xCenters = [0.2, 0.5, 0.8];
    // Compute coverage for each class and each barplot
    // Barplot 1: conditional, Barplot 2: marginal
    // Use alpha argument directly
    // Get predicted probabilities for all sample points
    let probsAll = predict_proba(X, means, covs, priors);
    // Conditional coverage
    let condCoverages = [];
    for (let k = 0; k < n_classes; k++) {
        const classIdxs = y.map((v, i) => v === k ? i : -1).filter(i => i !== -1);
        const classProbs = classIdxs.map(i => probsAll[i][k]);
        const threshold = quantile(classProbs, alpha);
        const covered = classIdxs.filter(i => probsAll[i][k] >= threshold);
        condCoverages.push(covered.length / classIdxs.length);
    }
    // Marginal coverage
    const marginalProbs = probsAll.map((p, i) => p[y[i]]);
    const marginalThreshold = quantile(marginalProbs, alpha);
    let margCoverages = [];
    for (let k = 0; k < n_classes; k++) {
        const classIdxs = y.map((v, i) => v === k ? i : -1).filter(i => i !== -1);
        const covered = classIdxs.filter(i => marginalProbs[i] >= marginalThreshold);
        margCoverages.push(covered.length / classIdxs.length);
    }
    // Assemble traces
    for (let classIdx = 0; classIdx < n_classes; classIdx++) {
        for (let colIdx = 0; colIdx < 2; colIdx++) {
            let yVals = [null, null, null];
            if (colIdx === 0) yVals[classIdx] = condCoverages[classIdx];
            if (colIdx === 1) yVals[classIdx] = margCoverages[classIdx];
            traces.push({
                x: xCenters,
                y: yVals,
                type: 'bar',
                marker: { color: colors[classIdx] },
                xaxis: `x${colIdx+3}`,
                yaxis: `y${colIdx+3}`,
                showlegend: (colIdx === 0),
                legendgroup: `class${classIdx+1}`,
                name: (colIdx === 0) ? `Class ${classIdx+1} (coverage)` : undefined,
                width: 0.2,
                offsetgroup: `class${classIdx+1}`,
            });
        }
    }
    return traces;
}
// Simple, responsive Plotly subplot visualization for Quarto
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
const xMin = -6.1, xMax = 6.1;
const yMin = -4.1, yMax = 8.1;

document.addEventListener('DOMContentLoaded', function() {
    const plotsDiv = document.getElementById('plots2');
    if (!plotsDiv) return;
    plotsDiv.style.display = 'flex';
    plotsDiv.style.flexDirection = 'column';
    plotsDiv.style.alignItems = 'center';
    plotsDiv.style.width = '100%';
    plotsDiv.style.maxWidth = '1000px';
    plotsDiv.style.margin = '0 auto';
    const container = document.createElement('div');
    container.id = 'plotContainer';
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.height = 'auto';
    plotsDiv.appendChild(container);

function getResponsiveLayout() {
    const containerWidth = container.offsetWidth || plotsDiv.offsetWidth || 700;
    const isMobile = containerWidth < 600;
    const isVeryNarrow = containerWidth < 400;

    const fontConfig = getPlotlyFontConfig();

    const leftDomain = isMobile ? [0.0, 0.47] : [0.0, 0.48];
    const rightDomain = isMobile ? [0.53, 1.0] : [0.52, 1.0];

    const topYDomain = isMobile ? [0.43, 0.96] : [0.35, 0.96];
    const bottomYDomain = isMobile ? [0.12, 0.27] : [0.08, 0.25];

    return {
        grid: {
            rows: 2,
            columns: 2,
            pattern: 'independent',
            xgap: isMobile ? 0.08 : 0.10,
            ygap: isMobile ? 0.04 : 0.06
        },

        width: containerWidth,
        height: Math.round(containerWidth * (isMobile ? 1.05 : 0.75))
            + (isMobile ? 100 : 40),
            // Top row: scatter/contour
            // Top row: scatter plots
        xaxis: {
            scaleanchor: 'y',
            scaleratio: 1,
            range: [xMin, xMax],
            domain: leftDomain,
            row: 1,
            col: 1,
            tickfont: { size: isMobile ? 9 : 12 }
        },

        xaxis2: {
            scaleanchor: 'y',
            scaleratio: 1,
            range: [xMin, xMax],
            domain: rightDomain,
            row: 1,
            col: 2,
            tickfont: { size: isMobile ? 9 : 12 }
        },

        yaxis: {
            range: [yMin, yMax],
            domain: topYDomain,
            row: 1,
            col: 1,
            tickfont: { size: isMobile ? 9 : 12 }
        },

        yaxis2: {
            range: [yMin, yMax],
            domain: topYDomain,
            showticklabels: false,
            showgrid: false,
            showline: false,
            row: 1,
            col: 2
        },

        // Bottom row: coverage bar charts
        xaxis3: {
            domain: leftDomain,
            row: 2,
            col: 1,
            range: [-0.1, 1.1],
            tickvals: [0.2, 0.5, 0.8],
            ticktext: ['Class 1', 'Class 2', 'Class 3'],
            tickfont: { size: isVeryNarrow ? 8 : isMobile ? 9 : 11 },
            automargin: true
        },

        xaxis4: {
            domain: rightDomain,
            row: 2,
            col: 2,
            range: [-0.1, 1.1],
            tickvals: [0.2, 0.5, 0.8],
            ticktext: ['Class 1', 'Class 2', 'Class 3'],
            tickfont: { size: isVeryNarrow ? 8 : isMobile ? 9 : 11 },
            automargin: true
        },

        yaxis3: {
            domain: bottomYDomain,
            range: [0, 1.02],
            row: 2,
            col: 1,
            title: {
                text: isMobile ? 'Coverage' : 'Class coverage',
                font: { size: isMobile ? 10 : 14 }
            },
            tickfont: { size: isMobile ? 8 : 10 },
            automargin: true
        },

        yaxis4: {
            domain: bottomYDomain,
            range: [0, 1.02],
            showticklabels: false,
            row: 2,
            col: 2
        },

        margin: {
            t: isMobile ? 38 : 45,
            r: isMobile ? 5 : 15,
            b: isMobile ? 65 : 75,
            l: isMobile ? 35 : 55,
            pad: 2
        },
            font: { family: fontConfig.family },
            legend: {
                orientation: 'h',
                x: 0.5,
                y: isVeryNarrow ? -0.20 : isMobile ? -0.16 : -0.12,
                xanchor: 'center',
                yanchor: 'top',
                font: {
                    size: isVeryNarrow ? 8 : isMobile ? 9 : 12,
                    family: fontConfig.family
                },
                itemsizing: 'constant',
                traceorder: 'normal',
                ncol: 3,
            },
            annotations: [
                {
                    text: 'Conditional',
                    x: 0.24,
                    y: 1,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { size: 16, family: fontConfig.family, color: '#222' },
                    xanchor: 'center',
                    yanchor: 'bottom'
                },
                {
                    text: 'Standard',
                    x: 0.76,
                    y: 1,
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
        // Top row: scatter/contour
        const scatterLeft = scatterTraces().map((t, i) => ({...t, xaxis:'x1', yaxis:'y1', legendgroup:`scatter${i}`}));
        const contourLeft = alphaContoursFast(alpha).map((t, i) => ({...t, xaxis:'x1', yaxis:'y1', legendgroup:`contour${i}`}));
        const sepLeft = {...separationContour(), xaxis:'x1', yaxis:'y1', legendgroup:'sep'};

        const scatterRight = scatterTraces().map((t, i) => ({...t, xaxis:'x2', yaxis:'y2', legendgroup:`scatter${i}`, showlegend:false}));
        const contourRight = alphaContoursMarginal(alpha).map((t, i) => ({...t, xaxis:'x2', yaxis:'y2', legendgroup:`contour${i}`, showlegend:false}));
        const sepRight = {...separationContour(), xaxis:'x2', yaxis:'y2', legendgroup:'sep', showlegend:false};

        // Bottom row: barplots
        const barTraces = classConditionalBarTraces(alpha);

        // Add 1-alpha horizontal line to each lower barplot
        const yLine = 1 - alpha;
        const lineTraces = [
            {
                x: [0, 1],
                y: [yLine, yLine],
                type: 'scatter',
                mode: 'lines',
                line: { color: 'black', width: 2, dash: 'dot' },
                xaxis: 'x3',
                yaxis: 'y3',
                showlegend: true,
                legendgroup: 'onealpha',
                name: '1 - α',
                hoverinfo: 'none'
            },
            {
                x: [0, 1],
                y: [yLine, yLine],
                type: 'scatter',
                mode: 'lines',
                line: { color: 'black', width: 2, dash: 'dot' },
                xaxis: 'x4',
                yaxis: 'y4',
                showlegend: false,
                legendgroup: 'onealpha',
                name: '1 - α',
                hoverinfo: 'none'
            }
        ];

        return [
            ...scatterLeft,
            ...contourLeft,
            sepLeft,
            ...scatterRight,
            ...contourRight,
            sepRight,
            ...barTraces,
            ...lineTraces
        ];
    }
    function drawPlot() {
        Plotly.newPlot(container, createTraces(currentAlpha), getResponsiveLayout(), {responsive: true}).then(() => {
            // --- Zoom/pan synchronization ---
            container.removeAllListeners && container.removeAllListeners('plotly_relayout');
            let syncing = false;
            container.on('plotly_relayout', (eventData) => {
                if (syncing) return;
                syncing = true;
                const update = {};
                // Top row sync
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
                // Bottom row sync
                if (eventData['xaxis3.range[0]'] !== undefined) {
                    update['xaxis4.range'] = [eventData['xaxis3.range[0]'], eventData['xaxis3.range[1]']];
                } else if (eventData['xaxis4.range[0]'] !== undefined) {
                    update['xaxis3.range'] = [eventData['xaxis4.range[0]'], eventData['xaxis4.range[1]']];
                }
                if (eventData['yaxis3.range[0]'] !== undefined) {
                    update['yaxis4.range'] = [eventData['yaxis3.range[0]'], eventData['yaxis3.range[1]']];
                } else if (eventData['yaxis4.range[0]'] !== undefined) {
                    update['yaxis3.range'] = [eventData['yaxis4.range[0]'], eventData['yaxis4.range[1]']];
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
    window.addEventListener('resize', drawPlot);
    // --- Slider ---
    const slider = document.getElementById('alphaSlider');
    const alphaDisplay = document.getElementById('alphaValue');
    slider.value = currentAlpha;
    if (alphaDisplay) alphaDisplay.textContent = currentAlpha.toFixed(3);
    slider.addEventListener('input', (e) => {
        const alpha = parseFloat(e.target.value);
        currentAlpha = alpha;
        if (alphaDisplay) alphaDisplay.textContent = alpha.toFixed(3);
        Plotly.react(container, createTraces(alpha), getResponsiveLayout(), {responsive: true});
    });
});
