# setting the working directory:
#         setwd("/home/.../R")
# Clearing the variables:
#         rm(list=ls())

#####
# 1 # 
#####

# reload the function used in the previous session

rbernouilli <- function(n,beta){ 
rand_uni=runif(n)
rand_bern=rep(0,n)
rand_bern[which(rand_uni<beta)]<-1
return(rand_bern) 
} 

generate_fun <- function(n,mu_true,mu_0_true,alpha,beta) {
  x1 = runif(n)
  x2 = runif(n)
  indices=which(mu_true[1]*x1+mu_true[2]*x2+mu_0_true<0)
  y1=2*rbernouilli(n,alpha)-1  
  y2=2*rbernouilli(n,beta)-1
  y2[indices]=y1[indices]
  return(data.frame(cbind(x1,x2,y2)))
}


n=51
alpha=1
beta=0
mu_true=c(2,1)
mu_0_true=-1.5

simul_table=generate_fun(n,mu_true,mu_0_true,alpha,beta)



##########################################################################
# perceptron function 
##########################################################################

perceptron <-function(simul_table,rho,nb_epoch,mu_ini,mu_0_ini,mu_true,mu_0_true)
{
  dimension=dim(simul_table)
  dim1=dimension[1]
  dim2=dimension[2]
  
  mu=mu_ini
  mu_0=mu_0_ini
    
  for (i in 1:nb_epoch)
  { misclassified=0  # initializing the number of misclassified elements seen,
    breakFlag <- FALSE
    
    for(k in 1:dim1)
    {
      yi=(simul_table[k,dim2])
      xi=simul_table[k,1:dim2-1];
      if(  (yi*(crossprod(xi,mu)+mu_0) )<0 )
        { 
        mu_old=mu
        mu_0_old=mu_0
        
        mu=mu+rho*yi*xi
        mu_0=mu_0+rho*yi        
        
        misclassified=misclassified+1
        
        mu_concat_true=c(mu_true,mu_0_true);
        mu_concat_old=c(mu_old,mu_0_old)
        mu_concat_new=c(mu,mu_0)
        
        norm_true=norm( as.matrix(mu_concat_true) ,"F")
        norm_old=norm( as.matrix(mu_concat_old) ,"F")
        norm_new=norm( as.matrix(mu_concat_new) ,"F")
            
        angle_old=crossprod(mu_concat_old,mu_concat_true)/( norm_true*norm_old ) #evolution of the angle
        angle_new=crossprod(mu_concat_new,mu_concat_true)/( norm_true*norm_new ) #between the true hyperplan
                                                                                 #and the current/previous choice
      
        cat("observation number",k,"\n")
        cat("cos-Angle between old and true",angle_old,"\n")
        cat("cos-Angle between new and true",angle_new,"\n")                    #display options
        }    
    }
    
    if (misclassified==0)    
    {     
      cat("WARNING: no more point to classify!","Stabilized after ",i,"epochs")            
      breakFlag <- TRUE
      break      
    }
    cat("Number of misclassifed elements at epoch #",i ," = ", misclassified , "\n")
  }
  return(c(mu_0,mu))
}

rho=1
nb_epoch=100
mu_ini=c(-2,-1.333);
mu_0_ini=1.5;

simul_table_mat=as.matrix(simul_table)
mu_perceptron=perceptron(simul_table_mat,rho,nb_epoch,mu_ini,mu_0_ini,mu_true,mu_0_true)
    

#####
# 2 #
#####

##########################################################################
# logistic regression  +  display 
##########################################################################

y=(simul_table$y2+1)/2+1
reg_logit = glm( y-1 ~x1+x2,data=simul_table,family=binomial(link="logit"))
mu_logit=reg_logit$coefficients



axis_tics=seq(0,1,0.1)
x_plot=seq(length=100,from=0,to=1);

plot(simul_table[,1:2],
     xlim=c(0,1), ylim=c(0,1),
     pch = 21, 
     bg = c("red", "green")[y])


