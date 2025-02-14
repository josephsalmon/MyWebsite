

#####
# 1 # 
#####

# setwd("/tsi/users/salmon/Documents/data/Mes_cours/Telecom/MDI343/Salmon/TP/fichiers_online")
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
#setwd("/../../yourdirectory_where_you_have_loisAPI.R")
source("loisAPI.R")
help(tclVar)

help(head)
help(get)


#####
# 5 #
#####
median
median() # no useful information is provided that 
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
source("simpleRegAPI.R")
help(lm)
help(abline)
x=rnorm(n)
y=3*x+0.4*rnorm(n)
xy.lm=lm(y~x)
(xy.lm$coef)
summary(xy.lm)

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

# to modify

n <- 100
k <- 6
p <- 3
i <- sample(1:p, n, replace=TRUE)
x <- 10 * matrix(rnorm(p*k), nr=p, nc=k)
x <- x[i,] + matrix(rnorm(n*k), nr=n, nc=k)
L1L2 <- function (x) {
  cbind(L1 = apply(x, 1, mean),
        L2 = apply(x, 1, sd))
}
plot(L1L2(x), col=i)

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

x = rnorm(50)
h = hist(x, plot=F)  

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
boxplot(x, col="orange",border="darkblue",lwd=2)



require(stats)
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
  read.table("http://www-stat.stanford.edu/~tibs/ElemStatLearn/datasets/SAheart.data",sep=",",head=T,row.names=1)
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


######
# 17 #
######
help(glm)

X=c(1,2,3,4,5,6)
Y=exp(X)+30*runif(length(X))
BASE = data.frame(X,Y)
BASE
plot(BASE,pch=19,cex=2)

reg = lm(Y~X,data=BASE)
summary(reg)
abline(reg,col="red")

par()
par(lwd=9,bg="lightcyan",mfcol=c(1,2))

reg1 = glm(Y~X,data=BASE,family=gaussian(link="identity"))
summary(reg1)
newx=seq(.1,6.4,by=0.1)
predY = predict(reg1,newdata=
			 data.frame(X=newx))
plot(BASE,pch=19,cex=2)
lines(newx,predY,lwd=2,col="blue")
abline(reg,col="red")

		# -------------------------#

reg2 = glm(floor(Y)~X,data=BASE,family=poisson(link="log"))
summary(reg2)
newx=seq(.1,6.4,by=0.1)
predY = predict(reg2,newdata=data.frame(X=newx),type = "response")
plot(BASE,pch=19,cex=2)
lines(newx,predY,lwd=2,col="blue")
abline(reg,col="red")


dev.off(); 


######
# 18 #
######

##########################################################################
#1D test first
##########################################################################

x = seq(-1, 1, 0.01);  y <- x;
a = -0.5; b=6;
th = exp(a+b*x)/(1+exp(a+b*x));
for (j in 1:length(x)){
  y[j] = rbinom(1, 1, th[j]);
}
plot(x, y)

z <- y;
mod <- glm(z ~ x, family = binomial)
summary(mod)

zfit <- mod$fitted.values
yfit <- zfit
lines(x, yfit)
lines(x, th, col='red')


######
# 19 #
######

##########################################################################
# 2D case
##########################################################################

n=10000
alpha=0.9
beta=0.1


generate_fun <- function(n,alpha,beta) {
  x1 = runif(n)
  x2 = runif(n)
  indices=which(2*x1+x2<1.5)
  y1=2*rbinom(n,1,alpha)-1
  y2=2*rbinom(n,1,beta)-1
  y2[indices]=y1[indices]
  return(data.frame(cbind(x1,x2,y2)))
}

simul_table=generate_fun(n,alpha,beta)
simul_table_list=as.list(simul_table)


######
# 20 #
######
y=(simul_table$y2+1)/2+1
plot(simul_table[1:2], 
     pch = 21, 
     bg = c("red", "green")[y])

reg_logit = glm( y-1 ~x1+x2,data=simul_table,family=binomial(link="logit"))
coeff=reg_logit$coefficients
x_plot=seq(length=100,from=0,to=1);
# estimated separation line
lines(x_plot,(-coeff[2]*x_plot-coeff[1])/coeff[3],col="blue",lwd=9)
#true separation line
lines(x_plot,(-2*x_plot+1.5),col="black",lwd = 9, lty=2)

##########################################################################
# 3D : TODO
##########################################################################

glm(chd~sbp+tobacco+ldl+famhist+obesity+alcohol+age,data=heart_disease, family=gaussian(link="identity"))
glm(chd~sbp+tobacco+ldl+famhist+age,data=heart_disease, family=gaussian(link="identity"))




