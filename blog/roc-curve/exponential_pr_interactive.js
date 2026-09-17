import { initRocExplorerWidget } from './roc_explorer_engine.js';
import {
  exponentialParamSliders, exponentialYDomain,
  exponentialPdf0, exponentialPdf1, exponentialFpr, exponentialTpr,
} from './exponential_distribution.js';

// Precision(t) = pi*TPR(t) / (pi*TPR(t) + (1-pi)*FPR(t))  (@thm-precision-formula)
function precision(t, p) {
  const tpr = exponentialTpr(t, p);
  const fpr = exponentialFpr(t, p);
  const num = p.pi * tpr;
  const den = num + (1 - p.pi) * fpr;
  return den > 0 ? num / den : 1;
}

function averagePrecision(p, yDomain, num = 2000) {
  const tMin = Math.min(yDomain[0] - 2, 0), tMax = yDomain[1] + 2;
  let ap = 0, prevR = 1, prevP = 1;
  for (let i = 0; i <= num; i++) {
    const t = tMin + (tMax - tMin) * i / num;
    const r = exponentialTpr(t, p);
    const pr = precision(t, p);
    ap += Math.abs(prevR - r) * (pr + prevP) / 2;
    prevR = r; prevP = pr;
  }
  return ap;
}

const exponentialPrModel = {
  controlsSelector: '.exponential-pr-controls',
  plotSelector: '.exponential-pr-plot',
  paramSliders: [
    ...exponentialParamSliders,
    { key: 'pi', label: 'π (prevalence)', min: 0.05, max: 0.95, step: 0.05, value: 0.5 },
  ],
  initialT: 1.0,
  computeYDomain: exponentialYDomain,
  pdf0: exponentialPdf0,
  pdf1: exponentialPdf1,
  metricFn: (p) => averagePrecision(p, exponentialYDomain(p)),
  titleFn(p, ap) {
    const theta = p.lambda1 / p.lambda0;
    return `Exponential model  —  θ = λ₁/λ₀ = ${theta.toFixed(2)}, π = ${p.pi.toFixed(2)}  →  AP ≈ ${ap.toFixed(3)}`;
  },
  curve: {
    point: (t, p) => ({ x: exponentialTpr(t, p), y: precision(t, p) }),
    xAxisTitle: 'Recall',
    yAxisTitle: 'Precision',
    curveName: 'Precision-Recall curve',
    sweepRange: (yDomain) => [Math.min(yDomain[0] - 2, 0), yDomain[1] + 2],
    referenceLine: { type: 'baseline', value: (p) => p.pi, label: 'Random guessing (π)' },
  },
};

document.querySelectorAll('.exponential-pr-interactive').forEach((container) => {
  initRocExplorerWidget(container, exponentialPrModel);
});