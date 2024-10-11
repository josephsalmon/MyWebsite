# -*- coding: utf-8 -*-
"""
Created on Thu Oct  2 16:49:12 2014

@author: salmon
"""

import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt  # for plots
from matplotlib import rc
from sklearn.linear_model import RidgeCV

###############################################################################
# Plot initialization
dirname = "../srcimages/"
imageformat = '.pdf'
rc('font', **{'family': 'sans-serif', 'sans-serif': ['Computer Modern Roman']})
params = {'axes.labelsize': 12,
          'font.size': 16,
          'legend.fontsize': 16,
          'text.usetex': True,
          'figure.figsize': (8, 6)}
plt.rcParams.update(params)

sns.set_context("poster")
sns.set_palette("colorblind")
sns.set_style("white")
np.random.seed(666)
saving_plots = True

###############################################################################
# SVD
plt.close("all")

X = np.random.randn(9, 6)

# Full SVD
U, s, V = np.linalg.svd(X, full_matrices=True)
U.shape, V.shape, s.shape
S = np.zeros((9, 6), dtype=float)
S[:6, :6] = np.diag(s)

# Test to numerical precision if 2 arguments are equal
np.allclose(X, np.dot(U, np.dot(S, V)))

# Partial SVD
U, s, V = np.linalg.svd(X, full_matrices=False)
U.shape, V.shape, s.shape
S = np.diag(s)
# Test to numerical precision if 2 arguments are equal
np.allclose(X, np.dot(U, np.dot(S, V)))


##############################################################################
# SVD/OLS (un)stability

n_features = 50
n_samples = 51

eps = 1e-6

alpha_max = 1e4
n_alphas = 100
alphas = np.logspace(np.log10(alpha_max * eps),
                     np.log10(alpha_max), num=n_alphas)

# observe the weird phenomenon with such a design matrix X:
# x = 10. ** (-np.arange(n_samples,))
# X = (np.column_stack([x ** (i) for i in range(n_features)]))

X = np.random.randn(n_samples, n_features)
theta_true = np.zeros([n_features, ])
theta_true[0:5] = 2
y_true = np.dot(X, theta_true)
sigma = 1.
noise = sigma * np.random.randn(n_samples,)
y = np.dot(X, theta_true) + noise


def ridge_path(X, y, alphas):
    """ compute the ridge path for a list of tuning parameters """
    U, s, Vt = np.linalg.svd(X, full_matrices=False)
    theta_ridge = np.zeros((n_features, n_alphas))
    mat_d = np.zeros((n_features, n_alphas))
    UTy = np.dot(U.T, y)
    for index, alpha in enumerate(alphas):
        mat_d = np.diag((s / (s ** 2 + alpha)))
        coef_alpha = np.dot(Vt.T, np.dot(mat_d, UTy))
        theta_ridge[:, index] = coef_alpha

    return theta_ridge, s

# Possible alternative
# from sklearn.linear_model import _solve_svd

theta_ridge, s = ridge_path(X, y, np.asarray(alphas).ravel())

fig2 = plt.figure(figsize=(12, 8))
sns.despine()
plt.title("Ridge path: " +
          r"$p={0}, n={1} $".format(n_features, n_samples), fontsize=16)
ax1 = fig2.add_subplot(111)
ax1.plot(alphas, np.transpose(theta_ridge), linewidth=3)
ax1.set_xscale('log')
ax1.set_xlabel(r"$\lambda$")
ax1.set_ylabel("Coefficients values")
plt.tight_layout()
plt.show()

if saving_plots is True:
    filename = "Ridge_path"
    image_name = dirname + filename + imageformat
    fig2.savefig(image_name)


###############################################################################
# Cross Validation for Ridge

# If cv not specified  GCV (=leave-one-out) is used... seems really bad,
cv_fold = 5
clf = RidgeCV(alphas=alphas, fit_intercept=False, normalize=False, cv=cv_fold)
clf.fit(X, y)

ax1.axvline(clf.alpha_, color='K', linestyle='-', linewidth=3, label="$a$")
plt.annotate('$CV=5$', xy=(3 * clf.alpha_, 0.5), xycoords='data',
             xytext=(0, 80), textcoords='offset points', fontsize=18)

filename = "Ridge_path_CV"
image_name = dirname + filename + imageformat
fig2.savefig(image_name)

# ##############################################################################
# # Empirical risk : square dist. between true signal and predicted,
# # the Stein formula is needed

# to_test = np.transpose(np.kron(theta_true, np.ones((n_alphas, 1))))
# y_tensor = np.transpose(np.kron(y, np.ones((n_alphas, 1))))
# sure_by_lambdas = np.sum((y_tensor - np.dot(X, theta_ridge)) ** 2, 0)
# cov_term = np.zeros(n_alphas)

# for index, alpha in enumerate(alphas):
#     cov_term[index] = 2 * sigma ** 2 * np.sum(s ** 2 / (s ** 2 + alpha))

