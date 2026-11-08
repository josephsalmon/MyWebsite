// Sample-based PR (Precision-Recall) explorer (Plotly.js, client-side).
//
// PR counterpart of roc_sampling_explorer.js. Same sampling mechanics
// (seeded PRNG, standardized draws rescaled by the current mu/sigma,
// n0/n1 sliders, jittered mirrored scatter panel), with the ROC panel
// replaced by a Precision-Recall panel:
//
//  - Theoretical PR curve (solid black), computed from the exact
//    FPR(t), TPR(t) of the chosen distribution and the prevalence
//    pi_hat = n1/(n0+n1):
//
//        Recall(t)    = TPR(t)
//        Precision(t) = pi*TPR(t) / (pi*TPR(t) + (1-pi)*FPR(t))
//
//    Thresholds with no predicted positive (0/0) are not points of the
//    curve. The universal endpoint (Recall = 1, Precision = pi) is
//    always appended.
//  - Empirical PR curve (thin, light gray), from the threshold sweep
//    over the pooled samples (ties grouped). Its last point is
//    automatically (1, pi_hat).
//  - Horizontal dashed line Precision = pi_hat: the random-guessing
//    baseline (replaces the ROC diagonal).
//  - Unlike ROC, the PR curve depends on the class balance, so the
//    n0/n1 sliders reshape both curves, not just the scatter.

import {
  distributionParamSliders,
  distributionYDomain,
  distributionFpr,
  distributionTpr,
  addDistributionSelector,
  distributions,
  inverseCdf,
} from './gaussian_distribution.js';

const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

const LIGHT_THEME = {
  dark: false,
  bg: '#ffffff',
  text: '#243247',
  title: '#142238',
  secondary: '#46566d',
  axis: '#243247',
  muted: '#46566d',
  grid: 'rgba(30, 50, 75, 0.18)',
  zero: 'rgba(30, 50, 75, 0.55)',
  border: 'rgba(30, 50, 75, 0.28)',
  panel: 'rgba(0, 0, 0, 0.02)',
  curve: '#142238',
  threshold: '#142238',
  marker: '#ffffff',
  markerBorder: '#142238',
  x0: '#c62828',
  x1: '#1769aa',
  empirical: '#8a96a5',
  empiricalPoint: '#ffffff',
  theoretical: '#142238',
  operatingPoint: '#ffffff',
};

const DARK_THEME = {
  dark: true,
  bg: '#1b2534',
  text: '#e8edf5',
  title: '#ffffff',
  secondary: '#c1cde0',
  axis: '#e8edf5',
  muted: '#c1cde0',
  grid: 'rgba(220, 232, 250, 0.16)',
  zero: 'rgba(220, 232, 250, 0.60)',
  border: 'rgba(220, 232, 250, 0.25)',
  panel: 'rgba(255, 255, 255, 0.04)',
  curve: '#ffffff',
  threshold: '#f0f4fa',
  marker: '#1b2534',
  markerBorder: '#ffffff',

  // Sample distributions
  x0: '#ff8a80',
  x1: '#64b5f6',

  // Empirical and theoretical ROC
  empirical: '#c1cde0',
  empiricalPoint: '#1b2534',
  theoretical: '#ffffff',
  operatingPoint: '#1b2534',
};

let THEME = { ...LIGHT_THEME };

const AXIS_PR = { x: 'x2', y: 'y2' };


function parseRgba(str) {
  const match = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!match) return null;

  const values = match[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);

  if (
    values.length < 3 ||
    values.slice(0, 3).some(Number.isNaN)
  ) {
    return null;
  }

  return {
    r: values[0],
    g: values[1],
    b: values[2],
    a: values.length > 3 && !Number.isNaN(values[3])
      ? values[3]
      : 1,
  };
}

