// Four-panel plot (STACKED VERTICALLY): Gaussian model (mu0=0,
// sigma0=1, mu1=1, sigma1=2), prevalence fixed at pi=0.2.
//
// PANEL 1 (PR): Precision-Recall — reference curves for perfect /
// random / "always wrong" classification, the Gaussian PR curve
// itself, its "reversed test" curve, and its "class inversion +
// reversed threshold" curve.
//
// PANEL 2 (q): the same three curves in "q-space", q(t) = FPR(t)/TPR(t)
// = 1/LR+(t), on a LINEAR axis (see the note below on why log scale was
// dropped).
//
// PANEL 3 (ROC): the same operating points and curves in plain ROC
// space (FPR, TPR) — see @thm-three-transforms-final. This is where
// reversed rule and class inversion act as simple, literal reflections.
//
// PANEL 4 (z, x_w): the SAME six curves as panel 1 (perfect / random /
// always-wrong / reversed test / class inversion + reversed threshold /
// main PR curve), reparametrized through
//   z  := logit(Precision) = log(Precision/(1-Precision)),
//   x_w := -log(Recall)
// instead of (Recall, Precision) directly — see @lem-precision-sigmoid.
// Each curve's (recall, precision) pairs are transformed pointwise;
// nothing new is computed beyond the panel-1 curves themselves.
//
// NOTE ON THE q-PANEL SCALE: a log axis makes the class-inversion
// reciprocal q -> 1/q into an exact mirror reflection about q=1 (since
// log(1/q) = -log(q)) — genuinely the right scale for THAT symmetry.
// But the reversed-rule transform is only affine in q at FIXED recall r
// (@lem-reversed-rule-affine-in-q) — a pointwise fact, not a whole-curve
// one, since r itself varies along the curve — and log-scaling further
// warps that pointwise relationship into something curved. Since this
// panel is meant to illustrate q-space generically rather than favor
// one symmetry, it now uses a LINEAR axis, with the divergent tail of
// the class-inversion curve (unbounded as t -> -infinity here, since
// sigma1 != sigma0) clipped to a fixed window instead.
//
// Distribution (mu0, sigma0, mu1, sigma1) and prevalence (PI) are fixed
// constants here — only the threshold varies.
//
// Self-contained: only needs the standard normal CDF.

const FONT_FAMILY = 'Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

// Fixed prevalence for this figure.
const PI = 0.2;

// Guard against 0/0 (and against log(0)) when TPR(t) or FPR(t)
// underflow to (numerically) zero at extreme thresholds.
const EPS = 1e-9;

// Display window for the q-panel (linear). Chosen to comfortably
// contain the main and reversed-test curves' full range, while clipping
// the divergent tail of the class-inversion curve.
const Q_CLAMP_MIN = 0;
const Q_CLAMP_MAX = 6;

function erf(x) {

  const sign = x < 0 ? -1 : 1;

  const z = Math.abs(x);

  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;

  const t = 1 / (1 + p * z);

  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t)
                * Math.exp(-z * z);

  return sign * y;

}