# sure_by_lambdas += cov_term - sigma ** 2 * n_samples
# zero_n_features = np.zeros(n_features)
# fig3 = plt.figure(figsize=(12, 8))
# ax1 = fig3.add_subplot(111)
# plt.title("Ridge square-distance true/predicted : " +
#           r"$p={0}, n={1} $".format(n_features, n_samples), fontsize=16)
# plt.loglog(alphas, sure_by_lambdas, linewidth=6)
# err_inf = sure_by_lambdas[-1]
# ax1.axhline(err_inf, color='K', linestyle='-', linewidth=3)
# plt.text(alpha_max / 20., err_inf * 1.3,
#          "Null coef. Risk" + r"=${0}$".format(err_inf),
#          horizontalalignment='center', verticalalignment='center')
# err_zero = sure_by_lambdas[0]
# ax1.axhline(err_zero, color='K', linestyle='-', linewidth=3)
# plt.text(alpha_max * eps * 100, err_zero * 1.3,
#          "OLS Risk" + r"$={0}$".format(err_zero),
#          horizontalalignment='center', verticalalignment='center')
# ax1.set_ylim([err_zero / 3, err_inf * 3])
# ax1.set_xlabel(r"$\lambda$")
# ax1.set_ylabel("Squared-error")


##############################################################################
# Bias / Variance trade-off

# Bias contribution to the prediction risk
Biais2_tab = np.zeros(np.shape(alphas))
Gram = np.dot(X.T, X)
for index, alpha in enumerate(alphas):
    # Biais2 = np.dot(np.dot(Gram, theta_true),
    #                 np.linalg.solve(np.dot(Gram + alpha * np.eye(n_features),
    #                                 Gram + alpha * np.eye(n_features)),
    #                                 theta_true))
    intermed = alpha * X.dot(np.linalg.solve(Gram + alpha * np.eye(n_features),
                                             theta_true))
    Biais2 = np.linalg.norm(intermed) ** 2
    Biais2_tab[index] = Biais2

# Variance contribution to the prediction risk
Var_tab = np.zeros(np.shape(alphas))

for index, alpha in enumerate(alphas):
    Var_tab[index] = np.sum(s ** 4 / (s ** 2 + alpha) ** 2) * sigma ** 2

Risk = Var_tab + Biais2_tab
fig1 = plt.figure(figsize=(12, 8))
plt.title("Bias-Variance trade-off: " +
          r"$p={0}, n={1} $".format(n_features, n_samples), fontsize=16)
ax1 = fig1.add_subplot(111)
ax1.set_ylim([5 * sigma ** 2, Risk[-1] * 1.3])
plt.loglog(alphas, Var_tab, label="Variance", linewidth=6)
plt.loglog(alphas, Biais2_tab, label="Squared Bias", linewidth=6)
plt.loglog(alphas, Risk, label="Risk", linewidth=6)
plt.xlabel('$\lambda$')
plt.ylabel("Risk")
plt.legend(loc="upper left", fontsize=20)
plt.tight_layout()
plt.show()

if saving_plots is True:
    filename = "Bias_variance_trade_off"
    image_name = dirname + filename + imageformat
    fig1.savefig(image_name)

plt.axvline(clf.alpha_, color='K', linestyle='-', linewidth=8, label="$a$")
plt.annotate('$CV=5$', xy=(3 * clf.alpha_, 3), xycoords='data',
             xytext=(0, 80), textcoords='offset points', fontsize=18)

if saving_plots is True:
    filename = "Bias_variance_trade_off_CV"
    image_name = dirname + filename + imageformat
    fig1.savefig(image_name)


###############################################################################
# Risk visualization

# fig1 = plt.figure(figsize=(12, 8))
# plt.title("Bias-Variance trade-off: " +
#           r"$p={0}, n={1} $".format(n_features, n_samples), fontsize=16)
# ax1 = fig1.add_subplot(111)
# plt.loglog(alphas, Var_tab + Biais2_tab, label="Risk (theoretical)",
#            linewidth=6)

# # Stein formula is needed, see above.
# # plt.loglog(alphas, sure_by_lambdas, label="Risk (sure)", linewidth=6)
# plt.legend(loc="upper left")
# plt.show()

###############################################################################
# All large coefs

# theta_true = 1. * np.ones([n_features, ])
# theta_true[0:5] = 0.4
# theta_true = theta_true + 0.2 * np.random.rand(n_features,)


# ###############################################################################
# # Ridge for orthogonal design
# x = np.arange(-10, 10, step=0.01)

# softthresh = lambda x, a: np.sign(x) * np.maximum(np.abs(x) - a, 0)
# ridge_orth = lambda x, alpha: 1 / (1 + alpha) * x

# fig0 = plt.figure(figsize=(6, 6))
# ax1 = plt.subplot(111)
# sns.set_context("poster")
# sns.set_style("white")
# sns.set_palette("colorblind")
# ax1.plot(x, ridge_orth(x, 3.), label=r"$\eta_{\rm {Ridge},\lambda}$")
# ax1.plot(x, x, 'k--', linewidth=1)
# plt.legend(loc="upper left", fontsize=34)
# ax1.set_yticks([])
# ax1.set_yticklabels([])
# ax1.set_xticks([])
# ax1.set_xticklabels([])


# filename = "ridge_orth_1d"
# image_name = dirname + filename + imageformat
# fig0.savefig(image_name)
