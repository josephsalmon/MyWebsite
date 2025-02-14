# -*- coding: utf-8 -*-
"""
Created on Mon Sep 23 17:51:10 2013

@author: baskiotis, gramfort, salmon
"""

import numpy as np
import matplotlib.pyplot as plt
from tp_ML_supervise_source import \
    rand_gauss, rand_bi_gauss, rand_clown, rand_checkers, grid_2d, plot_2d, \
    frontiere, mse_loss, gradient, plot_gradient, poly2, collist, \
    symlist, gr_mse_loss, hinge_loss, gr_hinge_loss


############################################################################
########            Data Generation: example                        ########
############################################################################

n=100
mu=[1,1]
sigma=[1,1]
rand_gauss(n,mu,sigma)

n1=20
n2=20
mu1=[1,1]
mu2=[-1,-1]
sigma1=[0.9,0.9]
sigma2=[0.9,0.9]
data1=rand_bi_gauss(n1,n2,mu1,mu2,sigma1,sigma2)

std1=1
std2=5
n1=50
n2=50
data2=rand_clown(n1,n2,std1,std2)


std=0.1
data3=rand_checkers(n1,n2,std)
dataX=data1[:,:2]
dataY=data1[:,2]




############################################################################
########            Displaying labeled data                         ########
############################################################################
plt.close("all")

plt.figure(1, figsize=(15,5))
plt.subplot(131)
plt.title('First data set')
plot_2d(data1[:,:2],data1[:,2],w=None)

plt.subplot(132)
plt.title('Second data set')
plot_2d(data2[:,:2],data2[:,2],w=None)

plt.subplot(133)
plt.title('Third data set')
plot_2d(data3[:,:2],data3[:,2],w=None)
plt.show()


############################################################################
########           Linear discriminant analysis (LDA)               ########
############################################################################

from sklearn.lda import LDA
from sklearn import metrics

lda = LDA()
lda.fit(dataX,dataY)
lda.coef_
lda.intercept_


print "LDA results:"
print metrics.classification_report(dataY, lda.predict(dataX))


#meshgrid creation for visualization
xx,yy=grid_2d(dataX,50)
Z = lda.predict(np.c_[xx.ravel(), yy.ravel()])
Z = Z.reshape(xx.shape)

# Display the result into a color plot, first solution


plt.figure(2, figsize=(4,3))
plt.pcolormesh(xx, yy, Z, cmap=plt.cm.Paired)
labs=np.unique(dataY)
idxbyclass=[ np.where(dataY==labs[i])[0] for i in xrange(len(labs))]
for i in xrange(len(labs)):
	plt.scatter(dataX[idxbyclass[i],0],dataX[idxbyclass[i],1],
			color=collist[i%len(collist)],cmap=plt.cm.Paired,
			marker=symlist[i%len(symlist)],s=90,edgecolors='k')

# Display the result into a color plot, second solution
plt.figure(3, figsize=(4,3))
plt.pcolormesh(xx, yy, Z, cmap=plt.cm.Paired)
plt.scatter(dataX[:, 0], dataX[:, 1], c=dataY, edgecolors='k',
				cmap=plt.cm.Paired, s=100)
plt.show()

### Bugged part due to lda coding.
#Display the result into a color plot, third solution
#plt.figure(4)
#plot_2d(dataX,dataY)
#frontiere(lda.predict,dataX,step=50)
#plt.show()
#plt.close("all")

############################################################################
########            Logistic regression                             ########
############################################################################
from sklearn import linear_model
lr = linear_model.LogisticRegression()
lr.fit(dataX,dataY)
lr.coef_
lr.intercept_
lr.score

# grid design with meshgrid
xx,yy=grid_2d(dataX,50)
Z = lr.predict(np.c_[xx.ravel(), yy.ravel()])
Z = Z.reshape(xx.shape)

# Display the result into a color plot, first solution
plt.figure(2, figsize=(4,3))
plt.pcolormesh(xx, yy, Z, cmap=plt.cm.Paired)
labs=np.unique(dataY)
idxbyclass=[ np.where(dataY==labs[i])[0] for i in xrange(len(labs))]
for i in xrange(len(labs)):
	plt.scatter(dataX[idxbyclass[i],0],dataX[idxbyclass[i],1],
			color=collist[i%len(collist)],cmap=plt.cm.Paired,
			marker=symlist[i%len(symlist)],s=90,edgecolors='k')

