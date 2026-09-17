import { initRocExplorerWidget } from './roc_explorer_engine.js';
import {
  gaussianParamSliders, gaussianYDomain,
  gaussianPdf0, gaussianPdf1, gaussianFpr, gaussianTpr, gaussianAuc,
} from './gaussian_distribution.js';

const gaussianRocModel = {
  controlsSelector: '.gaussian-roc-controls',
  plotSelector: '.gaussian-roc-plot',
  paramSliders: gaussianParamSliders,
  initialT: 0.5,
  computeYDomain: gaussianYDomain,
  pdf0: gaussianPdf0,
  pdf1: gaussianPdf1,
  metricFn: gaussianAuc,
  titleFn(p, auc) {
    const Delta = (p.mu1 - p.mu0) / p.sigma1;
    const b = p.sigma0 / p.sigma1;
    return `Gaussian model  —  Δ = ${Delta.toFixed(2)}, b = ${b.toFixed(2)}  →  AUC = ${auc.toFixed(3)}`;
  },
  curve: {
    point: (t, p) => ({ x: gaussianFpr(t, p), y: gaussianTpr(t, p) }),
    xAxisTitle: 'FPR',
    yAxisTitle: 'TPR',
    curveName: 'ROC curve',
    referenceLine: { type: 'diagonal' },
  },
};

document.querySelectorAll('.gaussian-roc-interactive').forEach((container) => {
  initRocExplorerWidget(container, gaussianRocModel);
});