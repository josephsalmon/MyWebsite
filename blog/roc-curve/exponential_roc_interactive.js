import { initRocExplorerWidget } from './roc_explorer_engine.js';
import {
  exponentialParamSliders, exponentialYDomain,
  exponentialPdf0, exponentialPdf1, exponentialFpr, exponentialTpr, exponentialAuc,
} from './exponential_distribution.js';

const exponentialRocModel = {
  controlsSelector: '.exponential-roc-controls',
  plotSelector: '.exponential-roc-plot',
  paramSliders: exponentialParamSliders,
  initialT: 1.0,
  computeYDomain: exponentialYDomain,
  pdf0: exponentialPdf0,
  pdf1: exponentialPdf1,
  metricFn: exponentialAuc,
  titleFn(p, auc) {
    const theta = p.lambda1 / p.lambda0;
    return `Exponential model  —  θ = λ₁/λ₀ = ${theta.toFixed(2)}  →  AUC = ${auc.toFixed(3)}`;
  },
  curve: {
    point: (t, p) => ({ x: exponentialFpr(t, p), y: exponentialTpr(t, p) }),
    xAxisTitle: 'FPR',
    yAxisTitle: 'TPR',
    curveName: 'ROC curve',
    sweepRange: (yDomain) => [Math.min(yDomain[0] - 2, 0), yDomain[1] + 2],
    referenceLine: { type: 'diagonal' },
  },
};

document.querySelectorAll('.exponential-roc-interactive').forEach((container) => {
  initRocExplorerWidget(container, exponentialRocModel);
});