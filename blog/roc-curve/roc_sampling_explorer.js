// Sample-based ROC explorer (Plotly.js, client-side, fully JS — no
// Python/executable chunk of any kind: sampling happens in the browser
// via a seeded PRNG, using the same inverseCdf() already defined for
// each distribution in gaussian_distribution.js).
//
// Differences from the density-based explorer:
//  - LEFT panel: instead of the two population densities, this draws
//    actual random SAMPLES from X0 (healthy) and X1 (sick), plotted
//    vertically and mirrored (X1 blue on the left, X0 red on the
//    right, exactly as in the density version). Points are jittered
//    horizontally for visibility. Marker symbol encodes correctness at
//    the current threshold t: filled circle for a correct call (TP for
//    X1, TN... — see below), 'x' for a miss, matching the convention
//    used in the very first roc_interactive.js widget.
//  - Two sample-COUNT sliders, n0 and n1, replace the "two thresholds"
//    request: rather than a continuous prevalence slider, prevalence is
//    now implicit in how many negative vs. positive points you draw
//    (pi_hat = n1/(n0+n1)), and is reported as read-only text rather
//    than a slider — per the request to drop the pi control but still
//    surface its value somewhere.
//  - RIGHT panel: unchanged theoretical ROC curve + diagonal + boxed
//    operating point, PLUS a new empirical ROC curve (computed directly
//    from the n0+n1 samples via the standard threshold-sweep
//    construction) drawn in a deliberately less prominent style (thin,
//    light gray) than the black theoretical curve, with its own light
//    operating-point marker at the same threshold t.
//
// Sampling mechanics: draw n0+n1 fixed uniform variates once (seeded,
// so the point cloud doesn't reshuffle on every slider drag), map them
// through inverseCdf(u, distribution) to get STANDARDIZED draws z, and
// only then apply the current mu/sigma: x = mu + sigma*z. This means
// dragging mu0/sigma0/mu1/sigma1 rescales the existing points smoothly
// instead of resampling them — changing n0/n1 or the distribution is
// what triggers a fresh draw.