function Phi(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// Fixed Gaussian model for this figure:
// X | Y=0 ~ N(0, 1^2)
// X | Y=1 ~ N(1, 2^2)

function fprAt(t) {

  // FPR(t) = P(X0 >= t) = 1 - Phi((t-mu0)/sigma0) = 1 - Phi(t)

  return 1 - Phi(t);

}

function tprAt(t) {

  // TPR(t) = P(X1 >= t) = 1 - Phi((t-mu1)/sigma1) = 1 - Phi((t-1)/2)

  return 1 - Phi((t - 1) / 2);

}

// Precision(t) = pi*TPR / (pi*TPR + (1-pi)*FPR), per @thm-precision-formula.

function precisionOf(tpr, fpr, pi) {

  const num = pi * tpr;
  const den = num + (1 - pi) * fpr;

  return den > 0 ? num / den : 1;

}

// q(t) := FPR(t)/TPR(t) = 1/LR+(t), per @lem-reading-map-mobius.

function qOf(tpr, fpr) {
  return tpr > EPS ? fpr / tpr : NaN;
}

function clampQForDisplay(q) {
  if (!Number.isFinite(q) || q < 0) return NaN;
  return Math.min(Math.max(q, Q_CLAMP_MIN), Q_CLAMP_MAX);
}

// Clamp a probability away from exactly 0 or 1, so log(.) and
// logit(.) stay finite. Used only by the (z, x_w) panel.

function clamp01(p) {
  return Math.min(Math.max(p, EPS), 1 - EPS);
}

function logit(p) {
  const pc = clamp01(p);
  return Math.log(pc / (1 - pc));
}

// --- Raw (fpr, tpr) points for all three scenarios ------------------

function rocPoint(t) {

  return { fpr: fprAt(t), tpr: tprAt(t) };

}

function reversedTestRocPoint(t) {

  const pt = rocPoint(t);

  return { fpr: 1 - pt.fpr, tpr: 1 - pt.tpr };

}

function classInvertedRocPoint(t) {

  const pt = rocPoint(t);

  return { fpr: 1 - pt.tpr, tpr: 1 - pt.fpr };

}

// --- (recall, precision) points -------------------------------------

function prPoint(t) {

  const fpr = fprAt(t);
  const tpr = tprAt(t);

  return {
    recall: tpr,
    precision: precisionOf(tpr, fpr, PI)
  };

}

function reversedTestPrPoint(t) {

  const fprRev = 1 - fprAt(t);
  const tprRev = 1 - tprAt(t);

  return {
    recall: tprRev,
    precision: precisionOf(tprRev, fprRev, PI)
  };

}

function classInvertedPrPoint(t) {

  const fprInv = 1 - tprAt(t);
  const tprInv = 1 - fprAt(t);

  return {
    recall: tprInv,
    precision: precisionOf(tprInv, fprInv, 1 - PI)
  };

}

// --- (recall, q) points ------------------------------------------------

function qPoint(t) {

  const fpr = fprAt(t);
  const tpr = tprAt(t);

  return { recall: tpr, q: qOf(tpr, fpr) };

}

function reversedTestQPoint(t) {

  const fprRev = 1 - fprAt(t);
  const tprRev = 1 - tprAt(t);

  return { recall: tprRev, q: qOf(tprRev, fprRev) };

}

function classInvertedQPoint(t) {

  const fprInv = 1 - tprAt(t);
  const tprInv = 1 - fprAt(t);

  return { recall: tprInv, q: qOf(tprInv, fprInv) };

}

// --- Curve sweeps ---------------------------------------------------------

function sweepCurve(pointFn, tMin, tMax, xKey, yKey, num = 400) {

  const xs = [], ys = [];

  for (let i = 0; i <= num; i++) {

    const t = tMin + (tMax - tMin) * i / num;

    const pt = pointFn(t);

    xs.push(pt[xKey]);
    ys.push(pt[yKey]);

  }

  const idx = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);

  return {
    x: idx.map(i => xs[i]),
    y: idx.map(i => ys[i])
  };

}

function prCurve(pointFn, tMin, tMax, num = 400) {
  return sweepCurve(pointFn, tMin, tMax, 'recall', 'precision', num);
}

function qCurve(pointFn, tMin, tMax, num = 400) {

  const raw = sweepCurve(pointFn, tMin, tMax, 'recall', 'q', num);

  return { x: raw.x, y: raw.y.map(clampQForDisplay) };

}

function rocCurveOf(pointFn, tMin, tMax, num = 400) {
  return sweepCurve(pointFn, tMin, tMax, 'fpr', 'tpr', num);
}

// Reparametrize an existing (recall, precision) curve — any {x,y} pair
// of equal-length arrays — into (z, x_w) = (logit(precision), -log(recall)).
// Re-sorted by the new x (z), since the map recall -> -log(recall) is
// decreasing while precision -> logit(precision) is increasing, so the
// original recall-ascending order does not carry over.