function getPageTheme(el) {
  const root = document.documentElement;
  const body = document.body;

  if (
    root.classList.contains('quarto-dark') ||
    body?.classList.contains('quarto-dark')
  ) {
    return DARK_THEME;
  }

  if (
    root.classList.contains('quarto-light') ||
    body?.classList.contains('quarto-light')
  ) {
    return LIGHT_THEME;
  }

  const themeValue =
    root.getAttribute('data-bs-theme') ||
    root.getAttribute('data-theme') ||
    body?.getAttribute('data-bs-theme') ||
    body?.getAttribute('data-theme');

  if (themeValue) {
    return themeValue.toLowerCase().includes('dark')
      ? DARK_THEME
      : LIGHT_THEME;
  }

  for (let node = el; node; node = node.parentElement) {
    const bg = parseRgba(
      getComputedStyle(node).backgroundColor
    );

    if (bg && bg.a > 0.5) {
      const luminance =
        (0.2126 * bg.r +
         0.7152 * bg.g +
         0.0722 * bg.b) / 255;

      return luminance < 0.5
        ? DARK_THEME
        : LIGHT_THEME;
    }
  }

  return LIGHT_THEME;
}


function getThemeColors() {
  return THEME;
}

function refreshTheme(el) {
  const nextTheme = getPageTheme(el);
  const changed = THEME.dark !== nextTheme.dark;
  Object.assign(THEME, nextTheme);
  return changed;
}

function applyControlTypography(container) {
  container.querySelectorAll('label, span, .form-label, .form-check-label')
    .forEach((el) => {
      el.style.setProperty('font-family', FONT_FAMILY, 'important');
      el.style.setProperty('font-size', '11px', 'important');
      el.style.setProperty('line-height', '1.35', 'important');
      el.style.setProperty('color', THEME.text, 'important');
    });
}


const MAX_N = 300; // largest sample count either slider can request

// ------------------------------------------------------------------
// Seeded PRNG (Mulberry32) — deterministic across reloads, so the
// point cloud and jitter positions are reproducible.
// ------------------------------------------------------------------

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fillArray(n, rng) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = rng();
  return out;
}

// Fixed uniforms (u0, u1) and fixed jitter offsets — generated once,
// independent of distribution/parameters, so only n0/n1/distribution
// changes require recomputation of the derived arrays below.
const rngU0 = mulberry32(12345);
const rngU1 = mulberry32(67890);
const rngJ0 = mulberry32(11111);
const rngJ1 = mulberry32(22222);
const U0 = fillArray(MAX_N, rngU0);
const U1 = fillArray(MAX_N, rngU1);
// Jitter magnitude in [0.15, 1.0], sign applied at plot time.
const J0 = fillArray(MAX_N, rngJ0).map((u) => 0.15 + 0.85 * u);
const J1 = fillArray(MAX_N, rngJ1).map((u) => 0.15 + 0.85 * u);

// ------------------------------------------------------------------
// Empirical PR curve: threshold sweep over the pooled, sorted sample
// scores (ties grouped so a shared score yields a single point).
//   recall    = tp / P
//   precision = tp / (tp + fp)
// The sweep ends at (1, P/(P+N)) = (1, pi_hat) automatically.
// ------------------------------------------------------------------

function empiricalPrCurve(x0, x1) {
  const N = x0.length, P = x1.length;
  if (N === 0 || P === 0) return { x: [], y: [] };

  const scored = [];
  x1.forEach((v) => scored.push({ v, label: 1 }));
  x0.forEach((v) => scored.push({ v, label: 0 }));
  scored.sort((a, b) => b.v - a.v); // descending: high score = predicted positive first

  let tp = 0, fp = 0;
  const recallArr = [], precisionArr = [];
  for (let i = 0; i < scored.length; i++) {
    if (scored[i].label === 1) tp++; else fp++;
    // Only emit a point once all entries tied at this score are processed.
    if (i === scored.length - 1 || scored[i].v !== scored[i + 1].v) {
      recallArr.push(tp / P);
      precisionArr.push(tp / (tp + fp));
    }
  }
  return { x: recallArr, y: precisionArr };
}

// Empirical operating point at threshold t. Precision is undefined
// (0/0) when no sample is predicted positive: return null then.
function empiricalPoint(x0, x1, t) {
  const tp = x1.filter((v) => v >= t).length;
  const fp = x0.filter((v) => v >= t).length;
  if (x1.length === 0 || tp + fp === 0) return null;
  return { recall: tp / x1.length, precision: tp / (tp + fp) };
}

