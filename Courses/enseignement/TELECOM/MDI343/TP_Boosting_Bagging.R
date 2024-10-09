
##########################################################################
# BAGGING PART
##########################################################################


##########################################################################
# Reuse the same genertive model as before
##########################################################################
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
  y=2*rbernouilli(n,beta)-1
  y[indices]=y1[indices]
  return(data.frame(cbind(x1,x2,y)))
}




bootstrap<-function(simul_table){
  a=dim(simul_table)  
  index_bootstrapped=sample(1:a[1],replace =TRUE)
  return(simul_table[index_bootstrapped,])
}




n=51
alpha=0.05
beta=0.95
mu_true=c(2,1)
mu_0_true=-1.5

simul_table=generate_fun(n,mu_true,mu_0_true,alpha,beta)

x11()
par(mfcol=c(2,1))
y0=(simul_table$y+1)/2+1
plot(simul_table[,1:2],
     xlim=c(0,1), ylim=c(0,1),
     pch = 21, 
     bg = c("red", "green")[y0])

simul_table_1=bootstrap(simul_table)
dim(simul_table_1)

y1=(simul_table_1$y+1)/2+1
plot(simul_table_1[,1:2],
     xlim=c(0,1), ylim=c(0,1),
     pch = 21, 
     bg = c("red", "green")[y1])

# remark that there seems to have less points in the second case, but it is
# just because the sample are with replacements, so it is highly unlikely that
# there exactly as many points as in the original sample.


##########################################################################
# the baggin procedure
##########################################################################


rexemple <- function(n){
  res <- list();
  res$x <- cbind(runif(n), runif(n));
  res$y <- array(n);
  res$o <- array(n);
  u <- runif(n);
  T = 2 * res$x[,1] + res$x[,2] < 1.5;
  res$y[T]  <- u[T]<alpha;
  res$y[!T] <- u[!T]<beta;
  res$o[!T]  <- 1;
  res$o[T]  <- 0;
  res;
}

#test=cbind(kronecker(seq(1:m)/m,rep(1,m)),rep(seq(1:m)/m,m));
test <- rexemple(20000); # could also use LHS here
nb_nn=3
library(class)
test_guessed <- knn(simul_table[,1:2], test$x, simul_table[,3], k=nb_nn)
                    
x11()
par(mfcol=c(2,1))
plot(test$x[,1], test$x[,2], 
     col = c("springgreen4", "pink")[as.numeric(test_guessed)], 
     pch = 19, xlim = c(-0.2, 1.2), ylim = c(-0.2, 1.2))
points(simul_table[,1], simul_table[,2], pch = 21,bg = c( "green","red")[(1+simul_table$y)/2+1])
lines(c(0, 1), c(1.5, -0.5),col="black",lwd=5, lty=2)
# graph legend and result prints
title(paste("simulated data classification (k=",nb_nn,")"))       

legend(0.8, 1.2, cex=0.8,c("true frontier", "k-nn zone 1", "k-nn zone 0"), 
       lty = c(1, 0, 0), lwd = c(1, 0, 0),
       pch = c(NA,22, 22),
       pt.bg = c("black", "pink", "limegreen"),
       pt.cex = 2)








bootstrap<-function(simul_table){
  a=dim(simul_table)  
  index_bootstrapped=sample(1:a[1],replace =TRUE)
  return(simul_table[index_bootstrapped,])
}


bagging <- function(simul_table,test,nb_nn,B){
  a=length(test$y)
  test_guessed=matrix(0,a,B)
  for(i in 1:B){
    simul_table_1=bootstrap(simul_table)  
    test_guessed[,i]  <- (as.numeric(knn(simul_table_1[,1:2], test$x, simul_table_1[,3], k=nb_nn))-1)*2-1    
  }
  values=sign(apply(test_guessed,1,sum))
  return(values)
}

B=1000;
bagged_values=bagging(simul_table,test,nb_nn,B)

plot(test$x[,1], test$x[,2], 
     col = c("springgreen4", "pink")[as.numeric((1+bagged_values)/2+1)], 
     pch = 19, xlim = c(-0.2, 1.2), ylim = c(-0.2, 1.2))


points(simul_table[,1], simul_table[,2], pch = 21,bg = c( "green","red")[(1+simul_table$y)/2+1])
lines(c(0, 1), c(1.5, -0.5),col="black",lwd=5, lty=2)
# graph legend and result prints
title(paste("simulated data classification (k=",nb_nn,")"))       
legend(0.8, 1.2, cex=0.8,c("true frontier", "k-nn zone 1", "k-nn zone 0"), 
       lty = c(1, 0, 0), lwd = c(1, 0, 0),
       pch = c(NA,22, 22),
       pt.bg = c("black", "pink", "limegreen"),
       pt.cex = 2)



# measuring the error done on test:

# first give the oracle true label
true_indices=test$o
a=length(test$y)

bagging_error=sum(true_indices!=(1+bagged_values)/2)/a
no_bagging_errorsum(true_indices!=(as.numeric(test_guessed))-1)/a


##########################################################################
# BOOSTING  PART
##########################################################################
