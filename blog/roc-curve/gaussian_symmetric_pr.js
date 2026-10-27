// Single-panel PR plot: fixed Gaussian model
// X | Y=0 ~ N(0,1)
// X | Y=1 ~ N(1,4)
//
// The prevalence π affects precision, but not recall.

const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

const LIGHT_COLORS = {
  roc: '#000000ff',
  thresholdReversal: '#1f77b4',
  classSwap: '#1f77b4',
  classSwapReversal: '#1f77b4',
  perfect: '#9467bd',
  random: '#8c564b',
  wrong: '#e377c2',

  // PR-curve-specific traces: keep these if the previous file uses them.
  pr: '#000000ff',
  baseline: '#8c564b',
  operatingPoint: '#1f77b4',
};

const DARK_COLORS = {
  roc: '#f2f2f2',
  thresholdReversal: '#6cb2eb',
  classSwap: '#6cb2eb',
  classSwapReversal: '#6cb2eb',
  perfect: '#b79cff',
  random: '#e0a58f',
  wrong: '#f48fb1',

  pr: '#f2f2f2',
  baseline: '#e0a58f',
  operatingPoint: '#6cb2eb',
};

const LIGHT_THEME = {
  text: '#333333',
  title: '#111111',
  secondary: '#555555',
  grid: '#e5e5e5',
  border: 'rgba(0,0,0,0.15)',
  panel: 'rgba(0,0,0,0.02)',
};

const DARK_THEME = {
  text: '#e6e6e6',
  title: '#f5f5f5',
  secondary: '#b8b8b8',
  grid: 'rgba(255,255,255,0.16)',
  border: 'rgba(255,255,255,0.28)',
  panel: 'rgba(255,255,255,0.05)',
};

const COLORS = { ...LIGHT_COLORS };
const THEME = {
  dark: false,
  bg: 'rgb(255,255,255)',
  ...LIGHT_THEME,
};

function parseRgba(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '');
  if (!m) return null;

  const values = m[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);

  return {
    r: values[0],
    g: values[1],
    b: values[2],
    a: values.length > 3 ? values[3] : 1,
  };
}

function pageBackground(el) {
  for (let node = el; node; node = node.parentElement) {
    const color = parseRgba(getComputedStyle(node).backgroundColor);

    if (color && color.a > 0.5) {
      return color;
    }
  }

  return { r: 255, g: 255, b: 255, a: 1 };
}

function refreshTheme(el) {
  const bg = pageBackground(el);

  const luminance =
    (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;

  const dark = luminance < 0.5;
  const bgStr = `rgb(${bg.r},${bg.g},${bg.b})`;

  const changed = dark !== THEME.dark || bgStr !== THEME.bg;

  Object.assign(
    THEME,
    dark ? DARK_THEME : LIGHT_THEME,
    { dark, bg: bgStr }
  );

  Object.assign(COLORS, dark ? DARK_COLORS : LIGHT_COLORS);

  return changed;
}


function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * z);

  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
      Math.exp(-z * z);

  return sign * y;
}


function Phi(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}


// -------------------------------------------------------------------
// Gaussian model
// -------------------------------------------------------------------

function fprAt(t) {
  return 1 - Phi(t);
}

function tprAt(t) {
  return 1 - Phi((t - 1) / 2);
}


function rocPoint(t) {
  return {
    fpr: fprAt(t),
    tpr: tprAt(t),
  };
}


// -------------------------------------------------------------------
// PR transformations
// -------------------------------------------------------------------

// Original upper-tail classifier.
//
// Recall = TPR
//
// Precision = P(Y=1 | X >= t)
//           = π TPR / [π TPR + (1-π) FPR]
function prPoint(t, prevalence) {

  const pt = rocPoint(t);

  const pi = prevalence;
  const pi0 = 1 - pi;

  const denominator =
    pi * pt.tpr +
    pi0 * pt.fpr;

  const precision =
    denominator > 0
      ? (pi * pt.tpr) / denominator
      : NaN;   // 0/0: precision undefined, not a point of the curve

  return {
    recall: pt.tpr,
    precision,
  };
}


