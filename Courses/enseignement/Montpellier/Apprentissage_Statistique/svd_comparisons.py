# -*- coding: utf-8 -*-
"""
Adapted from
http://blog.explainmydata.com/2016/01/how-much-faster-is-truncated-svd.html
by Alex Rubinsteyn
@author: Joseph Salmon
"""

import time
import numpy as np
from sklearn import decomposition
import seaborn as sns
import pandas as pd
import matplotlib.pyplot as plt

RANK = 50
N_COLS = 600
min_row = 100
max_rows = 1000


def evaluate_svd(svd_fn, reconstruct_fn, min_rows=100, max_rows=1000,
                 n_samples=30, n_cols=N_COLS, rank=RANK, random_seed=0):
    """ SVD evaluation:
    Return n_rows, time_elimes, errors
    """
    np.random.seed(random_seed)
    time_elimes = []
    errors = []
    n_rows_array = (np.linspace(min_rows, max_rows, num=n_samples)).astype(int)

    for n_rows in n_rows_array:
        # construct a low-rank matrix
        left = np.random.randn(n_rows, rank)
        right = np.random.randn(rank, n_cols)
        full = np.dot(left, right)

        # how long does it take to perform the SVD?
        start_t = time.time()
        svd_outputs = svd_fn(full)
        end_t = time.time()
        time_el = end_t - start_t
        time_elimes.append(time_el)

        # compute mean absolte error of reconstruction
        reconstructed = reconstruct_fn(svd_outputs)
        diff = full - reconstructed
        mae = np.mean(np.abs(diff))
        errors.append(mae)
        print("n_rows=%d , time = %0.4f, MAE = %0.8f" % (n_rows, time_el, mae))
    max_error = np.max(errors)
    print("Max Error=%f" % max_error)
    assert max_error < 0.0000001
    return n_rows_array, time_elimes, errors


# Full SVD with NumPy

def np_svd(X):
    """
    Compute SVD with numpy method
    """
    return np.linalg.svd(X, full_matrices=False, compute_uv=True)


def np_inv_svd(svd_outputs):
    """
    Compute reconstruction from SVD with numpy method
    """
    U, s, V = svd_outputs
    return np.dot(U, np.dot(np.diag(s), V))


# Truncated SVD with scikit-learn

def skl_svd(X, rank=RANK):
    """
    Compute SVD with skl method
    """
    tsvd = decomposition.TruncatedSVD(rank)
    X_reduced = tsvd.fit_transform(X)
    return (tsvd, X_reduced)


def skl_inv_svd(svd_outputs):
    """
    Compute reconstruction from SVD with skl method
    """
    tsvd, X_reduced = svd_outputs
    return tsvd.inverse_transform(X_reduced)


def skl_rand_svd(X, rank=RANK):
    """
    Compute approximated SVD with skl method (randomized algorithm)
    """
    tsvd = decomposition.TruncatedSVD(rank, algorithm="randomized",
                                      n_iter=1)
    X_reduced = tsvd.fit_transform(X)
    return (tsvd, X_reduced)


def skl_arpack_svd(X, rank=RANK):
    """
    Compute approximated SVD with skl method (Arpack algorithm)
    """
    tsvd = decomposition.TruncatedSVD(rank, algorithm="arpack")
    X_reduced = tsvd.fit_transform(X)
    return (tsvd, X_reduced)


# Perform timings

n_rows, np_times, np_errors = evaluate_svd(np_svd, np_inv_svd)
n_rows, skl_rand_times, skl_rand_err = evaluate_svd(skl_rand_svd, skl_inv_svd)
n_rows, skl_arpack_times, skl_arpack_err = evaluate_svd(skl_arpack_svd,
                                                        skl_inv_svd)

# Display

figure = plt.figure(figsize=(10, 10))
sns.plt.xlim(min_row, max_rows)
sns.plt.ylim(0, np.max([np_times, skl_rand_times, skl_arpack_times]))

x_axis = pd.Series(n_rows, name="number of rows")

sns.regplot(x=x_axis, y=pd.Series(np_times, name="elapsed time (s)"))
sns.regplot(x=x_axis, y=pd.Series(skl_rand_times, name="elapsed time (s)"))
sns.regplot(x=x_axis, y=pd.Series(skl_arpack_times, name="elapsed time (s)"))


plt.legend(("numpy.linalg.svd", "TruncatedSVD (rand)",
            "TruncatedSVD (arpack)"), loc='upper left')
plt.title("Time to perform SVD:" +
          " rank = {0} with {1} columns".format(RANK, N_COLS))
plt.show()
