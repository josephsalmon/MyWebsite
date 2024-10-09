import pandas as pd
from sklearn import linear_model

# Alternative for Linear Models
import statsmodels.api as sm

import matplotlib.pyplot as plt #for plots
import numpy as np
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.ticker import LinearLocator, FormatStrFormatter


#this is for display only
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




# Load data about Galton's experiment:
url = 'http://www.math.uah.edu/stat/data/Galton.txt'

#other possible data sets.
#url = 'https://forge.scilab.org/index.php/p/rdataset/source/file/master/csv/datasets/cars.csv'
#url = 'http://vincentarelbundock.github.io/Rdatasets/csv/datasets/trees.csv'


# Warning error: find the correct sep type (open the txt file to see the issue)
dat = pd.read_csv(url)
# Solution:
dat = pd.read_csv(url, sep="\t")

# perform the regression fitting
y=dat['Child']
x=dat['Midparent']
clf = linear_model.LinearRegression()

# first try:
clf.fit(x,y)

#wrong dimension: x.shape is (n,)
[n,]=x.shape

#reshape X to be a matrix:
X=x.reshape(n,1)
clf.fit(X,y)
clf.intercept_
clf.coef_


#display data and fitted values
fig, ax = plt.subplots(figsize=(8,6))
ax.plot(X[:,], y, 'o', label="data")
ax.plot(X[:,], clf.predict(X), 'r',linewidth=3,
         label="OLS")
ax.legend(loc='best', numpoints = 1)
plt.show()

# without the constants added:
clf2 = linear_model.LinearRegression(fit_intercept = False, normalize= False)
clf2.fit(X,y)
clf2.coef_
clf2.intercept_

#display data and fitted values
fig, ax = plt.subplots(figsize=(8,6))
ax.set_ylim(-20, 120)
ax.plot(X[:,], y, 'o', label="data")
ax.plot(X[:,], clf2.predict(X), 'r',linewidth=3,
         label="OLS")
ax.legend(loc='best', numpoints = 1)
plt.show()


#open question: find the values of \theta_0 and \theta_1 explicitely

#standard deviation: check the formula used by this function 1/n or 1/(n-1)?
std_error = np.std(y-clf.predict(X))
 

#comparison with a Gaussian distribution 
sm.qqplot( (y-clf.predict(X))/std_error)
plt.close('all')

plt.hist(y-clf.predict(X),bins = 22)
plt.show()




###############################################################################
#################### second dataset : example in 3D (2 features)  #############
###############################################################################

# Load data about tree growth
url = 'http://vincentarelbundock.github.io/Rdatasets/csv/datasets/trees.csv'
dat3 = pd.read_csv(url)
# perform the regression fitting

# Fit regression model
X=dat3[['Girth','Height']]
y=dat3['Volume']

clf = linear_model.LinearRegression(fit_intercept = True)
clf.fit(X,y)
X.shape

clf.intercept_
clf.coef_


XX = np.arange(8, 22, 0.5)
YY = np.arange(64, 90, 0.5)
xx, yy = np.meshgrid(XX, YY)
zz = clf.coef_[0]*xx +clf.coef_[1]*yy+clf.intercept_


fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
ax.plot_wireframe(xx, yy, zz, rstride=10, cstride=10)
ax.plot(X['Girth'],X['Height'],y,'o',c='b')
#ax.zaxis.set_major_locator(LinearLocator(10))
#ax.zaxis.set_major_formatter(FormatStrFormatter('%.02f'))
ax.set_zlim(5, 80)
ax.set_xlabel('Girth')
ax.set_ylabel('Height')
ax.set_zlabel('Volume')
plt.show()


###############################################################################
#################### third dataset :  auto-mpg     ############################
###############################################################################
# Load the auto-mpg dataset.
#url = 'auto-mpg.csv'
url = 'http://josephsalmon.eu/enseignement/TELECOM/CES/auto-mpg.csv'

dat4 = pd.read_csv(url, sep = ',')

dat4[28:34] # beware of the ???? or NAN

colnames=['mpg','cylinders','engdispl','horsepower','weight','accel','year','origin','carname']
dat4 = pd.read_csv(url, sep=',', na_values='?')
dat4.columns = ['mpg','cylinders','engdispl','horsepower','weight','accel','year','origin','carname']
dat4[28:34]
dat4['mpg']
dat4['horsepower']

data_clean=dat4.dropna()
data_clean['horsepower'][28:35]
y=data_clean['mpg']
X=data_clean.drop(['mpg','carname'],axis=1)


clf = linear_model.LinearRegression()
clf.fit(X,y)
clf.intercept_
clf.coef_

# what is the solution with sklearn? Apply the same kind of commends as before



# Check that in fact the row 190 is the one used in the pdf
X.query('weight==3233')
y[190]
clf.predict(X.query('weight==3233'))