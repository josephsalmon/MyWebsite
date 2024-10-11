# -*- coding: utf-8 -*-
"""
Created on Sept 25 09:39:45 2014

@author: joseph salmon
"""

import matplotlib.pyplot as plt
import numpy as np

###################################################################################
# Plot initialization

dirname="../srcimages/"
imageformat='.svg'
from matplotlib import rc
rc('font', **{'family':'sans-serif', 'sans-serif':['Computer Modern Roman']})
params = {'axes.labelsize': 12,
          'text.fontsize': 12,
          'legend.fontsize': 12,
          'xtick.labelsize': 10,
          'ytick.labelsize': 10,
          'text.usetex': True,
          'figure.figsize': (8,6)}
plt.rcParams.update(params)
mc3my_brown = (0.64,0.16,0.16)
purple = (148./255,0,211./255)
plt.close("all")

###################################################################################
# Gaussienne
x = np.linspace(-3., 3.0)
sigma2=1
mu=0

fig1, ax = plt.subplots(figsize=(10,3))
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, color=purple)
plt.show()

filename="standardNorm"
image_name=dirname+filename+imageformat
fig1.savefig(image_name)


###################################################################################
# multiple Gaussienne
x = np.linspace(-5., 5.0,num=200)

sigma2=0.2
mu=0

fig1, ax = plt.subplots(figsize=(10,3))
ax.set_xlim(-5, 5)
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                label= r'$\mu={0},\quad   \sigma^2={1} $'.format(mu,sigma2))
sigma2=0.5
mu=0
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                label= r'$\mu={0},\quad   \sigma^2={1} $'.format(mu,sigma2))
sigma2=1
mu=0
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                label= r'$\mu={0},\quad   \sigma^2={1} $'.format(mu,sigma2))

sigma2=2
mu=0
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                label= r'$\mu={0},\quad   \sigma^2={1} $'.format(mu,sigma2))

sigma2=5
mu=0
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                label= r'$\mu={0},\quad   \sigma^2={1} $'.format(mu,sigma2))


plt.legend()
plt.show()

filename="standardNorm_bis"
image_name=dirname+filename+imageformat
fig1.savefig(image_name)

fig2, ax1 = plt.subplots(figsize=(10,3))
ax1.set_xlim(-5, 5)

sigma2=1
mu=-2
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                 label= r'$\mu={0}, \sigma^2={1} $'.format(mu,sigma2))


sigma2=1
mu=-1
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                 label= r'$\mu={0}, \sigma^2={1} $'.format(mu,sigma2))

sigma2=1
mu=-0
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                 label= r'$\mu={0}, \sigma^2={1} $'.format(mu,sigma2))

sigma2=1
mu=1
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                 label= r'$\mu={0}, \sigma^2={1} $'.format(mu,sigma2))
sigma2=1
mu=2
plt.plot(x, 1/np.sqrt(2 * np.pi*sigma2) * np.exp( - (x - mu)**2 / 
                (2 * sigma2) ),linewidth=2, 
                 label= r'$\mu={0}, \sigma^2={1} $'.format(mu,sigma2))

plt.legend()
plt.show()

filename="standardNorm_multiple_bis"
image_name=dirname+filename+imageformat
fig1.savefig(image_name)



###################################################################################
# Gaussienne high dimension

from mpl_toolkits.mplot3d import Axes3D

step=200
mean_0 = [1,1]
mean_1 = [2,2]
mean_2 = [3,3]
noise_level = 0.20

xx = np.linspace(0, 4, step)
yy = xx
Xg,Yg = np.meshgrid(xx, yy)



Z2_bis =  plt.mlab.bivariate_normal(Xg,Yg, sigmax=noise_level, 
                                    sigmay=noise_level, mux=mean_1[0], 
                                    muy=mean_1[1], sigmaxy=0.0)

fig3_bis = plt.figure( dpi = 30)
ax = fig3_bis.add_subplot(111, projection='3d')
ax.plot_surface(Xg,Yg, Z2_bis, cmap= 'Oranges', rstride=3, cstride=3,
                alpha=0.9, linewidth=0.5)
ax.set_zlim(0,4)
plt.show()


Z2_ter =  plt.mlab.bivariate_normal(Xg,Yg, sigmax=noise_level, 
                                    sigmay=2*noise_level, mux=mean_1[0], 
                                    muy=mean_1[1], sigmaxy=0.0)


fig3_ter = plt.figure( dpi = 90)
ax = fig3_ter.add_subplot(111, projection='3d')
ax.plot_surface(Xg,Yg, Z2_ter, cmap= 'Oranges', rstride=3, cstride=3,
                alpha=0.9, linewidth=0.5)
ax.set_zlim(0,4)
plt.show()




fig3_bis.savefig('../srcimages/iso_gaussian.svg')
fig3_ter.savefig('../srcimages/aniso_gaussian.svg')


###################################################################################
A=np.random.randn(4,4)
B=np.dot(A,np.transpose(A)) 
np.linalg.det(B) # semi definite positive then
L=np.linalg.cholesky(B)
print np.dot(L,np.transpose(L))-B 
