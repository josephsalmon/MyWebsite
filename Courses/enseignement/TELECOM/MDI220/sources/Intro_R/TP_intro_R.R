# rm(list=ls())



#####
# 1 # 
#####


# Might need : setwd("usefull_directory")
a = runif(1);M <- a*matrix(c(1:3,rep(4, 3)), ncol = 3, nrow = 2);ls()


#####
# 2 # 
#####
help(ls) # rem ls strands for listing
ls()
rm(list=ls())
ls()




#####
# 3 #
#####
help(mosaicplot)
require(graphics)
require(datasets)
mosaicplot(Titanic, main = "Survival on the Titanic", color = TRUE) 





#####
# 4 #
#####
getwd()
#if needed:
#setwd("/../../yourdirectory_where_you_have_your_code.R")
#alternative solution in Rstudio: Session/Set Working Directory....


#####
# 5 #
#####
median
#type:
#> median()       : no useful information is provided that way
getS3method('median', 'default')

# note that you might be astonished that 0L is ...0
typeof(0)
typeof(0L) # those are integer values use for vectors sizes  


#####
# 6 #
#####
fibo <- function(n,a=1,b=1){ 
 if (n == 1) return(a) 
 if (n == 2) return(b) 
 return(fibo(n-1,b,a+b)) 
} 

fibonacci <- local({
    memo <- c(1, 1, rep(NA, 10000))
    f <- function(x) {
        if(x == 0) return(0)
        if(x < 0) return(NA)
        if(x > length(memo))
        stop("’x’ too big for implementation")
        if(!is.na(memo[x])) return(memo[x])
        ans <- f(x-2) + f(x-1)
        memo[x] <<- ans
        ans
    }
})



n=110
fibo(n)
fibonacci(n)
factorial(n)	


#####
# 7 #
#####

n=50
library(MASS)

MA=matrix(runif(50),nrow=10)
pseudoinv_MA=ginv(MA)

#1
pseudoinv_MA%*%MA%*%pseudoinv_MA-pseudoinv_MA
#2
MA%*%pseudoinv_MA%*%MA-MA
#3
t(pseudoinv_MA%*%MA)-pseudoinv_MA%*%MA
#4
t(MA%*%pseudoinv_MA)-MA%*%pseudoinv_MA


#####
# 8 #
#####
help(lines)
x=seq(-10,10,l=100)
plot(x,sin(x))
plot(x,sin(x),type="l",col="blue") 
lines(x,cos(x),col="green") 


y <- sin(x)
z <- cos(x)
plot(y~x, type='l', lwd=3, 
     ylab='', xlab='angle', main="Trigonometric functions")
abline(h=0,lty=3)
abline(v=0,lty=3)
lines(z~x, type='l', lwd=3, col='red')
legend(-6,-1, yjust=0,
       c("Sine", "Cosine"),
       lwd=3, lty=1, col=c(par('fg'), 'red'),
      )


#####
# 9 #
#####
y=x;
f <- function(x,y) {
r <- sqrt(x^2+y^2)
sin(r)/r
}

help(outer)
z=outer(x,y,f)
image(x,y,z)
z[is.na(z)] <- 1

persp(x, y, z, theta = 30, phi = 30, expand = 0.5, col = 
        "lightblue",shade=.5,xlab = "X", ylab = "Y", zlab = "Z")
persp(x,y,z)
contour(x,y,z)
filled.contour(x,y,z)


######
# 10 #
###### 
n <- 100
p <- 3
i <- sample(1:p, n, replace=TRUE)
center1=c(0,0)
center2=c(0,10)
center3=c(10,0)
stdeviation=1
centers=rbind(center1,center2,center3)
x <- centers[i,] + matrix(stdeviation*rnorm(n*2), nr=n, nc=2)
plot(x[,1],x[,2],col=i)
#x <- 1 * matrix(rnorm(p*k), nr=p, nc=k)
# x <- x[i,] + matrix(rnorm(n*k), nr=n, nc=k)
# L1L2 <- function (x) {
#   cbind(L1 = apply(x, 1, mean),
#         L2 = apply(x, 1, sd))
# }
# plot(L1L2(x), col=i)

