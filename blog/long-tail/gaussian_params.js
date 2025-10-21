// gaussian_params.js - Shared Gaussian mixture parameters
export const n_samples = 1000;
export const priors = [6/10, 1/10, 3/10];
export const means = [[0, 3.5], [-2, 0], [1, 1]];
export const covs = [
    [[1, 0.8], [0.8, 1]],
    [[.25, 0], [0, 0.25]],
    [[1.85, 1.4], [1.4, 1.85]]
];
export const n_classes = means.length;
