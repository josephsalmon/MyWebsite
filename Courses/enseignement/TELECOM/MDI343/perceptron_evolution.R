samplePoints <- function(n, beta, beta0){
  s <- list()
  s$x <- matrix(runif(2*n), nrow = n);  # sample uniformly in the unit square
  s$y <- 2*(s$x %*% beta + beta0 > 0)-1 # +-1 label at random
  s
}
# sample 2n data points (n on each side of the hyperplane defined
# by beta and beta0)

n <- 25
mu <- c(-2, -1); 
mu0 = 1.5;
s <- samplePoints(n, mu, mu0)

beta <- runif(2)-1/2;
beta0 <- -sum(beta)/2;
rho = 1;

tic=proc.time()[3]

perceptron_displays<-function(s,beta,beta0)
{

  K <- which((s$x %*% beta + beta0 ) * s$y < 0);
  cat("number of misclasified elements :", length(K), "\n");
  it <- 0;
  while (length(K)>0 & it<100){
    it <- it+1;
    # ploting part
    plot(s$x[,1], s$x[,2], bg = c("red", "green")[(s$y+3)/2], pch = 21);
    lines(c(-1, 1), (-mu0 - mu[1]*c(-1,1))/mu[2], col = "black",lwd=5, lty=2);
    lines(c(-1, 1), (-beta0 - beta[1]*c(-1, 1))/beta[2], col="blue",lwd=5);
    points(s$x[K, 1], s$x[K, 2], pch=21, cex=2.5, lwd = 5, col="blue");
    


    if (length(K)>0) 

      {i <- sample(K, 1)
      } #
    else
      {i<-K;}
    points(s$x[i,1], s$x[i, 2], col = "blue", pch = 20, cex=3);
    beta <- beta + rho * s$y[i]*s$x[i,];
    beta0 <- beta0 + rho * s$y[i];
    
    Sys.sleep(0.05);
    K <- which((s$x %*% beta + beta0 ) * s$y < 0);
    
    cat("number of misclasified elements :", length(K), "\n");
  }
  cat("number of iterations :", it, "\n");
  plot(s$x[,1], s$x[,2], bg = c("red", "green")[(s$y+3)/2], pch = 21);
  lines(c(-1, 1), (-mu0 - mu[1]*c(-1,1))/mu[2], col = "black",lwd=5, lty=2);
  lines(c(-1, 1), (-beta0 - beta[1]*c(-1, 1))/beta[2], col="blue",lwd=5);
  
 return(cbind(beta,beta0))
}

# first example with a well separated case
output=perceptron_displays(s,beta,beta0)
toc=proc.time()[3] - tic
cat("time needed :", toc, " s.\n");

Sys.sleep(2);

# second example with a non-separated case
s <- list()
s$x <-  matrix(c(0,0,1,1,0,1,0,1), nrow = 4); 
s$y <- c(1,-1,-1,1)


output=perceptron_displays(s,beta,beta0)
#dev.off()
