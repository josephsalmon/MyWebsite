// Single-panel ROC plot: fixed Gaussian model (mu0=0, sigma0=1, mu1=1,
// sigma1=1), with reference curves for perfect / random / "always wrong"
// classification, the Gaussian ROC curve itself, and its symmetrized
// (reversed-test) curve. A single threshold slider drives two markers:
// the operating point (FPR(t), TPR(t)) and its reflection through
// (0.5, 0.5), which is exactly the operating point of the reversed
// decision rule {X < t} instead of {X >= t}, since
//   FPR_rev(t) = P(X0 < t) = 1 - FPR(t),  TPR_rev(t) = 1 - TPR(t).
//
// Self-contained: only needs the standard normal CDF, so it does not
// import from gaussian_distribution.js (avoids any export-name drift
// between files).

const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * z);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-z * z);
  return sign * y;
}
function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }

// Fixed model parameters for this figure (mu0=0, sigma0=1, mu1=1, sigma1=1).
function fprAt(t) { return 1 - Phi(t); }        // FPR(t) = 1 - Phi((t-mu0)/sigma0)
function tprAt(t) { return 1 - Phi(t - 1); }    // TPR(t) = 1 - Phi((t-mu1)/sigma1)

function rocPoint(t) {
  return { fpr: fprAt(t), tpr: tprAt(t) };
}

function rocCurve(tMin, tMax, num = 400) {
  const fpr = [], tpr = [];
  for (let i = 0; i <= num; i++) {
    const t = tMin + (tMax - tMin) * i / num;
    const pt = rocPoint(t);
    fpr.push(pt.fpr);
    tpr.push(pt.tpr);
  }
  const idx = fpr.map((_, i) => i).sort((a, b) => fpr[a] - fpr[b]);
  return { x: idx.map(i => fpr[i]), y: idx.map(i => tpr[i]) };
}

