export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * z);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-z * z);
  return sign * y;
}
export function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }

export function normalPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export const gaussianParamSliders = [
  { key: 'mu0',    label: 'μ₀ (healthy mean)', min: -3,  max: 3, step: 0.1, value: 0 },
  { key: 'sigma0', label: 'σ₀ (healthy sd)',   min: 0.2, max: 3, step: 0.1, value: 1 },
  { key: 'mu1',    label: 'μ₁ (sick mean)',    min: -6,  max: 6, step: 0.1, value: 1 },
  { key: 'sigma1', label: 'σ₁ (sick sd)',      min: 0.2, max: 3, step: 0.1, value: 1 },
];

export function gaussianYDomain(p) {
  return [
    Math.min(p.mu0 - 4 * p.sigma0, p.mu1 - 4 * p.sigma1),
    Math.max(p.mu0 + 4 * p.sigma0, p.mu1 + 4 * p.sigma1),
  ];
}

export const gaussianPdf0 = (y, p) => normalPdf(y, p.mu0, p.sigma0);
export const gaussianPdf1 = (y, p) => normalPdf(y, p.mu1, p.sigma1);
export const gaussianFpr = (t, p) => 1 - Phi((t - p.mu0) / p.sigma0);
export const gaussianTpr = (t, p) => 1 - Phi((t - p.mu1) / p.sigma1);

export function gaussianAuc(p) {
  // AUC = Phi(Delta / sqrt(1+b^2)), Delta = (mu1-mu0)/sigma1, b = sigma0/sigma1
  const Delta = (p.mu1 - p.mu0) / p.sigma1;
  const b = p.sigma0 / p.sigma1;
  return Phi(Delta / Math.sqrt(1 + b * b));
}