// -------------------------------------------------------------------
// Threshold reversal
// -------------------------------------------------------------------
//
// The classes stay unchanged, but the positive prediction becomes
// X < t.
//
// Recall = 1 - TPR
//
// Precision = P(Y=1 | X < t)
//           = π(1-TPR)
//             / [π(1-TPR) + (1-π)(1-FPR)]
//
function reversedTestPrPoint(t, prevalence) {

  const pt = rocPoint(t);

  const pi = prevalence;
  const pi0 = 1 - pi;

  const recall = 1 - pt.tpr;

  const denominator =
    pi * (1 - pt.tpr) +
    pi0 * (1 - pt.fpr);

  const precision =
    denominator > 0
      ? (pi * (1 - pt.tpr)) / denominator
      : NaN;   // 0/0: precision undefined, not a point of the curve

  return {
    recall,
    precision,
  };
}


// -------------------------------------------------------------------
// Class-label swap
// -------------------------------------------------------------------
//
// New positive class = original Y=0.
//
// The upper-tail rule is unchanged.
//
// Recall* = FPR
//
// Precision* = P(Y=0 | X >= t)
//            = (1-π) FPR
//              / [(1-π)FPR + π TPR]
//
function classInversionPrPoint(t, prevalence) {

  const pt = rocPoint(t);

  const pi = prevalence;
  const pi0 = 1 - pi;

  const recall = pt.fpr;

  const denominator =
    pi0 * pt.fpr +
    pi * pt.tpr;

  const precision =
    denominator > 0
      ? (pi0 * pt.fpr) / denominator
      : NaN;   // 0/0: precision undefined, not a point of the curve

  return {
    recall,
    precision,
  };
}


// -------------------------------------------------------------------
// Class-label swap + threshold reversal
// -------------------------------------------------------------------
//
// New positive class = original Y=0.
//
// The lower-tail rule is used.
//
// Recall* = 1 - FPR
//
// Precision* = P(Y=0 | X < t)
//            = (1-π)(1-FPR)
//              / [(1-π)(1-FPR) + π(1-TPR)]
//
function classInversionReversedPrPoint(t, prevalence) {

  const pt = rocPoint(t);

  const pi = prevalence;
  const pi0 = 1 - pi;

  const recall = 1 - pt.fpr;

  const denominator =
    pi0 * (1 - pt.fpr) +
    pi * (1 - pt.tpr);

  const precision =
    denominator > 0
      ? (pi0 * (1 - pt.fpr)) / denominator
      : NaN;   // 0/0: precision undefined, not a point of the curve

  return {
    recall,
    precision,
  };
}


// -------------------------------------------------------------------
// Generate a PR curve
// -------------------------------------------------------------------

function prCurve(pointFn, prevalence, tMin, tMax, endpointPrecision, num = 400) {

  const recall = [];
  const precision = [];

  for (let i = 0; i <= num; i++) {

    const t =
      tMin +
      (tMax - tMin) * i / num;

    const pt = pointFn(t, prevalence);

    // Precision is undefined where no positive is predicted (0/0):
    // such thresholds are not points of the curve.
    if (!Number.isFinite(pt.precision)) continue;

    recall.push(pt.recall);
    precision.push(pt.precision);
  }

  // Sort by recall so that Plotly draws the curve from left to right.
  const idx = recall
    .map((_, i) => i)
    .sort((a, b) => recall[a] - recall[b]);

  const x = idx.map(i => recall[i]);
  const y = idx.map(i => precision[i]);

  // Endpoint at recall = 1. It is the limit of the curve where the
  // classifier labels *every* sample as positive, so its height is the
  // base rate of the class that is treated as positive:
  //
  //   original / threshold reversal          -> pi       (positive = Y=1)
  //   class swap / class swap + reversal     -> 1 - pi   (positive = Y=0)
  //
  // Over a finite threshold range the curve may stop just short of it,
  // so append it explicitly.
  x.push(1);
  y.push(endpointPrecision);

  return { x, y, endpointPrecision };
}


