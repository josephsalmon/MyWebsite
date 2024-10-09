##############################################################################
#######  Linear algebra:  matrix inversion vs solving systems           ######
##############################################################################
#checking some Algebra computations: time and accuracy:

library(MASS)
n=10


x=runif(n)
MA=matrix(runif(n*n),nrow=n)
y=t(MA)%*%MA%*%x
# One want to solve in xx: MA^T MA xx= yy, ie doing the computation:
# xx=(MA^T MA)^(-1) yy

start <- Sys.time ()
sol1=solve(t(MA)%*%MA,y);
Sys.time () - start

start <- Sys.time ()
sol2=ginv(t(MA)%*%MA)%*%y;
Sys.time () - start

# start <- Sys.time ()
# sol3=qr.solve(t(MA)%*%MA,y)
# Sys.time () - start

start <- Sys.time ()
sol4=solve(t(MA)%*%MA)%*%y;
Sys.time () - start




sum(abs(sol1-x))
sum(abs(sol2-x))
# sum(abs(sol3-x))
sum(abs(sol4-x))





################################################################################
###############           Spectral decomposition ect.                 ############
################################################################################

# TODO : Learning the conditioning of a matrix the "Hard Way"
# TODO
spectrum=eigen(t(MA)%*%MA);
spectrum$values

m=svd(t(MA)%*%MA)
m$d
mypinv<-function(X, tol = sqrt(.Machine$double.eps))
{
  ## Generalized Inverse of a Matrix
  dnx <- dimnames(X)
  if(is.null(dnx)) dnx <- vector("list", 2)
  s <- svd(X)
  nz <- s$d > tol * s$d[1]
  structure(
    if(any(nz)) s$v[, nz] %*% (t(s$u[, nz])/s$d[nz]) else X,
    dimnames = dnx[2:1])
}
start <- Sys.time ()
sol5=mypinv(t(MA)%*%MA)%*%y;
Sys.time () - start
sum(abs(sol5-x))



################################################################################
###############           Dimension 1 :    Galton dataset           ############
################################################################################

Galton=read.table('http://www.math.uah.edu/stat/data/Galton.txt',sep="",head=TRUE)

plot(Galton$Midparent,Galton$Child)
model_Galton=lm(Child~Midparent , data=Galton)

xbar=mean(Galton$Midparent)
ybar=mean(Galton$Child)

theta_1=cov(Galton$Midparent,Galton$Child)/var(Galton$Midparent)
theta_0=ybar-xbar*theta_1


model_Galton$coefficients
theta_0
theta_1

lines(Galton$Midparent,theta_0+theta_1*Galton$Midparent,type="o", 
                                                        pch=24,col="red")
lines(Galton$Midparent,model_Galton$fitted.values,col="blue",lwd=2,lty=2)

hist(Galton$Child-model_Galton$fitted.values,breaks=15)
qqnorm(Galton$Child-model_Galton$fitted.values)



model_Galton_inv=lm(Midparent~Child , data=Galton)
theta_1_inv=theta_1*var(Galton$Midparent)/var(Galton$Child)
theta_2_inv=mean(Galton$Midparent)+ 
            mean((Galton$Child))/mean((Galton$Midparent))*
            var(Galton$Midparent)/var(Galton$Child)*(theta_0-mean(Galton$Child))


################################################################################
###############           Data aquisition: Auto MPG                 ############
################################################################################
# Analysis of the dataset Auto MPG
# download if needed the dataset :
#http://archive.ics.uci.edu/ml/datasets/Auto+MPG
#http://archive.ics.uci.edu/ml/machine-learning-databases/auto-mpg/auto-mpg.data







# Beware when you import the dataset: there might be missing values 
# cf column horsepower :) 
cars_dataset_bad=read.table('auto-mpg.data',sep="",head=TRUE)
cars_dataset_bad


cars_dataset=read.table('auto-mpg.data',sep="",head=TRUE,na.strings = 
                          c("NA","?") )
names(cars_dataset)=c( "mpg","cylinders","engine_displacement","horsepower",
                       "weight","acceleration","year",
                       "origin","car_name")

cars_dataset
dim(cars_dataset)
head(cars_dataset)

# Linear regression  on a small subpart of the dataset.
cars_clean_small=cars_dataset[1:9,1:8]
model_R=lm( mpg ~., data = cars_clean_small)
model_R
#Why do we get NA in 3 columns?



#Cleaninng the NA's (Non Available, =NaN in Matlab):
cars_dataset=cars_dataset[complete.cases(cars_dataset),]
dim(cars_dataset)
#now we have a dataset of size 391, there were 7 lines with NA

# Let's  remove the origin(1=US, 2=Europe,3=Japan) and the names
cars_dataset=cars_dataset[,1:7]
#We could come back to the origin variables later (categorical data)

# make the cars_dataset variables be known by R
attach(cars_dataset)

################################################################################
###############           Linear regression                         ############
################################################################################
# Least square estimate: remark that MPG is miles per gallon (not liters/100km!)
# in a city-cycle context
model_tot=lm(mpg~. , data=cars_dataset)
?lm
help(lm)
model_tot
# Interpretation of the signs of coefficients?
model_tot$coefficients

# compare with the following:
library(MASS)

#try to modify this value to deal with [a, X] instead of [1,X]
a=1
Z=as.matrix(cars_dataset[,2:7])
dimensions=dim(Z)
X=cbind(matrix(a,dimensions[1],1),Z)
dim(X)
y=as.matrix(cars_dataset[,1])
M = (t(X)%*%X)              # DO NOT USE PSEUDO INVERSE...
theta_hat =solve(M,t(X)%*%y)
theta_hat
model_tot$coefficients
pred1=X%*%theta_hat

# testing the prediction in the two cases:
sum(abs(pred1-model_tot$fitted.values))


# TO DISCOVER LATER...
#influence.measures(model_tot)



# Are cylinders and year are releavant?
plot(year,mpg)
model_year=lm(mpg~year, data=cars_dataset)
lines(year,model_year$fitted.values,col="red")

model1=lm(cars_dataset$mpg~cars_dataset$cylinders)


################################################################################
###############           Rescaling the dataset                     ############
################################################################################

#cars_dataset_rescaled=scale(cars_dataset)

cars_dataset_rescaled <- data.frame(scale(cars_dataset))
cov(cars_dataset_rescaled )
colMeans(cars_dataset_rescaled)


model_tot_rescaled=lm(mpg~. ,data=cars_dataset_rescaled)
model_tot
model_tot_rescaled
#what are the largest coefficients after normalization?









