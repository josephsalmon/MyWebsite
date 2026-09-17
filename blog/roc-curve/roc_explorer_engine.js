// Generic curve explorer engine (Plotly.js, client-side, no data file).
// Shared by any two-class family and any curve derived from a threshold
// t (ROC, Precision-Recall, ...): the caller supplies a "model" object
// describing the distribution (parameter sliders, densities, y-domain)
// and a generic "curve" spec (an operating point as a function of t,
// plus an optional reference line). This file handles everything else:
// the control panel, the vertical mirrored PDF panel with threshold
// shading, the curve panel with operating-point marker, layout, and
// slider wiring.
//
// model = {
//   controlsSelector: string,
//   plotSelector: string,
//   paramSliders: [{key,label,min,max,step,value}, ...],  // may include
//                                                          // a prevalence
//                                                          // slider etc. —
//                                                          // the engine
//                                                          // treats every
//                                                          // entry the same
//   initialT: number,
//   computeYDomain(params) -> [yMin, yMax],
//   pdf0(y, params) -> number,   // density of X0 (healthy)
//   pdf1(y, params) -> number,   // density of X1 (sick)
//   metricFn(params) -> number,  // e.g. AUC or AP, shown in the title
//   titleFn(params, metric) -> string,
//   xAxisPdfLabel?: string,
//   curve: {
//     point(t, params) -> {x, y},         // operating point at threshold t
//     xAxisTitle: string,
//     yAxisTitle: string,
//     curveName: string,
//     sweepRange?(yDomain, params) -> [tMin, tMax],  // default: [yDomain[0]-2, yDomain[1]+2]
//     referenceLine:
//       { type: 'diagonal' } |
//       { type: 'baseline', value(params) -> number, label: string } |
//       { type: 'none' },
//   },
// }

export const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
export const COLOR_X0 = '#e41a1c'; // red, right side (healthy)
export const COLOR_X1 = '#377eb8'; // blue, left side (sick)
const AXIS_CURVE = { x: 'x2', y: 'y2' };

const fmt2 = (v) => Number(v).toFixed(2);

function sweepCurve(curve, params, tMin, tMax, num = 400) {
  const xs = [], ys = [];
  for (let i = 0; i <= num; i++) {
    const t = tMin + (tMax - tMin) * i / num;
    const pt = curve.point(t, params);
    xs.push(pt.x);
    ys.push(pt.y);
  }
  const idx = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  return { x: idx.map(i => xs[i]), y: idx.map(i => ys[i]) };
}