import {
  distributionParamSliders,
  distributionYDomain,
  distributionFpr,
  distributionTpr,
  distributionAuc,
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

function refreshTheme(el) {
  const nextTheme = getPageTheme(el);
  const changed = THEME.dark !== nextTheme.dark;

  Object.assign(THEME, nextTheme);
  return changed;
}
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

function applyControlTypography(container) {
  const theme = getThemeColors();

  container.querySelectorAll(
    'label, span, .form-label, .form-check-label'
  ).forEach((el) => {
    el.style.setProperty('font-family', FONT_FAMILY, 'important');
    el.style.setProperty('font-size', '11px', 'important');
    el.style.setProperty('line-height', '1.35', 'important');
    el.style.setProperty('color', theme.text, 'important');
  });
}



const AXIS_ROC = { x: 'x2', y: 'y2' };

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
// Empirical ROC curve: standard threshold-sweep construction over the
// pooled, sorted sample scores (ties grouped so a shared score value
// yields a single point, matching sklearn's roc_curve convention).
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Empirical ROC curve — PIECEWISE AFFINE (not the staircase).
//
// A knot is emitted ONLY where the class of the next-highest score
// changes (positive-run meets negative-run). Consecutive knots differ
// in BOTH coordinates, so the connecting segments are true diagonals.
// Equivalently: this is the ROC of the randomized classifiers that mix
// the two knot thresholds (randomization theorem) — the linear
// interpolation of the staircase corners, dominating the staircase.
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Empirical ROC — PIECEWISE AFFINE via the concave majorant.
//
// The staircase vertices are the operating points of all deterministic
// thresholds. By the randomization theorem, every point of the convex
// hull of these vertices is attainable by a randomized classifier, and
// the effective ROC is the hull's upper-left boundary: the least
// concave majorant of the staircase. Hull edges are straight diagonals
// with non-increasing slopes — piecewise affine, concave, dominating
// the staircase, and directly comparable to the concave theoretical
// (Neyman-Pearson) curve.
// ------------------------------------------------------------------

function staircaseVertices(x0, x1) {
  const N = x0.length, P = x1.length;
  const scored = [];
  x1.forEach((v) => scored.push({ v, label: 1 }));
  x0.forEach((v) => scored.push({ v, label: 0 }));
  scored.sort((a, b) => b.v - a.v);

  const pts = [{ fpr: 0, tpr: 0 }];
  let fp = 0, tp = 0;
  for (let i = 0; i < scored.length; i++) {
    if (scored[i].label === 1) tp++; else fp++;
    if (i === scored.length - 1 || scored[i].v !== scored[i + 1].v)
      pts.push({ fpr: fp / N, tpr: tp / P });
  }
  // ensure (1,1) endpoint (dedup if the last vertex already is (1,1))
  const last = pts[pts.length - 1];
  if (last.fpr !== 1 || last.tpr !== 1) pts.push({ fpr: 1, tpr: 1 });
  return pts;
}

// ------------------------------------------------------------------
// Empirical ROC curve — PIECEWISE AFFINE via LOCAL randomization.
//
// At each upper-left corner of the staircase (the operating point
// reached when a run of positive flips ends and negatives take over),
// randomizing between this corner's threshold and the next corner's
// threshold traces the straight segment joining the two corners
// (randomization theorem). The curve therefore:
//   - visits EVERY corner (no hull, no domination pruning),
//   - is a function of FPR (one point per FPR level),
//   - has only diagonal segments: consecutive corners differ in both
//     coordinates (an FPR step from the negative run, a TPR step from
//     the following positive run).
// Note: unlike the concave hull, this curve may be non-concave — it
// is the LOCAL randomization frontier, not the global optimum.
// ------------------------------------------------------------------

function empiricalRocCurve(x0, x1) {
  const N = x0.length, P = x1.length;
  if (!N || !P) return { x: [0, 1], y: [0, 1] };

  const scored = [];
  x1.forEach((v) => scored.push({ v, label: 1 }));
  x0.forEach((v) => scored.push({ v, label: 0 }));
  scored.sort((a, b) => b.v - a.v);   // descending: high score first

  const xs = [0], ys = [0];           // (0,0) always on the curve
  let fp = 0, tp = 0;
  let run = null;

  for (let i = 0; i < scored.length; i++) {
    if (run === 1 && scored[i].label === 0) {
      // A positive run just ended: current cumulative point is an
      // upper-left corner — keep it as a knot.
      xs.push(fp / N);
      ys.push(tp / P);
    }
    if (scored[i].label === 1) tp++; else fp++;
    run = scored[i].label;
  }

  xs.push(1); ys.push(1);             // (1,1) always on the curve
  return { x: xs, y: ys };
}

// Operating point ON the randomized-interpolation curve: the test's
// FPR with TPR linearly interpolated between the bracketing corners.
function empiricalPoint(x0, x1, t, curve) {
  const N = x0.length;
  if (!N || !x1.length || !curve || curve.x.length < 2) return { fpr: 0, tpr: 0 };

  const fpr = x0.filter((v) => v >= t).length / N;

  for (let k = 1; k < curve.x.length; k++) {
    if (fpr <= curve.x[k]) {
      const xA = curve.x[k - 1], xB = curve.x[k];
      const u = xB > xA ? (fpr - xA) / (xB - xA) : 0;
      return { fpr, tpr: curve.y[k - 1] + u * (curve.y[k] - curve.y[k - 1]) };
    }
  }
  return { fpr, tpr: curve.y[curve.y.length - 1] };
}


export async function initRocSamplingWidget(container) {
  const controlsDiv = container.querySelector('.sampling-roc-controls');
  const plotDiv = container.querySelector('.sampling-roc-plot');
  applyControlTypography(container);

  const controlTextEls = [];
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
    labelRow.style.fontFamily = FONT_FAMILY;
    labelRow.style.marginBottom = '2px';
    labelRow.style.setProperty('font-size', '11px', 'important');
    labelRow.style.setProperty('line-height', '1.35', 'important');

    const labelText = document.createElement('span');
    labelText.textContent = label;
    labelText.style.fontWeight = '600';

    const valueText = document.createElement('span');
    valueText.textContent = formatFn(value);
    valueText.style.color = getThemeColors().muted;

    [labelText, valueText].forEach((el) => {
      el.style.setProperty('font-size', '11px', 'important');
      el.style.setProperty('line-height', '1.35', 'important');
      el.style.setProperty('font-family', FONT_FAMILY, 'important');
    });

    controlTextEls.push(valueText);

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
  addDistributionSelector(container, '.sampling-roc-controls');

  // Distribution parameter sliders (mu0, sigma0, mu1, sigma1).
  distributionParamSliders.forEach(({ key, label, min, max, step, value }) => {
    controlsDiv.appendChild(makeSliderRow(key, label, min, max, step, value, fmt2));
  });

  const hr1 = document.createElement('hr');
  hr1.style.margin = '8px 0';
  hr1.style.borderColor = 'rgba(0,0,0,0.1)';
  controlsDiv.appendChild(hr1);

  // Sample-count sliders — replace the earlier prevalence slider.
  controlsDiv.appendChild(makeSliderRow('n0', 'n₀ (negative samples)', 5, MAX_N, 5, params.n0, fmt0));
  controlsDiv.appendChild(makeSliderRow('n1', 'n₁ (positive samples)', 5, MAX_N, 5, params.n1, fmt0));

  const prevalenceLabel = document.createElement('div');
    prevalenceLabel.style.setProperty('font-family', FONT_FAMILY, 'important');
  prevalenceLabel.style.setProperty('font-size', '11px', 'important');
  prevalenceLabel.style.setProperty('line-height', '1.35', 'important');
  prevalenceLabel.style.color = getThemeColors().muted; prevalenceLabel.style.marginTop = '2px';
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
thresholdLabelRow.style.setProperty('font-size', '11px', 'important');
thresholdLabelRow.style.setProperty('line-height', '1.35', 'important');
thresholdRow.appendChild(thresholdLabelRow);

const thresholdLabel = document.createElement('span');
thresholdLabel.textContent = 'Threshold';
thresholdLabel.style.fontWeight = '600';
thresholdLabelRow.appendChild(thresholdLabel);

const thresholdValueLabel = document.createElement('span');
thresholdValueLabel.textContent = 'Threshold = ' + params.t.toPrecision(3);
thresholdValueLabel.style.color = getThemeColors().muted;
controlTextEls.push(thresholdValueLabel);
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
    const theme = getThemeColors();
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
          marker: {
          color,
          size: ms,
          line: { color: theme.axis, width: 0.5 },
                  }
        },
        { x: wrong.x, y: wrong.y, mode: 'markers',
          name: `${label} — miss`, showlegend: false,
          marker: { color, size: wms, symbol: 'x' } },
      ];
    }

    const traces = [
      ...splitAndBuild(x1, j1, -1, theme.x1, 'X₁ (sick)', true),
      ...splitAndBuild(x0, j0, +1, theme.x0, 'X₀ (healthy)', false),
      {   x: [-1.15, 1.15],
          y: [t, t],
          mode: 'lines',
          name: 'Threshold',
          line: { color: theme.threshold, width: 2 },
          showlegend: true, },
    ];
    return traces;
  }

  // --- ROC panel traces --------------------------------------------------

  function rocCurveTheoretical(p, yDomain, num = 400) {
    const xs = [], ys = [];
    const tMin = yDomain[0] - 2, tMax = yDomain[1] + 2;
    for (let i = 0; i <= num; i++) {
      const t = tMin + (tMax - tMin) * i / num;
      xs.push(distributionFpr(t, p));
      ys.push(distributionTpr(t, p));
    }
    const idx = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
    return { x: idx.map((i) => xs[i]), y: idx.map((i) => ys[i]) };
  }

  function buildRocTraces(p, yDomain, samples) {
    const theme = getThemeColors();
    const theoCurve = rocCurveTheoretical(p, yDomain);
    const theoPoint = { fpr: distributionFpr(p.t, p), tpr: distributionTpr(p.t, p) };
    const empCurve = empiricalRocCurve(samples.x0, samples.x1);
    const empPoint = empiricalPoint(samples.x0, samples.x1, p.t, empCurve);
    const empVerts = staircaseVertices(samples.x0, samples.x1);   // ← NEW
    const scale = currentScale();

    return [
      // Diagonal reference — light gray.
      { x: [0, 1], y: [0, 1], mode: 'lines', name: 'Random guessing',
        line: { color: theme.muted, width: 1.5, dash: 'dash' },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false },

      // NEW: every deterministic operating point (staircase vertices),
      // including the dominated ones — kept visible as small dots.
      { x: empVerts.map((v) => v.fpr), y: empVerts.map((v) => v.tpr),
        mode: 'markers', name: 'Sample thresholds',
        marker: { color: theme.empirical, size: Math.max(2.5, 4 * scale),
                  symbol: 'circle', opacity: 0.7 },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: true },

      // Empirical ROC frontier — piecewise affine (concave majorant).
      { x: empCurve.x, y: empCurve.y, mode: 'lines', name: 'Empirical ROC',
        line: { color: theme.empirical, width: 1.5 },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: true },
      { x: [empPoint.fpr], y: [empPoint.tpr], mode: 'markers', name: 'Empirical point',
        marker: { color: theme.empiricalPoint,
                  size: Math.max(4, 8 * scale),
                  symbol: 'circle',
                  line: { color: theme.empirical, width: 1.5 } },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false },

      // Theoretical ROC — solid, prominent.
      { x: theoCurve.x, y: theoCurve.y, mode: 'lines', name: 'ROC curve',
        line: { color: theme.theoretical, width: 2.5 },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y },
      { x: [theoPoint.fpr], y: [theoPoint.tpr], mode: 'markers', name: 'Operating point',
        marker: { color: theme.operatingPoint,
                  size: Math.max(6, 12 * scale),
                  symbol: 'circle',
                  line: { color: theme.theoretical, width: 2 } },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false },
    ];
  }
  // --- Layout -----------------------------------------------------------

  // Responsive sizing: same recipe as roc_explorer_engine.js.
  // The ROC subplot is square (scaleanchor), so its pixel box must be
  // square by construction: the ROC panel spans rocWidthFrac of the
  // plot area, so plotAreaH = plotAreaW * rocWidthFrac and height
  // derives from width. The top band hosts title + legend (never the
  // x-labels), and the inter-panel gap is wide enough for the "TPR"
  // ylabel at every width.

