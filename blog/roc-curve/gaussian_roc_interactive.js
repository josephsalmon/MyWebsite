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
      label: 'π (prevalence)',
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

    // Kept short and on one line (no "model", no spaces around "="):
    // a long, wrapped title otherwise gets clipped against the top of
    // the plot's reserved title margin.
    return (
      `${dist.label}  —  ` +
      // `Δ=${Delta.toFixed(2)}, ρ=${rho.toFixed(2)}, AUC=${auc.toFixed(3)}`
      `Δ=${Delta.toFixed(2)}, ρ=${rho.toFixed(2)}`

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

document
  .querySelectorAll('.gaussian-roc-interactive')
  .forEach((container) => {

    // Add the distribution radio buttons before initializing
    // the existing ROC explorer.
    addDistributionSelector(container);

    // Initial distribution.
    container.dataset.distribution = 'gaussian';

    // Listen to distribution changes.
    const radios = container.querySelectorAll(
      '.distribution-selector input[type="radio"]'
    );

    radios.forEach((radio) => {

      radio.addEventListener('change', () => {

        if (!radio.checked) return;

        container.dataset.distribution = radio.value;

        // The engine reads the parameter object generated from
        // the controls. We expose the selected distribution
        // through the container.
        //
        // If the engine provides a refresh/update method,
        // it should be called here. Otherwise, dispatch an
        // input event so the existing control machinery can
        // recompute the widget.
        container.dispatchEvent(
          new CustomEvent('roc-distribution-change', {
            detail: {
              distribution: radio.value,
            },
          })
        );
      });

    });

    initRocExplorerWidget(
      container,
      locationScaleRocModel
    );
  });