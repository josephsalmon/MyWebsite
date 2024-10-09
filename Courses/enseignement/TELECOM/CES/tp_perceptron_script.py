# -*- coding: utf-8 -*-
"""
Created on Mon Sep 23 17:51:10 2013

@authors: baskiotis, salmon, gramfort
"""

import numpy as np
import matplotlib.pyplot as plt

# Check the name of the source file!
from tp_perceptron_source import (rand_gauss, rand_bi_gauss, rand_checkers,
                                  rand_clown, plot_2d, gradient,
                                  plot_gradient, poly2, frontiere,
                                  hinge_loss, gr_hinge_loss,
                                  mse_loss, gr_mse_loss)

############################################################################
########            Data Generation: example                        ########
############################################################################

n = 100
mu = [1., 1.]
sigmas = [1., 1.]
rand_gauss(n, mu, sigmas)


n1 = 20
n2 = 20
mu1 = [1., 1.]
mu2 = [-1., -1.]
sigmas1 = [0.9, 0.9]
sigmas2 = [0.9, 0.9]
data1 = rand_bi_gauss(n1, n2, mu1, mu2, sigmas1, sigmas2)


n1 = 50
n2 = 50
sigmas1 = 1.
sigmas2 = 5.
data2 = rand_clown(n1, n2, sigmas1, sigmas2)


n1 = 75
n2 = 75
sigma = 0.1
data3 = rand_checkers(n1, n2, sigma)

dataX = data1[:, :2]
dataY = data1[:, 2]


############################################################################
########            Displaying labeled data                         ########
############################################################################
plt.close("all")

plt.figure(1, figsize=(15, 5))
plt.subplot(131)
plt.title('First data set')
plot_2d(data1[:, :2], data1[:, 2], w=None)

plt.subplot(132)
plt.title('Second data set')
plot_2d(data2[:, :2], data2[:, 2], w=None)

plt.subplot(133)
plt.title('Third data set')
plot_2d(data3[:, :2], data3[:, 2], w=None)
plt.show()


############################################################################
########                Perceptron example                          ########
############################################################################
# MSE Loss
epsilon = 0.001
niter = 75

dataX = data1[:, :2]
dataY = data1[:, 2]

std_ini = 1.
w_ini = std_ini * np.random.randn(dataX.shape[1] + 1)
lfun = mse_loss
gr_lfun = gr_mse_loss


plt.figure(7)
wh, costh = gradient(dataX, dataY, epsilon, niter, w_ini, lfun, gr_lfun,
                     stoch=False)
plot_gradient(dataX, dataY, wh, costh, lfun)
plt.suptitle('MSE and batch')
plt.show()



epsilon = 0.001
plt.figure(8)
plt.suptitle('MSE and stochastic')
wh_sto, costh_sto = gradient(dataX, dataY, epsilon, niter, w_ini, lfun,
                             gr_lfun, stoch=True)
plot_gradient(dataX, dataY, wh_sto, costh_sto, lfun)
plt.show()


#  Sklearn SGD:
from sklearn import linear_model
clf = linear_model.SGDClassifier()
clf.fit(dataX, dataY)
plt.figure(88)
plot_2d(dataX, dataY)
frontiere(clf.predict, dataX, step=50)
plt.show



# Hinge Loss
epsilon = 0.01
niter = 30

dataX = data1[:, :2]
dataY = data1[:, 2]

std_ini = 1.
w_ini = std_ini * np.random.randn(dataX.shape[1] + 1)

lfun = hinge_loss
gr_lfun = gr_hinge_loss
wh, costh = gradient(dataX, dataY, epsilon, niter, w_ini, lfun,
                     gr_lfun, stoch=False)

plt.figure(9)
plt.suptitle('Hinge and batch')
plot_gradient(dataX, dataY, wh, costh, lfun)
plt.show()

plt.figure(10)
plt.suptitle('Hinge and stochastic')
wh_sto, costh_sto = gradient(dataX, dataY, epsilon, niter, w_ini, lfun,
                             gr_lfun, stoch=True)
plot_gradient(dataX, dataY, wh_sto, costh_sto, lfun)
plt.show()


# Create a figure with all the boundary displayed with a
# brighter display for the newest one
epsilon = 1.
niter = 30
plt.figure(11)
wh_sto, costh_sto = gradient(dataX, dataY, epsilon, niter, w_ini, lfun,
                             gr_lfun, stoch=True)
indexess = np.arange(0., 1., 1. / float(niter))
for i in range(niter):
    plot_2d(dataX, dataY, wh_sto[i, :], indexess[i])


############################################################################
########                Perceptron for larger dimensions            ########
############################################################################
epsilon = 0.01
niter = 50

dataX = data2[:, :2]
dataY = data2[:, 2]

proj = poly2
dataXX = proj(dataX)
w_ini = np.random.randn(niter, dataXX.shape[1] + 1)


from sklearn import linear_model

clf = linear_model.SGDClassifier()
clf.fit(dataXX, dataY)


plt.ion()
plt.figure(11)
plt.clf()
plot_2d(dataX, dataY)
frontiere(lambda xx: clf.predict(poly2(xx)), dataX)
plt.draw()
plt.show()

# QUESTION: proposer une métrique d'évaluation permettant de comparer
# un perceptron estimé sans ou avec les variables produits
# (function poly2)
