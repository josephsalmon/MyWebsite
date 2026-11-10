// Three-panel figure: Neyman-Pearson illustration for the fixed Gaussian model
// (mu0=0, sigma0=1, mu1=1, sigma1=2). Display code follows gaussian_symmetric_roc.js.
//
//   [ class densities ] [ log-likelihood ratio ] [ ROC curves + legend ]
//   [                      lambda slider                                ]
//
// Tests drawn on the ROC panel: LR-optimal, one-sided right (X >= t), one-sided left (X <= t),
// two-sided around 0 and around 1, plus the extreme cases.
//
// Responsive: wide (>= 760 px) the two left panels take 50 % of the width and the ROC panel
// (square, with its legend on the right) the other 50 %; narrower, the layout stacks
// (densities + LLR on top, ROC and its legend below), so there is never a horizontal scrollbar.
//
// The two left panels are vertical and SHARE their y axis (the assay value x), like the
// mirrored density panel of roc_explorer_engine.js: X1 (sick, class 1) in blue on the left,
// X0 (healthy, class 0) in red on the right; the log-likelihood ratio l(x) is drawn on the
// same vertical scale, so a horizontal line crosses both panels at the same x.
//
// Works with the HTML block:
//   #gaussian-roc-simple > .gaussian-roc-controls (#lr-threshold, #lr-thr-val) + .gaussian-roc-plot
// (the container is re-arranged by this script: plot on top, controls below).
//
// Independent of gaussian_symmetric_roc.js: only elements with the ids / classes above are
// touched, so the figure built by gaussian_symmetric_roc.js on the same page is left alone.
const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
const PLOTLY_URL = 'https://cdn.plot.ly/plotly-2.35.2.min.js';

// ---------------------------------------------------------------------------
// Colors. Two palettes (light / dark page background); `COLORS` and `THEME`
// are updated in place by refreshTheme(), which reads the *actual* background
// color of the page, so no assumption is made about the site's theme names.
// ---------------------------------------------------------------------------

const LIGHT_COLORS = {
  roc: '#000000ff',                // LR-optimal ROC curve
  test: '#1f77b4',                 // all the other tests (told apart by dash)

  dens0: '#c62828',                // class 0 = X0 healthy (red, right side)
  dens1: '#1769aa',                // class 1 = X1 sick (blue, left side)
  region: '#ff7f0e',               // lambda line / highlighted decision region of the LLR panel

  perfect: '#9467bd',              // Extreme cases
  random: '#8c564b',
  wrong: '#e377c2',

  right: '#1f77b4',   // one-sided X >= t   (blue)
  left:  '#2ca02c',   // one-sided X <= t   (green)
  two:   '#e6a100',   // two-sided |X| >= r (amber)

};

const DARK_COLORS = {
  roc: '#f2f2f2',                  // near white instead of black
  test: '#6cb2eb',                 // lighter blue

  dens0: '#ff8a80',
  dens1: '#64b5f6',
  region: '#ffb74d',

  perfect: '#b79cff',
  random: '#e0a58f',
  wrong: '#f48fb1',

  // DARK_COLORS
  right: '#6cb2eb',
  left:  '#81c784',
  two:   '#ffd54f',
};

const LIGHT_THEME = {
  text: '#333333', title: '#111111', secondary: '#555555',
  grid: '#e5e5e5', border: 'rgba(0,0,0,0.15)', panel: 'rgba(0,0,0,0.02)',
  zeroLine: 'rgba(30, 50, 75, 0.55)', threshold: '#142238',
};

const DARK_THEME = {
  text: '#e6e6e6', title: '#f5f5f5', secondary: '#b8b8b8',
  grid: 'rgba(255,255,255,0.16)', border: 'rgba(255,255,255,0.28)', panel: 'rgba(255,255,255,0.05)',
  zeroLine: 'rgba(220, 232, 250, 0.60)', threshold: '#f0f4fa',
};

const COLORS = { ...LIGHT_COLORS };
const THEME = { dark: false, bg: 'rgb(255,255,255)', ...LIGHT_THEME };

function parseRgba(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return null;
  const v = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
}

// '#rrggbb' + alpha -> 'rgba(r,g,b,a)'
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '').slice(0, 6);
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// First non-transparent background color found going up from `el`.
function pageBackground(el) {
  for (let n = el; n; n = n.parentElement) {
    const c = parseRgba(getComputedStyle(n).backgroundColor);
    if (c && c.a > 0.5) return c;
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

// Updates THEME and COLORS from the page background. Returns true if changed.
function refreshTheme(el) {
  const bg = pageBackground(el);
  const luminance = (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;
  const dark = luminance < 0.5;
  const bgStr = `rgb(${bg.r},${bg.g},${bg.b})`;
  const changed = dark !== THEME.dark || bgStr !== THEME.bg;
  Object.assign(THEME, dark ? DARK_THEME : LIGHT_THEME, { dark, bg: bgStr });
  Object.assign(COLORS, dark ? DARK_COLORS : LIGHT_COLORS);
  return changed;
}

// Plotly is not loaded by the page block: load it if nobody did.
let plotlyPromise = null;
function ensurePlotly() {
  if (window.Plotly) return Promise.resolve(window.Plotly);
  if (!plotlyPromise) {
    plotlyPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PLOTLY_URL;
      s.onload = () => resolve(window.Plotly);
      s.onerror = () => reject(new Error('Could not load Plotly from ' + PLOTLY_URL));
      document.head.appendChild(s);
    });
  }
  return plotlyPromise;
}

// ---------------------------------------------------------------------------
// Maths
// ---------------------------------------------------------------------------

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * z);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-z * z);
  return sign * y;
}