dev.off();  # turn off output device



######
# 11 #
###### 

n=10000
rand_uni=runif(n)
rand_bern=matrix(0,1,n)
rand_bern[which(rand_uni<0.75)]<-1
plot( cumsum(rand_bern)/seq(1,n))


rbernouilli <- function(n,beta){ 
  rand_uni=runif(n)
  rand_bern=rep(0,n)
  rand_bern[which(rand_uni<beta)]<-1
  return(rand_bern) 
} 

# Alternatively one could also used directly 
# rbinom(n,1,0.75)


######
# 12 #
###### 

##########################################################################
#cumulative distribution function
##########################################################################

x = rnorm(100) # r means random, norm refers to the normal distribution
n=length(x)
plot(sort(x), 1:n/n, type="s", ylim=c(0,1), xlab="", ylab="")
?pnorm         # p means (cumulative) probability distribution 
curve(pnorm(x,0,1), add=T, col="blue")

##########################################################################
#probability distribution function, empirical approximation
##########################################################################

x = rnorm(500)
par(mfcol=c(2,1))
hist(x, breaks=20)
hist(x, breaks=20, freq=F, col="cyan")
curve(dnorm(x), add=T,col="darkblue") # one possible way to draw

x = rnorm(200)
h = hist(x, plot=F,breaks=20)  
plot(h)

h$breaks
h$counts
?hist

######
# 13 #
###### 

x = rnorm(100)
par(mfcol=c(2,2),bg="lightcyan")
boxplot(x)
boxplot(x,horizontal=T)
boxplot(x, col="red")

dev.off();  # turn off output device

# what is the IQR that range is controling the boxplot. default=1.5
myrange=1.5
output=boxplot(x, col="orange",border="darkblue",lwd=2,range = myrange)

quantile(x,0.5)
quantile(x,0.75)
quantile(x,0.25)
sortedx=sort(x)

IQR=(quantile(x,0.75)-quantile(x,0.25))

indexlow=((quantile(x,0.25)-myrange*IQR)<sortedx)
lowerbound = sortedx[sum(indexlow==FALSE)]
lowerbound2= min(x)

indexup   = ((quantile(x,0.75)+myrange*IQR)>sortedx)
uperbound = sortedx[sum(indexup==TRUE)]
uperbound2  = max(x)

output$stats
lowerbound
lowerbound2
uperbound
uperbound2

# rem the mean and the median are different.
require(stats)
n=10
lines(seq(0,n-1,length=n),c(matrix(mean(x),1,n)),col="green")

help('RNG')



######
# 14 #
######
search()
searchpaths()
data();attach(cars); plot(speed,dist)
search()
help(cars)


######
# 15 #
######



heart_disease=
 read.table(
 "http://www-stat.stanford.edu/~tibs/ElemStatLearn/datasets/SAheart.data",
 sep=",",head=T,row.names=1)
plot(heart_disease[,-5], 
    pch = 21, 
     bg = c("red", "green","blue")[
       as.numeric(heart_disease$famhist)
     ])


data(iris)
plot(iris[1:4], 
     pch = 21, 
     bg = c("red", "green","blue")[
       as.numeric(iris$Species)
     ])
help(plot)



######
# 16 #
######
attach(cars)
summary(cars)
plot(speed, dist)
reglin<-lm(dist ~ speed)
abline( reglin, col = "red" )
help(abline)
summary(reglin)



##########
# Bonuse #
##########
#using API



######
# 17 #
######
# source("simpleRegAPI.R")
# source("loisAPI.R")
# help(tclVar)
# 
# help(head)
# help(get)

