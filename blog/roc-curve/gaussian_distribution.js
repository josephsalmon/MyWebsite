// ------------------------------------------------------------
// Location-scale distributions for the ROC explorer
//
// X0 = sigma0 * Z0 + mu0
// X1 = sigma1 * Z1 + mu1
//
// Delta = (mu1 - mu0) / sigma1
// rho   = sigma0 / sigma1
//
// The five standardized distributions are:
//   Gaussian
//   Cauchy
//   Logistic
//   Uniform [-1/2, 1/2]
//   Gumbel (max)
// ------------------------------------------------------------


// ============================================================
// Basic utilities
// ============================================================

export function erf(x) {
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

export function Phi(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}


// ============================================================
// Standardized distributions
// ============================================================

// ---------- Gaussian ----------

function gaussianCdf(z) {
  return Phi(z);
}

function gaussianPdf(z) {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}


// ---------- Cauchy ----------

function cauchyCdf(z) {
  return 0.5 + Math.atan(z) / Math.PI;
}

function cauchyPdf(z) {
  return 1 / (Math.PI * (1 + z * z));
}


// ---------- Logistic ----------

function logisticCdf(z) {
  // Numerically stable logistic CDF
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }

  const e = Math.exp(z);
  return e / (1 + e);
}

function logisticPdf(z) {
  const F = logisticCdf(z);
  return F * (1 - F);
}


// ---------- Uniform [-1/2, 1/2] ----------

function uniformCdf(z) {
  if (z < -0.5) return 0;
  if (z > 0.5) return 1;
  return z + 0.5;
}

function uniformPdf(z) {
  return (z >= -0.5 && z <= 0.5) ? 1 : 0;
}


// ---------- Gumbel (max) ----------

function gumbelCdf(z) {
  return Math.exp(-Math.exp(-z));
}

function gumbelPdf(z) {
  const e = Math.exp(-z);
  return e * Math.exp(-e);
}


// ============================================================
// Distribution registry
// ============================================================

export const distributions = {
  gaussian: {
    label: 'Gaussian',
    symmetric: true,
    cdf: gaussianCdf,
    pdf: gaussianPdf,
  },

  cauchy: {
    label: 'Cauchy',
    symmetric: true,
    cdf: cauchyCdf,
    pdf: cauchyPdf,
  },

  logistic: {
    label: 'Logistic',
    symmetric: true,
    cdf: logisticCdf,
    pdf: logisticPdf,
  },

  uniform: {
    label: 'Uniform [-1/2, 1/2]',
    symmetric: true,
    cdf: uniformCdf,
    pdf: uniformPdf,
  },

  gumbel: {
    label: 'Gumbel (max)',
    symmetric: false,
    cdf: gumbelCdf,
    pdf: gumbelPdf,
  },
};


// ============================================================
// Distribution-specific parameter ranges
// ============================================================

export const distributionParamSliders = [
  {
    key: 'mu0',
    label: 'μ₀ (healthy location)',
    min: -3,
    max: 3,
    step: 0.1,
    value: 0,
  },

  {
    key: 'sigma0',
    label: 'σ₀ (healthy scale)',
    min: 0.2,
    max: 3,
    step: 0.1,
    value: 1,
  },

  {
    key: 'mu1',
    label: 'μ₁ (sick location)',
    min: -6,
    max: 6,
    step: 0.1,
    value: 1,
  },

  {
    key: 'sigma1',
    label: 'σ₁ (sick scale)',
    min: 0.2,
    max: 3,
    step: 0.1,
    value: 1,
  },
];


// ============================================================
// Selected distribution
// ============================================================

export function getDistribution(p) {
  return distributions[p.distribution || 'gaussian'];
}


// ============================================================
// Location-scale density
// ============================================================

export function distributionPdf0(x, p) {
  const dist = getDistribution(p);
  const z = (x - p.mu0) / p.sigma0;

  return dist.pdf(z) / p.sigma0;
}

export function distributionPdf1(x, p) {
  const dist = getDistribution(p);
  const z = (x - p.mu1) / p.sigma1;

  return dist.pdf(z) / p.sigma1;
}


// ============================================================
// FPR and TPR at threshold t
// ============================================================

export function distributionFpr(t, p) {
  const dist = getDistribution(p);
  const z0 = (t - p.mu0) / p.sigma0;

  return 1 - dist.cdf(z0);
}

export function distributionTpr(t, p) {
  const dist = getDistribution(p);
  const z1 = (t - p.mu1) / p.sigma1;

  return 1 - dist.cdf(z1);
}


// ============================================================
// Theoretical ROC as a function of FPR
//
// General location-scale formula:
//
// TPR = 1 - F(
//          rho F^{-1}(1-FPR) - Delta
//       )
//
// For symmetric distributions:
//
// TPR = F(
//          Delta + rho F^{-1}(FPR)
//       )
//
// The Gumbel case is evaluated directly from the general
// location-scale expression.
// ============================================================

export function distributionRocFromFpr(fpr, p) {
  const dist = getDistribution(p);

  const Delta = (p.mu1 - p.mu0) / p.sigma1;
  const rho = p.sigma0 / p.sigma1;

  // Keep the argument away from exactly 0 and 1.
  const x = Math.min(1 - 1e-12, Math.max(1e-12, fpr));

  // ----------------------------------------------------------
  // Symmetric distributions
  // ----------------------------------------------------------

  if (dist.symmetric) {
    const z = inverseCdf(x, p.distribution);
    return dist.cdf(Delta + rho * z);
  }

  // ----------------------------------------------------------
  // Gumbel: use the general formula
  //
  // F^{-1}(p) = -ln(-ln p)
  // ----------------------------------------------------------

  if (p.distribution === 'gumbel') {
    const q = 1 - x;

    // q is in (0,1), so this is well-defined.
    const z = -Math.log(-Math.log(q));

    return 1 - dist.cdf(rho * z - Delta);
  }

  return NaN;
}