# Display the result into a color plot, second solution
plt.figure(3, figsize=(4,3))
plt.pcolormesh(xx, yy, Z, cmap=plt.cm.Paired)
plt.scatter(dataX[:, 0], dataX[:, 1], c=dataY, edgecolors='k',
				cmap=plt.cm.Paired, s=100)
plt.show()


# Display the result into a color plot, third solution
plt.figure(4)
plot_2d(dataX,dataY)
frontiere(lr.predict,dataX,step=100)
plt.show()


############################################################################
########                Perceptron example                          ########
############################################################################

# MSE Loss
epsilon=0.01
niter=75

dataX=data1[:,:2]
dataY=data1[:,2]

#w_ini: intial guess for the hyperplan
w_ini=np.zeros([niter,dataX.shape[1]+1])
std_ini=1
for i in range(dataX.shape[1]+1):
	w_ini[-1,-i+1]=std_ini*np.random.randn(1,1)
	print w_ini[-1,-i+1]

lfun=mse_loss
gr_lfun=gr_mse_loss


plt.figure(7)
wh,costh=gradient(dataX,dataY,epsilon,niter,w_ini,lfun,gr_lfun,stoch=False)
plot_gradient(dataX,dataY,wh,costh,lfun)
plt.suptitle('MSE and batch')
plt.show()


epsilon=0.001
plt.figure(8)
plt.suptitle('MSE and stochastic')
wh_sto,costh_sto=gradient(dataX,dataY,epsilon,niter,w_ini,lfun,gr_lfun,
						stoch=True)
plot_gradient(dataX,dataY,wh_sto,costh_sto,lfun)
plt.show()




# Hinge Loss
epsilon=0.01
niter=30

dataX=data1[:,:2]
dataY=data1[:,2]

w_ini=np.zeros([niter,dataX.shape[1]+1])
std_ini=10
for i in range(dataX.shape[1]+1):
	w_ini[-1,-i+1]=std_ini*np.random.randn(1,1)


lfun=hinge_loss
gr_lfun=gr_hinge_loss
wh,costh=gradient(dataX,dataY,epsilon,niter,w_ini,lfun,gr_lfun,stoch=False)

plt.figure(9)
plt.suptitle('Hinge and batch')
plot_gradient(dataX,dataY,wh,costh,lfun)
plt.show()

plt.figure(10)
plt.suptitle('Hinge and stochastic')
wh_sto,costh_sto=gradient(dataX,dataY,epsilon,niter,w_ini,lfun,gr_lfun,
						stoch=True)
plot_gradient(dataX,dataY,wh_sto,costh_sto,lfun)
plt.show()


# Create a figure with all the boundary displayed with a
# brighter display for the newest one
epsilon=1
niter=30
plt.figure(11)
wh_sto,costh_sto=gradient(dataX,dataY,epsilon,niter,w_ini,lfun,gr_lfun,
						stoch=True)
indexess=np.linspace(0,1,niter)
for i in range(niter):
	plot_2d(dataX,dataY,wh_sto[i,:],indexess[i])


### TODO : 1) movie of the evolution of the boundary (and the data)



############################################################################
########                Perceptron for larger dimensions            ########
############################################################################

epsilon=0.01
niter=50

dataX=data2[:,:2]
dataY=data2[:,2]

proj=poly2;
dataXX=proj(dataX)
w_ini=np.random.randn(niter,dataXX.shape[1]+1)



clf = linear_model.SGDClassifier()
clf.fit(dataXX, dataY)



plt.ion()
plt.figure(11)
plt.clf()
plot_2d(dataX,dataY)
frontiere(lambda xx:clf.predict(poly2(xx)),dataX)
plt.draw();
plt.show();

# question: provide a score evaluation between the perceptron and the
# perceptron applied to 2nd order polynoms of the data.


############################################################################
########            Knn                                             ########
############################################################################
from sklearn import neighbors


n1=100
n2=100
epsilon=0.1
data3=rand_checkers(n1,n2,epsilon)

dataX=data1[:,:2]
dataY=data1[:,2]



knn = neighbors.KNeighborsClassifier(n_neighbors=5)
knn.fit(dataX,dataY)
plt.figure(5)
plot_2d(dataX,dataY)
frontiere(knn.predict,dataX,step=50)

# Display the result into a color plot, third solution
plt.figure(6)
for k in range(1, 17):
	knn = neighbors.KNeighborsClassifier(n_neighbors=k)
	knn.fit(dataX,dataY)
	plt.subplot(5,4,k)
	plt.xlabel('KNN with k=%d'+str(k))
	plot_2d(dataX,dataY)
	frontiere(knn.predict,dataX,step=50)
	plt.show()