export async function initRocExplorerWidget(container, model) {
  const controlsDiv = container.querySelector(model.controlsSelector);
  const plotDiv = container.querySelector(model.plotSelector);

  const params = {};
  model.paramSliders.forEach(({ key, value }) => { params[key] = value; });
  params.t = model.initialT;

  // --- Build the control panel -------------------------------------

  const sliderEls = {};
  const valueEls = {};

  function makeSliderRow(key, label, min, max, step, value, formatFn) {
    const row = document.createElement('div');
    row.style.marginBottom = '7px';

    const labelRow = document.createElement('div');
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.fontFamily = FONT_FAMILY;
    labelRow.style.fontSize = '9.5px';
    labelRow.style.marginBottom = '2px';

    const labelText = document.createElement('span');
    labelText.textContent = label;
    labelText.style.fontWeight = '600';

    const valueText = document.createElement('span');
    valueText.textContent = formatFn(value);
    valueText.style.color = '#555';

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

  model.paramSliders.forEach(({ key, label, min, max, step, value }) => {
    controlsDiv.appendChild(makeSliderRow(key, label, min, max, step, value, fmt2));
  });

  const hr = document.createElement('hr');
  hr.style.margin = '8px 0';
  hr.style.borderColor = 'rgba(0,0,0,0.1)';
  controlsDiv.appendChild(hr);

  // --- Threshold slider: own dedicated layout, matching the original
  // roc_interactive.js widget (label, slider, value line below).

  const [yMin0, yMax0] = model.computeYDomain(params);

  const thresholdLabel = document.createElement('div');
  thresholdLabel.textContent = 'Threshold';
  thresholdLabel.style.fontFamily = FONT_FAMILY;
  thresholdLabel.style.fontWeight = '600';
  thresholdLabel.style.fontSize = '9.5px';
  thresholdLabel.style.marginBottom = '4px';
  controlsDiv.appendChild(thresholdLabel);

  const thresholdSlider = document.createElement('input');
  thresholdSlider.type = 'range';
  thresholdSlider.min = yMin0;
  thresholdSlider.max = yMax0;
  thresholdSlider.step = (yMax0 - yMin0) / 500;
  thresholdSlider.value = params.t;
  thresholdSlider.style.width = '100%';
  controlsDiv.appendChild(thresholdSlider);

  const thresholdValueLabel = document.createElement('div');
  thresholdValueLabel.style.marginTop = '4px';
  thresholdValueLabel.style.textAlign = 'center';
  thresholdValueLabel.style.fontFamily = FONT_FAMILY;
  thresholdValueLabel.style.fontSize = '9px';
  thresholdValueLabel.style.color = '#555';
  controlsDiv.appendChild(thresholdValueLabel);

  sliderEls.t = thresholdSlider;

  function updateThresholdLabel() {
    thresholdValueLabel.textContent = 'Threshold = ' + params.t.toPrecision(3);
  }
  updateThresholdLabel();

  const legendRow = document.createElement('div');
  legendRow.style.display = 'flex';
  legendRow.style.gap = '10px';
  legendRow.style.marginTop = '8px';
  legendRow.style.fontSize = '9px';
  legendRow.innerHTML = `
    <span style="display:flex; align-items:center; gap:3px;">
      <span style="width:8px; height:8px; border-radius:50%; background:${COLOR_X1}; display:inline-block;"></span>X₁ (sick)
    </span>
    <span style="display:flex; align-items:center; gap:3px;">
      <span style="width:8px; height:8px; border-radius:50%; background:${COLOR_X0}; display:inline-block;"></span>X₀ (healthy)
    </span>`;
  controlsDiv.appendChild(legendRow);

  // --- Threshold-range maintenance ----------------------------------

  function refreshThresholdRange() {
    const [yMin, yMax] = model.computeYDomain(params);
    thresholdSlider.min = yMin;
    thresholdSlider.max = yMax;
    thresholdSlider.step = (yMax - yMin) / 500;
    params.t = Math.min(Math.max(params.t, yMin), yMax);
    thresholdSlider.value = params.t;
    updateThresholdLabel();
  }

  // --- PDF panel traces ----------------------------------------------

  function buildPdfTraces(p) {
    const [yMin, yMax] = model.computeYDomain(p);
    const N = 300;
    let ys = [];
    for (let i = 0; i <= N; i++) ys.push(yMin + (yMax - yMin) * i / N);
    if (p.t > yMin && p.t < yMax) {
      ys.push(p.t);
      ys.sort((a, b) => a - b);
    }

    const pdf0 = ys.map((y) => model.pdf0(y, p));
    const pdf1 = ys.map((y) => model.pdf1(y, p));
    const maxDensity = Math.max(...pdf0, ...pdf1, 1e-6);

    function splitTraces(dens, sign, color, name) {
      const below = { x: [], y: [] };
      const above = { x: [], y: [] };
      for (let i = 0; i < ys.length; i++) {
        const xv = sign * dens[i];
        if (ys[i] <= p.t) { below.x.push(xv); below.y.push(ys[i]); }
        else { above.x.push(xv); above.y.push(ys[i]); }
      }
      return [
        { x: below.x, y: below.y, mode: 'lines', fill: 'tozerox',
          fillcolor: color + '99', line: { color, width: 1 },
          name, showlegend: false, xaxis: 'x', yaxis: 'y' },
        { x: above.x, y: above.y, mode: 'lines', fill: 'tozerox',
          fillcolor: color + '33', line: { color, width: 1 },
          name, showlegend: true, xaxis: 'x', yaxis: 'y' },
      ];
    }

    const traces = [
      ...splitTraces(pdf1, -1, COLOR_X1, 'X₁ (sick)'),
      ...splitTraces(pdf0, +1, COLOR_X0, 'X₀ (healthy)'),
      { x: [-maxDensity * 1.15, maxDensity * 1.15], y: [p.t, p.t],
        mode: 'lines', name: 'Threshold', line: { color: 'black', width: 2 },
        xaxis: 'x', yaxis: 'y' },
    ];

    return { traces, maxDensity, yDomain: [yMin, yMax] };
  }

  // --- Generic curve-panel traces -------------------------------------

  function buildCurveTraces(p, yDomain) {
    const curve = model.curve;
    const [tMin, tMax] = curve.sweepRange
      ? curve.sweepRange(yDomain, p)
      : [yDomain[0] - 2, yDomain[1] + 2];
    const curvePoints = sweepCurve(curve, p, tMin, tMax, 400);
    const currentPoint = curve.point(p.t, p);

    const traces = [];
    const ref = curve.referenceLine || { type: 'none' };
    if (ref.type === 'diagonal') {
      traces.push({
        x: [0, 1], y: [0, 1], mode: 'lines', name: 'Random guessing',
        line: { color: 'gray', width: 1.5, dash: 'dash' },
        xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y, showlegend: false,
      });
    } else if (ref.type === 'baseline') {
      const yb = ref.value(p);
      traces.push({
        x: [0, 1], y: [yb, yb], mode: 'lines', name: ref.label || 'Baseline',
        line: { color: 'gray', width: 1.5, dash: 'dash' },
        xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y, showlegend: false,
      });
    }
    traces.push({
      x: curvePoints.x, y: curvePoints.y, mode: 'lines', name: curve.curveName,
      line: { color: '#000000', width: 2.5 }, xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y,
    });
    traces.push({
      x: [currentPoint.x], y: [currentPoint.y], mode: 'markers', name: 'Operating point',
      marker: { color: 'white', size: 12, symbol: 'circle', line: { color: 'black', width: 2 } },
      xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y, showlegend: false,
    });
    return traces;
  }

  // --- Layout -----------------------------------------------------

  function layoutFor(p, yDomain, maxDensity) {
    const metric = model.metricFn(p);
    return {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      xaxis: {
        domain: [0, 0.45], range: [-maxDensity * 1.15, maxDensity * 1.15],
        zeroline: true, zerolinecolor: 'rgba(0,0,0,0.3)', showticklabels: false,
        title: { text: model.xAxisPdfLabel || 'X₁ density ← | → X₀ density', font: { size: 11 } },
      },
      yaxis: {
        domain: [0, 1], range: yDomain,
        zerolinecolor: '#eee', zerolinewidth: 1,
        gridcolor: '#eee', gridwidth: 1, showgrid: true,
        title: { text: 'Assay value (X)', font: { size: 12 } },
      },
      [AXIS_CURVE.x.replace('x', 'xaxis')]: {
        domain: [0.55, 1], range: [-0.05, 1.05],
        title: { text: model.curve.xAxisTitle, font: { size: 12 } },
      },
      [AXIS_CURVE.y.replace('y', 'yaxis')]: {
        range: [-0.05, 1.05], scaleanchor: AXIS_CURVE.x, scaleratio: 1,
        title: { text: model.curve.yAxisTitle, font: { size: 12 } },
      },
      margin: { l: 60, r: 20, t: 110, b: 55, pad: 4 },
      title: {
        text: model.titleFn(p, metric),
        font: { size: 18, family: FONT_FAMILY, color: '#111' },
        x: 0.5, xanchor: 'center', y: 1, yanchor: 'top', pad: { t: 0, b: 20 },
      },
      legend: {
        orientation: 'h', y: 1.08, yanchor: 'bottom', x: 0.5, xanchor: 'center',
        font: { size: 10, family: FONT_FAMILY },
      },
      height: 440,
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
  }

  // --- Render -------------------------------------------------------

  function render() {
    const { traces: pdfTraces, maxDensity, yDomain } = buildPdfTraces(params);
    const traces = pdfTraces.concat(buildCurveTraces(params, yDomain));
    const layout = layoutFor(params, yDomain, maxDensity);
    Plotly.react(plotDiv, traces, layout, { responsive: true, displayModeBar: false });
  }

  // --- Wiring ---------------------------------------------------------

  model.paramSliders.forEach(({ key }) => {
    sliderEls[key].addEventListener('input', () => {
      params[key] = parseFloat(sliderEls[key].value);
      valueEls[key].textContent = fmt2(params[key]);
      refreshThresholdRange();
      render();
    });
  });
  thresholdSlider.addEventListener('input', () => {
    params.t = parseFloat(thresholdSlider.value);
    updateThresholdLabel();
    render();
  });

  render();
}