function toZW(curveXY) {

  const zs = curveXY.y.map(logit);
  const xws = curveXY.x.map((r) => -Math.log(clamp01(r)));

  const idx = zs.map((_, i) => i).sort((a, b) => zs[a] - zs[b]);

  return {
    x: idx.map(i => zs[i]),
    y: idx.map(i => xws[i])
  };

}

function zwPointFromPr(pt) {
  return { z: logit(pt.precision), xw: -Math.log(clamp01(pt.recall)) };
}

// Closed-form reference curves.

function perfectPrCurve() {
  return { x: [0, 1, 1], y: [1, 1, PI] };
}

function randomPrCurve() {
  return { x: [0, 1], y: [PI, PI] };
}

function alwaysWrongPrCurve(num = 100) {

  const x = [], y = [];

  for (let i = 0; i <= num; i++) {

    const r = i / num;

    x.push(r);
    y.push(PI * r / (PI * r + (1 - PI)));

  }

  return { x, y };

}

function randomGuessingQCurve() {
  return { x: [0, 1], y: [1, 1] };
}

function randomGuessingRocCurve() {
  return { x: [0, 1], y: [0, 1] };
}

export async function initGaussianSymmetricPrWidget(container) {

  const controlsDiv =
    container.querySelector('.gaussian-symmetric-pr-controls');

  const plotDiv =
    container.querySelector('.gaussian-symmetric-pr-plot');

  const plotDivQ =
    container.querySelector('.gaussian-symmetric-pr-plot-q');

  const plotDivRoc =
    container.querySelector('.gaussian-symmetric-pr-plot-roc');

  const plotDivZW =
    container.querySelector('.gaussian-symmetric-pr-plot-zw');

  // --- Control panel: a single threshold slider. ------------------------

  const tMin = -6, tMax = 8;

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

    valueLabel.textContent =
      'Threshold = ' + parseFloat(slider.value).toPrecision(3);

  }

  updateValueLabel();

  // --- Legend (shared across all panels) ----------------------------------

  const legendRow = document.createElement('div');

  legendRow.style.marginTop = '10px';
  legendRow.style.fontFamily = FONT_FAMILY;
  legendRow.style.fontSize = '8.5px';
  legendRow.style.color = '#555';
  legendRow.style.lineHeight = '1.5';

  legendRow.innerHTML = `

    <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px;">

      <span style="width:8px; height:8px; border-radius:50%;
        background:white; border:2px solid black; display:inline-block;"></span>

      operating point

    </div>

    <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px;">

      <span style="width:8px; height:8px; border-radius:50%;
        background:white; border:2px solid #999; display:inline-block;"></span>

      reversed test

    </div>

    <div style="display:flex; align-items:center; gap:4px;">

      <span style="width:8px; height:8px; border-radius:50%;
        background:white; border:2px solid #666; display:inline-block;"></span>

      class inversion + reversed threshold

    </div>`;

  controlsDiv.appendChild(legendRow);

  // --- Static curves (independent of t) ------------------------------------

  const perfectCurve = perfectPrCurve();
  const randomCurve = randomPrCurve();
  const wrongCurve = alwaysWrongPrCurve();

  const gaussianCurveFull = prCurve(prPoint, tMin, tMax);
  const reversedTestCurve = prCurve(reversedTestPrPoint, tMin, tMax);
  const classInvertedCurve = prCurve(classInvertedPrPoint, tMin, tMax);

  const randomQCurve = randomGuessingQCurve();

  const gaussianQCurveFull = qCurve(qPoint, tMin, tMax);
  const reversedTestQCurve = qCurve(reversedTestQPoint, tMin, tMax);
  const classInvertedQCurve = qCurve(classInvertedQPoint, tMin, tMax);

  const randomRocCurve = randomGuessingRocCurve();

  const gaussianRocCurveFull = rocCurveOf(rocPoint, tMin, tMax);
  const reversedTestRocCurve = rocCurveOf(reversedTestRocPoint, tMin, tMax);
  const classInvertedRocCurve = rocCurveOf(classInvertedRocPoint, tMin, tMax);

  // Panel 4: the same six curves as panel 1, reparametrized through
  // (z, x_w) = (logit(precision), -log(recall)) — no new curve math,
  // just a pointwise transform of the panel-1 arrays already computed.
  const perfectZWCurve = toZW(perfectCurve);
  const randomZWCurve = toZW(randomCurve);
  const wrongZWCurve = toZW(wrongCurve);
  const gaussianZWCurve = toZW(gaussianCurveFull);
  const reversedTestZWCurve = toZW(reversedTestCurve);
  const classInvertedZWCurve = toZW(classInvertedCurve);

  // Layout range for panel 4, derived from the main/reversed/inverted
  // curves only (the perfect/random/always-wrong reference curves can
  // run to very large |z| or x_w near their endpoints, since logit and
  // -log diverge at 0/1 — those are simply clipped by the axis range,
  // same convention as the q-panel's clamp).
  const zwCoreX = [
    ...gaussianZWCurve.x, ...reversedTestZWCurve.x, ...classInvertedZWCurve.x,
  ].filter(Number.isFinite);
  const zwCoreY = [
    ...gaussianZWCurve.y, ...reversedTestZWCurve.y, ...classInvertedZWCurve.y,
  ].filter(Number.isFinite);
  const zwXRange = [Math.min(...zwCoreX) - 1, Math.max(...zwCoreX) + 1];
  const zwYRange = [Math.max(0, Math.min(...zwCoreY) - 1), Math.max(...zwCoreY) + 1];

  function buildPrTraces(t) {

    const pt = prPoint(t);
    const ptRev = reversedTestPrPoint(t);
    const ptInv = classInvertedPrPoint(t);

    return [

      { x: perfectCurve.x, y: perfectCurve.y, mode: 'lines',
        name: 'Perfect classification', line: { color: '#cccccc', width: 2.5 }, showlegend: true },

      { x: randomCurve.x, y: randomCurve.y, mode: 'lines',
        name: 'Random classification', line: { color: '#cccccc', width: 2.5, dash: 'dash' }, showlegend: true },

      { x: wrongCurve.x, y: wrongCurve.y, mode: 'lines',
        name: 'Always-wrong classification', line: { color: '#cccccc', width: 2.5, dash: 'dot' }, showlegend: true },

      { x: reversedTestCurve.x, y: reversedTestCurve.y, mode: 'lines',
        name: 'Reversed test', line: { color: '#999999', width: 2.5, dash: 'dashdot' }, showlegend: true },

      { x: classInvertedCurve.x, y: classInvertedCurve.y, mode: 'lines',
        name: 'Class inversion + reversed threshold', line: { color: '#666666', width: 2.5, dash: 'longdash' }, showlegend: true },

      { x: gaussianCurveFull.x, y: gaussianCurveFull.y, mode: 'lines',
        name: 'PR curve', line: { color: '#000000', width: 3.5 }, showlegend: true },

      { x: [pt.recall], y: [pt.precision], mode: 'markers', name: 'Operating point',
        marker: { color: 'white', size: 12, symbol: 'circle', line: { color: 'black', width: 2 } }, showlegend: false },

      { x: [ptRev.recall], y: [ptRev.precision], mode: 'markers', name: 'Reversed test point',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#999999', width: 2 } }, showlegend: false },

      { x: [ptInv.recall], y: [ptInv.precision], mode: 'markers', name: 'Class-inverted point',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#666666', width: 2 } }, showlegend: false },

    ];

  }

  function buildQTraces(t) {

    const pt = qPoint(t);
    const ptRev = reversedTestQPoint(t);
    const ptInv = classInvertedQPoint(t);

    return [

      { x: randomQCurve.x, y: randomQCurve.y, mode: 'lines',
        name: 'Random classification (q=1)', line: { color: '#cccccc', width: 2.5, dash: 'dash' }, showlegend: true },

      { x: reversedTestQCurve.x, y: reversedTestQCurve.y, mode: 'lines',
        name: 'Reversed test (q)', line: { color: '#999999', width: 2.5, dash: 'dashdot' }, showlegend: true },

      { x: classInvertedQCurve.x, y: classInvertedQCurve.y, mode: 'lines',
        name: 'Class inversion + reversed threshold (q, clipped)', line: { color: '#666666', width: 2.5, dash: 'longdash' }, showlegend: true },

      { x: gaussianQCurveFull.x, y: gaussianQCurveFull.y, mode: 'lines',
        name: 'q = FPR/TPR curve', line: { color: '#000000', width: 3.5 }, showlegend: true },

      { x: [pt.recall], y: [clampQForDisplay(pt.q)], mode: 'markers', name: 'Operating point (q)',
        marker: { color: 'white', size: 12, symbol: 'circle', line: { color: 'black', width: 2 } }, showlegend: false },

      { x: [ptRev.recall], y: [clampQForDisplay(ptRev.q)], mode: 'markers', name: 'Reversed test point (q)',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#999999', width: 2 } }, showlegend: false },

      { x: [ptInv.recall], y: [clampQForDisplay(ptInv.q)], mode: 'markers', name: 'Class-inverted point (q)',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#666666', width: 2 } }, showlegend: false },

    ];

  }

  function buildRocTraces(t) {

    const pt = rocPoint(t);
    const ptRev = reversedTestRocPoint(t);
    const ptInv = classInvertedRocPoint(t);

    return [

      { x: randomRocCurve.x, y: randomRocCurve.y, mode: 'lines',
        name: 'Random classification (diagonal)', line: { color: '#cccccc', width: 2.5, dash: 'dash' }, showlegend: true },

      { x: [pt.fpr, ptRev.fpr], y: [pt.tpr, ptRev.tpr], mode: 'lines',
        name: 'Central reflection (guide)', line: { color: '#999999', width: 1, dash: 'dot' }, showlegend: false },

      { x: [pt.fpr, ptInv.fpr], y: [pt.tpr, ptInv.tpr], mode: 'lines',
        name: 'Anti-diagonal reflection (guide)', line: { color: '#666666', width: 1, dash: 'dot' }, showlegend: false },

      { x: reversedTestRocCurve.x, y: reversedTestRocCurve.y, mode: 'lines',
        name: 'Reversed test (ROC)', line: { color: '#999999', width: 2.5, dash: 'dashdot' }, showlegend: true },

      { x: classInvertedRocCurve.x, y: classInvertedRocCurve.y, mode: 'lines',
        name: 'Class inversion + reversed threshold (ROC)', line: { color: '#666666', width: 2.5, dash: 'longdash' }, showlegend: true },

      { x: gaussianRocCurveFull.x, y: gaussianRocCurveFull.y, mode: 'lines',
        name: 'ROC curve', line: { color: '#000000', width: 3.5 }, showlegend: true },

      { x: [pt.fpr], y: [pt.tpr], mode: 'markers', name: 'Operating point (ROC)',
        marker: { color: 'white', size: 12, symbol: 'circle', line: { color: 'black', width: 2 } }, showlegend: false },

      { x: [ptRev.fpr], y: [ptRev.tpr], mode: 'markers', name: 'Reversed test point (ROC)',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#999999', width: 2 } }, showlegend: false },

      { x: [ptInv.fpr], y: [ptInv.tpr], mode: 'markers', name: 'Class-inverted point (ROC)',
        marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#666666', width: 2 } }, showlegend: false },

    ];

  }

function buildZWTraces(t) {

  const pt = zwPointFromPr(prPoint(t));
  const ptRev = zwPointFromPr(reversedTestPrPoint(t));
  const ptInv = zwPointFromPr(classInvertedPrPoint(t));

  return [

    { x: perfectZWCurve.y, y: perfectZWCurve.x, mode: 'lines',
      name: 'Perfect classification (x_w, z)', line: { color: '#cccccc', width: 2.5 }, showlegend: true },

    { x: randomZWCurve.y, y: randomZWCurve.x, mode: 'lines',
      name: 'Random classification (x_w, z)', line: { color: '#cccccc', width: 2.5, dash: 'dash' }, showlegend: true },

    { x: wrongZWCurve.y, y: wrongZWCurve.x, mode: 'lines',
      name: 'Always-wrong classification (x_w, z)', line: { color: '#cccccc', width: 2.5, dash: 'dot' }, showlegend: true },

    { x: reversedTestZWCurve.y, y: reversedTestZWCurve.x, mode: 'lines',
      name: 'Reversed test (x_w, z)', line: { color: '#999999', width: 2.5, dash: 'dashdot' }, showlegend: true },

    { x: classInvertedZWCurve.y, y: classInvertedZWCurve.x, mode: 'lines',
      name: 'Class inversion + reversed threshold (x_w, z)', line: { color: '#666666', width: 2.5, dash: 'longdash' }, showlegend: true },

    { x: gaussianZWCurve.y, y: gaussianZWCurve.x, mode: 'lines',
      name: '(x_w, z) curve', line: { color: '#000000', width: 3.5 }, showlegend: true },

    { x: [pt.xw], y: [pt.z], mode: 'markers', name: 'Operating point (x_w, z)',
      marker: { color: 'white', size: 12, symbol: 'circle', line: { color: 'black', width: 2 } }, showlegend: false },

    { x: [ptRev.xw], y: [ptRev.z], mode: 'markers', name: 'Reversed test point (x_w, z)',
      marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#999999', width: 2 } }, showlegend: false },

    { x: [ptInv.xw], y: [ptInv.z], mode: 'markers', name: 'Class-inverted point (x_w, z)',
      marker: { color: 'white', size: 10, symbol: 'circle', line: { color: '#666666', width: 2 } }, showlegend: false },

  ];

}

  function baseLayout(xTitle, yTitle, yAxisExtra) {

    return {

      font: { family: FONT_FAMILY, size: 12, color: '#333' },

      xaxis: {
        range: [-0.05, 1.05],
        title: { text: xTitle, font: { size: 12 } },
      },

      yaxis: Object.assign({
        title: { text: yTitle, font: { size: 12 } },
      }, yAxisExtra || {}),

      margin: { l: 60, r: 20, t: 60, b: 55, pad: 4 },

      legend: {
        orientation: 'h', y: 1.15, yanchor: 'bottom', x: 0.5, xanchor: 'center',
        font: { size: 9.5, family: FONT_FAMILY },
      },

      width: 480,
      height: 400,
      autosize: false,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',

    };

  }

  function layoutPr() {
    return baseLayout('Recall', 'Precision', {
      range: [-0.05, 1.05], scaleanchor: 'x', scaleratio: 1,
    });
  }

  function layoutQ() {

    return baseLayout('Recall', 'q = FPR/TPR  (= 1/LR⁺, clipped to [0, 6])', {
      range: [Q_CLAMP_MIN - 0.2, Q_CLAMP_MAX + 0.2],
    });

  }

  function layoutRoc() {
    return baseLayout('FPR', 'TPR', {
      range: [-0.05, 1.05], scaleanchor: 'x', scaleratio: 1,
    });
  }

  function layoutZW() {

    const l = baseLayout('z = logit(Precision)', 'x_w = -log(Recall)', {
      range: zwYRange,
    });

    l.xaxis.range = zwXRange;

    return l;

  }

  function render() {

    const t = parseFloat(slider.value);

    Plotly.react(plotDiv, buildPrTraces(t), layoutPr(),
      { responsive: false, displayModeBar: false });

    Plotly.react(plotDivQ, buildQTraces(t), layoutQ(),
      { responsive: false, displayModeBar: false });

    Plotly.react(plotDivRoc, buildRocTraces(t), layoutRoc(),
      { responsive: false, displayModeBar: false });

    Plotly.react(plotDivZW, buildZWTraces(t), layoutZW(),
      { responsive: false, displayModeBar: false });

  }

  slider.addEventListener('input', () => {

    updateValueLabel();
    render();

  });

  render();

}

document
  .querySelectorAll('.gaussian-symmetric-pr-interactive')
  .forEach((container) => {

    initGaussianSymmetricPrWidget(container);

  });