// -------------------------------------------------------------------
// Marker for the universal endpoint (1, pi)
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// Small DOM helpers
// -------------------------------------------------------------------

function addLabel(parent, text, { top = false } = {}) {

  const el = document.createElement('div');

  el.textContent = text;

  el.style.fontFamily = FONT_FAMILY;
  el.style.fontWeight = '600';
  el.style.fontSize = '9.5px';
  el.style.margin =
    top ? '8px 0 4px 0' : '0 0 4px 0';

  parent.appendChild(el);

  return el;
}


function addSlider(parent, { min, max, step, value }) {

  const slider = document.createElement('input');

  Object.assign(slider, {
    type: 'range',
    min,
    max,
    step,
    value,
  });

  slider.style.width = '100%';

  parent.appendChild(slider);

  const valueLabel = document.createElement('div');

  Object.assign(valueLabel.style, {
    marginTop: '4px',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: '9px',
    color: THEME.secondary,
  });

  parent.appendChild(valueLabel);

  return {
    slider,
    valueLabel,
  };
}


// -------------------------------------------------------------------
// One curve + operating-point marker
// -------------------------------------------------------------------

function curveAndPoint(
  curve,
  pt,
  {
    color,
    width,
    dash,
    name,
    legend,
    legendrank,
    markerSize = 10,
  }
) {

  // Unique group per curve: clicking its legend entry toggles only this
  // curve (line + operating-point marker), not the whole block.
  const legendgroup = 'curve-' + name;

  return [

    {
      x: curve.x,
      y: curve.y,
      mode: 'lines',
      name,
      legend,
      legendgroup,
      legendrank,
      line: {
        color,
        width,
        dash,
      },
      showlegend: true,
    },

    {
      x: [pt.recall],
      y: [pt.precision],
      mode: 'markers',
      legend,
      legendgroup,
      legendrank,

      marker: {
        color: THEME.bg,
        size: markerSize,
        symbol: 'circle',
        line: {
          color,
          width: 2,
        },
      },

      showlegend: false,
    },

    // endpointMarker({
    //   color,
    //   precision: curve.endpointPrecision,
    //   legend,
    //   legendgroup,
    //   legendrank,
    //   size: endpointSize,
    // }),

  ];
}


// ===================================================================
// Main widget
// ===================================================================