// --- Responsive sizing ---
const MARGIN_L = 60;
const MARGIN_R = 20;
const MARGIN_T = 78;    // title (top) + legend (below it)
const MARGIN_B = 55;

const NATURAL_WIDTH = 780;
const MIN_WIDTH = 380;

// Minimum pixel gap to prevent "TPR" label overlap
const MIN_GAP_PX = 46;  // Minimum gap in pixels for the "TPR" label
const ROC_WIDTH_FRAC = 0.56;  // ROC panel width fraction (56% of plot area)

// Dynamically compute panel domains to ensure the gap is wide enough
function panelDomains(width) {
  const plotAreaW = width - MARGIN_L - MARGIN_R;
  // Minimum gap fraction: MIN_GAP_PX / plotAreaW
  const minGapFrac = MIN_GAP_PX / plotAreaW;
  // Ensure the gap is at least minGapFrac (e.g., 20% or MIN_GAP_PX, whichever is larger)
  const gapFrac = Math.max(minGapFrac, 0.20);  // 20% minimum gap
  // Scatter panel takes the remaining space after the gap and ROC panel
  const scatterFrac = 1 - gapFrac - ROC_WIDTH_FRAC;
  return {
    scatter: [0, scatterFrac],
    roc: [1 - ROC_WIDTH_FRAC, 1],
    gapFrac,  // For debugging (optional)
  };
}

