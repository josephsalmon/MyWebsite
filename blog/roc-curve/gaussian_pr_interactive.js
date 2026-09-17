import { initRocExplorerWidget } from './roc_explorer_engine.js';
import {
  gaussianParamSliders, gaussianYDomain,
  gaussianPdf0, gaussianPdf1, gaussianFpr, gaussianTpr,
} from './gaussian_distribution.js';

// Precision(t) = pi*TPR(t) / (pi*TPR(t) + (1-pi)*FPR(t))  (@thm-precision-formula)
function precision(t, p) {
  const tpr = gaussianTpr(t, p);
  const fpr = gaussianFpr(t, p);
  const num = p.pi * tpr;
  const den = num + (1 - p.pi) * fpr;
  return den > 0 ? num / den : 1;
}

// Average Precision (area under the PR curve), by numerical integration
// over recall via a fine threshold sweep — the PR analogue of the closed-
// form AUC used on the ROC side; no simple closed form in general.
function averagePrecision(p, yDomain, num = 2000) {
  const tMin = yDomain[0] - 2, tMax = yDomain[1] + 2;
  let ap = 0, prevR = 1, prevP = 1; // t -> -inf gives (recall, precision) -> (1, pi)
  for (let i = 0; i <= num; i++) {
    const t = tMin + (tMax - tMin) * i / num;
    const r = gaussianTpr(t, p);
    const pr = precision(t, p);
    ap += Math.abs(prevR - r) * (pr + prevP) / 2; // trapezoid, |dr| since r decreases in t
    prevR = r; prevP = pr;
  }
  return ap;
}

const gaussianPrModel = {
  controlsSelector: '.gaussian-pr-controls',
  plotSelector: '.gaussian-pr-plot',
  paramSliders: [
    ...gaussianParamSliders,
    { key: 'pi', label: 'π (prevalence)', min: 0.05, max: 0.95, step: 0.05, value: 0.5 },
  ],
  initialT: 0.5,
  computeYDomain: gaussianYDomain,
  pdf0: gaussianPdf0,
  pdf1: gaussianPdf1,
  metricFn: (p) => averagePrecision(p, gaussianYDomain(p)),
  titleFn(p, ap) {
    const Delta = (p.mu1 - p.mu0) / p.sigma1;
    const b = p.sigma0 / p.sigma1;
    return `Gaussian model  —  Δ = ${Delta.toFixed(2)}, b = ${b.toFixed(2)}, π = ${p.pi.toFixed(2)}  →  AP ≈ ${ap.toFixed(3)}`;
  },
  curve: {
    point: (t, p) => ({ x: gaussianTpr(t, p), y: precision(t, p) }),
    xAxisTitle: 'Recall',
    yAxisTitle: 'Precision',
    curveName: 'Precision-Recall curve',
    referenceLine: { type: 'baseline', value: (p) => p.pi, label: 'Random guessing (π)' },
  },
};

document.querySelectorAll('.gaussian-pr-interactive').forEach((container) => {
  initRocExplorerWidget(container, gaussianPrModel);
});