export async function initGaussianSymmetricPrWidget(container) {

  const controlsDiv =
    container.querySelector('.gaussian-symmetric-pr-controls');

  const plotDiv =
    container.querySelector('.gaussian-symmetric-pr-plot');


  const tMin = -4;
  const tMax = 5;


  // -----------------------------------------------------------------
  // Threshold control
  // -----------------------------------------------------------------

  addLabel(controlsDiv, 'Threshold');

  const {
    slider: thresholdSlider,
    valueLabel: thresholdValueLabel,
  } =
    addSlider(
      controlsDiv,
      {
        min: tMin,
        max: tMax,
        step: (tMax - tMin) / 500,
        value: 0.5,
      }
    );


  function updateThresholdValueLabel() {

    thresholdValueLabel.textContent =
      'Threshold = ' +
      parseFloat(thresholdSlider.value).toPrecision(3);
  }

  updateThresholdValueLabel();


  // -----------------------------------------------------------------
  // Prevalence control
  // -----------------------------------------------------------------

  addLabel(
    controlsDiv,
    'Prevalence (π)',
    { top: true }
  );


  const {
    slider: prevalenceSlider,
    valueLabel: prevalenceValueLabel,
  } =
    addSlider(
      controlsDiv,
      {
        min: 0.01,
        max: 0.99,
        step: 0.01,
        value: 0.2,
      }
    );


  function updatePrevalenceValueLabel() {

    prevalenceValueLabel.textContent =
      'π = ' +
      parseFloat(prevalenceSlider.value).toFixed(2);
  }

  updatePrevalenceValueLabel();


  // -----------------------------------------------------------------
  // Small HTML legend in the controls
  // -----------------------------------------------------------------

  const legendRow =
    document.createElement('div');

  Object.assign(
    legendRow.style,
    {
      marginTop: '10px',
      fontFamily: FONT_FAMILY,
      fontSize: '8.5px',
      color: '#555',
      lineHeight: '1.5',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '4px 8px',
    }
  );


function fillLegendRow() {
  legendRow.innerHTML = [
    [COLORS.roc, 'PR curve'],
    [COLORS.thresholdReversal, 'Threshold reversal'],
    [COLORS.classSwap, 'Class label swap'],
    [
      COLORS.classSwapReversal,
      'Class label swap + threshold reversal',
    ],
  ].map(([color, label]) => `
    <div style="
      display: flex;
      align-items: center;
      gap: 4px;
      color: ${THEME.secondary};
    ">
      <span style="
        width: 8px;
        height: 8px;
        box-sizing: content-box;
        border-radius: 50%;
        background: ${THEME.bg};
        border: 2px solid ${color};
        display: inline-block;
        flex-shrink: 0;
      "></span>
      <span>${label}</span>
    </div>
  `).join('');

  legendRow.style.color = THEME.secondary;
}


  controlsDiv.appendChild(legendRow);


function styleControls() {
  controlsDiv.style.border = `1px solid ${THEME.border}`;
  controlsDiv.style.background = THEME.panel;
  controlsDiv.style.color = THEME.text;

  thresholdValueLabel.style.color = THEME.secondary;
  prevalenceValueLabel.style.color = THEME.secondary;
  legendRow.style.color = THEME.secondary;

  fillLegendRow();
}

  // =================================================================
  // Build curves
  // =================================================================

  function buildCurves(prevalence) {

    const gaussianCurve =
      prCurve(
        prPoint,
        prevalence,
        tMin,
        tMax,
        prevalence
      );

    const reversedTestCurve =
      prCurve(
        reversedTestPrPoint,
        prevalence,
        tMin,
        tMax,
        prevalence
      );

    const classInversionCurve =
      prCurve(
        classInversionPrPoint,
        prevalence,
        tMin,
        tMax,
        1 - prevalence
      );

    const classInversionReversedCurve =
      prCurve(
        classInversionReversedPrPoint,
        prevalence,
        tMin,
        tMax,
        1 - prevalence
      );


    return {
      gaussianCurve,
      reversedTestCurve,
      classInversionCurve,
      classInversionReversedCurve,
    };
  }


  // -----------------------------------------------------------------
  // Responsive marker scaling
  // -----------------------------------------------------------------

  function currentScale() {

    const {
      width,
    } = computePlotSize();

    return width / NATURAL_WIDTH;
  }


  // =================================================================
  // Plot traces
  // =================================================================

  function buildTraces(t, prevalence) {

    const scale =
      currentScale();


    const scaleMarker =
      size =>
        Math.max(
          4,
          size * scale
        );


    const {
      gaussianCurve,
      reversedTestCurve,
      classInversionCurve,
      classInversionReversedCurve,
    } =
      buildCurves(prevalence);


    // Always-wrong PR curve (computed up front).
    //
    // For t <= t_dagger: FPR = 1 and recall r sweeps [0, 1], so
    //
    //   precision(r) = pi r / (pi r + pi0),   r in [0, 1],
    //
    // a smooth arc from (0, 0) to (1, pi). For t >= t_dagger the whole
    // half-line collapses to the single point (0, 0), which is the arc's
    // starting point.
    const wrongRecall = [];
    const wrongPrecision = [];

    for (let i = 0; i <= 400; i++) {

      const r = i / 400;

      const denominator =
        prevalence * r +
        (1 - prevalence);

      const p =
        denominator > 0
          ? (prevalence * r) / denominator
          : 0;

      wrongRecall.push(r);
      wrongPrecision.push(p);
    }


    const traces = [

      // =============================================================
      // ORIGINAL
      // =============================================================

      {
        x: [null],
        y: [null],
        mode: 'lines',

        name: '<b>Original</b>',

        legend: 'legend',
        legendgroup: 'heading-original',
        legendrank: 100,

        showlegend: true,

        line: {
          width: 0,
        },

        hoverinfo: 'skip',
      },


      // Original PR
      ...curveAndPoint(
        gaussianCurve,
        prPoint(t, prevalence),
        {
          color: COLORS.roc,
          width: 2.5,
          dash: 'solid',

          name: 'PR curve',

          legend: 'legend',
          legendrank: 101,

          markerSize:
            scaleMarker(16),

        }
      ),


      // =============================================================
      // TRANSFORMATIONS
      // =============================================================

      {
        x: [null],
        y: [null],
        mode: 'lines',

        name: '<b>Transformations</b>',

        legend: 'legend',
        legendgroup: 'heading-transformations',
        legendrank: 200,

        showlegend: true,

        line: {
          width: 0,
        },

        hoverinfo: 'skip',
      },


      // Threshold reversal
      ...curveAndPoint(
        reversedTestCurve,
        reversedTestPrPoint(
          t,
          prevalence
        ),
        {
          color: COLORS.thresholdReversal,
          width: 2,
          dash: 'dot',

          name: 'Threshold reversal',

          legend: 'legend',
          legendrank: 201,

          markerSize:
            scaleMarker(10),

          // endpointSize: scaleMarker(7),
        }
      ),


      // Class label swap
      ...curveAndPoint(
        classInversionCurve,
        classInversionPrPoint(
          t,
          prevalence
        ),
        {
          color: COLORS.classSwap,
          width: 2,
          dash: 'dash',

          name: 'Class label swap',

          legend: 'legend',
          legendrank: 202,

          markerSize:
            scaleMarker(10),

          // endpointSize: scaleMarker(7),
        }
      ),


      // Class swap + threshold reversal
      ...curveAndPoint(
        classInversionReversedCurve,
        classInversionReversedPrPoint(
          t,
          prevalence
        ),
        {
          color: COLORS.classSwapReversal,
          width: 2,
          dash: 'longdash',

          name: 'Class swap + threshold rev.',

          legend: 'legend',
          legendrank: 203,

          markerSize:
            scaleMarker(10),

          // endpointSize: scaleMarker(7),
        }
      ),


      // =============================================================
      // EXTREME CASES
      // =============================================================

      {
        x: [null],
        y: [null],
        mode: 'lines',

        name: '<b>Extreme cases</b>',

        legend: 'legend',
        legendgroup: 'heading-extreme',
        legendrank: 300,

        showlegend: true,

        line: {
          width: 0,
        },

        hoverinfo: 'skip',
      },


      // Perfect classifier:
      // precision = 1 throughout the informative part of the curve.
      {
        // Flat at 1, then a vertical drop at recall 1 down to (1, pi).
        x: [0, 1, 1],
        y: [1, 1, prevalence],

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

      // endpointMarker({
      //   color: COLORS.perfect,
      //   precision: prevalence,
      //   legend: 'legend',
      //   legendgroup: 'curve-Perfect',
      //   legendrank: 301,
      //   size: scaleMarker(7),
      // }),


      // Random classifier:
      // precision = prevalence π for every recall.
      {
        x: [0, 1],
        y: [prevalence, prevalence],

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

      // endpointMarker({
      //   color: COLORS.random,
      //   precision: prevalence,
      //   legend: 'legend',
      //   legendgroup: 'curve-Random',
      //   legendrank: 302,
      //   size: scaleMarker(7),
      // }),


      // Always-wrong classifier:
      // the point (0, 0) plus the arc pi r / (pi r + pi0) up to (1, pi).
      {
        x: wrongRecall,
        y: wrongPrecision,

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

      // endpointMarker({
      //   color: COLORS.wrong,
      //   precision: prevalence,
      //   legend: 'legend',
      //   legendgroup: 'curve-Always wrong',
      //   legendrank: 303,
      //   size: scaleMarker(7),
      // }),

    ];


    return traces;
  }


  // =================================================================
  // Compact Plotly legend
  // =================================================================

  let cachedNormalGap = null;

  function compactLegendInterlineSpacing() {

    const items =
      plotDiv.querySelectorAll(
        '.legend .traces'
      );


    // Expected order:
    //
    // 0  Original
    // 1  PR curve
    // 2  Transformations
    // 3  Threshold reversal
    // 4  Class label swap
    // 5  Class swap + threshold rev.
    // 6  Extreme cases
    // 7  Perfect
    // 8  Random
    // 9  Always wrong

    if (items.length < 10)
      return;


    const transforms =
      Array.from(items).map(item => {

        const transform =
          item.getAttribute('transform') ||
          '';

        const match =
          transform.match(
            /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/
          );


        if (!match)
          return null;


        return {
          item,
          x: parseFloat(match[1]),
          y: parseFloat(match[2]),
        };
      });


    if (
      transforms.some(
        v => v === null
      )
    )
      return;


    // Measured once, from Plotly's untouched layout, then cached: re-applying
    // the compaction after a legend redraw must never compound.
    if (cachedNormalGap === null)
      cachedNormalGap = transforms[1].y - transforms[0].y;

    const normalGap = cachedNormalGap;


    // 1.00 = normal Plotly spacing
    // 0.80 = 20% reduction
    // 0.63 = 37% reduction
    //
    // Block boundaries remain relatively open.

    const gapFactor = [

      0.800, // Original → PR curve
      0.800, // PR curve → Transformations
      0.800, // Transformations → Threshold reversal

      0.630, // Threshold reversal → Class label swap
      0.630, // Class label swap → Class swap + threshold rev.

      0.800, // Class swap + threshold rev. → Extreme cases
      0.800, // Extreme cases → Perfect

      0.630, // Perfect → Random
      0.630, // Random → Always wrong

    ];


    let y =
      transforms[0].y;


    transforms[0].item.setAttribute(
      'transform',
      `translate(${transforms[0].x},${y})`
    );


    for (
      let i = 1;
      i < transforms.length;
      i++
    ) {

      const gap =
        normalGap *
        gapFactor[i - 1];


      y += gap;


      transforms[i].item.setAttribute(
        'transform',
        `translate(${transforms[i].x},${y})`
      );
    }
  }


  // =================================================================
  // Legend layout
  // =================================================================

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
      color: THEME.text,
    },

    borderwidth: 0,
    itemwidth: 28,
    traceorder: 'normal',
  };
}


  // =================================================================
  // Responsive sizing
  // =================================================================

  const MARGIN_L = 55;
  const MARGIN_R = 175;
  const MARGIN_T = 20;
  const MARGIN_B = 45;

  const NATURAL_WIDTH = 600;
  const MIN_WIDTH = 360;
  const MIN_PLOT_SIDE = 200;


  function computePlotSize() {

    const measured =
      plotDiv.getBoundingClientRect().width;


    const available =
      measured > 0
        ? measured
        : NATURAL_WIDTH;


    const width =
      Math.max(
        MIN_WIDTH,
        Math.min(
          NATURAL_WIDTH,
          Math.round(available)
        )
      );


    const plotSide =
      Math.max(
        MIN_PLOT_SIDE,
        width -
          MARGIN_L -
          MARGIN_R
      );


    const height =
      plotSide +
      MARGIN_T +
      MARGIN_B;


    return {
      width,
      height,
    };
  }


  // =================================================================
  // Plot layout
  // =================================================================

function layout() {
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const { width, height } = computePlotSize();

  return {
    font: {
      family: FONT_FAMILY,
      size: 12,
      color: THEME.text,
    },

    title: {
      font: {
        family: FONT_FAMILY,
        size: 14,
        color: THEME.title,
      },
    },

    xaxis: {
      range: [-0.04, 1.04],
      autorange: false,
      tickvals: ticks,
      showline: false,
      zeroline: false,
      gridcolor: THEME.grid,
      gridwidth: 1,
      tickfont: {
        family: FONT_FAMILY,
        size: 12,
        color: THEME.text,
      },
      title: {
        text: 'Recall',
        font: {
          family: FONT_FAMILY,
          size: 14,
          color: THEME.title,
        },
        standoff: 8,
      },
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
      tickfont: {
        family: FONT_FAMILY,
        size: 12,
        color: THEME.text,
      },
      title: {
        text: 'Precision',
        font: {
          family: FONT_FAMILY,
          size: 14,
          color: THEME.title,
        },
        standoff: 8,
      },
    },

    margin: {
      l: MARGIN_L,
      r: MARGIN_R,
      t: MARGIN_T,
      b: MARGIN_B,
      pad: 0,
    },

    legend: {
      ...legendLayout(),
      font: {
        family: FONT_FAMILY,
        size: 10,
        color: THEME.text,
      },
    },

    uirevision: 'keep',
    width,
    height,
    autosize: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };
}


  // =================================================================
  // Rendering
  // =================================================================

  let rendering = false;
  let pending = false;


 async function render() {
  if (rendering) {
    pending = true;
    return;
  }

  rendering = true;

  try {
    do {
      pending = false;

      const t = parseFloat(thresholdSlider.value);
      const prevalence = parseFloat(prevalenceSlider.value);

      await Plotly.react(
        plotDiv,
        buildTraces(t, prevalence),
        layout(),
        {
          displayModeBar: false,
        }
      );

      compactLegendInterlineSpacing();
    } while (pending);
  } catch (error) {
    console.error('Error rendering PR widget:', error);
  } finally {
    rendering = false;
  }
}

  // ===================================================================
// Theme changes
// ===================================================================

let themeTimers = [];

function refreshThemeAndRender() {
  const changed = refreshTheme(container);

  if (changed) {
    styleControls();
    render();
  }
}

function scheduleThemeCheck() {
  themeTimers.forEach(clearTimeout);

  themeTimers = [60, 400].map(ms =>
    setTimeout(refreshThemeAndRender, ms)
  );
}

const themeObserver = new MutationObserver(scheduleThemeCheck);

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class', 'style', 'data-bs-theme', 'data-theme'],
});