function computePlotSize() {
  const measured = plotDiv.getBoundingClientRect().width;
  const available = measured > 0 ? measured : NATURAL_WIDTH;
  const width = Math.max(MIN_WIDTH, Math.min(NATURAL_WIDTH, Math.round(available)));

  // Compute panel domains
  const { scatter: scatterDomain, roc: rocDomain } = panelDomains(width);

  // Ensure the ROC panel is square
  const plotAreaW = width - MARGIN_L - MARGIN_R;
  const plotAreaH = plotAreaW * ROC_WIDTH_FRAC;  // Square ROC subplot
  const height = Math.round(plotAreaH + MARGIN_T + MARGIN_B);

  return { width, height, scatterDomain, rocDomain };
}

const currentScale = () => computePlotSize().width / NATURAL_WIDTH;

function layoutFor(p, yDomain, auc) {
  const dist = distributions[p.distribution || 'gaussian'];
  const Delta = (p.mu1 - p.mu0) / p.sigma1;
  const rho = p.sigma0 / p.sigma1;

  const theme = getThemeColors();
  const { width, height, scatterDomain, rocDomain } = computePlotSize();
  const scale = width / NATURAL_WIDTH;
  const axesTopFrac = (height - MARGIN_T) / height;

  const axisStyle = {
    color: theme.axis,
    linecolor: theme.axis,
    tickcolor: theme.axis,
    gridcolor: theme.grid,
    zerolinecolor: theme.zero,
    title: {
      font: {
        family: FONT_FAMILY,
        size: Math.max(11, 12 * scale),
        color: theme.text,
      },
    },
    tickfont: {
      family: FONT_FAMILY,
      size: Math.max(10, 11 * scale),
      color: theme.text,
    },
  };

  return {
    font: {
      family: FONT_FAMILY,
      size: 12,
      color: theme.text,
    },

    grid: { rows: 1, columns: 2, pattern: 'independent' },

    // Sample distribution panel.
    xaxis: {
      ...axisStyle,
      domain: scatterDomain,
      range: [-1.3, 1.3],
      zeroline: true,
      zerolinecolor: theme.zero,
      showticklabels: false,
      title: {
        text: 'X₁ samples ← | → X₀ samples',
        font: {
          family: FONT_FAMILY,
          size: Math.max(12, 11 * scale),
          color: theme.text,
        },
      },
    },

    yaxis: {
      ...axisStyle,
      domain: [0, 1],
      range: yDomain,
      zerolinecolor: theme.zero,
      gridcolor: theme.grid,
      gridwidth: 1,
      showgrid: true,
      title: {
        text: 'Assay value (X)',
        font: {
          family: FONT_FAMILY,
          size: Math.max(11, 12 * scale),
          color: theme.text,
        },
      },
    },

    // ROC panel.
    [AXIS_ROC.x.replace('x', 'xaxis')]: {
      ...axisStyle,
      domain: rocDomain,
      range: [-0.05, 1.05],
      title: {
        text: 'FPR',
        font: {
          family: FONT_FAMILY,
          size: Math.max(11, 12 * scale),
          color: theme.text,
        },
      },
    },

    [AXIS_ROC.y.replace('y', 'yaxis')]: {
      ...axisStyle,
      range: [-0.05, 1.05],
      scaleanchor: AXIS_ROC.x,
      scaleratio: 1,
      title: {
        text: 'TPR',
        standoff: 12,
        font: {
          family: FONT_FAMILY,
          size: Math.max(11, 12 * scale),
          color: theme.text,
        },
      },
    },

    title: {
      text: `${dist.label} — Δ=${Delta.toFixed(2)}, ρ=${rho.toFixed(2)}`,
      y: 1,
      yanchor: 'top',
      yref: 'container',
      x: 0.5,
      xanchor: 'center',
      font: {
        family: FONT_FAMILY,
        size: Math.max(11, 16 * scale),
        color: theme.title,
      },
      pad: { t: 6, b: 0 },
    },

    legend: {
      orientation: 'h',
      y: axesTopFrac + 0.25,
      yanchor: 'bottom',
      x: 0.5,
      xanchor: 'center',
      font: {
        family: FONT_FAMILY,
        size: Math.max(10, 10 * scale),
        color: theme.text,
      },
      traceorder: 'normal',
    },

    margin: { l: MARGIN_L, r: MARGIN_R, t: MARGIN_T, b: MARGIN_B, pad: 4 },
    width,
    height,
    autosize: false,

    // Keep transparent backgrounds so Quarto's theme shows through.
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };
}

