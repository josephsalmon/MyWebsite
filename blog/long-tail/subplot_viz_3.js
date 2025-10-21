// Generate barplot traces for class-conditional per class
function classConditionalBarTraces(alpha) {
    // Example: use empirical priors as bar heights
    // You can replace with other class-conditional metrics if needed
    // Create traces for each class, linking them across all three barplots
    let traces = [];
    const xCenters = [0.2, 0.5, 0.8];
    // Compute coverage for each class and each barplot
    // Barplot 1: conditional, Barplot 2: marginal, Barplot 3: macro
    // Use alpha argument directly
    // Get predicted probabilities for all sample points
    const params = getCurrentParams();
    let probsAll;
    if (params.type === 'logistic') {
        probsAll = predictLogistic(X, params.weights);
    } else {
        probsAll = predict_proba(X, params.means, params.covs, params.priors);
    }
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
    // Macro coverage
    let macroCoverages = [];
    let currentPriors = params.type === 'logistic' ? priors_obs : params.priors;
    for (let k = 0; k < n_classes; k++) {
        const macroScores = probsAll.map((p, i) => p[y[i]] / currentPriors[y[i]]);
        const macroThreshold = Math.min(1, quantile(macroScores, alpha) * currentPriors[k]);
        const classIdxs = y.map((v, i) => v === k ? i : -1).filter(i => i !== -1);
        const covered = classIdxs.filter(i => probsAll[i][k] >= macroThreshold);
        macroCoverages.push(covered.length / classIdxs.length);
    }
    // Assemble traces
    for (let classIdx = 0; classIdx < n_classes; classIdx++) {
        for (let colIdx = 0; colIdx < 3; colIdx++) {
            let yVals = [null, null, null];
            if (colIdx === 0) yVals[classIdx] = condCoverages[classIdx];
            if (colIdx === 1) yVals[classIdx] = margCoverages[classIdx];
            if (colIdx === 2) yVals[classIdx] = macroCoverages[classIdx];
            traces.push({
                x: xCenters,
                y: yVals,
                type: 'bar',
                marker: { color: colors[classIdx] },
                xaxis: `x${colIdx+4}`,
                yaxis: `y${colIdx+4}`,
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

// State variable to track model type: 'theoretical', 'empirical', 'logistic'
let modelType = 'theoretical';

// Matrix operations for Newton's method
function matrixInverse2x2(matrix) {
    const [[a, b], [c, d]] = matrix;
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-10) return null; // Singular matrix
    return [[d / det, -b / det], [-c / det, a / det]];
}

function matrixInverse(matrix) {
    const n = matrix.length;
    if (n === 2) return matrixInverse2x2(matrix);

    // For larger matrices, use Gauss-Jordan elimination
    const augmented = matrix.map((row, i) => [...row, ...new Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

        if (Math.abs(augmented[i][i]) < 1e-10) return null; // Singular

        // Make diagonal 1
        const pivot = augmented[i][i];
        for (let j = 0; j < 2 * n; j++) {
            augmented[i][j] /= pivot;
        }

        // Eliminate column
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = augmented[k][i];
                for (let j = 0; j < 2 * n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
    }

    return augmented.map(row => row.slice(n));
}

function matrixVectorMultiply(matrix, vector) {
    return matrix.map(row => row.reduce((sum, val, j) => sum + val * vector[j], 0));
}

// Multinomial logistic regression using Newton's method with L2 regularization
function logisticRegression(X, y, maxIterations = 20, lambda = 0.001) {
    const n_samples = X.length;
    const n_features = X[0].length;
    const n_classes = Math.max(...y) + 1;

    // Initialize weights matrix: (n_classes-1) x (n_features + 1)
    // We use n_classes-1 because one class (typically the last) serves as reference
    let weights = [];
    for (let c = 0; c < n_classes - 1; c++) {
        weights.push(new Array(n_features + 1).fill(0)); // +1 for bias
    }

    // Add bias term to X
    const X_with_bias = X.map(x => [1, ...x]);

    console.log(`Training multinomial logistic regression for ${n_classes} classes`);

    // Newton's method iterations
    for (let iter = 0; iter < maxIterations; iter++) {
        // Flatten weights for easier manipulation
        const flatWeights = weights.flat();
        const numParams = flatWeights.length;

        let gradient = new Array(numParams).fill(0);
        let hessian = Array(numParams).fill().map(() => Array(numParams).fill(0));

        // Compute probabilities using softmax
        const probabilities = [];
        for (let i = 0; i < n_samples; i++) {
            const scores = [];

            // Compute scores for each class (reference class has score 0)
            for (let c = 0; c < n_classes - 1; c++) {
                const score = X_with_bias[i].reduce((sum, x, j) => sum + x * weights[c][j], 0);
                scores.push(Math.max(-500, Math.min(500, score))); // Clip for stability
            }
            scores.push(0); // Reference class score

            // Softmax normalization
            const maxScore = Math.max(...scores);
            const expScores = scores.map(s => Math.exp(s - maxScore));
            const sumExp = expScores.reduce((a, b) => a + b, 0);
            const probs = expScores.map(s => s / sumExp);
            probabilities.push(probs);
        }

        // Compute gradient and Hessian
        for (let i = 0; i < n_samples; i++) {
            const probs = probabilities[i];
            const trueClass = y[i];

            // Gradient computation
            for (let c = 0; c < n_classes - 1; c++) {
                const error = probs[c] - (trueClass === c ? 1 : 0);
                const baseIdx = c * (n_features + 1);

                for (let j = 0; j < n_features + 1; j++) {
                    gradient[baseIdx + j] += error * X_with_bias[i][j];
                }
            }

            // Hessian computation (block structure)
            for (let c1 = 0; c1 < n_classes - 1; c1++) {
                for (let c2 = 0; c2 < n_classes - 1; c2++) {
                    const baseIdx1 = c1 * (n_features + 1);
                    const baseIdx2 = c2 * (n_features + 1);

                    let hessianWeight;
                    if (c1 === c2) {
                        hessianWeight = probs[c1] * (1 - probs[c1]);
                    } else {
                        hessianWeight = -probs[c1] * probs[c2];
                    }

                    for (let j1 = 0; j1 < n_features + 1; j1++) {
                        for (let j2 = 0; j2 < n_features + 1; j2++) {
                            hessian[baseIdx1 + j1][baseIdx2 + j2] += hessianWeight * X_with_bias[i][j1] * X_with_bias[i][j2];
                        }
                    }
                }
            }
        }

        // Add L2 regularization (skip bias terms)
        for (let c = 0; c < n_classes - 1; c++) {
            const baseIdx = c * (n_features + 1);
            for (let j = 1; j < n_features + 1; j++) { // Start from 1 to skip bias
                const paramIdx = baseIdx + j;
                gradient[paramIdx] += lambda * flatWeights[paramIdx];
                hessian[paramIdx][paramIdx] += lambda;
            }
        }

        // Add numerical stability
        for (let i = 0; i < numParams; i++) {
            hessian[i][i] += 1e-8;
        }

        // Newton update
        const hessianInv = matrixInverse(hessian);
        if (hessianInv) {
            const update = matrixVectorMultiply(hessianInv, gradient);
            let maxUpdate = 0;

            // Update flattened weights
            for (let i = 0; i < numParams; i++) {
                flatWeights[i] -= update[i];
                maxUpdate = Math.max(maxUpdate, Math.abs(update[i]));
            }

            // Reshape back to weight matrix
            for (let c = 0; c < n_classes - 1; c++) {
                for (let j = 0; j < n_features + 1; j++) {
                    weights[c][j] = flatWeights[c * (n_features + 1) + j];
                }
            }

            // Check convergence
            if (maxUpdate < 1e-6) {
                console.log(`Multinomial logistic regression converged after ${iter + 1} iterations`);
                break;
            }
        } else {
            // Fallback to gradient descent
            console.log('Using gradient descent fallback');
            for (let i = 0; i < numParams; i++) {
                const regularization = (i % (n_features + 1) > 0) ? lambda * flatWeights[i] : 0;
                flatWeights[i] -= 0.01 * (gradient[i] + regularization) / n_samples;
            }

            // Reshape back to weight matrix
            for (let c = 0; c < n_classes - 1; c++) {
                for (let j = 0; j < n_features + 1; j++) {
                    weights[c][j] = flatWeights[c * (n_features + 1) + j];
                }
            }
        }
    }

    return weights;
}

// Train logistic regression model with L2 regularization
console.log('Training logistic regression with L2 regularization...');
const logisticWeights = logisticRegression(X, y, 10, 0.01);  // 10 iterations, lambda=0.01
console.log('Logistic weights:', logisticWeights);

// Predict probabilities using multinomial logistic regression
function predictLogistic(points, weights) {
    const n_classes = weights.length + 1; // +1 for reference class

    return points.map(point => {
        const x_with_bias = [1, ...point];
        let scores = [];

        // Compute scores for each class (reference class has score 0)
        for (let c = 0; c < n_classes - 1; c++) {
            const score = x_with_bias.reduce((sum, x, j) => sum + x * weights[c][j], 0);
            scores.push(Math.max(-500, Math.min(500, score))); // Clip for stability
        }
        scores.push(0); // Reference class score

        // Softmax normalization
        const maxScore = Math.max(...scores);
        const expScores = scores.map(s => Math.exp(s - maxScore));
        const sumExp = expScores.reduce((a, b) => a + b, 0);
        return expScores.map(s => s / (sumExp || 1));
    });
}

// Function to get current parameters based on mode
function getCurrentParams() {
    if (modelType === 'empirical') {
        return { means: means_obs, covs: covs_obs, priors: priors_obs };
    } else if (modelType === 'logistic') {
        return { type: 'logistic', weights: logisticWeights };
    } else {
        return { means: means, covs: covs, priors: priors };
    }
}

// Initial grid probabilities (will be updated when mode changes)
let gridProbs = predict_proba(gridPoints, means, covs, priors);
const marginal_score = ZX.map((probs, idx) => probs[y[idx]]);

// Test logistic regression predictions
console.log('Testing logistic regression on sample points...');
const logisticTestPreds = predictLogistic(X.slice(0, 5), logisticWeights);
console.log('Sample logistic predictions:', logisticTestPreds);

// Compute separation contour once using theoretical parameters (fixed)
const gridProbsTheoretical = predict_proba(gridPoints, means, covs, priors);
const argGridTheoretical = gridProbsTheoretical.map(p => p.indexOf(Math.max(...p)));
const zArgmaxTheoretical = [];
for (let yi=0; yi<n_discr; yi++) zArgmaxTheoretical.push(argGridTheoretical.slice(yi*n_discr,(yi+1)*n_discr));

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
        const params = getCurrentParams();
        for (let i = 0; i < n_classes; i++) {
            const classPoints = X.filter((_, idx) => y[idx] === i);
            let probs_class;

            if (params.type === 'logistic') {
                probs_class = predictLogistic(classPoints, params.weights).map(p => p[i]);
            } else {
                probs_class = predict_proba(classPoints, params.means, params.covs, params.priors).map(p => p[i]);
            }

            const threshold = quantile(probs_class, alpha);
            const z = gridProbs.map(p => p[i] >= threshold ? 1 : 0);
            const z2d = [];
            for (let yi = 0; yi < n_discr; yi++) z2d.push(z.slice(yi*n_discr, (yi+1)*n_discr));
            newTraces.push({
                x: x_grid, y: y_grid, z: z2d,
                type: 'contour', showscale: false,
                colorscale: [[0,'rgba(255,255,255,0)'], [1, colors[i]]],
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
    const params = getCurrentParams();

    // Get current priors based on model type
    let currentPriors;
    if (params.type === 'logistic') {
        // For logistic regression, use empirical priors
        currentPriors = priors_obs;
    } else {
        currentPriors = params.priors;
    }

    for (let i = 0; i < n_classes; i++) {
        // macro_score = ZX[idx, int(y[idx])] / priors[int(y[idx])]
        const macro_score = ZX.map((probs, idx) => probs[y[idx]] / currentPriors[y[idx]]);
        // threshold = min(1, np.quantile(macro_score, alpha) * priors[i])
        const threshold = Math.min(1, quantile(macro_score, alpha) * currentPriors[i]);
        // mask = predictions[:, i] >= threshold
        const z = gridProbs.map(p => p[i] >= threshold ? 1 : 0);
        const z2d = [];
        for (let yi = 0; yi < n_discr; yi++) z2d.push(z.slice(yi*n_discr, (yi+1)*n_discr));
        newTraces.push({
            x: x_grid, y: y_grid, z: z2d,
            type: 'contour', showscale: false,
            colorscale: [[0,'rgba(255,255,255,0)'], [1, colors[i]]],
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
    // Always use theoretical parameters for separation contour (pre-computed)
    return {
        x: x_grid, y: y_grid, z: zArgmaxTheoretical,
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
    const plotsDiv = document.getElementById('plots3');
    if (!plotsDiv) return;
    plotsDiv.style.display = 'flex';
    plotsDiv.style.flexDirection = 'column';
    plotsDiv.style.alignItems = 'center';
    plotsDiv.style.width = '100%';
    plotsDiv.style.maxWidth = '800px';
    plotsDiv.style.margin = '0 auto';

    // Add Model selection buttons (Theoretical/Empirical/Logistic)
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.marginBottom = '-4px';
    toggleContainer.style.gap = '10px';

    const toggleLabel = document.createElement('span');
    toggleLabel.textContent = 'Probability model:';
    toggleLabel.style.fontWeight = 'bold';
    toggleLabel.style.marginRight = '8px';

    const theoreticalBtn = document.createElement('button');
    theoreticalBtn.textContent = 'Theoretical';
    theoreticalBtn.id = 'theoretical-btn';
    theoreticalBtn.style.padding = '6px 12px';
    theoreticalBtn.style.border = 'none';
    theoreticalBtn.style.borderRadius = '4px 0 0 0';
    theoreticalBtn.style.cursor = 'pointer';
    theoreticalBtn.style.backgroundColor = '#4CAF50';
    theoreticalBtn.style.color = 'white';

    const empiricalBtn = document.createElement('button');
    empiricalBtn.textContent = 'Empirical';
    empiricalBtn.id = 'empirical-btn';
    empiricalBtn.style.padding = '6px 12px';
    empiricalBtn.style.border = 'none';
    empiricalBtn.style.borderRadius = '0';
    empiricalBtn.style.cursor = 'pointer';
    empiricalBtn.style.backgroundColor = '#f1f1f1';
    empiricalBtn.style.color = '#333';

    const logisticBtn = document.createElement('button');
    logisticBtn.textContent = 'Logistic Reg.';
    logisticBtn.id = 'logistic-btn';
    logisticBtn.style.padding = '6px 12px';
    logisticBtn.style.border = 'none';
    logisticBtn.style.borderRadius = '0 4px 4px 0';
    logisticBtn.style.cursor = 'pointer';
    logisticBtn.style.backgroundColor = '#f1f1f1';
    logisticBtn.style.color = '#333';

    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(theoreticalBtn);
    toggleContainer.appendChild(empiricalBtn);
    toggleContainer.appendChild(logisticBtn);
    plotsDiv.appendChild(toggleContainer);

    const container = document.createElement('div');
    container.id = 'plotContainer';
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.height = 'auto';
    container.style.marginTop = '0px'; // Remove any top margin
    container.style.paddingTop = '0px'; // Remove any top padding
    plotsDiv.appendChild(container);

    function getResponsiveLayout() {
        const containerWidth = container.offsetWidth || plotsDiv.offsetWidth || 1200;
        return {
            // 2 rows, 3 columns grid for subplots
            grid: { rows: 2, columns: 3, pattern: 'independent', xgap: 0.03, ygap: 0.01 },
            width: containerWidth,
            height: Math.round(containerWidth * 0.9),
            // Top row domains (row 1)
            xaxis: { scaleanchor: 'y', scaleratio: 1, range: [xMin, xMax], domain: [0.0, 0.31333333333333335], anchor: 'y', row: 1, col: 1, ticklabelposition: 'middle' },
            xaxis2: { scaleanchor: 'y2', scaleratio: 1, range: [xMin, xMax], domain: [0.34333333333333335, 0.6566666666666667], anchor: 'y2', row: 1, col: 2, ticklabelposition: 'middle' },
            xaxis3: { scaleanchor: 'y3', scaleratio: 1, range: [xMin, xMax], domain: [0.6866666666666667, 1.0], anchor: 'y3', row: 1, col: 3, ticklabelposition: 'middle' },
            // Top row: occupy 2/3 of height
            yaxis: { range: [yMin, yMax], domain: [0.28, 1.0], showticklabels: true, constrain: 'domain', automargin: true, anchor: 'x', row: 1, col: 1 },
            yaxis2: { range: [yMin, yMax], domain: [0.28, 1.0], showticklabels: false, showgrid: false, showline: false, constrain: 'domain', automargin: true, anchor: 'x2', row: 1, col: 2 },
            yaxis3: { range: [yMin, yMax], domain: [0.28, 1.0], showticklabels: false, showgrid: false, showline: false, constrain: 'domain', automargin: true, anchor: 'x3', row: 1, col: 3 },
            // Bottom row: occupy 0 to 0.15 of height
            xaxis4: { domain: [0.0, 0.31333333333333335], anchor: 'y4', row: 2, col: 1, ticklabelposition: 'middle', ticklabelmode: 'anchor', ticklabelpadding: 20, range: [-0.1, 1.1], tickvals: [0.12, 0.5, 0.88], ticktext: ['Class 1', 'Class 2', 'Class 3'] },
            xaxis5: { domain: [0.34333333333333335, 0.6566666666666667], anchor: 'y5', row: 2, col: 2, ticklabelposition: 'middle', ticklabelmode: 'anchor', ticklabelpadding: 20, range: [-0.1, 1.1], tickvals: [0.12, 0.5, 0.88], ticktext: ['Class 1', 'Class 2', 'Class 3'] },
            xaxis6: { domain: [0.6866666666666667, 1.0], anchor: 'y6', row: 2, col: 3, ticklabelposition: 'middle', ticklabelmode: 'anchor', ticklabelpadding: 20, range: [-0.1, 1.1], tickvals: [0.12, 0.5, 0.88], ticktext: ['Class 1', 'Class 2', 'Class 3'] },
            yaxis4: { domain: [0.20, 0.36], range: [0., 1.02], showticklabels: true, automargin: true, anchor: 'x4', row: 2, col: 1, title: { text: 'Class coverage', font: { size: 15 } } },
            yaxis5: { domain: [0.20, 0.36], range: [0., 1.02], showticklabels: false, automargin: true, anchor: 'x5', row: 2, col: 2 },
            yaxis6: { domain: [0.20, 0.36], range: [0., 1.02], showticklabels: false, automargin: true, anchor: 'x6', row: 2, col: 3 },
            yaxis5: {domain: [0.20, 0.36], range: [0., 1.02], showticklabels: false, automargin:false, anchor:'x5'},
            yaxis6: {domain: [0.20, 0.36], range: [0., 1.02], showticklabels: false, automargin:false, anchor:'x6'},
            // reduce left/right margins slightly to compensate for tighter domains
    margin: { t: 5, r: 10, b: 50, l: 60 },
            font: { family: 'Inter, sans-serif' },
            legend: {
                orientation: 'h',
                x: 0.5,
                y: .13,
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
                    x: 0.15666666666666668,
                    y: 0.87,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { size: 16, family: 'Inter, sans-serif', color: '#222' },
                    xanchor: 'center',
                    yanchor: 'bottom'
                },
                {
                    text: 'Standard',
                    x: 0.5,
                    y: 0.87,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { size: 16, family: 'Inter, sans-serif', color: '#222' },
                    xanchor: 'center',
                    yanchor: 'bottom'
                },
                {
                    text: 'Standard with PAS',
                    x: 0.8433333333333334,
                    y: 0.87,
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
    let currentAlpha = 0.15;
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

        // Add 1-alpha horizontal line to each lower barplot
        const yLine = 1 - alpha;
        // Add a single legend trace for the 1-alpha line, link all three lines with legendgroup
        const lineTraces = [
            {
                x: [0, 1],
                y: [yLine, yLine],
                type: 'scatter',
                mode: 'lines',
                line: { color: 'black', width: 2, dash: 'dot' },
                xaxis: 'x4',
                yaxis: 'y4',
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
                xaxis: 'x5',
                yaxis: 'y5',
                showlegend: false,
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
                xaxis: 'x6',
                yaxis: 'y6',
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
            ...scatterMiddle,
            ...contourMiddle,
            sepMiddle,
            ...scatterRight,
            ...contourRight,
            sepRight,
        // Add barplots in the second row
        ...classConditionalBarTraces(alpha),
            ...lineTraces
        ];
    }
    function attachRelayoutHandler() {
        container.removeAllListeners && container.removeAllListeners('plotly_relayout');
        let syncing = false;
        container.on('plotly_relayout', (eventData) => {
            if (syncing) return;
            syncing = true;
            const update = {};
            // --- First row: sync x/y axes across all three subplots ---
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

            // --- Second row: sync x/y axes across all three barplots ---
            if (eventData['xaxis4.range[0]'] !== undefined) {
                update['xaxis5.range'] = [eventData['xaxis4.range[0]'], eventData['xaxis4.range[1]']];
                update['xaxis6.range'] = [eventData['xaxis4.range[0]'], eventData['xaxis4.range[1]']];
            } else if (eventData['xaxis5.range[0]'] !== undefined) {
                update['xaxis4.range'] = [eventData['xaxis5.range[0]'], eventData['xaxis5.range[1]']];
                update['xaxis6.range'] = [eventData['xaxis5.range[0]'], eventData['xaxis5.range[1]']];
            } else if (eventData['xaxis6.range[0]'] !== undefined) {
                update['xaxis4.range'] = [eventData['xaxis6.range[0]'], eventData['xaxis6.range[1]']];
                update['xaxis5.range'] = [eventData['xaxis6.range[0]'], eventData['xaxis6.range[1]']];
            }
            if (eventData['yaxis4.range[0]'] !== undefined) {
                update['yaxis5.range'] = [eventData['yaxis4.range[0]'], eventData['yaxis4.range[1]']];
                update['yaxis6.range'] = [eventData['yaxis4.range[0]'], eventData['yaxis4.range[1]']];
            } else if (eventData['yaxis5.range[0]'] !== undefined) {
                update['yaxis4.range'] = [eventData['yaxis5.range[0]'], eventData['yaxis5.range[1]']];
                update['yaxis6.range'] = [eventData['yaxis5.range[0]'], eventData['yaxis5.range[1]']];
            } else if (eventData['yaxis6.range[0]'] !== undefined) {
                update['yaxis4.range'] = [eventData['yaxis6.range[0]'], eventData['yaxis6.range[1]']];
                update['yaxis5.range'] = [eventData['yaxis6.range[0]'], eventData['yaxis6.range[1]']];
            }

            if (Object.keys(update).length > 0) {
                Plotly.relayout(container, update).finally(() => { syncing = false; });
            } else {
                syncing = false;
            }
        });
    }
    function updateGridProbs() {
        const params = getCurrentParams();
        console.log('Updating grid probs with model type:', modelType);
        if (params.type === 'logistic') {
            console.log('Using logistic regression predictions');
            gridProbs = predictLogistic(gridPoints, params.weights);
            console.log('First few logistic predictions:', gridProbs.slice(0, 3));
        } else {
            console.log('Using Gaussian mixture predictions');
            gridProbs = predict_proba(gridPoints, params.means, params.covs, params.priors);
        }
    }

    function drawPlot() {
        Plotly.newPlot(container, createTraces(currentAlpha), getResponsiveLayout(), {responsive: true}).then(attachRelayoutHandler);
    }

    function updateButtonStyles() {
        // Reset all buttons to inactive style
        [theoreticalBtn, empiricalBtn, logisticBtn].forEach(btn => {
            btn.style.backgroundColor = '#f1f1f1';
            btn.style.color = '#333';
        });

        // Activate the current model type button
        if (modelType === 'theoretical') {
            theoreticalBtn.style.backgroundColor = '#4CAF50';
            theoreticalBtn.style.color = 'white';
        } else if (modelType === 'empirical') {
            empiricalBtn.style.backgroundColor = '#4CAF50';
            empiricalBtn.style.color = 'white';
        } else if (modelType === 'logistic') {
            logisticBtn.style.backgroundColor = '#4CAF50';
            logisticBtn.style.color = 'white';
        }
    }

    // Button event handlers
    theoreticalBtn.addEventListener('click', () => {
        console.log('Switching to theoretical model');
        if (modelType !== 'theoretical') {
            modelType = 'theoretical';
            updateGridProbs();
            updateButtonStyles();
            drawPlot();
        }
    });

    empiricalBtn.addEventListener('click', () => {
        console.log('Switching to empirical model');
        if (modelType !== 'empirical') {
            modelType = 'empirical';
            updateGridProbs();
            updateButtonStyles();
            drawPlot();
        }
    });

    logisticBtn.addEventListener('click', () => {
        console.log('Switching to logistic regression model');
        if (modelType !== 'logistic') {
            modelType = 'logistic';
            updateGridProbs();
            updateButtonStyles();
            drawPlot();
        }
    });

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
