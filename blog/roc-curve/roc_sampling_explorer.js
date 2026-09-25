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
const COLOR_X0 = '#e41a1c'; // red, right side (healthy)
const COLOR_X1 = '#377eb8'; // blue, left side (sick)
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

function empiricalRocCurve(x0, x1) {
  const N = x0.length, P = x1.length;
  if (N === 0 || P === 0) return { x: [0, 1], y: [0, 1] };

  const scored = [];
  x1.forEach((v) => scored.push({ v, label: 1 }));
  x0.forEach((v) => scored.push({ v, label: 0 }));
  scored.sort((a, b) => b.v - a.v); // descending: high score = predicted positive first

  let tp = 0, fp = 0;
  const fprArr = [0], tprArr = [0];
  for (let i = 0; i < scored.length; i++) {
    if (scored[i].label === 1) tp++; else fp++;
    // Only emit a point once all entries tied at this score are processed.
    if (i === scored.length - 1 || scored[i].v !== scored[i + 1].v) {
      fprArr.push(fp / N);
      tprArr.push(tp / P);
    }
  }
  return { x: fprArr, y: tprArr };
}

function empiricalPoint(x0, x1, t) {
  const fpr = x0.length ? x0.filter((v) => v >= t).length / x0.length : 0;
  const tpr = x1.length ? x1.filter((v) => v >= t).length / x1.length : 0;
  return { fpr, tpr };
}