/* -------------------------------------------------------------
   1️⃣  Preserve any user‑zoomed ranges that Plotly is storing.
   ------------------------------------------------------------- */


   /* -------------------------------------------------------------
   Preserve any user‑zoom/pan that Plotly has stored.
   Plotly stores the *current* layout on the DOM element under
   the property `_fullLayout`.  The first (scatter) subplot uses the
   keys `xaxis` / `yaxis`.  The second (ROC) subplot is the **second**
   x‑ and y‑axis, whose keys are `xaxis2` and `yaxis2` (not `x2axis`
   / `y2axis`).  This function copies those ranges into the newly
   generated layout before we call Plotly.react, so the view never
   jumps back to the default after the threshold slider moves.
   ------------------------------------------------------------- */
function preserveZoom(layout) {
  // The full layout exists only after the first draw.
  const existing = plotDiv._fullLayout;
  if (!existing) return layout;   // first render – nothing to keep

  // ----- Scatter panel (left side) -----
  if (existing.xaxis?.range) {
    layout.xaxis.range = existing.xaxis.range.slice();   // clone array
  }
  if (existing.yaxis?.range) {
    layout.yaxis.range = existing.yaxis.range.slice();
  }

  // ----- ROC panel (right side) -----
  // The ROC subplot is the *second* x‑ and y‑axis in Plotly.
  if (existing.xaxis2?.range) {
    // AXIS_ROC.x is "x2".  replace('x','xaxis') => "xaxis2"
    layout[AXIS_ROC.x.replace('x', 'xaxis')].range = existing.xaxis2.range.slice();
  }
  if (existing.yaxis2?.range) {
    layout[AXIS_ROC.y.replace('y', 'yaxis')].range = existing.yaxis2.range.slice();
  }

  return layout;
}