export async function initPrSamplingWidget(container) {
  const controlsDiv = container.querySelector('.sampling-pr-controls');
  const plotDiv = container.querySelector('.sampling-pr-plot');

  const params = {
    distribution: 'gaussian',
    mu0: 0, sigma0: 1, mu1: 1, sigma1: 1,
    n0: 60, n1: 60,
    t: 0.5,
  };

  // --- Control panel --------------------------------------------------

  const sliderEls = {};
  const valueEls = {};

  function makeSliderRow(key, label, min, max, step, value, formatFn) {
    const row = document.createElement('div');
    row.style.marginBottom = '7px';

    const labelRow = document.createElement('div');
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.marginBottom = '2px';
    labelRow.style.setProperty('font-family', FONT_FAMILY, 'important');
    labelRow.style.setProperty('font-size', '11px', 'important');
    labelRow.style.setProperty('line-height', '1.35', 'important');

    const labelText = document.createElement('span');
    labelText.textContent = label;
    labelText.style.fontWeight = '600';

    const valueText = document.createElement('span');
    valueText.textContent = formatFn(value);
    valueText.style.color = THEME.muted;

    labelRow.appendChild(labelText);
    labelRow.appendChild(valueText);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.style.width = '100%';

    row.appendChild(labelRow);
    row.appendChild(input);

    sliderEls[key] = input;
    valueEls[key] = valueText;
    return row;
  }

  const fmt2 = (v) => Number(v).toFixed(2);
  const fmt0 = (v) => String(Math.round(v));

  // Distribution radio buttons (existing helper — writes its own DOM into
  // controlsDiv; reused as-is).
  addDistributionSelector(container, '.sampling-pr-controls');

  // Distribution parameter sliders (mu0, sigma0, mu1, sigma1).
  distributionParamSliders.forEach(({ key, label, min, max, step, value }) => {
    controlsDiv.appendChild(makeSliderRow(key, label, min, max, step, value, fmt2));
  });

  const hr1 = document.createElement('hr');
  hr1.style.margin = '8px 0';
  hr1.style.setProperty('border-color', THEME.border, 'important');   // was 'rgba(0,0,0,0.1)'

  controlsDiv.appendChild(hr1);

  // Sample-count sliders — replace the earlier prevalence slider.
  controlsDiv.appendChild(makeSliderRow('n0', 'n₀ (negative samples)', 5, MAX_N, 5, params.n0, fmt0));
  controlsDiv.appendChild(makeSliderRow('n1', 'n₁ (positive samples)', 5, MAX_N, 5, params.n1, fmt0));

  const prevalenceLabel = document.createElement('div');
  prevalenceLabel.style.fontFamily = FONT_FAMILY;
  prevalenceLabel.style.fontSize = '9.77px';
  prevalenceLabel.style.color = '#777';
  prevalenceLabel.style.marginTop = '2px';
  prevalenceLabel.style.marginBottom = '6px';
  controlsDiv.appendChild(prevalenceLabel);

  function updatePrevalenceLabel() {
    const piHat = params.n1 / (params.n0 + params.n1);
    prevalenceLabel.textContent = `π̂ = n₁/(n₀+n₁) = ${piHat.toFixed(2)}`;
  }
  updatePrevalenceLabel();

  const hr2 = document.createElement('hr');
  hr2.style.margin = '8px 0';
  hr2.style.borderColor = 'rgba(0,0,0,0.1)';
  controlsDiv.appendChild(hr2);

  // Threshold slider — own dedicated layout (matches the other widgets).
// Threshold slider — label and value on the same line
const [yMin0, yMax0] = distributionYDomain(params);

const thresholdRow = document.createElement('div');
thresholdRow.style.marginBottom = '7px';
controlsDiv.appendChild(thresholdRow);

const thresholdLabelRow = document.createElement('div');
thresholdLabelRow.style.display = 'flex';
thresholdLabelRow.style.justifyContent = 'space-between';
thresholdLabelRow.style.fontFamily = FONT_FAMILY;
thresholdLabelRow.style.marginBottom = '2px';
thresholdLabelRow.style.fontSize = '9.77px';
thresholdRow.appendChild(thresholdLabelRow);

const thresholdLabel = document.createElement('span');
thresholdLabel.textContent = 'Threshold';
thresholdLabel.style.fontWeight = '600';
thresholdLabelRow.appendChild(thresholdLabel);

const thresholdValueLabel = document.createElement('span');
thresholdValueLabel.textContent = 'Threshold = ' + params.t.toPrecision(3);
thresholdValueLabel.style.color = '#555';
thresholdLabelRow.appendChild(thresholdValueLabel);

const thresholdSlider = document.createElement('input');
thresholdSlider.type = 'range';
thresholdSlider.min = yMin0;
thresholdSlider.max = yMax0;
thresholdSlider.step = (yMax0 - yMin0) / 500;
thresholdSlider.value = params.t;
thresholdSlider.style.width = '100%';
thresholdRow.appendChild(thresholdSlider);

function updateThresholdLabel() {
  thresholdValueLabel.textContent =  params.t.toPrecision(3);
}
updateThresholdLabel();
  // --- Sample generation (depends on distribution, n0, n1) ------------

  let x0Full = [], x1Full = []; // standardized (z) samples, length MAX_N

  function regenerateStandardizedSamples() {
    x0Full = U0.map((u) => inverseCdf(u, params.distribution));
    x1Full = U1.map((u) => inverseCdf(u, params.distribution));
  }
  regenerateStandardizedSamples();

  function currentSamples() {
    const z0 = x0Full.slice(0, params.n0);
    const z1 = x1Full.slice(0, params.n1);
    const j0 = J0.slice(0, params.n0);
    const j1 = J1.slice(0, params.n1);
    const x0 = z0.map((z) => params.mu0 + params.sigma0 * z);
    const x1 = z1.map((z) => params.mu1 + params.sigma1 * z);
    return { x0, x1, j0, j1 };
  }

  // --- Threshold-range maintenance -------------------------------------

  function refreshThresholdRange() {
    const [yMin, yMax] = distributionYDomain(params);
    thresholdSlider.min = yMin;
    thresholdSlider.max = yMax;
    thresholdSlider.step = (yMax - yMin) / 500;
    params.t = Math.min(Math.max(params.t, yMin), yMax);
    thresholdSlider.value = params.t;
    updateThresholdLabel();
  }

  // --- Sample-scatter panel traces -------------------------------------

  function buildScatterTraces(samples) {
    const { x0, x1, j0, j1 } = samples;
    const t = params.t;
    const theme = THEME;

    const ms = Math.max(3, 6 * currentScale());   // sample points
    const wms = Math.max(3, 6 * currentScale());  // miss crosses
    

    function splitAndBuild(values, jitters, sign, color, label, correctIfAbove) {
      const correct = { x: [], y: [] };
      const wrong = { x: [], y: [] };
      for (let i = 0; i < values.length; i++) {
        const isAbove = values[i] >= t;
        const isCorrect = isAbove === correctIfAbove;
        const bucket = isCorrect ? correct : wrong;
        bucket.x.push(sign * jitters[i]);
        bucket.y.push(values[i]);
      }
      return [
        { x: correct.x, y: correct.y, mode: 'markers',
          name: label, showlegend: true,
          marker: { color, size: ms, line: { color: theme.axis, width: 0.5 } } },
        { x: wrong.x, y: wrong.y, mode: 'markers',
          name: `${label} — miss`, showlegend: false,
          marker: { color, size: wms, symbol: 'x' } },
      ];
    }

   const traces = [
      ...splitAndBuild(x1, j1, -1, theme.x1, 'X₁ (sick)', true),
      ...splitAndBuild(x0, j0, +1, theme.x0, 'X₀ (healthy)', false),
      { x: [-1.15, 1.15], y: [t, t], mode: 'lines', name: 'Threshold',
        line: { color: theme.threshold, width: 2 }, showlegend: true },
    ];
    return traces;
  }

  // --- PR panel traces --------------------------------------------------

  // Precision from exact FPR/TPR and a prevalence pi; NaN when no
  // positive is predicted (0/0).
  function theoreticalPrPoint(t, p, pi) {
    const tpr = distributionTpr(t, p);
    const fpr = distributionFpr(t, p);
    const denom = pi * tpr + (1 - pi) * fpr;
    return denom > 0
      ? { recall: tpr, precision: (pi * tpr) / denom }
      : { recall: tpr, precision: NaN };
  }

  function prCurveTheoretical(p, yDomain, pi, num = 400) {
    const pts = [];
    const tMin = yDomain[0] - 2, tMax = yDomain[1] + 2;
    for (let i = 0; i <= num; i++) {
      const t = tMin + (tMax - tMin) * i / num;
      const pt = theoreticalPrPoint(t, p, pi);
      if (Number.isFinite(pt.precision)) pts.push(pt);
    }
    // Left to right in recall; ties (recall = 1 for bounded-below
    // supports) go from high to low precision, so the curve drops
    // vertically to the universal endpoint.
    pts.sort((a, b) => (a.recall - b.recall) || (b.precision - a.precision));
    const x = pts.map((q) => q.recall);
    const y = pts.map((q) => q.precision);
    // Universal endpoint: Recall = 1, Precision = pi.
    x.push(1);
    y.push(pi);
    return { x, y };
  }

  function buildPrTraces(p, yDomain, samples) {
   const pi = p.n1 / (p.n0 + p.n1);
    const theoCurve = prCurveTheoretical(p, yDomain, pi);
    const theoPoint = theoreticalPrPoint(p.t, p, pi);
    const empCurve = empiricalPrCurve(samples.x0, samples.x1);
    const empPoint = empiricalPoint(samples.x0, samples.x1, p.t);
    const scale = currentScale();
    const theoVisible = Number.isFinite(theoPoint.precision);

return [
      { x: [0, 1], y: [pi, pi], mode: 'lines', name: 'Random guessing',
        line: { color: THEME.muted, width: 1.5, dash: 'dash' },          // was 'gray'
        xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, showlegend: false },

      { x: empCurve.x, y: empCurve.y, mode: 'lines', name: 'Empirical PR',
        line: { color: THEME.empirical, width: 1.5 },                    // was '#bbbbbb'
        xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, showlegend: true },
      { x: empPoint ? [empPoint.recall] : [], y: empPoint ? [empPoint.precision] : [],
        mode: 'markers', name: 'Empirical point',
        marker: { color: THEME.empiricalPoint, size: Math.max(4, 8 * scale),   // was '#eeeeee'
                  symbol: 'circle', line: { color: THEME.empirical, width: 1.5 } },
        xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, showlegend: false },

      { x: theoCurve.x, y: theoCurve.y, mode: 'lines', name: 'PR curve',
        line: { color: THEME.theoretical, width: 2.5 },                 // was '#000000'
        xaxis: AXIS_PR.x, yaxis: AXIS_PR.y },
      { x: theoVisible ? [theoPoint.recall] : [], y: theoVisible ? [theoPoint.precision] : [],
        mode: 'markers', name: 'Operating point',
        marker: { color: THEME.operatingPoint, size: Math.max(6, 12 * scale), // was 'white'
                  symbol: 'circle', line: { color: THEME.theoretical, width: 2 } },
        xaxis: AXIS_PR.x, yaxis: AXIS_PR.y, showlegend: false },
    ];
  }

  // --- Layout -----------------------------------------------------------
  // --- Layout -----------------------------------------------------------

  // Responsive sizing: same recipe as the ROC sampling explorer.
  // The PR subplot is square (scaleanchor), so its pixel box must be
  // square by construction: the PR panel spans PR_WIDTH_FRAC of the
  // plot area, so plotAreaH = plotAreaW * PR_WIDTH_FRAC and height
  // derives from width. The top band hosts title + legend (never the
  // x-labels), and the inter-panel gap is wide enough for the "Precision"
  // ylabel at every width.

// --- Responsive sizing ---
const MARGIN_L = 60;
const MARGIN_R = 20;
const MARGIN_T = 78;    // title (top) + legend (below it)
const MARGIN_B = 55;

const NATURAL_WIDTH = 780;
const MIN_WIDTH = 380;

// Minimum pixel gap to prevent "Precision" label overlap
const MIN_GAP_PX = 58;  // Minimum gap in pixels for the "Precision" label
const PR_WIDTH_FRAC = 0.56;  // PR panel width fraction (56% of plot area)

// Dynamically compute panel domains to ensure the gap is wide enough
function panelDomains(width) {
  const plotAreaW = width - MARGIN_L - MARGIN_R;
  // Minimum gap fraction: MIN_GAP_PX / plotAreaW
  const minGapFrac = MIN_GAP_PX / plotAreaW;
  // Ensure the gap is at least minGapFrac (e.g., 20% or MIN_GAP_PX, whichever is larger)
  const gapFrac = Math.max(minGapFrac, 0.20);  // 20% minimum gap
  // Scatter panel takes the remaining space after the gap and PR panel
  const scatterFrac = 1 - gapFrac - PR_WIDTH_FRAC;
  return {
    scatter: [0, scatterFrac],
    pr: [1 - PR_WIDTH_FRAC, 1],
    gapFrac,  // For debugging (optional)
  };
}

function computePlotSize() {
  const measured = plotDiv.getBoundingClientRect().width;
  const available = measured > 0 ? measured : NATURAL_WIDTH;
  const width = Math.max(MIN_WIDTH, Math.min(NATURAL_WIDTH, Math.round(available)));

  // Compute panel domains
  const { scatter: scatterDomain, pr: prDomain } = panelDomains(width);

  // Ensure the PR panel is square
  const plotAreaW = width - MARGIN_L - MARGIN_R;
  const plotAreaH = plotAreaW * PR_WIDTH_FRAC;  // Square PR subplot
  const height = Math.round(plotAreaH + MARGIN_T + MARGIN_B);

  return { width, height, scatterDomain, prDomain };
}

const currentScale = () => computePlotSize().width / NATURAL_WIDTH;

function layoutFor(p, yDomain) {
  const dist = distributions[p.distribution || 'gaussian'];
  const Delta = (p.mu1 - p.mu0) / p.sigma1;
  const rho = p.sigma0 / p.sigma1;

  const { width, height, scatterDomain, prDomain } = computePlotSize();
  const scale = width / NATURAL_WIDTH;
  const axesTopFrac = (height - MARGIN_T) / height;

  const axisStyle = {
    color: THEME.axis, linecolor: THEME.axis, tickcolor: THEME.axis,
    gridcolor: THEME.grid, zerolinecolor: THEME.zero,
  };
  const axisTitle = (text) => ({
    text,
    font: { family: FONT_FAMILY, size: Math.max(11, 12 * scale), color: THEME.text },
  });
  const axisTickfont = () => ({
    family: FONT_FAMILY, size: Math.max(10, 11 * scale), color: THEME.text,
  });

  return {
    font: { family: FONT_FAMILY, size: 12, color: THEME.text },          // was '#333'
    grid: { rows: 1, columns: 2, pattern: 'independent' },

    xaxis: {
      ...axisStyle, tickfont: axisTickfont(),
      domain: scatterDomain, range: [-1.3, 1.3],
      zeroline: true, showticklabels: false,
      title: axisTitle('X₁ samples ← | → X₀ samples'),
    },
    yaxis: {
      ...axisStyle, tickfont: axisTickfont(),
      domain: [0, 1], range: yDomain, showgrid: true,
      title: axisTitle('Assay value (X)'),                               // gridcolor via axisStyle
    },

    xaxis2: {
      ...axisStyle, tickfont: axisTickfont(),
      domain: prDomain, range: [-0.05, 1.05],
      title: axisTitle('Recall'),
    },
    yaxis2: {
      ...axisStyle, tickfont: axisTickfont(),
      range: [-0.05, 1.05],
      scaleanchor: AXIS_PR.x, scaleratio: 1,
      title: { ...axisTitle('Precision'), standoff: 12 },
    },

    title: {
      text: `${dist.label} — Δ=${Delta.toFixed(2)}, ρ=${rho.toFixed(2)}, π̂=${(p.n1 / (p.n0 + p.n1)).toFixed(2)}`,
      y: 1, yanchor: 'top', yref: 'container',
      x: 0.5, xanchor: 'center',
      font: { size: Math.max(11, 16 * scale), family: FONT_FAMILY, color: THEME.title },  // was '#111'
      pad: { t: 6, b: 0 },
    },

    legend: {
      orientation: 'h',
      y: axesTopFrac + 0.25, yanchor: 'bottom',
      x: 0.5, xanchor: 'center',
      font: { size: Math.max(10, 10 * scale), family: FONT_FAMILY, color: THEME.text },
      traceorder: 'normal',
    },

    margin: { l: MARGIN_L, r: MARGIN_R, t: MARGIN_T, b: MARGIN_B, pad: 4 },
    width, height,
    autosize: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };
}
  // --- Render -------------------------------------------------------------

  function render() {
    const samples = currentSamples();
    const yDomain = distributionYDomain(params);
      const traces = buildScatterTraces(samples).concat(buildPrTraces(params, yDomain, samples));
    const layout = layoutFor(params, yDomain);
    Plotly.react(plotDiv, traces, layout, { responsive: true, displayModeBar: false });
  }

  // --- Wiring ---------------------------------------------------------

  distributionParamSliders.forEach(({ key }) => {
    sliderEls[key].addEventListener('input', () => {
      params[key] = parseFloat(sliderEls[key].value);
      valueEls[key].textContent = fmt2(params[key]);
      refreshThresholdRange();
      render();
    });
  });

  sliderEls.n0.addEventListener('input', () => {
    params.n0 = Math.round(parseFloat(sliderEls.n0.value));
    valueEls.n0.textContent = fmt0(params.n0);
    updatePrevalenceLabel();
    render();
  });
  sliderEls.n1.addEventListener('input', () => {
    params.n1 = Math.round(parseFloat(sliderEls.n1.value));
    valueEls.n1.textContent = fmt0(params.n1);
    updatePrevalenceLabel();
    render();
  });

  thresholdSlider.addEventListener('input', () => {
    params.t = parseFloat(thresholdSlider.value);
    updateThresholdLabel();
    render();
  });




  const radios = container.querySelectorAll('.distribution-selector input[type="radio"]');
  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      params.distribution = radio.value;
      regenerateStandardizedSamples();
      refreshThresholdRange();
      render();
    });
  });

  function updateControlTheme() {
    controlsDiv.style.setProperty('color', THEME.text, 'important');
    controlsDiv.style.setProperty('background-color', THEME.panel, 'important');
    controlsDiv.style.setProperty('border-color', THEME.border, 'important');
    Object.values(valueEls).forEach((el) =>
      el.style.setProperty('color', THEME.muted, 'important'));
    prevalenceLabel.style.setProperty('color', THEME.muted, 'important');
    thresholdValueLabel.style.setProperty('color', THEME.muted, 'important');
    container.querySelectorAll('hr').forEach((el) =>
      el.style.setProperty('border-color', THEME.border, 'important'));
    Object.values(sliderEls).forEach((el) =>
      el.style.setProperty('accent-color', THEME.x1, 'important'));
    applyControlTypography(container);
  }

  // --- Initial theme detection ----------------------------------------
  refreshTheme(container);
  updateControlTheme();
  render();   // ← the single initial render (replaces the old bare call)

  // --- Dark/light theme changes ----------------------------------------
  let renderedDark = THEME.dark;

  const themeObserver = new MutationObserver(() => {
    refreshTheme(container);
    if (THEME.dark !== renderedDark) {
      renderedDark = THEME.dark;
      updateControlTheme();
      render();
    }
  });

  themeObserver.observe(document.documentElement, {
    attributes: true, attributeFilter: ['class', 'data-bs-theme', 'data-theme'],
  });
  themeObserver.observe(document.body, {
    attributes: true, attributeFilter: ['class', 'data-bs-theme', 'data-theme'],
  });
  container._samplingPrThemeObserver = themeObserver;

  // Re-render (recomputing width/height/markers) whenever the plot
  // div's box changes — scoped to this widget.
  const ro = new ResizeObserver(() => render());
  ro.observe(plotDiv.parentElement);
  container._samplingPrResizeObserver = ro;
}   // ← end of initPrSamplingWidget



document.querySelectorAll('.sampling-pr-interactive').forEach((container) => {
  initPrSamplingWidget(container);
});