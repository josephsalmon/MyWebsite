import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from os import path
from scipy import stats
from matplotlib import rc
from numpy.linalg import norm


rc('font', **{'family': 'sans-serif',
              'sans-serif': ['Computer Modern Roman']})
params = {'axes.labelsize': 12,
          'font.size': 12,
          'legend.fontsize': 12,
          'xtick.labelsize': 10,
          'ytick.labelsize': 10,
          'text.usetex': True,
          'figure.figsize': (8, 6)}
plt.rcParams.update(params)

sns.set_context("poster")
sns.set_style("ticks")


def my_saving_display(fig, dirname, filename, imageformat, saving=False):
    """Function for saving the images under appropriate format."""
    if saving:
        if not path.exists(dirname):
            os.mkdir(dirname)
        image_name = os.path.join(dirname, filename + imageformat)
        fig.savefig(image_name, bbox_inches='tight')


def hinge(x):
    """Hinge/ReLu."""
    z = np.maximum(0, x)
    return z


def berhu(x):
    """BerHu function following Owen terminology."""
    x = np.atleast_1d(x)
    L = 15  # init for the vides on Fenchel.ipynb
    L = 3   # init for the videos in Smoothing.ipynb
    z = np.abs(x)
    if isinstance(x, np.ndarray):
        j = np.abs(x) > L
        z[j] = (x[j] ** 2 + L ** 2) / (2 * L)
    else:
        if np.abs(x) > L:
            z = (x ** 2 + L ** 2) / (2 * L)
    return 3 * z


def pinball(x, slope1=-0.25, slope2=0.75):
    """Hinge/ReLu."""
    z = np.maximum(slope1 * x, slope2 * x)
    return z


def moreau_pinball(x, gamma, slope1=-0.25, slope2=0.75):
    """Moreau env. function for pinball."""
    x = np.atleast_1d(x)
    z = x**2 / (2. * gamma)
    test = x <= gamma * slope1
    z[test] = slope1 * x[test] - gamma * slope1**2 / 2
    test2 = x >= gamma * slope2
    z[test2] = slope2 * x[test2] - gamma * slope2**2 / 2
    return z


def quadratic(x):
    """The fixed point of Fenchel."""
    return x**2 / 2


def huber_conco(x, threshold=2.5):
    """Huber function for concomitant."""
    z = np.abs(x)
    test = np.abs(x) <= threshold
    z[test] = x[test] ** 2 / (2 * threshold) + threshold / 2
    return z


def make_huber(alpha_huber):
    """Huber function factory."""
    return (lambda x: huber_ori(x, threshold=alpha_huber),
            lambda x: huber_ori_prime(x, threshold=alpha_huber))


def make_abs():
    """Absolute value function factory."""
    return (lambda x: np.abs(x),
            lambda x: np.sign(x))


def make_median(X):
    """Sum of abs function factory."""
    def cost(theta):
        return norm(X - theta[None, :], axis=1).sum()

    def subgradient(theta):
        X_m_theta = X - theta[None, :]
        return - np.sum(X_m_theta / norm(X_m_theta, axis=1)[:, None],
                        axis=0)
    # XXX deal with 0
    return cost, subgradient


def make_bisquare(X, thrshld=2.5):
    """Sum of biweight function factory."""
    def cost(theta):
        """Bi-square function."""
        normmXtheta = norm(X - theta[None, :], axis=1)
        z = 1 - (1 - (normmXtheta / thrshld)**2)**3
        z = np.minimum(1, z)
        return np.sum(z)

    def gradient(theta):
        X_m_theta = X - theta[None, :]
        normmXtheta = norm(X_m_theta, axis=1)
        u = 6 * X_m_theta * (1 - (normmXtheta[:, None] / thrshld)**2)**2 / thrshld ** 2
        u[normmXtheta > thrshld, :] = 0
        return -np.sum(u, axis=0)

    def weights(theta):
        X_m_theta = X - theta[None, :]
        normmXtheta = norm(X_m_theta, axis=1)
        w = (1 - (normmXtheta / thrshld)**2)**2
        w[normmXtheta > thrshld] = 0
        return w

    return cost, gradient, weights


def huber_ori(x, threshold=2.5):
    """Original Huber function."""
    x = np.atleast_1d(x)
    z = x ** 2 / (2 * threshold)
    test = np.abs(x) > threshold
    z[test] = np.abs(x)[test] - threshold / 2
    return z


def huber_ori_prime(x, threshold=2.5):
    """Original Huber function derivative."""
    x = np.atleast_1d(x)
    z = x / threshold
    test = np.abs(x) > threshold
    z[test] = np.sign(x)[test]
    return z


def huber_ori_scal_prime(x, threshold=2.5):
    """Original Huber function derivative."""
    z = x / threshold
    if np.abs(x) > threshold:
        z = np.sign(x)
    return z


def huber_weights(x, threshold):
    """Normalized weights (max=1) for the original Huber function."""
    z = threshold / np.abs(x)
    test = np.abs(x) < threshold
    z[test] = 1
    return z


def bisquare(x, threshold):
    """Bi-square function."""
    z = 1 - (1 - (x / threshold)**2)**3
    test = np.abs(x) > threshold
    z[test] = 1
    return z


def bisquare_prime(x, threshold):
    """Bi-square function derivative."""
    z = 6 * x * (1 - (x / threshold)**2)**2 / threshold ** 2
    test = np.abs(x) > threshold
    z[test] = 0
    return z


def bisquare_weights(x, threshold):
    """Bi-square function derivative."""
    z = (1 - (x / threshold)**2)**2
    test = np.abs(x) > threshold
    z[test] = 0
    return z


def bisquare_weights_scale(x, threshold):
    """Bi-square function normalized weights (max=1)."""
    z = 1 / x**2
    y = (1 - (1 - (x / threshold)**2)**3) / x**2  # 3-3*x**2+x**4
    return np.minimum(y, z)


def compute_contamination(threshold):
    """...."""
    eps = 1. - 1. / (stats.norm.cdf(threshold) - stats.norm.cdf(-threshold)
                     + 2 * stats.norm.pdf(threshold) / threshold)

    return eps


def optimal_distribution(x, threshold):
    """...."""
    eps = compute_contamination(threshold)
    z = (1 - eps) * stats.norm.pdf(x)
    test = x > threshold
    z[test] = (1 - eps) * stats.norm.pdf(threshold) * \
        np.exp(-threshold * (x[test] - threshold))
    test2 = x < - threshold
    z[test2] = (1 - eps) * stats.norm.pdf(-threshold) * \
        np.exp(threshold * (x[test2] + threshold))
    return z


def worst_corruption(x, threshold):
    """...."""
    eps = compute_contamination(threshold)
    z = optimal_distribution(x, threshold) - (1 - eps) * stats.norm.pdf(x)
    return z / eps