export async function initGaussianSymmetricRocWidget(container) {
  const controlsDiv = container.querySelector('.gaussian-symmetric-roc-controls');
  const plotDiv = container.querySelector('.gaussian-symmetric-roc-plot');

  // --- Control panel: a single threshold slider, same layout/format as
  // the threshold control in the other widgets in this series. ----------

  const tMin = -4, tMax = 5; // covers +/- 4-5 sd around both means

  const label = document.createElement('div');
  label.textContent = 'Threshold';
  label.style.fontFamily = FONT_FAMILY;
  label.style.fontWeight = '600';
  label.style.fontSize = '9.5px';
  label.style.marginBottom = '4px';
  controlsDiv.appendChild(label);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = tMin;
  slider.max = tMax;
  slider.step = (tMax - tMin) / 500;
  slider.value = 0.5;
  slider.style.width = '100%';
  controlsDiv.appendChild(slider);

  const valueLabel = document.createElement('div');
  valueLabel.style.marginTop = '4px';
  valueLabel.style.textAlign = 'center';
  valueLabel.style.fontFamily = FONT_FAMILY;
  valueLabel.style.fontSize = '9px';
  valueLabel.style.color = '#555';
  controlsDiv.appendChild(valueLabel);

  function updateValueLabel() {
    valueLabel.textContent = 'Threshold = ' + parseFloat(slider.value).toPrecision(3);
  }
  updateValueLabel();

  // Small legend explaining the two markers.
  const legendRow = document.createElement('div');
  legendRow.style.marginTop = '10px';
  legendRow.style.fontFamily = FONT_FAMILY;
  legendRow.style.fontSize = '8.5px';
  legendRow.style.color = '#555';
  legendRow.style.lineHeight = '1.5';
  legendRow.innerHTML = `
    <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid black; display:inline-block;"></span>
      operating point
    </div>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid #999; display:inline-block;"></span>
      reversed test
    </div>`;
  controlsDiv.appendChild(legendRow);

  // --- Reference curves (computed once — they don't depend on the
  // threshold): perfect / random / "always wrong" classification, all
  // kept visually secondary (light gray) so the Gaussian ROC curve reads
  // as the main subject of the plot without being named as such. --------

  const perfectCurve = { x: [0, 0, 1], y: [0, 1, 1] };
  const randomCurve = { x: [0, 1], y: [0, 1] };
  const wrongCurve = { x: [0, 1, 1], y: [0, 0, 1] };
  const gaussianCurveFull = rocCurve(tMin, tMax);
  // Symmetrized (reversed-test) curve: ROC'(s) = 1 - ROC(1-s), i.e. the
  // point reflection of the Gaussian curve through (0.5, 0.5).
  const symmetrizedCurve = {
    x: gaussianCurveFull.x.map(v => 1 - v).reverse(),
    y: gaussianCurveFull.y.map(v => 1 - v).reverse(),
  };

  function buildTraces(t) {
    const pt = rocPoint(t);
    const ptRev = { fpr: 1 - pt.fpr, tpr: 1 - pt.tpr };

    return [
      // Reference curves — light gray, kept visually secondary.
      {
        x: perfectCurve.x, y: perfectCurve.y, mode: 'lines',
        name: 'Perfect classification',
        line: { color: '#cccccc', width: 2.5 },
        showlegend: true,
      },
      {
        x: randomCurve.x, y: randomCurve.y, mode: 'lines',
        name: 'Random classification',
        line: { color: '#cccccc', width: 2.5, dash: 'dash' },
        showlegend: true,
      },
      {
        x: wrongCurve.x, y: wrongCurve.y, mode: 'lines',
        name: 'Always-wrong classification',
        line: { color: '#cccccc', width: 2.5, dash: 'dot' },
        showlegend: true,
      },
      // Symmetrized (reversed-test) curve — a step down in emphasis from
      // the main curve, but still visible since its point is interactive.
      {
        x: symmetrizedCurve.x, y: symmetrizedCurve.y, mode: 'lines',
        name: 'Reversed test',
        line: { color: '#999999', width: 2.5, dash: 'dashdot' },
        showlegend: true,
      },
      // Main Gaussian ROC curve — black, solid, standard width: the
      // visually dominant element of the figure.
      {
        x: gaussianCurveFull.x, y: gaussianCurveFull.y, mode: 'lines',
        name: 'ROC curve',
        line: { color: '#000000', width: 3.5 },
        showlegend: true,
      },
      // Operating point on the main curve.
      {
        x: [pt.fpr], y: [pt.tpr], mode: 'markers', name: 'Operating point',
        marker: { color: 'white', size: 12, symbol: 'circle', line: { color: 'black', width: 2 } },
        showlegend: false,
      },
      // Symmetric point (reversed test), reflected through (0.5, 0.5).
      {
        x: [ptRev.fpr], y: [ptRev.tpr], mode: 'markers', name: 'Reversed test point',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#999999', width: 2 } },
        showlegend: false,
      },
    ];
  }

  function layout() {
    return {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      xaxis: {
        range: [-0.05, 1.05], title: { text: 'False Positive Rate', font: { size: 12 } },
      },
      yaxis: {
        range: [-0.05, 1.05], scaleanchor: 'x', scaleratio: 1,
        title: { text: 'True Positive Rate', font: { size: 12 } },
      },
      margin: { l: 60, r: 20, t: 60, b: 55, pad: 4 },
      legend: {
        orientation: 'h', y: 1.15, yanchor: 'bottom', x: 0.5, xanchor: 'center',
        font: { size: 9.5, family: FONT_FAMILY },
      },
      width: 440,
      height: 480,
      autosize: false,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
  }

  function render() {
    const t = parseFloat(slider.value);
    Plotly.react(plotDiv, buildTraces(t), layout(), { responsive: false, displayModeBar: false });
  }

  slider.addEventListener('input', () => {
    updateValueLabel();
    render();
  });

  render();
}

document.querySelectorAll('.gaussian-symmetric-roc-interactive').forEach((container) => {
  initGaussianSymmetricRocWidget(container);
});