// Single-panel ROC plot: fixed Gaussian model (mu0=0, sigma0=1, mu1=1, sigma1=2)
const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

// ---------------------------------------------------------------------------
// Colors. Two palettes (light / dark page background); `COLORS` and `THEME`
// are updated in place by refreshTheme(), which reads the *actual* background
// color of the page, so no assumption is made about the site's theme names.
// ---------------------------------------------------------------------------

const LIGHT_COLORS = {
  roc: '#000000ff',                // Original ROC curve
  thresholdReversal: '#1f77b4',
  classSwap: '#1f77b4',
  classSwapReversal: '#1f77b4',

  perfect: '#9467bd',              // Extreme cases
  random: '#8c564b',
  wrong: '#e377c2',
};

const DARK_COLORS = {
  roc: '#f2f2f2',                  // near white instead of black
  thresholdReversal: '#6cb2eb',    // lighter blue
  classSwap: '#6cb2eb',
  classSwapReversal: '#6cb2eb',

  perfect: '#b79cff',
  random: '#e0a58f',
  wrong: '#f48fb1',
};

const LIGHT_THEME = {
  text: '#333333', title: '#111111', secondary: '#555555',
  grid: '#e5e5e5', border: 'rgba(0,0,0,0.15)', panel: 'rgba(0,0,0,0.02)',
};

const DARK_THEME = {
  text: '#e6e6e6', title: '#f5f5f5', secondary: '#b8b8b8',
  grid: 'rgba(255,255,255,0.16)', border: 'rgba(255,255,255,0.28)', panel: 'rgba(255,255,255,0.05)',
};

const COLORS = { ...LIGHT_COLORS };
const THEME = { dark: false, bg: 'rgb(255,255,255)', ...LIGHT_THEME };

