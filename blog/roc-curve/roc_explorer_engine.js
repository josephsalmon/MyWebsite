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

const LIGHT_THEME = {
  dark: false,
  text: '#243247', title: '#142238', secondary: '#46566d',
  grid: 'rgba(30, 50, 75, 0.18)',
  zeroLine: 'rgba(30, 50, 75, 0.55)',
  border: 'rgba(30, 50, 75, 0.28)',
  panel: 'rgba(0, 0, 0, 0.02)',      // was '#ffffff'
  curve: '#142238', threshold: '#142238',
  marker: '#ffffff', markerBorder: '#142238',
  x0: '#c62828', x1: '#1769aa',
};

const DARK_THEME = {
  dark: true,
  text: '#e8edf5', title: '#ffffff', secondary: '#c1cde0',
  grid: 'rgba(220, 232, 250, 0.16)',  // softer than 0.22
  zeroLine: 'rgba(220, 232, 250, 0.60)',
  border: 'rgba(220, 232, 250, 0.25)',
  panel: 'rgba(255, 255, 255, 0.04)', // blends with any dark bg
  curve: '#ffffff', threshold: '#f0f4fa',
  marker: '#1b2534', markerBorder: '#ffffff',
  x0: '#ff8a80', x1: '#64b5f6',
};

const THEME = { ...LIGHT_THEME, bg: '#ffffff' };

