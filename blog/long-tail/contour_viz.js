// contour_viz_sync.js
import { generateData, colors, mixture_pdf, predict_proba } from "./data_generation.js";

export function createDualScatter(containerId, means, covs, priors, n_samples, n_discr = 100) {
    const n_classes = means.length;

    // --- Generate sample data ---
    let X = [], y = [];
    for (let i = 0; i < n_classes; i++) {
        const count = Math.floor(n_samples * priors[i]);
        const Xi = generateData(count, means[i], covs[i]);
        X.push(...Xi);
        y.push(...Array(count).fill(i));
    }

    // --- Compute axis limits ---
    const allX = X.map(p => p[0]);
    const allY = X.map(p => p[1]);
    const xMin = Math.min(...allX);
    const xMax = Math.max(...allX);
    const yMin = Math.min(...allY);
    const yMax = Math.max(...allY);

    // --- Create grid for PDF evaluation ---
    const x_grid = Array.from({ length: n_discr }, (_, i) => xMin + (xMax - xMin) * i / (n_discr - 1));
    const y_grid = Array.from({ length: n_discr }, (_, i) => yMin + (yMax - yMin) * i / (n_discr - 1));
    const gridProbs = [];
    const gridPoints = [];
    for (let yi = 0; yi < n_discr; yi++) {
        for (let xi = 0; xi < n_discr; xi++) {
            const point = [x_grid[xi], y_grid[yi]];
            gridPoints.push(point);
            gridProbs.push(mixture_pdf(point, means, covs, priors));
        }
    }

    // --- Prepare traces for both subplots ---
    const traces = [];

    // Scatter traces for both subplots
    for (let i = 0; i < n_classes; i++) {
        const Xi = X.filter((_, idx) => y[idx] === i);
        // left subplot
        traces.push({
            x: Xi.map(d => d[0]),
            y: Xi.map(d => d[1]),
            mode: 'markers',
            type: 'scatter',
            marker: { color: colors[i], size: 4, opacity: 0.7 }, // Match subplot_viz.js opacity
            name: `Class ${i}`,
            xaxis: 'x1',
            yaxis: 'y1'
        });
        // right subplot
        traces.push({
            x: Xi.map(d => d[0]),
            y: Xi.map(d => d[1]),
            mode: 'markers',
            type: 'scatter',
            marker: { color: colors[i], size: 4, opacity: 0.7 }, // Match subplot_viz.js opacity
            name: `Class ${i}`,
            showlegend: false,
            xaxis: 'x2',
            yaxis: 'y2'
        });
    }

    // --- Add class prediction regions (right subplot only) ---
    // Get class probabilities for each grid point
    const classProbs = predict_proba(gridPoints, means, covs, priors);
    
    // Create argmax grid to show which class is predicted in each region
    const argGrid = classProbs.map(p => p.indexOf(Math.max(...p)));
    
    // Create individual contours for each class region (adapted from subplot_viz.js)
    for (let i = 0; i < n_classes; i++) {
        // Create binary mask: 1 where class i is predicted, 0 elsewhere
        const z = argGrid.map(pred => pred === i ? 1 : 0);
        const z2d = [];
        for (let yi = 0; yi < n_discr; yi++) {
            z2d.push(z.slice(yi * n_discr, (yi + 1) * n_discr));
        }
        
        // RIGHT subplot contour only
        traces.push({
            x: x_grid,
            y: y_grid,
            z: z2d,
            type: 'contour',
            showscale: false,
            colorscale: [[0, 'rgba(255,255,255,0)'], [1, colors[i]]], // Same as subplot_viz.js
            opacity: 1,
            contours: { start: 0, end: 1, size: 1 },
            line: { width: 1, color: 'black' },
            name: `Predicted ${i}`,
            legendgroup: `predicted-${i}`,
            showlegend: false, // Don't show in legend since scatter already shows classes
            xaxis: 'x2',
            yaxis: 'y2'
        });
    }
    
    // Create the zArgmax for the boundary contour
    const zArgmax = [];
    for (let yi = 0; yi < n_discr; yi++) {
        zArgmax.push(argGrid.slice(yi * n_discr, (yi + 1) * n_discr));
    }

    // --- Add Bayes classifier contour (right subplot only) ---
    // Add the decision boundaries (reuse zArgmax from above)
    
    // RIGHT subplot boundary only
    traces.push({
        x: x_grid,
        y: y_grid,
        z: zArgmax,
        type: 'contour',
        showscale: false,
        line: { color: 'red', width: 3 }, // Thicker red lines for better visibility
        contours: { 
            coloring: 'none', 
            showlines: true, 
            start: 0.5, 
            end: n_classes - 0.5, 
            size: 1 
        },
        name: 'Bayes Boundary',
        showlegend: true,
        xaxis: 'x2',
        yaxis: 'y2'
    });

    // --- Layout ---
    const layout = {
        grid: { rows: 1, columns: 2, pattern: 'independent' },
        width: 1200,
        height: 600,
        xaxis1: { title: 'X', scaleanchor: 'y1', scaleratio: 1, range: [xMin, xMax] },
        yaxis1: { title: 'Y', range: [yMin, yMax] },
        xaxis2: { title: 'X', scaleanchor: 'y2', scaleratio: 1, range: [xMin, xMax] },
        yaxis2: { title: 'Y', range: [yMin, yMax] }
    };

    const container = document.getElementById(containerId);
    let syncing = false;

    Plotly.newPlot(container, traces, layout).then(() => {
        // --- Sync all layout changes (zoom, pan, reset) ---
        container.on('plotly_relayout', (eventData) => {
            if (syncing) return;
            syncing = true;
            const update = {};
            Object.keys(eventData).forEach(key => {
                if (key.startsWith('xaxis')) {
                    update[key.replace('xaxis', 'xaxis2')] = eventData[key];
                    update[key.replace('xaxis', 'xaxis1')] = eventData[key];
                }
                if (key.startsWith('yaxis')) {
                    update[key.replace('yaxis', 'yaxis2')] = eventData[key];
                    update[key.replace('yaxis', 'yaxis1')] = eventData[key];
                }
            });
            Plotly.relayout(container, update).finally(() => { syncing = false; });
        });

        // --- Sync legend clicks ---
        container.on('plotly_legendclick', (event) => {
            const idx = event.curveNumber;
            const vis = event.data[idx].visible === true ? 'legendonly' : true;
            const pair = idx % 2 === 0 ? idx + 1 : idx - 1;
            Plotly.restyle(container, { visible: vis }, [idx, pair]);
            return false; // prevent default toggling
        });
    });
}