if (document.body) {
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-bs-theme', 'data-theme'],
  });
}

if (document.head) {
  themeObserver.observe(document.head, {
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'rel', 'media', 'href'],
  });
}

const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

colorSchemeQuery.addEventListener?.('change', scheduleThemeCheck);

// Apply the initial theme to the controls.
// The initial render below will use the same THEME values.
refreshTheme(container);
styleControls();


  // =================================================================
  // Controls
  // =================================================================

  thresholdSlider.addEventListener(
    'input',
    () => {

      updateThresholdValueLabel();

      render();
    }
  );


  prevalenceSlider.addEventListener(
    'input',
    () => {

      updatePrevalenceValueLabel();

      render();
    }
  );


  // =================================================================
  // Initial render
  // =================================================================

  const isHeading = ev =>
    String(ev.data[ev.curveNumber].legendgroup || '')
      .startsWith('heading-');


  render().then(() => {

    // Headings are labels only: ignore clicks on them.
    plotDiv.on('plotly_legendclick', ev => !isHeading(ev));
    plotDiv.on('plotly_legenddoubleclick', ev => !isHeading(ev));

    // Plotly redraws the legend after a click/restyle and resets the item
    // positions; re-apply the compact spacing so nothing shifts.
    plotDiv.on('plotly_restyle', compactLegendInterlineSpacing);
    plotDiv.on('plotly_afterplot', compactLegendInterlineSpacing);
  });


  // =================================================================
  // Responsive ResizeObserver
  // =================================================================

  let lastWidth = null;


  requestAnimationFrame(
    () => {

      const w =
        Math.round(
          plotDiv.parentElement
            .getBoundingClientRect()
            .width
        );


      if (
        w !== lastWidth &&
        w > 0
      ) {

        lastWidth = w;

        render();
      }
    }
  );


  const ro =
    new ResizeObserver(
      entries => {

        const w =
          Math.round(
            entries[0]
              .contentRect
              .width
          );


        if (
          w === lastWidth
        )
          return;


        lastWidth = w;

        render();
      }
    );


  ro.observe(
    plotDiv.parentElement
  );
}



document
  .querySelectorAll(
    '.gaussian-symmetric-pr-interactive'
  )
  .forEach(
    container => {

      initGaussianSymmetricPrWidget(
        container
      );
    }
  );