/* -------------------------------------------------------------
   2️⃣  Updated render() – build the layout, then inject the saved
       ranges, then redraw.
   ------------------------------------------------------------- */
function render() {
  const samples   = currentSamples();
  const yDomain   = distributionYDomain(params);
  const auc       = distributionAuc(params);
  const traces    = buildScatterTraces(samples)
                    .concat(buildRocTraces(params, yDomain, samples));

  // Build a fresh layout (titles, margins, colours, …)
  let layout = layoutFor(params, yDomain, auc);

  // Preserve whatever zoom/pan the user applied to either subplot.
  layout = preserveZoom(layout);

  // Re‑draw the figure – Plotly.react replaces the old plot but keeps
  // the axis ranges we just copied, so the view stays exactly as the
  // user left it.
  Plotly.react(plotDiv, traces, layout,
               { responsive: true, displayModeBar: false });
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

// At the very end, insert the theme observer.
// --- Initial theme detection ----------------------------------------

refreshTheme(container);
applyControlTypography(container);
render();

// --- Responsive resizing -------------------------------------------

const ro = new ResizeObserver(() => render());
ro.observe(plotDiv.parentElement);
container._samplingRocResizeObserver = ro;

// --- Dark/light theme changes --------------------------------------

const themeObserver = new MutationObserver(() => {
  if (refreshTheme(container)) {
    // Update text colors in the HTML controls.
    container.querySelectorAll('label, span, .form-label, .form-check-label')
      .forEach((el) => {
        el.style.setProperty('color', getThemeColors().text, 'important');
      });

    // Keep the slider values and prevalence text readable.
    controlTextEls.forEach((el) => {
      el.style.setProperty('color', getThemeColors().muted, 'important');
    });

    prevalenceLabel.style.setProperty(
      'color',
      getThemeColors().muted,
      'important'
    );

    // Update Plotly traces, axes, title, legend, and grid.
    render();
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class', 'data-bs-theme', 'data-theme'],
});

themeObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['class', 'data-bs-theme', 'data-theme'],
});

container._samplingRocThemeObserver = themeObserver;
  // Insert the rest of the theme-observer code here.
}

// Keep this outside the function.
document.querySelectorAll('.sampling-roc-interactive').forEach((container) => {
  initRocSamplingWidget(container);
});
