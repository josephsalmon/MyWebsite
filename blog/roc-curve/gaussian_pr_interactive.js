import { initRocExplorerWidget } from './roc_explorer_engine.js';
import {
  distributionParamSliders, distributionYDomain,
  distributionPdf0, distributionPdf1,
  distributionFpr, distributionTpr,
  addDistributionSelector, distributions,
} from './gaussian_distribution.js';

// Precision(t) = pi*TPR(t) / (pi*TPR(t) + (1-pi)*FPR(t))  (@thm-precision-formula)
function precision(t, p) {
  const tpr = distributionTpr(t, p);
  const fpr = distributionFpr(t, p);
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
    const r = distributionTpr(t, p);
    const pr = precision(t, p);
    ap += Math.abs(prevR - r) * (pr + prevP) / 2; // trapezoid, |dr| since r decreases in t
    prevR = r; prevP = pr;
  }
  return ap;
}

const locationScalePrModel = {
  controlsSelector: '.gaussian-pr-controls',
  plotSelector: '.gaussian-pr-plot',
  paramSliders: [
    ...distributionParamSliders,
    { key: 'pi', label: 'π (prevalence)', min: 0.05, max: 0.95, step: 0.05, value: 0.5 },
  ],
  initialT: 0.5,
  computeYDomain: distributionYDomain,
  pdf0: distributionPdf0,
  pdf1: distributionPdf1,
  metricFn: (p) => averagePrecision(p, distributionYDomain(p)),
  titleFn(p, ap) {
    const Delta = (p.mu1 - p.mu0) / p.sigma1;
    const rho = p.sigma0 / p.sigma1;
    const dist = distributions[p.distribution || 'gaussian'];
    return (
      `${dist.label} model  —  ` +
      `Δ = ${Delta.toFixed(2)}, ρ = ${rho.toFixed(2)}, π = ${p.pi.toFixed(2)}  →  AP ≈ ${ap.toFixed(3)}`
    );
  },
  curve: {
    point: (t, p) => ({ x: distributionTpr(t, p), y: precision(t, p) }),
    xAxisTitle: 'Recall',
    yAxisTitle: 'Precision',
    curveName: 'Precision-Recall curve',
    referenceLine: { type: 'baseline', value: (p) => p.pi, label: 'Random guessing (π)' },
  },
};

document.querySelectorAll('.gaussian-pr-interactive').forEach((container) => {

  // Pass this widget's controls selector!
  addDistributionSelector(container, '.gaussian-pr-controls');

  container.dataset.distribution = 'gaussian';

  const radios = container.querySelectorAll(
    '.distribution-selector input[type="radio"]'
  );

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      container.dataset.distribution = radio.value;
      container.dispatchEvent(
        new CustomEvent('roc-distribution-change', {
          detail: { distribution: radio.value },
        })
      );
    });
  });

  initRocExplorerWidget(container, locationScalePrModel);
});