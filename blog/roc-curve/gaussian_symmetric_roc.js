// Single-panel ROC plot: fixed Gaussian model (mu0=0, sigma0=1, mu1=1, sigma1=1)
const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

const COLORS = {
  // Primary ROC curves (Original)
  roc: '#000000ff',          // Blue (more visible than pure black)
  thresholdReversal: '#1f77b4',  // Orange (distinct from blue)
  classSwap: '#1f77b4',    // Green (distinct from orange)
  classSwapReversal: '#1f77b4', // Red (distinct from green)

  // Reference curves (Extreme cases)
  perfect: '#9467bd',      // Purple (visually distinct)
  random: '#8c564b',      // Brown (neutral, less prominent)
  wrong: '#e377c2',       // Pink (high contrast)

  // UI elements
  grid: '#E6E6E6',        // Light gray (unchanged)
  text: '#333333',        // Dark gray (unchanged)
  secondaryText: '#666666', // Medium gray (unchanged)
};

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
    fontFamily: FONT_FAMILY, fontSize: '9px', color: '#555',
  });
  parent.appendChild(valueLabel);

  return { slider, valueLabel };
}

// One curve + its operating-point marker, sharing a color/legend entry.
function curveAndPoint(curve, pt, { color, width, dash, name, legend, legendgroup, legendrank, markerSize = 10 }) {
  return [
    { x: curve.x, y: curve.y, mode: 'lines', name, legend, legendgroup, legendrank,
      line: { color, width, dash }, showlegend: true },
    { x: [pt.fpr], y: [pt.tpr], mode: 'markers', legend, legendgroup, legendrank,
      marker: { color: 'white', size: markerSize, symbol: 'circle', line: { color, width: 2 } },
      showlegend: false },
  ];
}

export async function initGaussianSymmetricRocWidget(container) {
  const controlsDiv = container.querySelector('.gaussian-symmetric-roc-controls');
  const plotDiv = container.querySelector('.gaussian-symmetric-roc-plot');

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
  addLabel(controlsDiv, 'Prevalence (π)', { top: true });
  const { slider: prevalenceSlider, valueLabel: prevalenceValueLabel } =
    addSlider(controlsDiv, { min: 0.01, max: 0.99, step: 0.01, value: 0.5 });

  function updatePrevalenceValueLabel() {
    prevalenceValueLabel.textContent = 'π = ' + parseFloat(prevalenceSlider.value).toFixed(2);
  }
  updatePrevalenceValueLabel();

  // Legend
  const legendRow = document.createElement('div');
  Object.assign(legendRow.style, {
    marginTop: '10px', fontFamily: FONT_FAMILY, fontSize: '8.5px',
    color: '#555', lineHeight: '1.5', display: 'grid',
    gridTemplateColumns: '1fr', gap: '4px 8px',
  });
  legendRow.innerHTML = [
    [COLORS.roc, 'ROC curve'],
    [COLORS.thresholdReversal, 'Threshold reversal'],
    [COLORS.classSwap, 'Class label swap'],
    [COLORS.classSwapReversal, 'Class label swap + threshold reversal'],
  ].map(([color, label]) => `
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid ${color}; display:inline-block;"></span>
      ${label}
    </div>`).join('');
  controlsDiv.appendChild(legendRow);

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
      legendgroup: 'original',
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
        legendgroup: 'original',
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
      legendgroup: 'transformations',
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
        legendgroup: 'transformations',
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
        legendgroup: 'transformations',
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
        legendgroup: 'transformations',
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
      legendgroup: 'extreme',
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
      legendgroup: 'extreme',
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
      legendgroup: 'extreme',
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
      legendgroup: 'extreme',
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

function legendLayout() {

  return {

    orientation: 'v',

    y: 0.98,
    yanchor: 'top',

    x: 1.02,
    xanchor: 'left',

    valign: 'top',

    font: {
      size: 8.5,
      family: FONT_FAMILY,
    },

    borderwidth: 0,

    itemwidth: 30,

    // Important: use rank ordering, not grouped ordering.
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
  const MARGIN_T = 20;
  const MARGIN_B = 45;

  const NATURAL_WIDTH = 600;
  const MIN_WIDTH = 360;
  const MIN_PLOT_SIDE = 160; // floor on the square plotting area itself

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

    return {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      xaxis: {
        range: [-0.04, 1.04],
        autorange: false,
        tickvals: ticks,
        showline: false,
        zeroline: false,
        gridcolor: '#e5e5e5',
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
        gridcolor: '#e5e5e5',
        gridwidth: 1,
        title: { text: 'True Positive Rate', font: { size: 12 }, standoff: 8 },
      },
      margin: { l: MARGIN_L, r: MARGIN_R, t: MARGIN_T, b: MARGIN_B, pad: 0 },

      legend: legendLayout(),
      width,
      height,
      autosize: false,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
  }

  function render() {
    const t = parseFloat(thresholdSlider.value);
    Plotly.react(plotDiv, buildTraces(t), layout(), { responsive: true, displayModeBar: false });
  }

  thresholdSlider.addEventListener('input', () => { updateThresholdValueLabel(); render(); });
  prevalenceSlider.addEventListener('input', () => { updatePrevalenceValueLabel(); render(); });

  render();

  // Re-render (recomputing layout width/height) whenever the plot div's
  // own box changes size — the direct analogue of subplot_viz.js's
  // `window.addEventListener('resize', drawPlot)`, but scoped to this
  // widget's own element via ResizeObserver, so multiple independent
  // widgets on one page don't interfere with each other.
  const ro = new ResizeObserver(() => render());
  ro.observe(plotDiv.parentElement);
}

document
  .querySelectorAll('.gaussian-symmetric-roc-interactive')
  .forEach((container) => {
    initGaussianSymmetricRocWidget(container);
  });