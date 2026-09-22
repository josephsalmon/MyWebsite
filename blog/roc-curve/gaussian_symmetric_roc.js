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
function curveAndPoint(curve, pt, { color, width, dash, name, legend, markerSize = 10 }) {
  return [
    { x: curve.x, y: curve.y, mode: 'lines', name, legend,
      line: { color, width, dash }, showlegend: true },
    { x: [pt.fpr], y: [pt.tpr], mode: 'markers', legend,
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

  function buildTraces(t) {
  // In buildTraces(t):
const traces = [
  // Original ROC curve (solid, thick line)
  ...curveAndPoint(gaussianCurve, rocPoint(t),
    { color: COLORS.roc, width: 2.5, dash: 'solid', name: 'ROC curve', legend: 'legend1', markerSize: 12 }),

  // Transformations (dashed/dotted, medium width)
  ...curveAndPoint(reversedTestCurve, reversedTestRocPoint(t),
    { color: COLORS.thresholdReversal, width: 2, dash: 'dot', name: 'Threshold reversal', legend: 'legend2' }),
  ...curveAndPoint(classInversionCurve, classInversionRocPoint(t),
    { color: COLORS.classSwap, width: 2, dash: 'dash', name: 'Class label swap', legend: 'legend2' }),
  ...curveAndPoint(classInversionReversedCurve, classInversionReversedRocPoint(t),
    { color: COLORS.classSwapReversal, width: 2, dash: 'longdash', name: 'Class swap + threshold rev.', legend: 'legend2' }),

  // Extreme cases (thin, distinct dashes)
  {
    x: perfectCurve.x,
    y: perfectCurve.y,
    mode: 'lines',
    name: 'Perfect',
    legend: 'legend3',
    showlegend: true,
    line: { color: COLORS.perfect, width: 1.5, dash: 'dot' }
  },
  {
    x: randomCurve.x,
    y: randomCurve.y,
    mode: 'lines',
    name: 'Random',
    legend: 'legend3',
    showlegend: true,
    line: { color: COLORS.random, width: 1.5, dash: 'dash' }
  },
  {
    x: wrongCurve.x,
    y: wrongCurve.y,
    mode: 'lines',
    name: 'Always wrong',
    legend: 'legend3',
    showlegend: true,
    line: { color: COLORS.wrong, width: 1.5, dash: 'longdashdot' }
  }
];

    return traces;
  }

  function legendColumn(x, xanchor, title) {
    return {
      orientation: 'v', y: 1.26, yanchor: 'top', x, xanchor, valign: 'top',
      font: { size: 9, family: FONT_FAMILY }, borderwidth: 0, itemwidth: 20,
      title: { text: title, font: { size: 9.5, family: FONT_FAMILY, color: '#333', weight: 'bold' }, side: 'top' },
    };
  }

  function gridShapes(ticks, boxMin, boxMax) {
  const shapes = [];
  ticks.forEach((v) => {
    // vertical line at x = v
    shapes.push({
      type: 'line', xref: 'x', yref: 'y',
      x0: v, x1: v, y0: boxMin, y1: boxMax,
      line: { color: '#e5e5e5', width: 1 },
      layer: 'below',
    });
    // horizontal line at y = v
    shapes.push({
      type: 'line', xref: 'x', yref: 'y',
      x0: boxMin, x1: boxMax, y0: v, y1: v,
      line: { color: '#e5e5e5', width: 1 },
      layer: 'below',
    });
  });
  return shapes;
}

 function layout() {
    const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
    return {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      xaxis: {
        range: [-0.04, 1.04],
        autorange: false,
        showline: false,
        linecolor: '#999',
        zeroline: false,
        linewidth: 1,
        ticklen: 0,
        tickvals: ticks,
        showgrid: false,
        title: { text: 'False Positive Rate', font: { size: 12 }, standoff: 10 },
      },
      yaxis: {
        range: [-0.04, 1.04],
        autorange: false,
        scaleanchor: 'x',
        scaleratio: 1,
        showline: false,
        zeroline: false,
        linecolor: '#999',
        linewidth: 1,
        ticklen: 0,
        showgrid: false,
        tickmode: 'array',
        tickvals: ticks,
        ticklabelposition: 'inside',
        ticklabelstandoff: 2,
        title: {
          text: 'True Positive Rate',
          font: { size: 12 },
          standoff: 10
        },
      },
      shapes: gridShapes(ticks, 0, 1),
      margin: { l: 60, r: 60, t: 70, b: 50, pad: 2 },  // Increased top margin
      legend: legendColumn(0.0, 'left', 'Original'),
      legend2: legendColumn(0.25, 'left', 'Transformations'),
      legend3: legendColumn(.70, 'left', 'Extreme cases'),
      width: 530,
      height: 520,
      autosize: false,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
  }


  function render() {
    const t = parseFloat(thresholdSlider.value);
    Plotly.react(plotDiv, buildTraces(t), layout(), { responsive: false, displayModeBar: false });
  }

  thresholdSlider.addEventListener('input', () => { updateThresholdValueLabel(); render(); });
  prevalenceSlider.addEventListener('input', () => { updatePrevalenceValueLabel(); render(); });

  render();
}

document
  .querySelectorAll('.gaussian-symmetric-roc-interactive')
  .forEach((container) => {
    initGaussianSymmetricRocWidget(container);
  });