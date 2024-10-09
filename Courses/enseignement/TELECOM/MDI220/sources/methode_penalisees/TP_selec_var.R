################################################
### exo 1:
################################################

#Q1

library("Matrix")
library("MASS")

#install.packages("lars")
#install.packages("elasticnet")

#install.packages("glmnet") #need a compatible fortran compiler 
#+ a recent version of the package Matrix 
# library("glmnet") 
library("lars") #need a compatible fortran compiler
library("elasticnet") #need a compatible fortran compiler
rm(list=ls(all=TRUE))

# data parameter:
nb_block=3
n=100
size_block=50
p=nb_block*size_block



# data generation function:
data_generation_exp1<- function(n,p,nb_block,size_block){
  size_bloc=floor(p/nb_block)
  epsilon=c(rnorm(n,1))
  theta=rep(3,p)
  #theta[1:5]=2
  theta[1:size_block]=-2
  #theta[(p-5):p]=2
  Sigma=matrix(0,p,p)
  liste_matrix=vector("list", nb_block)
  Id=diag(1,size_bloc,size_bloc)
  uns=matrix(1,size_bloc,size_bloc)
  liste_eig=vector("list", nb_block)
  
  for(i in 1:nb_block) {
    matrice_block=(i-1)/nb_block*uns+ (nb_block+1-i)/nb_block*Id
    liste_matrix[[i]]=matrice_block
    a=eigen(matrice_block)
    liste_eig[[i]]=a$values
  }
  Sigma=bdiag(liste_matrix)
  zeros_vec=rep(0,length=p)
  X=mvrnorm(n,zeros_vec,Sigma)
  Y=X%*%theta+epsilon
  #X=scale(X)
  return(list(Y=Y,X=X,theta=theta))
}

data_1=data_generation_exp1(n,p,nb_block,size_block)
Y=matrix(data_1$Y)
X=matrix(data_1$X, nrow = n, ncol = p)
plot(matrix(data_1$theta))
dev.off()


#discrtization of the coefficient path
k=30
matrix_ridge=array(0,dim=c(k,p))
lambda=rep(0,k)
for(i in 1:k) {
  lambda[i]=exp(i-(k/2))
}

#ridge data fitting
model0=lm.ridge(Y~X-1, lambda = lambda,Inter="false")
coef_ridge=model0$coef
delta=-(min(coef_ridge)-max(coef_ridge))/5
ylim_ridge=c(min(coef_ridge)-delta,max(coef_ridge)+delta)


#ploting part
par(mfrow=c(3,1)) 
couleur=c("black","blue","red","cyan","green")
for(i in 1:p){
  plot(lambda,coef_ridge[i,],log="x",type="l",ylim=ylim_ridge,xlim=c(1,100000),
       col=couleur[floor((i-1)/size_block+1)],ylab="coefs",xlab="Lambda",
       main = "Ridge")
  par(new=T)
}

par(new=F)


#a=eigen(Sigma)

################################################
### exo 2:
################################################

# 
# data(diabetes)
# attach(diabetes)
# object <- lars(x,y,type="lasso")
# ### make predictions at the values in x, at each of the
# ### steps produced in object
# fits <- predict.lars(object, x, type="fit")
# ### extract the coefficient vector with L1 norm=4.1
# coef4.1 <- coef(object, s=4.1, mode="norm") # or
# coef4.1 <- predict(object, s=4.1, type="coef", mode="norm")
# plot(object)
# detach(diabetes)


object_lasso <- lars(X,Y,type="lasso")

delta=-(min(object_lasso$beta)-max(object_lasso$beta))/5
ylim_lasso=c(min(object_lasso$beta)-delta,max(object_lasso$beta)+delta)

for(i in 1:p){
  plot(object_lasso$lambda,object_lasso$beta[-1,i],log="x",type="l",ylim=ylim_lasso,
       col=couleur[floor((i-1)/size_block+1)],ylab="coefs",xlab="Lambda",
       main = "Lasso")
  par(new=T)
}
par(new=F)

#install.packages("penalized")
#library("penalized")
#profL1()


################################################
### exo 3:
################################################
# data(diabetes)
# attach(diabetes)
# ##fit the lasso model (treated as a special case of the elastic net)
# object1 <- enet(x,y,lambda=0)
# plot(object1)
# ##fit the elastic net model with lambda=1.
# object2 <- enet(x,y,lambda=1) 
# plot(object2)
# ##early stopping after 50 LARS-EN steps
# object4 <- enet(x2,y,lambda=0.5,max.steps=50)
# plot(object4)
# detach(diabetes)




object_enet <- enet(X,Y,lambda=0.3) #lambda=0 should be the Lasso.... 
#note the smoothing effect though on the coord. path
delta=-(min(object_enet$beta)-max(object_enet$beta))/5
ylim_elanet=c(min(object_enet$beta)-delta,max(object_enet$beta)+delta)



for(i in 1:p){
  lambda_enet=object_enet$penalty
  nb_lambda=length(lambda_enet)
  beta_vec=object_enet$beta[,i]
  plot(lambda_enet[-nb_lambda],beta_vec[-nb_lambda],log="x",type="l",ylim=ylim_elanet,
       col=couleur[floor((i-1)/size_block+1)],ylab="coefs",xlab="Lambda",
       main = "Elastic Net")
  par(new=T)
}