function parseRgba(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return null;
  const v = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
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

function fprAt(t) { return 1 - Phi(t); }
function tprAt(t) { return 1 - Phi((t - 1) / 2); }

// Model constants, consistent with fprAt / tprAt above, and the closed-form
// AUC = P(X1 > X0) = Phi(Delta / sqrt(1 + rho^2)) of the original ROC curve.
// (The prevalence plays no role: the ROC curve does not depend on it.)
const MU0 = 0, SIGMA0 = 1, MU1 = 1, SIGMA1 = 2;
const DELTA = (MU1 - MU0) / SIGMA1;   // standardized separation
const RHO = SIGMA0 / SIGMA1;          // scale ratio
const AUC = Phi(DELTA / Math.sqrt(1 + RHO * RHO));

function rocPoint(t) {
  return { fpr: fprAt(t), tpr: tprAt(t) };
}

function reversedTestRocPoint(t) {
  const pt = rocPoint(t);
  return { fpr: 1 - pt.fpr, tpr: 1 - pt.tpr };
}

function classInversionRocPoint(t) {
  const pt = rocPoint(t);
  return { fpr: pt.tpr, tpr: pt.fpr };
}

function classInversionReversedRocPoint(t) {
  const pt = rocPoint(t);
  return { fpr: 1 - pt.tpr, tpr: 1 - pt.fpr };
}

function rocCurve(pointFn, tMin, tMax, num = 400) {
  const fpr = [], tpr = [];
  for (let i = 0; i <= num; i++) {
    const t = tMin + (tMax - tMin) * i / num;
    const pt = pointFn(t);
    fpr.push(pt.fpr);
    tpr.push(pt.tpr);
  }
  const idx = fpr.map((_, i) => i).sort((a, b) => fpr[a] - fpr[b]);
  return { x: idx.map(i => fpr[i]), y: idx.map(i => tpr[i]) };
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
  Object.assign(valueLabel.style, {
    marginTop: '4px', textAlign: 'center',
    fontFamily: FONT_FAMILY, fontSize: '9px', color: THEME.secondary,
  });
  parent.appendChild(valueLabel);

  return { slider, valueLabel };
}

// One curve + its operating-point marker, sharing a color/legend entry.
function curveAndPoint(curve, pt, { color, width, dash, name, legend, legendrank, markerSize = 10 }) {
  // Unique group per curve: clicking its legend entry toggles only this curve
  // (line + operating-point marker), not the whole Original/Transformations/Extreme block.
  const legendgroup = 'curve-' + name;
  return [
    { x: curve.x, y: curve.y, mode: 'lines', name, legend, legendgroup, legendrank,
      line: { color, width, dash }, showlegend: true },
    { x: [pt.fpr], y: [pt.tpr], mode: 'markers', legend, legendgroup, legendrank,
      marker: { color: THEME.bg, size: markerSize, symbol: 'circle', line: { color, width: 2 } },
      showlegend: false },
  ];
}

export async function initGaussianSymmetricRocWidget(container) {
  const controlsDiv = container.querySelector('.gaussian-symmetric-roc-controls');
  const plotDiv = container.querySelector('.gaussian-symmetric-roc-plot');

  refreshTheme(container);

  const tMin = -4, tMax = 5;

  // Threshold control
  addLabel(controlsDiv, 'Threshold');
  const { slider: thresholdSlider, valueLabel: thresholdValueLabel } =
    addSlider(controlsDiv, { min: tMin, max: tMax, step: (tMax - tMin) / 500, value: 0.5 });

  function updateThresholdValueLabel() {
    thresholdValueLabel.textContent = 'Threshold = ' + parseFloat(thresholdSlider.value).toPrecision(3);
  }
  updateThresholdValueLabel();

  // Prevalence control (illustrative only: does not affect the ROC curve)
  addLabel(controlsDiv, 'Prevalence (π₁)', { top: true });
  const { slider: prevalenceSlider, valueLabel: prevalenceValueLabel } =
    addSlider(controlsDiv, { min: 0.01, max: 0.99, step: 0.01, value: 0.5 });

  function updatePrevalenceValueLabel() {
    prevalenceValueLabel.textContent = 'π₁ = ' + parseFloat(prevalenceSlider.value).toFixed(2);
  }
  updatePrevalenceValueLabel();

  // Legend
  const legendRow = document.createElement('div');
  Object.assign(legendRow.style, {
    marginTop: '10px', fontFamily: FONT_FAMILY, fontSize: '8.5px',
    lineHeight: '1.5', display: 'grid',
    gridTemplateColumns: '1fr', gap: '4px 8px',
  });
  controlsDiv.appendChild(legendRow);

  function fillLegendRow() {
    legendRow.innerHTML = [
      [COLORS.roc, 'ROC curve'],
      [COLORS.thresholdReversal, 'Threshold reversal'],
      [COLORS.classSwap, 'Class label swap'],
      [COLORS.classSwapReversal, 'Class label swap + threshold reversal'],
    ].map(([color, label]) => `
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:${THEME.bg}; border:2px solid ${color}; display:inline-block;"></span>
      ${label}
    </div>`).join('');
  }

  // Everything in the controls box that depends on the page theme.
  function styleControls() {
    controlsDiv.style.border = `1px solid ${THEME.border}`;
    controlsDiv.style.background = THEME.panel;
    controlsDiv.style.color = THEME.text;
    [thresholdValueLabel, prevalenceValueLabel, legendRow].forEach((el) => {
      el.style.color = THEME.secondary;
    });
    fillLegendRow();
  }
  styleControls();

  // Static reference curves and the four transformed ROC curves
  const perfectCurve = { x: [0, 0, 1], y: [0, 1, 1] };
  const randomCurve = { x: [0, 1], y: [0, 1] };
  const wrongCurve = { x: [0, 1, 1], y: [0, 0, 1] };

  const gaussianCurve = rocCurve(rocPoint, tMin, tMax);
  const reversedTestCurve = rocCurve(reversedTestRocPoint, tMin, tMax);
  const classInversionCurve = rocCurve(classInversionRocPoint, tMin, tMax);
  const classInversionReversedCurve = rocCurve(classInversionReversedRocPoint, tMin, tMax);

  // Scale factor derived from how far the current responsive width has
  // shrunk relative to the widget's natural size — used to keep marker
  // sizes (and, if desired, line widths) proportional as the figure
  // scales down, instead of staying visually fixed while everything
  // else shrinks around them.
  function currentScale() {
    const { width } = computePlotSize();
    return width / NATURAL_WIDTH;
  }

  function buildTraces(t) {

  const scale = currentScale();

  const scaleMarker = (size) =>
    Math.max(4, size * scale);

  const traces = [

    // ===============================================================
    // ORIGINAL — heading
    // ===============================================================

    {
      x: [null],
      y: [null],
      mode: 'lines',
      name: '<b>Original</b>',
      legend: 'legend',
      legendgroup: 'heading-original',
      legendrank: 100,
      showlegend: true,
      line: { width: 0 },
      hoverinfo: 'skip',
    },

    // Original ROC
    ...curveAndPoint(
      gaussianCurve,
      rocPoint(t),
      {
        color: COLORS.roc,
        width: 2.5,
        dash: 'solid',
        name: 'ROC curve',
        legend: 'legend',
        legendrank: 101,
        markerSize: scaleMarker(16),
      }
    ),


    // ===============================================================
    // TRANSFORMATIONS — heading
    // ===============================================================

    {
      x: [null],
      y: [null],
      mode: 'lines',
      name: '<b>Transformations</b>',
      legend: 'legend',
      legendgroup: 'heading-transformations',
      legendrank: 200,
      showlegend: true,
      line: { width: 0 },
      hoverinfo: 'skip',
    },

    // Threshold reversal
    ...curveAndPoint(
      reversedTestCurve,
      reversedTestRocPoint(t),
      {
        color: COLORS.thresholdReversal,
        width: 2,
        dash: 'dot',
        name: 'Threshold reversal',
        legend: 'legend',
        legendrank: 201,
        markerSize: scaleMarker(10),
      }
    ),

    // Class label swap
    ...curveAndPoint(
      classInversionCurve,
      classInversionRocPoint(t),
      {
        color: COLORS.classSwap,
        width: 2,
        dash: 'dash',
        name: 'Class label swap',
        legend: 'legend',
        legendrank: 202,
        markerSize: scaleMarker(10),
      }
    ),

    // Class swap + threshold reversal
    ...curveAndPoint(
      classInversionReversedCurve,
      classInversionReversedRocPoint(t),
      {
        color: COLORS.classSwapReversal,
        width: 2,
        dash: 'longdash',
        name: 'Class swap + threshold rev.',
        legend: 'legend',
        legendrank: 203,
        markerSize: scaleMarker(10),
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

  return traces;
}


// -------------------------------------------------------------------
// One legend, with three explicitly grouped sections.
// -------------------------------------------------------------------

let cachedNormalGap = null;

function compactLegendInterlineSpacing() {

  const items = plotDiv.querySelectorAll('.legend .traces');

  // Expected order:
  // 0  Original
  // 1  ROC curve
  // 2  Transformations
  // 3  Threshold reversal
  // 4  Class label swap
  // 5  Class swap + threshold rev.
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

  // 30% reduction inside blocks.
  const compactGap = normalGap * 0.70;

  // Gap between consecutive legend items.
  //
  // 1.00 = normal Plotly spacing
  // 0.70 = 30% reduced spacing
  //
  // The block boundaries remain at the normal spacing.
const gapFactor = [
  .800, // Original → ROC curve
  .800, // ROC curve → Transformations
  .800, // Transformations → Threshold reversal

  0.630, // Threshold reversal → Class label swap
  0.630, // Class label swap → Class swap + threshold rev.

  .800, // Class swap + threshold rev. → Extreme cases
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
  // function gridShapes(ticks, boxMin, boxMax) {
  //   const shapes = [];
  //   ticks.forEach((v) => {
  //     // vertical line at x = v
  //     shapes.push({
  //       type: 'line', xref: 'x', yref: 'y',
  //       x0: v, x1: v, y0: boxMin, y1: boxMax,
  //       line: { color: '#e5e5e5', width: 1 },
  //       layer: 'below',
  //     });
  //     // horizontal line at y = v
  //     shapes.push({
  //       type: 'line', xref: 'x', yref: 'y',
  //       x0: boxMin, x1: boxMax, y0: v, y1: v,
  //       line: { color: '#e5e5e5', width: 1 },
  //       layer: 'below',
  //     });
  //   });
  //   return shapes;
  // }

  // --- Responsive sizing --------------------------------------------
  // The ROC axes are square (scaleanchor/scaleratio). To keep ticks and
  // their labels sitting cleanly against the axis at every width — issue
  // (4) — the PIXEL plotting box must itself be square: (width-l-r) must
  // equal (height-t-b) exactly. Previously height was a fixed constant
  // independent of the (responsive) width, so that equality broke as
  // soon as width shrank, forcing Plotly's scale-lock to silently shrink
  // one axis's domain to compensate — which visibly displaces the axis
  // (and its ticks) away from where the margins would suggest it should
  // sit. Fix: derive height FROM width and the margins, so the square
  // constraint holds by construction at every size, and the axis/ticks
  // never need to be nudged to compensate.

  const MARGIN_L = 55;
  const MARGIN_R = 175;   // reserved for the three legend columns
  const MARGIN_T = 44;   // title band
  const MARGIN_B = 45;

  const NATURAL_WIDTH = 600;
  const MIN_WIDTH = 360;
  const MIN_PLOT_SIDE = 200; // floor on the square plotting area itself

  function computePlotSize() {
    const measured = plotDiv.getBoundingClientRect().width;
    const available = measured > 0 ? measured : NATURAL_WIDTH;
    const width = Math.max(MIN_WIDTH, Math.min(NATURAL_WIDTH, Math.round(available)));

    const plotSide = Math.max(MIN_PLOT_SIDE, width - MARGIN_L - MARGIN_R);
    const height = plotSide + MARGIN_T + MARGIN_B;

    return { width, height };
  }

  function layout() {
    const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const { width, height } = computePlotSize();

    const scale = width / NATURAL_WIDTH;

    return {
      font: { family: FONT_FAMILY, size: 12, color: THEME.text },
      title: {
        text:
          'Gaussian model  —  ' +
          `Δ = ${DELTA.toFixed(2)}, ρ = ${RHO.toFixed(2)}  →  AUC = ${AUC.toFixed(3)}`,
        x: 0.5, xanchor: 'center', xref: 'container',
        y: 1, yanchor: 'top', yref: 'container',
        font: { size: Math.max(11, 14 * scale), family: FONT_FAMILY, color: THEME.title },
        pad: { t: 6, b: 0 },
      },
      xaxis: {
        range: [-0.04, 1.04],
        autorange: false,
        tickvals: ticks,
        showline: false,
        zeroline: false,
        gridcolor: THEME.grid,
        gridwidth: 1,
        title: { text: 'False Positive Rate', font: { size: 12 }, standoff: 8 },
      },
      yaxis: {
        range: [-0.04, 1.04],
        autorange: false,
        scaleanchor: 'x',
        scaleratio: 1,
        tickvals: ticks,
        showline: false,
        zeroline: false,
        gridcolor: THEME.grid,
        gridwidth: 1,
        title: { text: 'True Positive Rate', font: { size: 12 }, standoff: 8 },
      },
      margin: { l: MARGIN_L, r: MARGIN_R, t: MARGIN_T, b: MARGIN_B, pad: 0 },

      legend: legendLayout(),
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
    const t = parseFloat(thresholdSlider.value);
    await Plotly.react(plotDiv, buildTraces(t), layout(), { displayModeBar: false });
    compactLegendInterlineSpacing();
    rendering = false;
    if (pending) { pending = false; render(); }
  }

  thresholdSlider.addEventListener('input', () => { updateThresholdValueLabel(); render(); });
  prevalenceSlider.addEventListener('input', () => { updatePrevalenceValueLabel(); render(); });

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

  // Re-render (recomputing layout width/height) whenever the plot div's
  // own box changes size — the direct analogue of subplot_viz.js's
  // `window.addEventListener('resize', drawPlot)`, but scoped to this
  // widget's own element via ResizeObserver, so multiple independent
  // widgets on one page don't interfere with each other.
  let lastWidth = null;
  const ro = new ResizeObserver((entries) => {
    const w = Math.round(entries[0].contentRect.width);
    if (w === lastWidth) return;   // ignore height-only changes from our own renders
    lastWidth = w;
    render();
  });
  ro.observe(plotDiv.parentElement);   // parent shrinks with the page; div doesn't
}

document
  .querySelectorAll('.gaussian-symmetric-roc-interactive')
  .forEach((container) => {
    initGaussianSymmetricRocWidget(container);
  });