// ============================================================
// Inverse CDFs
// ============================================================

export function inverseCdf(p, distribution) {
  const x = Math.min(1 - 1e-12, Math.max(1e-12, p));

  switch (distribution) {

    case 'gaussian':
      // Inverse normal approximation.
      return normalInverse(x);

    case 'cauchy':
      return Math.tan(Math.PI * (x - 0.5));

    case 'logistic':
      return Math.log(x / (1 - x));

    case 'uniform':
      return x - 0.5;

    case 'gumbel':
      return -Math.log(-Math.log(x));

    default:
      return normalInverse(x);
  }
}


// ============================================================
// Inverse standard normal CDF
//
// Peter John Acklam approximation
// ============================================================

function normalInverse(p) {
  const a = [
    -3.969683028665376e+01,
     2.209460984245205e+02,
    -2.759285104469687e+02,
     1.383577518672690e+02,
    -3.066479806614716e+01,
     2.506628277459239e+00,
  ];

  const b = [
    -5.447609879822406e+01,
     1.615858368580409e+02,
    -1.556989798598866e+02,
     6.680131188771972e+01,
    -1.328068155288572e+01,
  ];

  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
     4.374664141464968e+00,
     2.938163982698783e+00,
  ];

  const d = [
     7.784695709041462e-03,
     3.224671290700398e-01,
     2.445134137142996e+00,
     3.754408661907416e+00,
  ];

  const plow = 0.02425;
  const phigh = 1 - plow;

  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));

    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));

    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  const q = p - 0.5;
  const r = q * q;

  return (
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}


// ============================================================
// Y-axis domain for the density plot
// ============================================================

export function distributionYDomain(p) {
  switch (p.distribution) {

    case 'uniform':
      return [
        p.mu0 - 0.6 * p.sigma0,
        p.mu0 + 0.6 * p.sigma0,
      ];

    case 'gumbel':
      return [
        Math.min(
          p.mu0 - 3 * p.sigma0,
          p.mu1 - 3 * p.sigma1
        ),
        Math.max(
          p.mu0 + 8 * p.sigma0,
          p.mu1 + 8 * p.sigma1
        ),
      ];

    case 'cauchy':
      return [
        Math.min(
          p.mu0 - 8 * p.sigma0,
          p.mu1 - 8 * p.sigma1
        ),
        Math.max(
          p.mu0 + 8 * p.sigma0,
          p.mu1 + 8 * p.sigma1
        ),
      ];

    case 'logistic':
      return [
        Math.min(
          p.mu0 - 7 * p.sigma0,
          p.mu1 - 7 * p.sigma1
        ),
        Math.max(
          p.mu0 + 7 * p.sigma0,
          p.mu1 + 7 * p.sigma1
        ),
      ];

    case 'gaussian':
    default:
      return [
        Math.min(
          p.mu0 - 4 * p.sigma0,
          p.mu1 - 4 * p.sigma1
        ),
        Math.max(
          p.mu0 + 4 * p.sigma0,
          p.mu1 + 4 * p.sigma1
        ),
      ];
  }
}


// ============================================================
// AUC
//
// Numerically integrate the theoretical ROC curve.
// This works uniformly for all five distributions.
// ============================================================

export function distributionAuc(p) {
  const n = 4000;
  const xmin = 1e-6;
  const xmax = 1 - 1e-6;

  let area = 0;

  let xPrev = xmin;
  let yPrev = distributionRocFromFpr(xPrev, p);

  for (let i = 1; i <= n; i++) {
    const x = xmin + (xmax - xmin) * i / n;
    const y = distributionRocFromFpr(x, p);

    area += 0.5 * (y + yPrev) * (x - xPrev);

    xPrev = x;
    yPrev = y;
  }

  // The omitted endpoint intervals have negligible contribution.
  return area;
}


// ============================================================
// Distribution radio buttons
// ============================================================

export function addDistributionSelector(container, controlsSelector) {
  const controls = container.querySelector(
    controlsSelector || '.gaussian-roc-controls'
  );
  if (!controls) return;
  if (controls.querySelector('.distribution-selector')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'distribution-selector';

  // Vertical, compact layout
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '3px';
  wrapper.style.marginBottom = '8px';
  wrapper.style.fontSize = '9.5px';
  wrapper.style.lineHeight = '1.25';

  const title = document.createElement('div');
  title.textContent = 'Distribution';
  title.style.fontWeight = '600';
  title.style.marginBottom = '4px';
  wrapper.appendChild(title);

  const names = [
    ['gaussian', 'Gaussian'],
    ['cauchy', 'Cauchy'],
    ['logistic', 'Logistic'],
    ['uniform', 'Uniform [-1/2, 1/2]'],
    ['gumbel', 'Gumbel (max)'],
  ];

  names.forEach(([value, label], i) => {
    const labelEl = document.createElement('label');
    labelEl.style.display = 'flex';
    labelEl.style.alignItems = 'center';
    labelEl.style.gap = '4px';
    labelEl.style.cursor = 'pointer';
    labelEl.style.userSelect = 'none';
    labelEl.style.overflow = 'hidden';
    labelEl.style.textOverflow = 'ellipsis';
    labelEl.style.whiteSpace = 'nowrap';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'roc-distribution';
    input.value = value;
    input.checked = (value === 'gaussian');
    input.style.margin = '0';
    input.style.transform = 'scale(0.85)';
    input.style.cursor = 'pointer';

    labelEl.appendChild(input);
    labelEl.appendChild(document.createTextNode(label));
    wrapper.appendChild(labelEl);
  });

  controls.prepend(wrapper);
  return wrapper;
}