export async function initRocSamplingWidget(container) {
  const controlsDiv = container.querySelector('.sampling-roc-controls');
  const plotDiv = container.querySelector('.sampling-roc-plot');

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
    labelRow.style.fontSize = '9px';      // was 9.5px
  
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
  prevalenceLabel.style.fontFamily = FONT_FAMILY;
  prevalenceLabel.style.fontSize = '8.5px';
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
  const [yMin0, yMax0] = distributionYDomain(params);

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
          name: `${label} — correct`, showlegend: false,
          marker: { color, size: 6, line: { color: 'black', width: 0.5 } } },
        { x: wrong.x, y: wrong.y, mode: 'markers',
          name: `${label} — miss`, showlegend: false,
          marker: { color, size: 6, symbol: 'x' } },
      ];
    }

    // X1 (sick): "correct" means predicted positive, i.e. x >= t (a TP).
    // X0 (healthy): "correct" means predicted negative, i.e. x < t (a TN).
    const traces = [
      ...splitAndBuild(x1, j1, -1, COLOR_X1, 'X₁', true),
      ...splitAndBuild(x0, j0, +1, COLOR_X0, 'X₀', false),
      { x: [-1.15, 1.15], y: [t, t], mode: 'lines', name: 'Threshold',
        line: { color: 'black', width: 2 }, showlegend: true },
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
    const theoCurve = rocCurveTheoretical(p, yDomain);
    const theoPoint = { fpr: distributionFpr(p.t, p), tpr: distributionTpr(p.t, p) };
    const empCurve = empiricalRocCurve(samples.x0, samples.x1);
    const empPoint = empiricalPoint(samples.x0, samples.x1, p.t);
    const scale = currentScale();

    return [
      // Diagonal reference — light gray.
      { x: [0, 1], y: [0, 1], mode: 'lines', name: 'Random guessing',
        line: { color: 'gray', width: 1.5, dash: 'dash' },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false },
      // Empirical ROC — thin, light gray.
      { x: empCurve.x, y: empCurve.y, mode: 'lines', name: 'Empirical ROC',
        line: { color: '#bbbbbb', width: 1.5 },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: true },
      { x: [empPoint.fpr], y: [empPoint.tpr], mode: 'markers', name: 'Empirical point',
        marker: { color: '#eeeeee', size: Math.max(4, 8 * scale),
                  symbol: 'circle', line: { color: '#bbbbbb', width: 1.5 } },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false },
      // Theoretical ROC — solid black.
      { x: theoCurve.x, y: theoCurve.y, mode: 'lines', name: 'ROC curve',
        line: { color: '#000000', width: 2.5 },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y },
      { x: [theoPoint.fpr], y: [theoPoint.tpr], mode: 'markers', name: 'Operating point',
        marker: { color: 'white', size: Math.max(6, 12 * scale),
                  symbol: 'circle', line: { color: 'black', width: 2 } },
        xaxis: AXIS_ROC.x, yaxis: AXIS_ROC.y, showlegend: false },
    ];                                                          // ← array closed
  }

  // --- Layout -----------------------------------------------------------
  // --- Layout -----------------------------------------------------------

  // Responsive sizing: same recipe as roc_explorer_engine.js.
  // The ROC subplot is square (scaleanchor), so its pixel box must be
  // square by construction: the ROC panel spans rocWidthFrac of the
  // plot area, so plotAreaH = plotAreaW * rocWidthFrac and height
  // derives from width. The top band hosts title + legend (never the
  // x-labels), and the inter-panel gap is wide enough for the "TPR"
  // ylabel at every width.

  const MARGIN_L = 60;
  const MARGIN_R = 20;
  const MARGIN_T = 78;    // title (top) + legend (below it)
  const MARGIN_B = 55;

  const NATURAL_WIDTH = 780;
  const MIN_WIDTH = 380;

  // Panel domains: 20% gap so "TPR" never reaches the scatter panel.
  const SCATTER_DOMAIN = [0, 0.40];
  const ROC_DOMAIN = [0.60, 1];
  const ROC_WIDTH_FRAC = 0.40;   // must equal ROC_DOMAIN[1] - ROC_DOMAIN[0]

  function computePlotSize() {
    const measured = plotDiv.getBoundingClientRect().width;
    const available = measured > 0 ? measured : NATURAL_WIDTH;
    const width = Math.max(MIN_WIDTH, Math.min(NATURAL_WIDTH, Math.round(available)));

    const plotAreaW = width - MARGIN_L - MARGIN_R;
    const plotAreaH = plotAreaW * ROC_WIDTH_FRAC;  // square ROC subplot
    const height = Math.round(plotAreaH + MARGIN_T + MARGIN_B);

    return { width, height };
  }

  const currentScale = () => computePlotSize().width / NATURAL_WIDTH;

  function layoutFor(p, yDomain, auc) {
    const dist = distributions[p.distribution || 'gaussian'];
    const Delta = (p.mu1 - p.mu0) / p.sigma1;
    const rho = p.sigma0 / p.sigma1;

    const { width, height } = computePlotSize();
    const scale = width / NATURAL_WIDTH;

    // Paper-fraction where the top of the axes sits — the legend is
    // placed just above it, inside the top-margin band, below the title.
    const axesTopFrac = (height - MARGIN_T) / height;

    return {
      font: { family: FONT_FAMILY, size: 12, color: '#333' },
      grid: { rows: 1, columns: 2, pattern: 'independent' },

      // --- Sample distribution panel --------------------------------
      xaxis: {
        domain: SCATTER_DOMAIN, range: [-1.3, 1.3],
        zeroline: true, zerolinecolor: 'rgba(0,0,0,0.3)', showticklabels: false,
        title: { text: 'X₁ samples ← | → X₀ samples',
                 font: { size: Math.max(9.5, 11 * scale) } },
      },
      yaxis: {
        domain: [0, 1], range: yDomain,
        zerolinecolor: '#eee', zerolinewidth: 1,
        gridcolor: '#eee', gridwidth: 1, showgrid: true,
        title: { text: 'Assay value (X)', font: { size: 12 } },
      },

      // --- ROC panel -------------------------------------------------
      [AXIS_ROC.x.replace('x', 'xaxis')]: {
        domain: ROC_DOMAIN, range: [-0.05, 1.05],
        title: { text: 'FPR', font: { size: 12 } },
      },
      [AXIS_ROC.y.replace('y', 'yaxis')]: {
        range: [-0.05, 1.05],
        scaleanchor: AXIS_ROC.x, scaleratio: 1,
        // standoff centers the "TPR" label in the 20% gap: it can
        // never overlap the scatter panel.
        title: { text: 'TPR', font: { size: 12 }, standoff: 12 },
      },

      // --- Title: pinned to the very top of the figure ---------------
      title: {
        text: `${dist.label} — Δ=${Delta.toFixed(2)}, ρ=${rho.toFixed(2)}`,
        y: 1, yanchor: 'top', yref: 'container',
        x: 0.5, xanchor: 'center',
        font: { size: Math.max(11, 16 * scale), family: FONT_FAMILY, color: '#111' },
        pad: { t: 0, b: 0 },
      },

      // --- Legend: in the top-margin band, between title and axes ----
      legend: {
        orientation: 'h',
        y: axesTopFrac + 0.02,
        yanchor: 'bottom',
        x: 0.5, xanchor: 'center',
        font: { size: Math.max(8.5, 10 * scale), family: FONT_FAMILY },
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
    const auc = distributionAuc(params);
    const traces = buildScatterTraces(samples).concat(buildRocTraces(params, yDomain, samples));
    const layout = layoutFor(params, yDomain, auc);
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

  render();

  // Re-render (recomputing width/height/markers) whenever the plot
  // div's box changes — scoped to this widget, so several widgets on
  // one page don't interfere with each other.
  const ro = new ResizeObserver(() => render());
  ro.observe(plotDiv.parentElement);
  container._samplingRocResizeObserver = ro;
}


document.querySelectorAll('.sampling-roc-interactive').forEach((container) => {
  initRocSamplingWidget(container);
});