# estimated separation by the perceptron
lines(x_plot,(-mu_perceptron[2]*x_plot-mu_perceptron[1])/mu_perceptron[3],col="blue",lwd=5)
# estimated separation by logit regression
lines(x_plot,(-mu_logit[2]*x_plot-mu_logit[1])/mu_logit[3],col="purple",lwd=5,lty=2)
#true separation
lines(x_plot,(-mu_true[1]*x_plot-mu_0_true)/mu_true[2],col="black",lwd=5, lty=2)


legend("topright", yjust=0,
       c("perceptron","logit","truth"),
       lty = c(1,2,2),
       col=c('blue','purple','black')
)



# ##########################################################################
# # how to make movies ANIMATED GIF
# ##########################################################################
# # update.packages()  # if needed update your packages.
# 
# # BEWARE below, you will need the following packages
# 
# # install.packages("spam")
# # install.packages("caTools")
# # install.packages("fields")
# dev.off()
# library(spam)
# library(fields) # for tim.colors
# library(caTools) # for write.gif
# 
# m = 400 # grid size
# C = complex( real=rep(seq(-1.8,0.6, length.out=m), each=m ), imag=rep(seq(-1.2,1.2, length.out=m), m ) )
# C = matrix(C,m,m)
# 
# Z = 0
# X = array(0, c(m,m,20))
# for (k in 1:20) {
#   Z = Z^2+C
#   X[,,k] = exp(-abs(Z))
# }
# 
# image(X[,,k], col=tim.colors(256)) # show final image in R
# write.gif(X, "Mandelbrot.gif", col=tim.colors(256), delay=1)



#############
# 3,4 and 5 #
#############
#Download and source perceptron_evolution.R 
source("perceptron_evolution.R")


#####
# 6 #
#####

#TODO

#####
# 7 #
#####

generate_fun2 <- function(n,M,delta)
  {
  ns2=floor(n/2)
  x2 = c(seq(1:(ns2))/(ns2)*M,seq(1:(n-ns2))/(n-ns2) *M)
  x1=c(rep(delta,ns2),rep(0,n-ns2))
  z1=rep(-1,ns2)
  z2=rep(1,n-ns2)
  y2=c(z1,z2)
  return(data.frame(cbind(x1,x2,y2)))
  }


rho=0.1
nb_epoch=200
mu_ini=c(1,0);
mu_0_ini=0.5;
n=115
M=1
delta=0.1


simul_table=generate_fun2(n,M,delta)
simul_table_mat=as.matrix(simul_table)
mu_perceptron=perceptron(simul_table_mat,rho,nb_epoch,mu_ini,mu_0_ini,mu_true,mu_0_true)


#logit already done
y=(simul_table$y2+1)/2+1
reg_logit = glm( y-1 ~x1+x2,data=simul_table,family=binomial(link="logit"))
mu_logit=reg_logit$coefficients


##########################################################################
#display
##########################################################################


axis_tics=seq(0,1,0.1)
x_plot=seq(length=100,from=0,to=1);

plot(simul_table[,1:2],
     xlim=c(0,1), ylim=c(0,1),
     pch = 21, 
     bg = c("red", "green")[y])


# estimated separation by the perceptron
lines(x_plot,(-mu_perceptron[2]*x_plot-mu_perceptron[1])/mu_perceptron[3],col="blue",lwd=5)
# estimated separation by logit regression
lines(x_plot,(-mu_logit[2]*x_plot-mu_logit[1])/mu_logit[3],col="purple",lwd=5,lty=2)
#true separation
lines(x_plot,(-mu_true[2]*x_plot-mu_true[1])/mu_0_true,col="black",lwd=5, lty=2)


legend("topright", yjust=0,
       c("perceptron","logit","truth"),
       lty = c(1,2,2),
       col=c('blue','purple','black')
)


#####
# 8 #
#####
n=100
simul_table=generate_fun(n,mu_true,mu_0_true,alpha,beta)

library(class)
train=simul_table[,1:2]
m=50
test=cbind(kronecker(seq(1:m)/m,rep(1,m)),rep(seq(1:m)/m,m))


