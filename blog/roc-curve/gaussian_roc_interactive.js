import { initRocExplorerWidget } from './roc_explorer_engine.js';

import {
  distributionParamSliders,
  distributionYDomain,
  distributionPdf0,
  distributionPdf1,
  distributionFpr,
  distributionTpr,
  distributionAuc,
  addDistributionSelector,
  distributions,
} from './gaussian_distribution.js';


// ============================================================
// Generic location-scale ROC model
// ============================================================

const locationScaleRocModel = {

  controlsSelector: '.gaussian-roc-controls',

  plotSelector: '.gaussian-roc-plot',

  paramSliders: [
    ...distributionParamSliders,

    {
      key: 'pi',
      label: 'π₁ (prevalence)',
      min: 0.05,
      max: 0.95,
      step: 0.05,
      value: 0.5,
    },
  ],

  initialT: 0.5,

  computeYDomain(p) {
    return distributionYDomain(p);
  },

  pdf0(x, p) {
    return distributionPdf0(x, p);
  },

  pdf1(x, p) {
    return distributionPdf1(x, p);
  },

  metricFn(p) {
    return distributionAuc(p);
  },

  titleFn(p, auc) {
    const Delta = (p.mu1 - p.mu0) / p.sigma1;
    const rho = p.sigma0 / p.sigma1;
    const dist = distributions[p.distribution || 'gaussian'];

    // `auc` is the value returned by metricFn; recompute it if the engine
    // did not pass it. The ROC curve does not depend on the prevalence
    // pi, so unlike the PR title there is no pi term here.
    const aucValue = typeof auc === 'number' ? auc : distributionAuc(p);

    return (
      `${dist.label} model  —  ` +
      `Δ = ${Delta.toFixed(2)}, ρ = ${rho.toFixed(2)}  →  AUC ≈ ${aucValue.toFixed(3)}`
    );
  },

  curve: {

    point: (t, p) => ({
      x: distributionFpr(t, p),
      y: distributionTpr(t, p),
    }),

    xAxisTitle: 'FPR',

    yAxisTitle: 'TPR',

    curveName: 'ROC curve',

    referenceLine: {
      type: 'diagonal',
    },
  },
};


// ============================================================
// Initialize
// ============================================================

function initializeGaussianRoc() {
  const containers = document.querySelectorAll(
    '.gaussian-roc-interactive'
  );

  containers.forEach(async (container) => {
    try {
      const controls = container.querySelector(
        '.gaussian-roc-controls'
      );

      const plot = container.querySelector(
        '.gaussian-roc-plot'
      );

      if (!controls || !plot) {
        throw new Error(
          'Could not find .gaussian-roc-controls or .gaussian-roc-plot.'
        );
      }

      // Prevent duplicate initialization.
      if (container.dataset.rocInitialized === 'true') {
        return;
      }

      // Set the initial distribution before building the widget.
      container.dataset.distribution = 'gaussian';

      // Add the distribution selector.
      addDistributionSelector(
        container,
        '.gaussian-roc-controls'
      );

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
      // Initialize the ROC explorer.
      await initRocExplorerWidget(
        container,
        locationScaleRocModel
      );

      container.dataset.rocInitialized = 'true';

      console.info('Gaussian ROC explorer initialized.');

    } catch (error) {
      console.error(
        'Failed to initialize Gaussian ROC explorer:',
        error
      );
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    initializeGaussianRoc,
    { once: true }
  );
} else {
  initializeGaussianRoc();
}