export function exponentialPdf(y, lambda) {
  return y < 0 ? 0 : lambda * Math.exp(-lambda * y);
}
export function exponentialSurvival(t, lambda) {
  return t < 0 ? 1 : Math.exp(-lambda * t);
}

export const exponentialParamSliders = [
  { key: 'lambda0', label: 'λ₀ (healthy rate)', min: 0.2, max: 3, step: 0.05, value: 1 },
  { key: 'lambda1', label: 'λ₁ (sick rate)',    min: 0.2, max: 3, step: 0.05, value: 0.4 },
];

export function exponentialYDomain(p) {
  return [0, 4 * Math.max(1 / p.lambda0, 1 / p.lambda1)];
}

export const exponentialPdf0 = (y, p) => exponentialPdf(y, p.lambda0);
export const exponentialPdf1 = (y, p) => exponentialPdf(y, p.lambda1);
export const exponentialFpr = (t, p) => exponentialSurvival(t, p.lambda0);
export const exponentialTpr = (t, p) => exponentialSurvival(t, p.lambda1);

export function exponentialAuc(p) {
  // AUC = lambda0 / (lambda0 + lambda1), theta = lambda1/lambda0 (@thm-exponential-roc)
  return p.lambda0 / (p.lambda0 + p.lambda1);
}