initial_par=par()
par(mfcol=c(3,3))
for (i in 1:9)
{
  output_knn=knn(train, test, simul_table[,3], k = (5*i-4))

  
  plot(test[,1:2],
     xlim=c(0,1), ylim=c(0,1),
     pch = 21,
     lwd=0,
     cex = 0.3,
     main =   paste("KNN with k = ",(5*i-4)),
     xlab = "X_1", ylab = "x_2",
     bg = c("red", "green")[output_knn])


  
  contour(seq(1:m)/m,seq(1:m)/m,t(matrix(output_knn,nrow=m)), 
        col = "black", lty=4, lwd = 3, drawlabels = FALSE, 
        add = TRUE,
         )

}
par=initial_par

###############
# 9,10 and 11 #
###############

#  TODO
#  Partial solution

alpha <- 0.2; beta <- 0.8; # the following assumes alpha < 0.5 < beta
evaluateClassifError <- function(method){
  N <- 10000;
  test <- rexemple(N);
  err <- 0;
  for(i in 1:N){
    err = err + (test$y[i] != method(test$x[i,]));
  }
  err/N;
}

n <- 100;
train <- rexemple(n);

bayesClassifier <- function(x) {2*x[1] + x[2] > 1.5;}
bayesError <- evaluateClassifError(bayesClassifier)

require(class)
test <- rexemple(7000); # could also use LHS here
test$guessed <- knn(train$x, test$x, train$y, k=6)
knnError <- mean(test$y != test$guessed)
plot(test$x[,1], test$x[,2], 
     col = c("springgreen4", "pink")[as.numeric(test$guessed)], 
     pch = 19, xlim = c(-0.2, 1.2), ylim = c(-0.2, 1.2))
points(train$x[,1], train$x[,2], pch = 21,bg = c( "green","red")[1+train$y])

lines(c(0, 1), c(1.5, -0.5),col="black",lwd=5, lty=2)

# graph legend and result prints
title("simulated data classification (k=6)")       
legend(0.8, 1.2, cex=0.8,c("true frontier", "k-nn zone 1", "k-nn zone 0"), 
       lty = c(1, 0, 0), lwd = c(1, 0, 0),
       pch = c(NA,22, 22),
       pt.bg = c("black", "pink", "limegreen"),
       pt.cex = 2)

cat("Bayes classification error:\t", bayesError, "\nknn classifier error:\t", knnError, "\n")

# to get all color with green variation
# colors()[grep("green",colors())]


# choice of k by crossvalidation
K = 4; L = floor(n/K);
Ik = 1:(n-L-1);
err <- array(0, length(Ik));
for(i in 1:K){
  for(k in 1:length(Ik)){
    plageTest = (i-1) * L + (1:L);
    rtrain = list(x=train$x[-plageTest, ], y=train$y[-plageTest]);
    test = list(x=train$x[plageTest, ], y=train$y[plageTest]);
    test$guessed <- knn(rtrain$x, test$x, rtrain$y, k=Ik[k])
    err[k] <- err[k] + mean(test$y != test$guessed)/length(Ik)
  }
}

x11()
plot(Ik, err, type='l');
kopt = Ik[which.min(err)];
kopt



######
# 12 #
######

#rm(list=ls())
### Dataset of handwritten digits:
train_zip7=read.table("http://www-stat.stanford.edu/~tibs/ElemStatLearn/datasets/zip.digits/train.7",sep=",") # data source
a=matrix(train_zip7[1,], ncol=16)
mode(a)


train_zip7_scaned=scan("http://www-stat.stanford.edu/~tibs/ElemStatLearn/datasets/zip.digits/train.7",sep=",") # data source
mode(train_zip7_scaned)
b=matrix((train_zip7_scaned),ncol=256,byrow=TRUE)
mode(b)


?image
image(b)
image(matrix(b[1,],nrow=16,byrow=TRUE),col=gray(256:0/256), zlim=c(-1,1))

# and yes the digits seems to be rotated...


# Handling the naming of things.
i=2
for(i in 1:6) { #-- Create objects  'r.1', 'r.2', ... 'r.6' --
  nam <- paste("r",i, sep="_")
  assign(nam, 1:i)
}
nam
r_3
ls(pattern = "^r..$")

paste(1:12) # same as as.character(1:12)
paste("A", 1:6, sep = "")
aa=paste("Today is", date())

######
# 13 #
######

# TODO