function Phi(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function pdf(x, mu, s) {
  return Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
}

// Model constants
const MU0 = 0, SIGMA0 = 1, MU1 = 1, SIGMA1 = 2;
const DELTA = (MU1 - MU0) / SIGMA1;   // standardized separation
const RHO = SIGMA0 / SIGMA1;          // scale ratio

// LLR(x) = ln f1(x)/f0(x) = A x^2 + B x + C  (quadratic since sigma0 != sigma1)
const A = 0.5 * (1 / SIGMA0 ** 2 - 1 / SIGMA1 ** 2);
const B = MU1 / SIGMA1 ** 2 - MU0 / SIGMA0 ** 2;
const C = Math.log(SIGMA0 / SIGMA1) - 0.5 * MU1 ** 2 / SIGMA1 ** 2 + 0.5 * MU0 ** 2 / SIGMA0 ** 2;
const C_LR = -B / (2 * A);            // vertex: {LLR >= lambda} = {|x - C_LR| >= r}
const llr = (x) => A * x * x + B * x + C;

// P(|X - c| >= r) under N(mu, s^2)
const outside = (c, r, mu, s) => Phi((c - r - mu) / s) + 1 - Phi((c + r - mu) / s);

// two-sided test |X - c| >= r
function twoSidedPoint(c, r) {
  return { fpr: outside(c, r, MU0, SIGMA0), tpr: outside(c, r, MU1, SIGMA1) };
}

// one-sided test X >= t
function oneSidedPoint(t) {
  return { fpr: 1 - Phi((t - MU0) / SIGMA0), tpr: 1 - Phi((t - MU1) / SIGMA1) };
}

// one-sided test on the left: X <= t  (FPR = Phi(t), TPR = Phi((t-1)/2))
function leftSidedPoint(t) {
  return { fpr: Phi((t - MU0) / SIGMA0), tpr: Phi((t - MU1) / SIGMA1) };
}

// Decision region {llr(x) >= lambda} = {x <= a} U {x >= b}; null if it is the whole line
function lrBoundaries(lambda) {
  const disc = B * B - 4 * A * (C - lambda);
  if (disc <= 0) return null;
  const s = Math.sqrt(disc);
  return { a: (-B - s) / (2 * A), b: (-B + s) / (2 * A) };
}

// LR test with LLR threshold lambda: region |x - C_LR| >= r(lambda)
function lrPoint(lambda) {
  const rg = lrBoundaries(lambda);
  const r = rg ? (rg.b - rg.a) / 2 : 0;
  return twoSidedPoint(C_LR, r);
}

// find x in [lo,hi] with fn(x) = target, fn decreasing
function solveDecreasing(fn, target, lo, hi) {
  for (let i = 0; i < 70; i++) {
    const mid = 0.5 * (lo + hi);
    if (fn(mid) > target) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

const R_MAX = 40, T_MIN = -10, T_MAX = 15, NUM = 800;

function sortedCurve(pts) {
  pts.sort((p, q) => p.fpr - q.fpr);
  return { x: pts.map((p) => p.fpr), y: pts.map((p) => p.tpr) };
}

// curve of a family indexed by r in [0, R_MAX] (denser near r = 0)
function radiusCurve(pointFn) {
  const pts = [];
  for (let i = 0; i <= NUM; i++) {
    const u = i / NUM;
    pts.push(pointFn(R_MAX * u * u));
  }
  return sortedCurve(pts);
}

function thresholdCurve(pointFn, tMin, tMax) {
  const pts = [];
  for (let i = 0; i <= NUM; i++) pts.push(pointFn(tMin + (tMax - tMin) * i / NUM));
  return sortedCurve(pts);
}

// Static reference curves and the ROC curves of the four tests
const perfectCurve = { x: [0, 0, 1], y: [0, 1, 1] };
const randomCurve = { x: [0, 1], y: [0, 1] };
const wrongCurve = { x: [0, 1, 1], y: [0, 0, 1] };

const lrCurve = radiusCurve((r) => twoSidedPoint(C_LR, r));      // LR-optimal (Neyman-Pearson)
const oneSidedCurve = thresholdCurve(oneSidedPoint, T_MIN, T_MAX);
const leftSidedCurve = thresholdCurve(leftSidedPoint, T_MIN, T_MAX);
const twoNullCurve = radiusCurve((r) => twoSidedPoint(MU0, r));

// AUC of the LR-optimal curve (trapezoid rule)
const AUC_LR = (() => {
  let s = 0;
  for (let i = 1; i < lrCurve.x.length; i++) {
    s += (lrCurve.x[i] - lrCurve.x[i - 1]) * (lrCurve.y[i] + lrCurve.y[i - 1]) / 2;
  }
  return s;
})();

// ---------------------------------------------------------------------------
// Density / LLR panels
// ---------------------------------------------------------------------------

const Y_MIN = -7, Y_MAX = 7;
const L_MIN = -1.5, L_MAX = 12;   // LLR >= -0.86 always, so nothing is lost on the left

const linspace = (u, v, n) => Array.from({ length: n + 1 }, (_, i) => u + (v - u) * i / n);

// y-intervals (clamped to the panel) where llr(y) >= lambda
function regionSegments(lambda) {
  const rg = lrBoundaries(lambda);
  const segs = rg
    ? [[Y_MIN, Math.min(rg.a, Y_MAX)], [Math.max(rg.b, Y_MIN), Y_MAX]]
    : [[Y_MIN, Y_MAX]];
  return segs.filter(([u, v]) => v > u);
}

// --- Small DOM helpers, to avoid repeating the slider/label boilerplate ---

function addLabel(parent, text, { top = false } = {}) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.fontFamily = FONT_FAMILY;
  el.style.fontWeight = '600';
  el.style.fontSize = '9.5px';
  el.style.margin = top ? '8px 0 4px 0' : '0 0 4px 0';
  parent.appendChild(el);
  return el;
}

function addSlider(parent, { min, max, step, value }) {
  const slider = document.createElement('input');
  Object.assign(slider, { type: 'range', min, max, step, value });
  slider.style.width = '100%';
  parent.appendChild(slider);

  const valueLabel = document.createElement('div');
  parent.appendChild(valueLabel);

  return { slider, valueLabel };
}

function styleValueLabel(el) {
  Object.assign(el.style, {
    display: 'block', marginTop: '4px', textAlign: 'center',
    fontFamily: FONT_FAMILY, fontSize: '9px', fontWeight: 'normal', color: THEME.secondary,
  });
}

// One curve + its operating-point marker, sharing a color/legend entry.
function curveAndPoint(curve, pt, { color, width, dash, name, legend, legendrank, markerSize = 10, symbol = 'circle' }) {
  const legendgroup = 'curve-' + name;
  return [
    { x: curve.x, y: curve.y, mode: 'lines', name, legend, legendgroup, legendrank,
      line: { color, width, dash }, showlegend: true },
    { x: [pt.fpr], y: [pt.tpr], mode: 'markers', legend, legendgroup, legendrank,
      // filled marker with a thin outline in the page background, so it stays readable on the curves
      marker: { color, size: markerSize, symbol, line: { color: THEME.bg, width: 1.5 } },
      showlegend: false },
  ];
}

export async function initGaussianRocSimpleWidget(container) {
  // Never touch the container of gaussian_symmetric_roc.js, nor initialise twice.
  if (container.classList && container.classList.contains('gaussian-symmetric-roc-interactive')) return;
  if (container.__gaussianRocSimpleInit) return;
  container.__gaussianRocSimpleInit = true;

  const controlsDiv = container.querySelector('.gaussian-roc-controls');
  const plotDiv = container.querySelector('.gaussian-roc-plot');
  if (!controlsDiv || !plotDiv) {
    console.error('gaussian_roc_simple.js: .gaussian-roc-controls / .gaussian-roc-plot not found in', container);
    return;
  }

  const Plotly = await ensurePlotly();
  refreshTheme(container);

  // Arrange the widget: plot on top (full width), controls below it.
  Object.assign(container.style, {
    display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch',
    gap: '8px', width: '100%', maxWidth: '1000px', margin: '0 auto',
    minWidth: '0', boxSizing: 'border-box',
  });
  // `contain: inline-size` stops the (fixed-width) Plotly SVG from contributing to the
  // intrinsic width of the widget. Without it, a flex/grid/figure parent cannot shrink
  // below the previous plot width, so the measured width stays stale after a resize
  // until the page is reloaded.
  Object.assign(plotDiv.style, {
    order: '1', flex: '0 0 auto', minWidth: '0', width: '100%',
    display: 'block', overflowX: 'hidden', contain: 'inline-size',
  });
  Object.assign(controlsDiv.style, {
    order: '2', flex: '0 0 auto', minWidth: '0', width: '100%', maxWidth: '560px',
    alignSelf: 'center', boxSizing: 'border-box', justifyContent: 'flex-start',
  });

    // λ range: below LLR_MIN the decision region is the whole line (FPR = TPR = 1),
  // so the slider starts just under it; lMax is large enough to approach the (0,0) corner.
  const LLR_MIN = C - B * B / (4 * A);            // ≈ -0.860
  const lMin = Math.floor(LLR_MIN * 10) / 10;     // -0.9
  const lMax = 12;

  // LLR threshold control: reuse the slider of the page block, else create one.
  let thresholdSlider = container.querySelector('#lr-threshold');
  let thresholdValueLabel = container.querySelector('#lr-thr-val');
  let thresholdTitle = controlsDiv.querySelector('label');
  if (thresholdSlider && thresholdValueLabel) {
    if (thresholdTitle) {
      Object.assign(thresholdTitle.style, {
        fontFamily: FONT_FAMILY, fontWeight: '600', fontSize: '9.5px', margin: '0 0 4px 0',
      });
    }
    thresholdSlider.style.width = '100%';
    // The HTML block may carry its own min/max/step: override them so the JS range wins.
    Object.assign(thresholdSlider, { min: lMin, max: lMax, step: 0.01 });
    thresholdSlider.value = Math.min(Math.max(parseFloat(thresholdSlider.value) || 0, lMin), lMax);
  } else {
    thresholdTitle = addLabel(controlsDiv, 'Log-likelihood-ratio threshold');
    ({ slider: thresholdSlider, valueLabel: thresholdValueLabel } =
      addSlider(controlsDiv, { min: lMin, max: lMax, step: 0.01, value: 0 }));
  }
  styleValueLabel(thresholdValueLabel);


  function updateThresholdValueLabel() {
    const lambda = parseFloat(thresholdSlider.value);
    const pt = lrPoint(lambda);
    thresholdValueLabel.textContent =
      'λ = ' + lambda.toPrecision(3) +
      '   ·   FPR = ' + pt.fpr.toFixed(3) +
      '   ·   TPR = ' + pt.tpr.toFixed(3);
  }
  updateThresholdValueLabel();

  // Legend of the operating-point markers
  const legendRow = document.createElement('div');
  Object.assign(legendRow.style, {
    marginTop: '10px', fontFamily: FONT_FAMILY, fontSize: '8.5px',
    lineHeight: '1.5', display: 'flex', flexWrap: 'wrap',
    justifyContent: 'center', gap: '4px 14px',
  });
  controlsDiv.appendChild(legendRow);

    function fillLegendRow() {
    const SHAPES = {
      star:  '<polygon points="5,0.5 6.4,3.7 9.8,3.9 7.2,6.1 8.1,9.4 5,7.6 1.9,9.4 2.8,6.1 0.2,3.9 3.6,3.7"/>',
      right: '<polygon points="1,0.5 9.5,5 1,9.5"/>',
      left:  '<polygon points="9,0.5 0.5,5 9,9.5"/>',
      square:'<rect x="1" y="1" width="8" height="8"/>',
    };
    legendRow.innerHTML = [
      [COLORS.roc,   'star',   'LR-optimal test'],
      [COLORS.right, 'right',  'One-sided (right)'],
      [COLORS.left,  'left',   'One-sided (left)'],
      [COLORS.two,   'square', 'Two-sided'],
    ].map(([color, shape, label]) => `
    <div style="display:flex; align-items:center; gap:4px;">
      <svg width="11" height="11" viewBox="0 0 10 10" fill="${color}" style="flex:none">${SHAPES[shape]}</svg>
      ${label}
    </div>`).join('');
  }

  // Everything in the controls box that depends on the page theme.
  function styleControls() {
    controlsDiv.style.border = `1px solid ${THEME.border}`;
    controlsDiv.style.background = THEME.panel;
    controlsDiv.style.color = THEME.text;
    [thresholdValueLabel, legendRow].forEach((el) => {
      el.style.color = THEME.secondary;
    });
    fillLegendRow();
  }
  styleControls();

  // Scale factor derived from how far the current responsive width has
  // shrunk relative to the widget's natural size — used to keep marker
  // sizes proportional as the figure scales down.
  function currentScale() {
    const { width } = computePlotSize();
    return width / NATURAL_WIDTH;
  }

  // ---- Left panel: mirrored class densities (vertical), decision region shaded ----
  // X1 (sick, class 1) goes to the left (blue), X0 (healthy, class 0) to the right (red).
  const MAX_DENSITY = Math.max(pdf(MU0, MU0, SIGMA0), pdf(MU1, MU1, SIGMA1));
  const DENS_RANGE = MAX_DENSITY * 1.15;

  function densityTraces(lambda) {
    const rg = lrBoundaries(lambda);

    // grid with the region boundaries inserted, so the pieces meet exactly
    const ys = linspace(Y_MIN, Y_MAX, 300);
    if (rg) [rg.a, rg.b].forEach((v) => { if (v > Y_MIN && v < Y_MAX) ys.push(v); });
    ys.sort((p, q) => p - q);

    // consecutive pieces: inside the decision region {llr >= lambda} or outside
    const inRegion = (y) => llr(y) >= lambda;
    const pieces = [];
    let start = 0, cur = inRegion(0.5 * (ys[0] + ys[1]));
    for (let i = 1; i < ys.length - 1; i++) {
      const m = inRegion(0.5 * (ys[i] + ys[i + 1]));
      if (m !== cur) { pieces.push({ i0: start, i1: i, strong: cur }); start = i; cur = m; }
    }
    pieces.push({ i0: start, i1: ys.length - 1, strong: cur });

    const classes = [
      { mu: MU1, s: SIGMA1, sign: -1, color: COLORS.dens1 },   // X1 (sick), left
      { mu: MU0, s: SIGMA0, sign: +1, color: COLORS.dens0 },   // X0 (healthy), right
    ];
    const traces = [];
    classes.forEach(({ mu, s, sign, color }) => {
      pieces.forEach(({ i0, i1, strong }) => {
        const yy = ys.slice(i0, i1 + 1);
        traces.push({
          x: yy.map((y) => sign * pdf(y, mu, s)), y: yy, mode: 'lines',
          fill: 'tozerox', fillcolor: hexToRgba(color, strong ? 0.42 : 0.16),
          line: { color, width: 1.8 },
          xaxis: 'x', yaxis: 'y', showlegend: false, hoverinfo: 'skip',
        });
      });
    });

    // region boundaries (horizontal "thresholds" a and b)
    if (rg) {
      [rg.a, rg.b].filter((v) => v > Y_MIN && v < Y_MAX).forEach((v) => {
        traces.push({
          x: [-DENS_RANGE, DENS_RANGE], y: [v, v], mode: 'lines',
          line: { color: THEME.threshold, width: 2 },
          xaxis: 'x', yaxis: 'y', showlegend: false, hoverinfo: 'skip',
        });
      });
    }
    return traces;
  }

  // ---- Middle panel: log-likelihood ratio, same vertical axis (x), region shaded ----
  function llrTraces(lambda) {
    const ys = linspace(Y_MIN, Y_MAX, 400);
    const traces = [];

    // shaded region: between the vertical line l = lambda and the curve, where curve >= lambda
    regionSegments(lambda).forEach(([u, v]) => {
      const seg = linspace(u, v, 160);
      traces.push({
        x: seg.map(() => lambda), y: seg, mode: 'lines', xaxis: 'x2', yaxis: 'y2',
        showlegend: false, hoverinfo: 'skip', line: { width: 0 },
      });
      traces.push({
        x: seg.map(llr), y: seg, mode: 'lines', xaxis: 'x2', yaxis: 'y2',
        showlegend: false, hoverinfo: 'skip', line: { width: 0 },
        fill: 'tonextx', fillcolor: hexToRgba(COLORS.region, 0.45),
      });
    });

    // reference level: likelihood ratio = 1  (log-likelihood ratio = 0)
    traces.push({
      x: [0, 0], y: [Y_MIN, Y_MAX], mode: 'lines', xaxis: 'x2', yaxis: 'y2',
      showlegend: false, hoverinfo: 'skip',
      line: { color: THEME.secondary, width: 1, dash: 'dot' },
    });

    // threshold lambda
    traces.push({
      x: [lambda, lambda], y: [Y_MIN, Y_MAX], mode: 'lines', xaxis: 'x2', yaxis: 'y2',
      showlegend: false, hoverinfo: 'skip',
      line: { color: COLORS.region, width: 2, dash: 'dash' },
    });

    // region boundaries (same horizontal lines as in the density panel)
    const rg = lrBoundaries(lambda);
    if (rg) {
      [rg.a, rg.b].filter((v) => v > Y_MIN && v < Y_MAX).forEach((v) => {
        traces.push({
          x: [L_MIN, L_MAX], y: [v, v], mode: 'lines', xaxis: 'x2', yaxis: 'y2',
          showlegend: false, hoverinfo: 'skip',
          line: { color: THEME.threshold, width: 1, dash: 'dot' },
        });
      });
    }

    // the log-likelihood ratio itself, l(x) on the horizontal axis, x on the vertical one
    traces.push({
      x: ys.map(llr), y: ys, mode: 'lines', xaxis: 'x2', yaxis: 'y2',
      showlegend: false, hoverinfo: 'skip',
      line: { color: COLORS.roc, width: 2.5 },
    });
    return traces;
  }

  // ---- Right panel: ROC curves ----
  function rocTraces(lambda) {

  const scale = currentScale();

  const scaleMarker = (size) =>
    Math.max(4, size * scale);

  // LR test at the slider value; the other tests are matched on the same FPR
  const lr = lrPoint(lambda);
  const f = lr.fpr;
  const t = solveDecreasing((x) => oneSidedPoint(x).fpr, f, T_MIN, T_MAX);
  // left test X <= s has FPR = Phi(s) = 1 - Phi(-s): same FPR as the right test at t when s = -t
  const sLeft = -t;
  const rNull = solveDecreasing((r) => twoSidedPoint(MU0, r).fpr, f, 0, R_MAX);

  const traces = [

    // vertical guide: same false-positive rate for all tests
    {
      x: [f, f],
      y: [0, 1],
      mode: 'lines',
      showlegend: false,
      hoverinfo: 'skip',
      line: { color: THEME.secondary, width: 1, dash: 'dot' },
    },

    // ===============================================================
    // NEYMAN-PEARSON — heading
    // ===============================================================

    {
      x: [null],
      y: [null],
      mode: 'lines',
      name: '<b>Neyman–Pearson</b>',
      legend: 'legend',
      legendgroup: 'heading-np',
      legendrank: 100,
      showlegend: true,
      line: { width: 0 },
      hoverinfo: 'skip',
    },




    // ===============================================================
    // OTHER TESTS — heading
    // ===============================================================

    {
      x: [null],
      y: [null],
      mode: 'lines',
      name: '<b>Other tests</b>',
      legend: 'legend',
      legendgroup: 'heading-others',
      legendrank: 200,
      showlegend: true,
      line: { width: 0 },
      hoverinfo: 'skip',
    },

    // One-sided
    ...curveAndPoint(
      oneSidedCurve,
      oneSidedPoint(t),
      {
        color: COLORS.right, markerSize: scaleMarker(12), symbol: 'triangle-right',
        width: 2,
        dash: 'dot',
        name: 'One-sided: X ≥ t',
        legend: 'legend',
        legendrank: 201,
        markerSize: scaleMarker(10),
      }
    ),

    // One-sided on the left
    ...curveAndPoint(
      leftSidedCurve,
      leftSidedPoint(sLeft),
      {
        color: COLORS.left,
        markerSize: scaleMarker(12),
        symbol: 'triangle-left',
        width: 2,
        dash: 'dashdot',
        name: 'One-sided: X ≤ t',
        legend: 'legend',
        legendrank: 202,
        markerSize: scaleMarker(10),
      }
    ),

    // Two-sided around the null mean
    ...curveAndPoint(
      twoNullCurve,
      twoSidedPoint(MU0, rNull),
      {
        color: COLORS.two,
        markerSize: scaleMarker(10),
        symbol: 'square',
        width: 2,
        dash: 'dash',
        name: 'Two-sided: |X| ≥ r',
        legend: 'legend',
        legendrank: 203,
        markerSize: scaleMarker(10),
      }
    ),

    // LR-optimal ROC
    ...curveAndPoint(
      lrCurve,
      lr,
      {
        color: COLORS.roc,
        markerSize: scaleMarker(18),
        symbol: 'star',
        width: 2.5,
        dash: 'solid',
        name: 'LR: |X + 1/3| ≥ r',
        legend: 'legend',
        legendrank: 101,
        markerSize: scaleMarker(16),
      }
    ),

    // ===============================================================
    // EXTREME CASES — heading
    // ===============================================================

    {
      x: [null],
      y: [null],
      mode: 'lines',
      name: '<b>Extreme cases</b>',
      legend: 'legend',
      legendgroup: 'heading-extreme',
      legendrank: 300,
      showlegend: true,
      line: { width: 0 },
      hoverinfo: 'skip',
    },

    // Perfect
    {
      x: perfectCurve.x,
      y: perfectCurve.y,
      mode: 'lines',
      name: 'Perfect',
      legend: 'legend',
      legendgroup: 'curve-Perfect',
      legendrank: 301,
      showlegend: true,
      line: {
        color: COLORS.perfect,
        width: 1.5,
        dash: 'dot',
      },
    },

    // Random
    {
      x: randomCurve.x,
      y: randomCurve.y,
      mode: 'lines',
      name: 'Random',
      legend: 'legend',
      legendgroup: 'curve-Random',
      legendrank: 302,
      showlegend: true,
      line: {
        color: COLORS.random,
        width: 1.5,
        dash: 'dash',
      },
    },

    // Always wrong
    {
      x: wrongCurve.x,
      y: wrongCurve.y,
      mode: 'lines',
      name: 'Always wrong',
      legend: 'legend',
      legendgroup: 'curve-Always wrong',
      legendrank: 303,
      showlegend: true,
      line: {
        color: COLORS.wrong,
        width: 1.5,
        dash: 'longdashdot',
      },
    },

  ];

  traces.forEach((tr) => { tr.xaxis = 'x3'; tr.yaxis = 'y3'; });
  return traces;
}

  function buildTraces(lambda) {
    return [...densityTraces(lambda), ...llrTraces(lambda), ...rocTraces(lambda)];
  }


// -------------------------------------------------------------------
// One legend (ROC panel), with three explicitly grouped sections.
// -------------------------------------------------------------------

let cachedNormalGap = null;

function compactLegendInterlineSpacing() {

  const items = plotDiv.querySelectorAll('.legend .traces');

  // Expected order:
  // 0  Neyman–Pearson
  // 1  LR-optimal
  // 2  Other tests (same FPR)
  // 3  One-sided (X >= t)
  // 4  One-sided (X <= t)
  // 5  Two-sided |X|
  // 6  Extreme cases
  // 7  Perfect
  // 8  Random
  // 9  Always wrong

  if (items.length < 10) return;

  const transforms = Array.from(items).map(item => {
    const transform = item.getAttribute('transform') || '';
    const match = transform.match(
      /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/
    );

    if (!match) return null;

    return {
      item,
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
    };
  });

  if (transforms.some(v => v === null)) return;

  // Use the normal Plotly spacing as the reference gap.
  // Measured once, from Plotly's untouched layout, then cached: re-applying
  // the compaction after a legend redraw must never compound.
  if (cachedNormalGap === null) cachedNormalGap = transforms[1].y - transforms[0].y;
  const normalGap = cachedNormalGap;

  // Gap between consecutive legend items.
  //
  // 1.00 = normal Plotly spacing
  // 0.63 = 37% reduced spacing
  //
  // Headings / block boundaries keep the larger spacing.
  const gapFactor = [
    .800, // Neyman–Pearson → LR-optimal
    .800, // LR-optimal → Other tests
    .800, // Other tests → One-sided

    0.630, // One-sided (right) → One-sided (left)
    0.630, // One-sided (left) → Two-sided |X|

    .800, // Two-sided |X| → Extreme cases
    .800, // Extreme cases → Perfect

    0.630, // Perfect → Random
    0.630, // Random → Always wrong
  ];

  let y = transforms[0].y;

  transforms[0].item.setAttribute(
    'transform',
    `translate(${transforms[0].x},${y})`
  );

  for (let i = 1; i < transforms.length; i++) {

    const gap = normalGap * gapFactor[i - 1];

    y += gap;

    transforms[i].item.setAttribute(
      'transform',
      `translate(${transforms[i].x},${y})`
    );
  }
}


function legendLayout() {

  return {

    orientation: 'v',

    y: 0.98,
    yanchor: 'top',

    x: 1.02,
    xanchor: 'left',

    valign: 'top',

    font: {
      size: 10,
      family: FONT_FAMILY,
    },

    borderwidth: 0,

    itemwidth: 28,

    traceorder: 'normal',
  };
}

// ---------------------------------------------------------------------------
// Responsive sizing
// ---------------------------------------------------------------------------
// Wide (>= STACK_BELOW): three panels in one row.
//   density | LLR | ROC+legend
//   Fractions of the plot area (between MARGIN_L and the legend band):
//     density: DENS_FRAC   (narrow — just two mirrored density curves)
//     gap1:    GAP1_FRAC   (small gap between density and LLR)
//     LLR:     LLR_FRAC
//     gap2:    GAP2_PX     (fixed pixel gap: ROC y-axis labels live here)
//     ROC:     (1 - DENS_FRAC - GAP1_FRAC - LLR_FRAC) * plotW - GAP2_PX
//   The ROC panel is square (scaleanchor), so height = ROC side + margins.
//
// Narrow (< STACK_BELOW): density + LLR stacked on the top row, ROC on the
// bottom row. Legend moves below the ROC panel.
// ---------------------------------------------------------------------------

const MARGIN_L  = 55;
const MARGIN_R  = 175;      // legend band (wide layout)
const MARGIN_R_STACK = 20;
const MARGIN_T  = 44;       // title band
const MARGIN_B  = 45;
const LEGEND_H  = 180;      // room for the legend below ROC in stacked layout
const ROW_GAP   = 84;       // vertical gap between top row and ROC in stacked layout

const NATURAL_WIDTH = 760;
const MIN_WIDTH     = 300;
const MIN_PLOT_SIDE = 160;  // floor on the ROC square side
const STACK_BELOW   = 640;

// Fractional widths of density and LLR panels (of the plot area).
// Chosen so that the ROC panel is roughly half the plot area on a wide screen.
const DENS_FRAC  = 0.14;   // density panel
const GAP1_FRAC  = 0.02;   // density → LLR gap
const LLR_FRAC   = 0.16;   // LLR panel
const STACK_DENS_FRAC = 0.50;  // stacked layout: density panel (needs room for its title / axis title)
const STACK_GAP_FRAC  = 0.05;  // stacked layout: gap density → LLR
const GAP2_PX    = 72;     // LLR → ROC gap in pixels (room for the ROC y tick labels + axis title);
                           // fixed in px (not a fraction) so the labels never touch the LLR panel
// ROC side = (1 - DENS_FRAC - GAP1_FRAC - LLR_FRAC) * plotW - GAP2_PX

function computePlotSize() {
  const measured   = Math.min(
    plotDiv.getBoundingClientRect().width || Infinity,
    plotDiv.parentElement ? plotDiv.parentElement.getBoundingClientRect().width || Infinity : Infinity,
  );
  const available  = measured > 0 ? measured : NATURAL_WIDTH;
  const width      = Math.max(MIN_WIDTH, Math.min(NATURAL_WIDTH, Math.round(available)));
  const stacked    = width < STACK_BELOW;

  if (!stacked) {
    const plotW = width - MARGIN_L - MARGIN_R;
    const rocSide = Math.max(MIN_PLOT_SIDE, Math.round(
      (1 - DENS_FRAC - GAP1_FRAC - LLR_FRAC) * plotW - GAP2_PX
    ));

    // Panel x-domains (fractions of plotW)
    const x0_dens  = 0;
    const x1_dens  = DENS_FRAC;
    const x0_llr   = x1_dens + GAP1_FRAC;
    const x1_llr   = x0_llr  + LLR_FRAC;
    const x0_roc   = x1_llr  + GAP2_PX / plotW;
    const x1_roc   = x0_roc  + rocSide / plotW;

    return {
      width,
      height: rocSide + MARGIN_T + MARGIN_B,
      stacked, plotW,
      margin: { l: MARGIN_L, r: MARGIN_R, t: MARGIN_T, b: MARGIN_B },
      llrW: LLR_FRAC * plotW,
      densW: DENS_FRAC * plotW,
      densTitle: 'X₁ ← density → X₀',
      domDens: { x: [x0_dens, x1_dens], y: [0, 1] },
      domLlr:  { x: [x0_llr,  x1_llr],  y: [0, 1] },
      domRoc:  { x: [x0_roc,  x1_roc],  y: [0, 1] },
      legend:  legendLayout(),
    };
  }

  // --- stacked ---
  const plotW    = width - MARGIN_L - MARGIN_R_STACK;
  const topH     = Math.min(Math.round(0.55 * plotW), 300);
  const rocSide  = Math.min(Math.round(0.75 * plotW), 300);
  const rocX0    = Math.max(0, (plotW - rocSide) / 2);
  const plotH    = topH + ROW_GAP + rocSide;

  // Top row: density and LLR share the full width
  // (the density panel used to be only 14 % wide here, so its titles collided with the LLR ones)
  const x1_dens  = STACK_DENS_FRAC;
  const x0_llr   = x1_dens + STACK_GAP_FRAC;

  const yTop = [(rocSide + ROW_GAP) / plotH, 1];
  const yBot = [0, rocSide / plotH];

  return {
    width,
    height: MARGIN_T + plotH + MARGIN_B + LEGEND_H,
    stacked, plotW,
    margin: { l: MARGIN_L, r: MARGIN_R_STACK, t: MARGIN_T, b: MARGIN_B + LEGEND_H },
    llrW: (1 - x0_llr) * plotW,
    densW: x1_dens * plotW,
    densTitle: x1_dens * plotW >= 105 ? 'X₁ ← density → X₀' : 'X₁ ← → X₀',
    domDens: { x: [0,       x1_dens], y: yTop },
    domLlr:  { x: [x0_llr,  1      ], y: yTop },
    domRoc:  { x: [rocX0 / plotW, (rocX0 + rocSide) / plotW], y: yBot },
    legend: {
      ...legendLayout(),
      x: (rocX0 + rocSide / 2) / plotW, xanchor: 'center',
      y: -68 / plotH, yanchor: 'top',
    },
  };
}


  function layout(lambda) {
    const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const g = computePlotSize();
    const { width, height } = g;

    const scale = width / NATURAL_WIDTH;

    const axisBase = {
      showline: false,
      zeroline: false,
      gridcolor: THEME.grid,
      gridwidth: 1,
      fixedrange: true,
    };
    const axisTitle = (text, size = 12) => ({ text, font: { size }, standoff: 8 });
    const smallNote = { size: 10, family: FONT_FAMILY, color: THEME.secondary };
    const panelTitle = (xr, yr, text) => ({
      xref: xr + ' domain', yref: yr + ' domain', x: 0.5, y: 1.03,
      xanchor: 'center', yanchor: 'bottom', showarrow: false, text: '<b>' + text + '</b>',
      font: { size: 12, family: FONT_FAMILY, color: THEME.text },
    });
    const title = width < 520
      ? `Gaussian model  —  AUC(LR) = ${AUC_LR.toFixed(3)}`
      : 'Gaussian model  —  ' +
        `Δ = ${DELTA.toFixed(2)}, ρ = ${RHO.toFixed(2)}  →  AUC(LR) = ${AUC_LR.toFixed(3)}`;

    return {
      font: { family: FONT_FAMILY, size: 12, color: THEME.text },
      title: {
        text: title,
        x: 0.5, xanchor: 'center', xref: 'container',
        y: 1, yanchor: 'top', yref: 'container',
        font: { size: Math.max(11, 14 * scale), family: FONT_FAMILY, color: THEME.title },
        pad: { t: 6, b: 0 },
      },

      // panel 1: mirrored class densities (vertical axis = assay value x, shared with panel 2)
      xaxis: {
        ...axisBase, domain: g.domDens.x, anchor: 'y', range: [-DENS_RANGE, DENS_RANGE],
        zeroline: true, zerolinecolor: THEME.zeroLine, showticklabels: false,
        title: axisTitle(g.densTitle, 11),
      },
      yaxis: {
        ...axisBase, domain: g.domDens.y, anchor: 'x', range: [Y_MIN, Y_MAX],
        title: axisTitle('Assay value (X)'),
      },

      // panel 2: log-likelihood ratio, drawn against the SAME vertical axis
      xaxis2: {
        ...axisBase, domain: g.domLlr.x, anchor: 'y2', range: [L_MIN, L_MAX],
        tickvals: g.llrW >= 90 ? [0, 4, 8, 12] : [0, 6, 12],
        ticks: 'outside', ticklen: 4, tickcolor: THEME.secondary,
        tickfont: { size: 10, color: THEME.secondary },
        title: axisTitle('ℓ(x)'),
      },
      yaxis2: {
        ...axisBase, domain: g.domLlr.y, anchor: 'x2', range: [Y_MIN, Y_MAX],
        matches: 'y', showticklabels: false,
        ticks: 'outside', ticklen: 4, tickcolor: THEME.secondary,   // tick marks only: labels are on the left panel
      },

      // panel 3: ROC (square)
      xaxis3: {
        ...axisBase, domain: g.domRoc.x, anchor: 'y3', range: [-0.04, 1.04], autorange: false,
        tickvals: ticks, title: axisTitle('False Positive Rate'),
      },
      yaxis3: {
        ...axisBase, domain: g.domRoc.y, anchor: 'x3', range: [-0.04, 1.04], autorange: false,
        scaleanchor: 'x3', scaleratio: 1,
        tickvals: ticks, title: axisTitle('True Positive Rate'),
      },

      annotations: [
        panelTitle('x', 'y', 'Class densities'),
        panelTitle('x2', 'y2', g.llrW >= 125 ? 'Log-likelihood ratio' : 'Log-LR'),
        panelTitle('x3', 'y3', 'ROC curves'),
        // class labels (density panel)
        { xref: 'x domain', yref: 'y domain', x: 0.03, y: 0.99, xanchor: 'left', yanchor: 'top',
          showarrow: false, text: 'X₁',
          font: { size: 10, family: FONT_FAMILY, color: COLORS.dens1 } },
        { xref: 'x domain', yref: 'y domain', x: 0.97, y: 0.99, xanchor: 'right', yanchor: 'top',
          showarrow: false, text: 'X₀',
          font: { size: 10, family: FONT_FAMILY, color: COLORS.dens0 } },
        // level labels (LLR panel)
        { xref: 'x2', yref: 'y2 domain', x: lambda, y: 0.99, xanchor: 'left', yanchor: 'top',
          xshift: 3, showarrow: false, text: 'λ',
          font: { size: 11, family: FONT_FAMILY, color: COLORS.region } },
        { xref: 'x2', yref: 'y2 domain', x: 0, y: 0.01, xanchor: 'left', yanchor: 'bottom',
          xshift: 3, showarrow: false, text: 'LR = 1', font: smallNote },
      ],
      margin: { ...g.margin, pad: 0 },

      legend: g.legend,
      uirevision: 'keep',
      width,
      height,
      autosize: false,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
  }

  let rendering = false, pending = false;
  async function render() {
    if (rendering) { pending = true; return; }
    rendering = true;
    const lambda = parseFloat(thresholdSlider.value);
    await Plotly.react(plotDiv, buildTraces(lambda), layout(lambda), { displayModeBar: false });
    compactLegendInterlineSpacing();
    rendering = false;
    if (pending) { pending = false; render(); }
  }

  thresholdSlider.addEventListener('input', () => { updateThresholdValueLabel(); render(); });

  // Follow the site's light / dark toggle (Quarto swaps stylesheets and body
  // classes) and the OS preference. The stylesheet swap is not instantaneous,
  // so the check is repeated shortly after each change.
  function refreshThemeAndRender() {
    if (refreshTheme(container)) {
      styleControls();
      render();
    }
  }
  let themeTimers = [];
  function scheduleThemeCheck() {
    themeTimers.forEach(clearTimeout);
    themeTimers = [60, 400].map((ms) => setTimeout(refreshThemeAndRender, ms));
  }
  const themeObserver = new MutationObserver(scheduleThemeCheck);
  themeObserver.observe(document.documentElement, { attributes: true });
  themeObserver.observe(document.body, { attributes: true });
  themeObserver.observe(document.head, {
    subtree: true, attributes: true, attributeFilter: ['disabled', 'rel', 'media', 'href'],
  });
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener?.('change', scheduleThemeCheck);

  const isHeading = (ev) =>
    String(ev.data[ev.curveNumber].legendgroup || '').startsWith('heading-');

  let lastWidth = null;

  render().then(() => {   // initial; attach legend handlers once the plot exists
    plotDiv.on('plotly_legendclick', (ev) => !isHeading(ev));
    plotDiv.on('plotly_legenddoubleclick', (ev) => !isHeading(ev));
    // Plotly redraws the legend after a click/restyle and resets the item
    // positions; re-apply the compact spacing so nothing shifts.
    plotDiv.on('plotly_restyle', compactLegendInterlineSpacing);
    plotDiv.on('plotly_afterplot', compactLegendInterlineSpacing);
  });
  requestAnimationFrame(() => {
    const w = Math.round(plotDiv.parentElement.getBoundingClientRect().width);
    if (w !== lastWidth && w > 0) { lastWidth = w; render(); }
  });

  // Re-render (recomputing layout width/height) whenever the widget's
  // box changes size, scoped to this widget's own element via ResizeObserver
  // so multiple independent widgets on one page don't interfere.
  const ro = new ResizeObserver((entries) => {
    const w = Math.round(entries[0].contentRect.width);
    if (w === lastWidth) return;   // ignore height-only changes from our own renders
    lastWidth = w;
    render();
  });
  ro.observe(plotDiv.parentElement);   // parent shrinks with the page; div doesn't

  // Fallbacks: window resize (zoom, devtools docking, orientation) and a re-check on the
  // next frame, in case the layout had not settled when the observer fired.
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const w = Math.round(plotDiv.parentElement.getBoundingClientRect().width);
      if (w > 0) { lastWidth = w; render(); }
    });
  });
}

document
  .querySelectorAll('#gaussian-roc-simple')
  .forEach((container) => {
    initGaussianRocSimpleWidget(container).catch((err) => console.error(err));
  });