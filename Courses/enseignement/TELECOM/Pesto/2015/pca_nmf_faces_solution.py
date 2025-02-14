# -*- coding: utf-8 -*-

# Authors: Vlad Niculae, Alexandre Gramfort, Slim Essid, Joseph Salmon
# License: BSD

from time import time
from numpy.random import RandomState
import pylab as plt
import numpy as np

from sklearn.datasets import fetch_olivetti_faces
from sklearn import cross_validation as cv
from sklearn import decomposition
# from sklearn.svm import SVC
from sklearn.lda import LDA

# -- Prepare data and define utility functions --------------------------------

n_row, n_col = 5, 7
n_components = n_row * n_col
image_shape = (64, 64)
rng = RandomState(0)

# Load faces data
dataset = fetch_olivetti_faces(shuffle=True, random_state=rng)
faces = dataset.data

n_samples, n_features = faces.shape

# global centering
faces_centered = faces - faces.mean(axis=0, dtype=np.float64)

print "Dataset consists of %d faces" % n_samples


def plot_gallery(title, images):
    plt.figure(figsize=(2. * n_col, 2.26 * n_row))
    plt.suptitle(title, size=16)
    for i, comp in enumerate(images):
        plt.subplot(n_row, n_col, i + 1)

        comp = comp.reshape(image_shape)
        vmax = comp.max()
        vmin = comp.min()
        dmy = np.nonzero(comp < 0)
        if len(dmy[0]) > 0:
            yz, xz = dmy
        comp[comp < 0] = 0

        plt.imshow(comp, cmap=plt.cm.gray, vmax=vmax, vmin=vmin)
        # print "vmax: %f, vmin: %f" % (vmax, vmin)
        # print comp

        if len(dmy[0]) > 0:
            plt.plot(xz, yz, 'r,', hold=True)
            print len(dmy[0]), "negative-valued pixels"

        plt.xticks(())
        plt.yticks(())

    plt.subplots_adjust(0.01, 0.05, 0.99, 0.93, 0.04, 0.)


# Plot a sample of the input data
plot_gallery("First centered Olivetti faces", faces_centered[:n_components])

# -- Decomposition methods ----------------------------------------------------

# List of the different estimators and whether to center the data

estimators = [
    ('pca', 'Eigenfaces - PCA',
     decomposition.PCA(n_components=n_components, whiten=True),
     True),

    ('nmf', 'Non-negative components - NMF',
     decomposition.NMF(n_components=n_components, init='nndsvdar', tol=1e-3,
                       sparseness=None, max_iter=200),
     False),

    ('ica', 'Independent components - FastICA',
     decomposition.FastICA(n_components=n_components, whiten=True, tol=1e-6,
                           max_iter=10),
     True)
]

# -- Transform and classify ---------------------------------------------------

labels = dataset.target
n_folds = 3
skf = cv.StratifiedKFold(labels, n_folds=n_folds)
scores = {'pca': np.zeros(n_folds), 'nmf': np.zeros(n_folds),
          'ica': np.zeros(n_folds)}

for i, (tr_ind, ts_ind) in enumerate(skf):
    print 'Fold %d' % (i + 1)
    X, X_, Xt, Xt_ = faces[tr_ind], faces_centered[tr_ind], faces[ts_ind], \
        faces_centered[ts_ind]
    y, yt = labels[tr_ind], labels[ts_ind]

    for shortname, name, estimator, center in estimators:
        # if shortname != 'nmf': continue
        print "Extracting the top %d %s..." % (n_components, name)
        t0 = time()

        data = X
        ts_data = Xt
        if center:
            data = X_
            ts_data = Xt_

        data = estimator.fit_transform(data)
        ts_data = estimator.transform(ts_data)

        print "Classifying..."
        # clf = SVC(kernel='rbf', gamma=1./(0.02*n_components), C=100,
        #       tol=1e-6) # had better select the best param for each transform
        clf = LDA()
        clf = clf.fit(data, y)
        scores[shortname][i] = clf.score(ts_data, yt)

        train_time = (time() - t0)
        print "done in %0.3fs" % train_time

        components_ = estimator.components_

        plot_gallery('%s - Train time %.1fs' % (name, train_time),
                     components_[:n_components])

print scores
print [scores[k].mean() for k in scores.keys()]
