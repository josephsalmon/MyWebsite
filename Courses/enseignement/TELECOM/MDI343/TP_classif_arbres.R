
# install.package first, or if impossible go to the second part
# and use  the package rpart
# install.packages("tree")
#require(tree)
### simulated example

alpha <- 0.2; beta <- 0.8; # the following assumes alpha < 0.5 < beta

rexemple <- function(n){
	res <- list();
	res$x <- cbind(runif(n), runif(n));
	res$y <- array(n);
	u <- runif(n);
	T = 2 * res$x[,1] + res$x[,2] < 1.5;
	res$y[T] <- u[T]<alpha;
	res$y[!T] <- u[!T]<beta;
	res;
}

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

y = factor(train$y); x1 = train$x[,1]; x2 = train$x[,2];




#with tree package
# fullTree <- tree(y~x1+x2, control = tree.control(n, mindev=0, minsize=2))


#with rpart package
require(rpart)
rpart.control(minsplit = 20, cp = 0.01,
              maxcompete = 4, maxsurrogate = 5, usesurrogate = 2,
              xval = 10,surrogatestyle = 0, maxdepth = 30)

fullTree_rpart <- rpart(y~x1+x2, method="class")


#cartClassifier <- prune.tree(fullTree, best = 10)

#with rpart package
cartClassifier_rpart <- prune.rpart(fullTree_rpart, cp = 0.1)



test <- rexemple(20000); # could also use LHS here

#with tree package
# test$estimProba <- predict(cartClassifier, data.frame(x1=test$x[,1], x2=test$x[,2]))
# test$guessed <- test$estimProba[,2]>0.5;

#with rpart package
ls("package:rpart")
test$estimProba_rpart <- predict(cartClassifier_rpart, data.frame(x1=test$x[,1], x2=test$x[,2]))
test$guessed_rpart <- test$estimProba_rpart[,2]>0.5;




cartError <- mean(test$y != test$guessed_rpart)
plot(test$x[,1], test$x[,2], col = c("pink", "cyan")[as.numeric(1+test$guessed)], pch = 19, xlim = c(-0.2, 1.2), ylim = c(-0.2, 1.2))
points(train$x[,1], train$x[,2], col = c("red", "blue")[1+train$y], pch = 19)
lines(c(0, 1), c(1.5, -0.5), col="black", lwd = 2)

f <- cartClassifier_rpart$frame;
lx <- c(); ly <- c();
for (j in 1:dim(f)[1]){
  var <- f[j,1]; 
  if((var == 'x1') || (var == 'x2')){
    b <- as.double(substr(f[j,5][1], 2,5))
    if (var == 'x1'){
      lx <- c(lx,b);
      lines(c(b,b), c(0,1));
    }
    else{
      ly <- c(ly, b);
      lines(c(0,1), c(b,b));
    }
  }
}


# graph legend and result prints
title("simulated data classification")
legend(0.8, 1.2, cex=0.8,c("true frontier", "k-nn zone 1", "k-nn zone 0"), 
       col = c("black", "cyan", "pink"),             
       lty = c(1, 0, 0), lwd = c(1, 0, 0),
       pch = c(NA,22, 22),
       pt.bg = c("black", "cyan", "pink"),
       pt.cex = 2)
cat("Bayes classification error:\t", bayesError, "\nCART classifier error:\t", cartError, "\n")

# to plot the partition tree with the package tree
x11();
partition.tree(cartClassifier, col="blue", cex = 2);
points(train$x[,1], train$x[,2], col = c("red", "blue")[1+train$y], pch = 19)
lines(c(0, 1), c(1.5, -0.5), col="green", lwd = 2)






# grow tree 
fit <- rpart(Kyphosis ~ Age + Number + Start,
             method="class", data=kyphosis)

printcp(fit) # display the results 
plotcp(fit) # visualize cross-validation results 
summary(fit) # detailed summary of splits




# plot tree 
x11();


par(mfrow=c(1,2)) # two plots on one page 
# given tree
plot(fit, uniform=TRUE, 
     main="Classification Tree for Kyphosis")
text(fit, use.n=TRUE, all=TRUE, cex=.8)


# prune the tree 
# pfit<- prune(fit, cp=fit$cptable[which.min(fit$cptable[,"xerror"]),"CP"])
pfit<- prune(fit, cp=0.0196)

# plot the pruned tree 
plot(pfit, uniform=TRUE,main="Pruned Classification Tree for Kyphosis")
text(pfit, use.n=TRUE, all=TRUE, cex=.8)




x11();

control_options=rpart.control(minsplit = 3,minibucket=10,cp = 0.01,
              maxcompete = 20, maxsurrogate = 5, usesurrogate = 2,
              xval = 10,surrogatestyle = 0, maxdepth = 3)

#options
minsplit = 5      # minimum nb of observations so that a split is attempted
minibucket=3      # minimum nb of observations in terminal node
cp = 0.01         # complexity / regularization parameter
maxcompete = 5    # the number of competitor splits retained in the output
maxsurrogate = 5  # the number of surrogate splits retained in the output. 
usesurrogate = 2  # how to use surrogates in the splitting process. 
xval = 10        # the number of surrogate splits retained in the output. 
surrogatestyle = 0 # how to use surrogates in the splitting process. 
maxdepth = 12      # how to use surrogates in the splitting process. 0

fit2 <- rpart(Kyphosis ~ Age + Number + Start,
              method="class", data=kyphosis, control=control_options)
#x11();
plot(fit2, uniform=TRUE, 
     main="Classification Tree for Kyphosis")
text(fit2, use.n=TRUE, all=TRUE, cex=.8)


# create attractive postscript plot of tree 
# post(fit, file = "tree.pdf", 
#      title = "Classification Tree for Kyphosis")
getwd()