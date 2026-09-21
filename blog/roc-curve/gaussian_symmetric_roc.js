// Single-panel ROC plot: fixed Gaussian model (mu0=0, sigma0=1, mu1=1, sigma1=1)
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

function Phi(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function fprAt(t) {
  return 1 - Phi(t);
}

function tprAt(t) {
  return 1 - Phi((t - 1)/2);
}

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
  const fpr = [];
  const tpr = [];

  for (let i = 0; i <= num; i++) {
    const t = tMin + (tMax - tMin) * i / num;
    const pt = pointFn(t);
    fpr.push(pt.fpr);
    tpr.push(pt.tpr);
  }

  const idx = fpr.map((_, i) => i).sort((a, b) => fpr[a] - fpr[b]);
  return { x: idx.map(i => fpr[i]), y: idx.map(i => tpr[i]) };
}

export async function initGaussianSymmetricRocWidget(container) {
  const controlsDiv = container.querySelector('.gaussian-symmetric-roc-controls');
  const plotDiv = container.querySelector('.gaussian-symmetric-roc-plot');

  // Threshold control
  const tMin = -4;
  const tMax = 5;

  const thresholdLabel = document.createElement('div');
  thresholdLabel.textContent = 'Threshold';
  thresholdLabel.style.fontFamily = FONT_FAMILY;
  thresholdLabel.style.fontWeight = '600';
  thresholdLabel.style.fontSize = '9.5px';
  thresholdLabel.style.marginBottom = '4px';
  controlsDiv.appendChild(thresholdLabel);

  const thresholdSlider = document.createElement('input');
  thresholdSlider.type = 'range';
  thresholdSlider.min = tMin;
  thresholdSlider.max = tMax;
  thresholdSlider.step = (tMax - tMin) / 500;
  thresholdSlider.value = 0.5;
  thresholdSlider.style.width = '100%';
  controlsDiv.appendChild(thresholdSlider);

  const thresholdValueLabel = document.createElement('div');
  thresholdValueLabel.style.marginTop = '4px';
  thresholdValueLabel.style.textAlign = 'center';
  thresholdValueLabel.style.fontFamily = FONT_FAMILY;
  thresholdValueLabel.style.fontSize = '9px';
  thresholdValueLabel.style.color = '#555';
  controlsDiv.appendChild(thresholdValueLabel);

  function updateThresholdValueLabel() {
    thresholdValueLabel.textContent = 'Threshold = ' + parseFloat(thresholdSlider.value).toPrecision(3);
  }
  updateThresholdValueLabel();

  // Prevalence slider (doesn't affect ROC curve)
  const prevalenceLabel = document.createElement('div');
  prevalenceLabel.textContent = 'Prevalence (π)';
  prevalenceLabel.style.fontFamily = FONT_FAMILY;
  prevalenceLabel.style.fontWeight = '600';
  prevalenceLabel.style.fontSize = '9.5px';
  prevalenceLabel.style.margin = '8px 0 4px 0';
  controlsDiv.appendChild(prevalenceLabel);

  const prevalenceSlider = document.createElement('input');
  prevalenceSlider.type = 'range';
  prevalenceSlider.min = 0.01;
  prevalenceSlider.max = 0.99;
  prevalenceSlider.step = 0.01;
  prevalenceSlider.value = 0.5;
  prevalenceSlider.style.width = '100%';
  controlsDiv.appendChild(prevalenceSlider);

  const prevalenceValueLabel = document.createElement('div');
  prevalenceValueLabel.style.marginTop = '4px';
  prevalenceValueLabel.style.textAlign = 'center';
  prevalenceValueLabel.style.fontFamily = FONT_FAMILY;
  prevalenceValueLabel.style.fontSize = '9px';
  prevalenceValueLabel.style.color = '#555';
  controlsDiv.appendChild(prevalenceValueLabel);

  function updatePrevalenceValueLabel() {
    prevalenceValueLabel.textContent = 'π = ' + parseFloat(prevalenceSlider.value).toFixed(2);
  }
  updatePrevalenceValueLabel();

  // Legend with two columns
  const legendRow = document.createElement('div');
  legendRow.style.marginTop = '10px';
  legendRow.style.fontFamily = FONT_FAMILY;
  legendRow.style.fontSize = '8.5px';
  legendRow.style.color = '#555';
  legendRow.style.lineHeight = '1.5';
  legendRow.style.display = 'grid';
  legendRow.style.gridTemplateColumns = '1fr';
  legendRow.style.gap = '4px 8px';

  legendRow.innerHTML = `
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid black; display:inline-block;"></span>
      ROC curve
    </div>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid #999; display:inline-block;"></span>
      Threshold Reversal
    </div>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid #777; display:inline-block;"></span>
      Class label swap
    </div>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid #555; display:inline-block;"></span>
      Class label swap + threshold reversal
    </div>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border-radius:50%; background:white; border:2px solid #cccccc; display:inline-block;"></span>
      Perfect
    </div>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border:1px solid #cccccc; display:inline-block;"></span>
      Random
    </div>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="width:8px; height:8px; border:1px dashed #cccccc; display:inline-block;"></span>
      Always wrong
    </div>
  `;
  controlsDiv.appendChild(legendRow);

  // Pre-compute curves
  const perfectCurve = { x: [0, 0, 1], y: [0, 1, 1] };
  const randomCurve = { x: [0, 1], y: [0, 1] };
  const wrongCurve = { x: [0, 1, 1], y: [0, 0, 1] };
  const gaussianCurve = rocCurve(rocPoint, tMin, tMax);
  const reversedTestCurve = rocCurve(reversedTestRocPoint, tMin, tMax);
  const classInversionCurve = rocCurve(classInversionRocPoint, tMin, tMax);
  const classInversionReversedCurve = rocCurve(classInversionReversedRocPoint, tMin, tMax);

  function buildTraces(t) {
    const pt = rocPoint(t);
    const ptRev = reversedTestRocPoint(t);
    const ptClass = classInversionRocPoint(t);
    const ptBoth = classInversionReversedRocPoint(t);

    return [

      // Main ROC curve
      {
        x: gaussianCurve.x, y: gaussianCurve.y,
        mode: 'lines', name: 'ROC curve',
        line: { color: '#000000', width: 2.5 },
        showlegend: true
      },

      // Transformed curves
      {
        x: reversedTestCurve.x, y: reversedTestCurve.y,
        mode: 'lines', name: 'Reversed rule',
        line: { color: '#999999', width: 1.5, dash: 'dash' },
        showlegend: true
      },
      {
        x: classInversionCurve.x, y: classInversionCurve.y,
        mode: 'lines', name: 'Class inversion',
        line: { color: '#777777', width: 1.5, dash: 'dot' },
        showlegend: true
      },
      {
        x: classInversionReversedCurve.x, y: classInversionReversedCurve.y,
        mode: 'lines', name: 'Class inv. + reversed',
        line: { color: '#555555', width: 1.5, dash: 'dashdot' },
        showlegend: true
      },

      // Only show markers for the main transformations
      {
        x: [pt.fpr], y: [pt.tpr],
        mode: 'markers',
        marker: { color: 'white', size: 12, symbol: 'circle', line: { color: 'black', width: 2 } },
        showlegend: false
      },
      {
        x: [ptRev.fpr], y: [ptRev.tpr],
        mode: 'markers',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#999999', width: 2 } },
        showlegend: false
      },
      {
        x: [ptClass.fpr], y: [ptClass.tpr],
        mode: 'markers',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#777777', width: 2 } },
        showlegend: false
      },
      {
        x: [ptBoth.fpr], y: [ptBoth.tpr],
        mode: 'markers',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#555555', width: 2 } },
        showlegend: false
      },
            // Reference curves
      {
        x: perfectCurve.x, y: perfectCurve.y,
        mode: 'lines', name: 'Perfect',
        line: { color: '#cccccc', width: 1.5 },
        showlegend: true
      },
      {
        x: randomCurve.x, y: randomCurve.y,
        mode: 'lines', name: 'Random',
        line: { color: '#cccccc', width: 1.5, dash: 'dash' },
        showlegend: true
      },
      {
        x: wrongCurve.x, y: wrongCurve.y,
        mode: 'lines', name: 'Always wrong',
        line: { color: '#cccccc', width: 1.5, dash: 'dot' },
        showlegend: true
      },
    ];
  }

  function layout() {
    return {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      xaxis: {
        range: [-0.05, 1.05],
        title: { text: 'False Positive Rate', font: { size: 12 } }
      },
      yaxis: {
        range: [-0.05, 1.05],
        scaleanchor: 'x',
        scaleratio: 1,
        title: { text: 'True Positive Rate', font: { size: 12 } }
      },
      margin: { l: 60, r: 20, t: 60, b: 55, pad: 4 },
      legend: {
        orientation: 'h',
        y: 1.15,
        yanchor: 'bottom',
        x: 0.5,
        xanchor: 'center',
        font: { size: 9.5, family: FONT_FAMILY }
      },
      width: 440,
      height: 480,
      autosize: false,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    };
  }

  function render() {
    const t = parseFloat(thresholdSlider.value);
    Plotly.react(
      plotDiv,
      buildTraces(t),
      layout(),
      { responsive: false, displayModeBar: false }
    );
  }

  thresholdSlider.addEventListener('input', () => {
    updateThresholdValueLabel();
    render();
  });

  prevalenceSlider.addEventListener('input', () => {
    updatePrevalenceValueLabel();
    render();
  });

  render();
}

document
  .querySelectorAll('.gaussian-symmetric-roc-interactive')
  .forEach((container) => {
    initGaussianSymmetricRocWidget(container);
  });