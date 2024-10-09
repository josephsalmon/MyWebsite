# -*- coding: utf-8 -*-
"""
Created on Mon Sep 23 17:50:04 2013

@author: salmon
"""

############################################################################
#  Impoort part
############################################################################
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
from sklearn.linear_model import LinearRegression


############################################################################
# Displaying labeled data
############################################################################
symlist = ['o', 'p', '*', 's', '+', 'x', 'D', 'v', '-', '^']
collist = ['blue', 'green', 'red', 'purple', 'orange', 'salmon', 'grey',
           'fuchsia']


def hex_to_rgb(value):
    value = value.lstrip('#')
    lv = len(value)
    return tuple(int(value[i:i + lv / 3], 16) for i in range(0, lv, lv / 3))


def plot_2d(data, y=None, w=None, alpha_choice=1):
    """ Plot in 2D the dataset data, colors and symbols according to the
    class given by the vector y (if given); the separating hyperplan w can
    also be displayed if asked"""
    if y is not None:
        labs = np.unique(y)
        idxbyclass = [np.where(y == labs[i])[0] for i in range(len(labs))]
    else:
        labs = [""]
        idxbyclass = [range(data.shape[0])]
    for i in range(len(labs)):
        plt.plot(data[idxbyclass[i], 0], data[idxbyclass[i], 1], '+',
                 color=collist[i % len(collist)], ls='None',
                 marker=symlist[i % len(symlist)], markersize=8)
    plt.ylim([np.min(data[:, 1]), np.max(data[:, 1])])
    plt.xlim([np.min(data[:, 0]), np.max(data[:, 0])])
    mx = np.min(data[:, 0])
    maxx = np.max(data[:, 0])
    if w is not None:
        plt.plot([mx, maxx], [mx * -w[1] / w[2] - w[0] / w[2],
                              maxx * -w[1] / w[2] - w[0] / w[2]],
                 "g", alpha=alpha_choice)


############################################################################
# Displaying tools for the Frontiere
############################################################################

def frontiere(f, data, step=50):
    """ trace la frontiere pour la fonction de decision f"""
    xmin, xmax = data[:, 0].min() - 1, data[:, 0].max() + 1
    ymin, ymax = data[:, 1].min() - 1, data[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(xmin, xmax, (xmax - xmin) * 1. / step),
                         np.arange(ymin, ymax, (ymax - ymin) * 1. / step))
    z = np.array([f(vec) for vec in np.c_[xx.ravel(), yy.ravel()]])
    z = z.reshape(xx.shape)
    plt.imshow(z, origin='lower', extent=[xmin, xmax, ymin, ymax],
               interpolation="bicubic", cmap=cm.jet)

    plt.colorbar()


def frontiere_bis(f, data, step=50):
    """ trace la frontiere pour la fonction de decision f"""
    xmin, xmax = data[:, 0].min() - 1, data[:, 0].max() + 1
    ymin, ymax = data[:, 1].min() - 1, data[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(xmin, xmax, (xmax - xmin) * 1. / step),
                         np.arange(ymin, ymax, (ymax - ymin) * 1. / step))
    z = np.array([f(vec) for vec in np.c_[xx.ravel(), yy.ravel()]])
    z = z.reshape(xx.shape)
    plt.imshow(z, origin='lower', extent=[xmin, xmax, ymin, ymax],
               interpolation="bicubic", cmap=cm.Oranges)
    plt.pcolormesh(xx, yy, z, cmap='red_blue_classes')
    plt.colorbar()


def frontiere_joe(f, data, k=3, step=50):
    """ trace la frontiere pour la fonction de decision f"""
    xmin, xmax = data[:, 0].min() - 1, data[:, 0].max() + 1
    ymin, ymax = data[:, 1].min() - 1, data[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(xmin, xmax, (xmax - xmin) * 1. / step),
                         np.arange(ymin, ymax, (ymax - ymin) * 1. / step))
    z = np.array([f(vec) for vec in np.c_[xx.ravel(), yy.ravel()]])
    z = z.reshape(xx.shape)
    idxbyclass = [np.where(z == i) for i in range(k)]
#    plt.imshow(z,origin='lower',extent=[xmin,xmax,ymin,ymax],
#               interpolation="bicubic", cmap=cm.jet)
    for i in range(k):

        plt.plot(xx[idxbyclass[i]], yy[idxbyclass[i]], '.',
                 color=collist[i % len(collist)], ls='None',
                 markersize=5)
    plt.ylim([np.min(data[:, 1]), np.max(data[:, 1])])
    plt.xlim([np.min(data[:, 0]), np.max(data[:, 0])])


def frontiere_3d(f, data, step=20):
    """plot the 3d frontiere for the decision function ff"""
    ax = plt.gca(projection='3d')
    xmin, xmax = data[:, 0].min() - 1., data[:, 0].max() + 1.
    ymin, ymax = data[:, 1].min() - 1., data[:, 1].max() + 1.
    xx, yy = np.meshgrid(np.arange(xmin, xmax, (xmax - xmin) * 1. / step),
                         np.arange(ymin, ymax, (ymax - ymin) * 1. / step))
    z = np.array([f(vec) for vec in np.c_[xx.ravel(), yy.ravel()]])
    z = z.reshape(xx.shape)
    ax.plot_surface(xx, yy, z, rstride=1, cstride=1,
                    linewidth=0., antialiased=False, cmap=cm.jet)


############################################################################
# Classification with indicators/regression
############################################################################

def classi_ind_regr(x_to_class, X, y, k=3):
    """ X: features
        y: labels/classes
        k: number of classes
        x_to_class: point whose label is to be predicted
    """
    proba_vector = np.zeros(k,)
    regr = LinearRegression()
    for k in range(0, k):
        indexes_k = np.squeeze(np.argwhere(y == k))
        y_k = np.zeros(y.shape)
        y_k[indexes_k] = 1
        regr.fit(X, y_k)
        proba_vector[k] = regr.predict(x_to_class.reshape(1, -1))

    label_pred = np.argmax(proba_vector)
    return label_pred, proba_vector

############################################################################
# Multivariate normal pdf
############################################################################