function parseRgba(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return null;

  const values = m[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);

  if (values.length < 3 || values.slice(0, 3).some(Number.isNaN)) {
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

  // Quarto's theme classes take precedence.
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

  // Fall back to explicit theme attributes.
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

  // Fall back to the nearest opaque background colour.
  for (let node = el; node; node = node.parentElement) {
    const bg = parseRgba(getComputedStyle(node).backgroundColor);

    if (bg && bg.a > 0.5) {
      const luminance =
        (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;

      return luminance < 0.5 ? DARK_THEME : LIGHT_THEME;
    }
  }

  return LIGHT_THEME;
}

function refreshTheme(el) {
  const nextTheme = getPageTheme(el);
  const changed = THEME.dark !== nextTheme.dark;

  Object.assign(THEME, nextTheme);
  return changed;
}

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

  if (!controlsDiv || !plotDiv) {
    throw new Error(
      'ROC explorer: controls or plot container was not found.'
    );
  }

  function applyWidgetTypography() {
    container.style.setProperty(
      'font-family',
      FONT_FAMILY,
      'important'
    );

    controlsDiv.style.setProperty(
      'font-family',
      FONT_FAMILY,
      'important'
    );

    controlsDiv.querySelectorAll('*').forEach((el) => {
      el.style.setProperty(
        'font-family',
        FONT_FAMILY,
        'important'
      );
    });
  }

  // Keep the remainder of your existing initialization here.

  if (!controlsDiv || !plotDiv) {
    throw new Error(
      'ROC explorer: controls or plot container was not found.'
    );
  }

  const params = {};
  model.paramSliders.forEach(({ key, value }) => {
    params[key] = value;
  });

  params.t = model.initialT;

  const sliderEls = {};
  const valueEls = {};

  // Distribution selection.
  if (container.dataset.distribution) {
    params.distribution = container.dataset.distribution;
  }

  // Continue with the control panel construction here.

  // --- Build the control panel -------------------------------------

// Fixed typography for controls.
// Theme changes should affect colours, not font sizes.
const CONTROL_FONT = {
  family: FONT_FAMILY,
  label: '11px',
  value: '11px',
  threshold: '11px',
  lineHeight: '1.35',
};


function setFixedFont(el, size) {
  el.style.setProperty('font-family', CONTROL_FONT.family, 'important');
  el.style.setProperty('font-size', size, 'important');
  el.style.setProperty('line-height', CONTROL_FONT.lineHeight, 'important');
}

  function makeSliderRow(key, label, min, max, step, value, formatFn) {
    const row = document.createElement('div');
    row.style.marginBottom = '7px';

    const labelRow = document.createElement('div');
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.alignItems = 'baseline';
    labelRow.style.gap = '10px';
    labelRow.style.marginBottom = '5px';

    setFixedFont(labelRow, CONTROL_FONT.label);
    labelRow.style.color = THEME.text;

    const labelText = document.createElement('span');
    labelText.textContent = label;
    labelText.style.fontWeight = '600';
    labelText.style.whiteSpace = 'normal';
    labelText.style.color = THEME.text;

    setFixedFont(labelText, CONTROL_FONT.label);

    const valueText = document.createElement('span');
    valueText.textContent = formatFn(value);
    valueText.style.color = THEME.secondary;
    valueText.style.fontWeight = '600';
    valueText.style.whiteSpace = 'nowrap';

    setFixedFont(valueText, CONTROL_FONT.value);
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
  hr.style.borderColor = THEME.border;
  controlsDiv.appendChild(hr);

  // --- Threshold slider: own dedicated layout, matching the original
  // roc_interactive.js widget (label, slider, value line below).

  const [yMin0, yMax0] = model.computeYDomain(params);

  const thresholdLabel = document.createElement('div');
  thresholdLabel.textContent = 'Threshold';
  thresholdLabel.style.fontWeight = '700';
  thresholdLabel.style.color = THEME.text;
  thresholdLabel.style.marginBottom = '5px';

  setFixedFont(thresholdLabel, CONTROL_FONT.threshold);

  const thresholdSlider = document.createElement('input');
  thresholdSlider.type = 'range';
  thresholdSlider.min = yMin0;
  thresholdSlider.max = yMax0;
  thresholdSlider.step = (yMax0 - yMin0) / 500;
  thresholdSlider.value = params.t;
  thresholdSlider.style.width = '100%';
  controlsDiv.appendChild(thresholdSlider);

  const thresholdValueLabel = document.createElement('div');
  thresholdValueLabel.style.marginTop = '6px';
  thresholdValueLabel.style.textAlign = 'center';
  thresholdValueLabel.style.color = THEME.secondary;
  thresholdValueLabel.style.fontWeight = '600';

  setFixedFont(thresholdValueLabel, CONTROL_FONT.value);
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
  legendRow.style.color = THEME.text;

  setFixedFont(legendRow, '10px');
  controlsDiv.appendChild(legendRow);

function updateControlTheme() {
  controlsDiv.style.setProperty('color', THEME.text, 'important');
  controlsDiv.style.setProperty(
    'background-color',
    THEME.panel,
    'important'
  );
  controlsDiv.style.setProperty(
    'border-color',
    THEME.border,
    'important'
  );

  // Update primary slider labels.
  controlsDiv.querySelectorAll('span, div').forEach((el) => {
    el.style.setProperty('color', THEME.text, 'important');
  });

  // Restore secondary text colours.
  Object.values(valueEls).forEach((el) => {
    el.style.setProperty('color', THEME.secondary, 'important');
  });

  thresholdValueLabel.style.setProperty(
    'color',
    THEME.secondary,
    'important'
  );

  // Update separators.
  controlsDiv.querySelectorAll('hr').forEach((el) => {
    el.style.setProperty('border-color', THEME.border, 'important');
  });

  // Keep typography stable across theme changes.
  controlsDiv.querySelectorAll('span, div').forEach((el) => {
    if (
      el === thresholdValueLabel ||
      Object.values(valueEls).includes(el)
    ) {
      setFixedFont(el, CONTROL_FONT.value);
    } else {
      setFixedFont(el, CONTROL_FONT.label);
    }
  });

  applyWidgetTypography();
}

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
      const withAlpha = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

  return [
    {
      x: below.x,
      y: below.y,
      mode: 'lines',
      fill: 'tozerox',
      fillcolor: withAlpha(color, 0.42),
      line: { color, width: 1.8 },
      name,
      showlegend: false,
      xaxis: 'x',
      yaxis: 'y',
    },
    {
      x: above.x,
      y: above.y,
      mode: 'lines',
      fill: 'tozerox',
      fillcolor: withAlpha(color, 0.16),
      line: { color, width: 1.8 },
      name,
      showlegend: true,
      xaxis: 'x',
      yaxis: 'y',
    },
  ];
    }

    const traces = [
      ...splitTraces(pdf1, -1, THEME.x1, 'X₁ (sick)'),
      ...splitTraces(pdf0, +1, THEME.x0, 'X₀ (healthy)'),
      { x: [-maxDensity * 1.15, maxDensity * 1.15], y: [p.t, p.t],
      mode: 'lines',
      name: 'Threshold',
      line: { color: THEME.threshold, width: 2 },
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
        line: { color: THEME.secondary, width: 1.8, dash: 'dash' },
        xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y, showlegend: false,
      });
    } else if (ref.type === 'baseline') {
      const yb = ref.value(p);
      traces.push({
        x: [0, 1], y: [yb, yb], mode: 'lines', name: ref.label || 'Baseline',
        line: { color: THEME.secondary, width: 1.5, dash: 'dash' },
        xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y, showlegend: false,
      });
    }
    traces.push({
      x: curvePoints.x, y: curvePoints.y, mode: 'lines', name: curve.curveName,
      line: { color: THEME.curve, width: 3.5 }, xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y,
    });
    traces.push({
      x: [currentPoint.x], y: [currentPoint.y], mode: 'markers', name: 'Operating point',
      marker: {
        color: THEME.marker,
        size: Math.max(6, 12 * (computePlotSize().width / NATURAL_WIDTH)),
        symbol: 'circle', line: { color: THEME.markerBorder, width: 2 },
      },
      xaxis: AXIS_CURVE.x, yaxis: AXIS_CURVE.y, showlegend: false,
    });
    return traces;
  }

  // --- Layout -----------------------------------------------------
  // --- Responsive sizing --------------------------------------------
  // The curve (ROC) subplot is square (scaleanchor), so its pixel box
  // must be square by construction: the curve panel spans
  // CURVE_WIDTH_FRAC of the plot area, hence
  //   plotAreaH = plotAreaW * CURVE_WIDTH_FRAC  ->  height from width.

  const MARGIN_L = 60;
  const MARGIN_R = 20;
  const MARGIN_T = 78;    // title (top) + legend (below it)
  const MARGIN_B = 55;

  const NATURAL_WIDTH = 780;
  const MIN_WIDTH = 380;

  // Pixel budget the inter-panel gap must always hold, left of the
  // curve panel's axis line: y2 tick labels (~14px) + "TPR" title
  // (~16px) + standoff (12px), at natural size.
  const GAP_PX = 46;
  const CURVE_WIDTH_FRAC = 0.56;   // what the curve panel keeps

  // Panel domains: the gap is max(46px, 14%) so "TPR" never overlaps
  // the PDF panel even at the narrowest widths.
  function panelDomains(width) {
    const plotAreaW = width - MARGIN_L - MARGIN_R;
    const gapFrac = Math.max(GAP_PX / plotAreaW, 0.14);
    const pdfFrac = 1 - gapFrac - CURVE_WIDTH_FRAC;
    return {
      pdf: [0, pdfFrac],
      curve: [1 - CURVE_WIDTH_FRAC, 1],
    };
  }

  function computePlotSize() {
    const measured = plotDiv.getBoundingClientRect().width;
    const available = measured > 0 ? measured : NATURAL_WIDTH;
    const width = Math.max(MIN_WIDTH, Math.min(NATURAL_WIDTH, Math.round(available)));

    const plotAreaW = width - MARGIN_L - MARGIN_R;
    const plotAreaH = plotAreaW * CURVE_WIDTH_FRAC;
    const height = Math.round(plotAreaH + MARGIN_T + MARGIN_B);

    return { width, height };
  }

  // Scale factor relative to natural size — keeps the operating-point
  // marker proportional as the figure shrinks.
  function currentScale() {
    const { width } = computePlotSize();
    return width / NATURAL_WIDTH;
  }

  function layoutFor(p, yDomain, maxDensity) {
    const metric = model.metricFn(p);
    const { width, height } = computePlotSize();
    const scale = width / NATURAL_WIDTH;
    const { pdf: pdfDomain, curve: curveDomain } = panelDomains(width);

    // Paper-fraction where the top of the axes sits: the legend goes
    // just above it (inside the top-margin band), below the title.
    const axesTopFrac = (height - MARGIN_T) / height;

    return {
      font: {
        family: FONT_FAMILY,
        size: 12,
        color: THEME.text,
      },
      grid: { rows: 1, columns: 2, pattern: 'independent' },

xaxis: {
  domain: pdfDomain,
  range: [-maxDensity * 1.15, maxDensity * 1.15],
  zeroline: true,
  zerolinecolor: THEME.zeroLine,
  showticklabels: false,
  color: THEME.text,
  tickfont: {
    family: FONT_FAMILY,
    size: 12,
    color: THEME.text,
  },
  title: {
    text: model.xAxisPdfLabel || 'X₁ density ← | → X₀ density',
    font: {
      family: FONT_FAMILY,
      size: 11,
      color: THEME.text,
    },
  },
},

yaxis: {
  domain: [0, 1],
  range: yDomain,
  zerolinecolor: THEME.grid,
  zerolinewidth: 1,
  gridcolor: THEME.grid,
  gridwidth: 1,
  showgrid: true,
  color: THEME.text,
  tickfont: {
    family: FONT_FAMILY,
    size: 12,
    color: THEME.text,
  },
  title: {
    text: 'Assay value (X)',
    font: {
      family: FONT_FAMILY,
      size: 12,
      color: THEME.text,
    },
  },
},

xaxis2: {
  domain: curveDomain,
  range: [-0.05, 1.05],
  color: THEME.text,
  tickfont: {
    family: FONT_FAMILY,
    size: 12,
    color: THEME.text,
  },
  title: {
    text: model.curve.xAxisTitle,
    font: {
      family: FONT_FAMILY,
      size: 12,
      color: THEME.text,
    },
  },
},

yaxis2: {
  range: [-0.05, 1.05],
  scaleanchor: AXIS_CURVE.x,
  scaleratio: 1,
  color: THEME.text,
  tickfont: {
    family: FONT_FAMILY,
    size: 12,
    color: THEME.text,
  },
  title: {
    text: model.curve.yAxisTitle,
    font: {
      family: FONT_FAMILY,
      size: Math.max(9, 12 * scale),
      color: THEME.text,
    },
    standoff: Math.max(8, 12 * scale),
  },
},
      [AXIS_CURVE.x.replace('x', 'xaxis')]: {     // curve panel
        domain: curveDomain, range: [-0.05, 1.05],
        title: { text: model.curve.xAxisTitle, font: { size: 12 } },
      },
      [AXIS_CURVE.y.replace('y', 'yaxis')]: {     // the "TPR" side
        range: [-0.05, 1.05], scaleanchor: AXIS_CURVE.x, scaleratio: 1,
        // Scaled title font + reduced standoff at narrow widths keeps
        // "TPR" inside even the 46px floor gap.
        title: { text: model.curve.yAxisTitle,
                 font: { size: Math.max(9, 12 * scale) },
                 standoff: Math.max(8, 12 * scale) },
      },
      margin: { l: MARGIN_L, r: MARGIN_R, t: MARGIN_T, b: MARGIN_B, pad: 4 },
      title: {
        text: model.titleFn(p, metric),
        y: 1, yanchor: 'top', yref: 'container',
        x: 0.5, xanchor: 'center',
        font: { size: Math.max(11, 16 * scale), family: FONT_FAMILY, color: THEME.title },
        pad: { t: 6, b: 0 },
      },
      legend: {
        orientation: 'h',
        // Paper coords: small OFFSET above the axes top (add, not
        // multiply!) — inside the top-margin band, below the title.
        y: axesTopFrac + 0.25,
        yanchor: 'bottom',
        x: 0.5, xanchor: 'center',
        font: {
          size: 11,
          family: FONT_FAMILY,
          color: THEME.text,
        },
      },
      width, height,
      autosize: false,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
  }

  // --- Render -------------------------------------------------------

  function render() {
    const { traces: pdfTraces, maxDensity, yDomain } = buildPdfTraces(params);
    const traces = pdfTraces.concat(buildCurveTraces(params, yDomain));
    const layout = layoutFor(params, yDomain, maxDensity);
    // NOTE: no `responsive: true` — Plotly's auto-resize would fight
    // our explicit width/height and loop with the ResizeObserver.
    Plotly.react(plotDiv, traces, layout, { displayModeBar: false });
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

  container.addEventListener('roc-distribution-change', (evt) => {
    params.distribution = evt.detail.distribution;
    refreshThresholdRange();
    updateThresholdLabel();
    render();
  });
  // --- React to page theme changes ---------------------------------
  const themeObserver = new MutationObserver(() => {
    if (refreshTheme(container)) {
      updateControlTheme();
      render();
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme', 'data-bs-theme'],
  });
  if (document.body) {
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-bs-theme'],
    });
  }
  // Re-render when the container width changes. Observe the PARENT
  // (which tracks the page width — the plot div itself is sized by
  // Plotly and only changes after a render), and guard on width so
  // our own height-changing renders don't re-trigger the observer.
  // Re-render when the container width changes.
  let lastWidth = null;
  const ro = new ResizeObserver((entries) => {
    const w = Math.round(entries[0].contentRect.width);
    if (w === lastWidth) return;
    lastWidth = w;
    render();
  });

  ro.observe(plotDiv.parentElement);
  container._rocExplorerResizeObserver = ro;
}