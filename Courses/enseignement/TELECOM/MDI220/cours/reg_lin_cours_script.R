require(stats); require(graphics); attach(cars)
#scatter plot of the dataset "cars" 
pdf("../images/cars_data_plot.pdf")
plot(cars, xlab = "Speed (mph)", ylab = "Stopping distance (ft)",
     las = 1, xlim = c(0, 25))
title(main = "cars dataset")
dev.off()



#scatter plot of the dataset "cars" with the regression function, ie least square estimate
pdf("../images/cars_data_plot_regression.pdf")
plot(cars, xlab = "Speed (mph)", ylab = "Stopping distance (ft)",
     las = 1, xlim = c(0, 25))
title(main = "cars dataset")

d <- seq(0, 25, length.out = 200)
fm <- lm(dist ~ speed, data = cars)
lines(d, predict(fm, data.frame(speed = d)), col = 'red',lwd=5)
dev.off()


#scatter plot of the dataset "cars" with the regression function, ie least square estimate
# with added the center of gravity of the cloud of points
attach(cars);summary(cars); 
pdf("../images/cars_data_plot_regression_gravity.pdf")
plot(speed,dist,xlab = "Speed (mph)", ylab = "Stopping distance (ft)")
reglin<-lm(dist ~ speed); 
abline(reglin,col = "red", lwd=5); summary(reglin)
points(mean(speed),mean(dist),col = "red",lwd=10)
dev.off()

#scatter plot of the dataset "cars" with the regression function, ie least square estimate
# with added the center of gravity of the cloud of points, after recentering
dim_cars=dim(cars)
attach(cars);summary(cars); 
pdf("../images/cars_data_plot_regression_gravity_recentered.pdf")
cars_recentered <- as.data.frame(scale(cars, scale = FALSE))
plot(cars_recentered,xlab = "Speed (mph)", ylab = "Stopping distance (ft)")
reglin_center<-lm(cars_recentered$dist ~ cars_recentered$speed); 
abline(reglin_center,col = "red", lwd=5); summary(reglin)
points(mean(cars_recentered$speed),mean(cars_recentered$dist),col = "red",lwd=10)
dev.off()


#scatter plot of the dataset "cars" with the regression function, ie least square estimate
# with added the center of gravity of the cloud of points, after recentering+rescaling
attach(cars);summary(cars); 
pdf("../images/cars_data_plot_regression_gravity_recentered_rescaled.pdf")
cars_rescaled <- as.data.frame(scale(cars, scale = TRUE))
plot(cars_rescaled,xlab = "Speed (mph)", ylab = "Stopping distance (ft)")
reglin_center<-lm(cars_rescaled$dist ~ cars_rescaled$speed); 
abline(reglin_center,col = "red", lwd=5); summary(reglin)
points(mean(cars_rescaled$speed),mean(cars_rescaled$dist),col = "red",lwd=10)
dev.off()

sd(cars_rescaled$dist)

# check the formula for the expression of the lst square
mean(dist)
mean(speed)
cor(dist,speed)*sd(dist)/sd(speed)


# Surface example:
pdf("../images/CN0_2d.pdf")
x <- seq(-1, 1, length= 50)
y <- x
f <- function(x, y) { r <- -(x^2+y^2);1-exp(r) }
z <- outer(x, y, f)
z[is.na(z)] <- 1
op <- par(bg = "white")
persp(x, y, z, theta = 30, phi = 0, expand = 0.95, col = "lightblue")
dev.off()


# Surface example 2:
pdf("../images/CN0_2d_non_trivial.pdf")
x <- seq(-1, 1, length= 50)
y <- x
f <- function(x, y) { r <- -(x-y)^2;(1-r) }
z <- outer(x, y, f)
z[is.na(z)] <- 1
op <- par(bg = "white")
persp(x, y, z, theta = 60, phi = 0, expand = 0.95, col = "lightblue")
dev.off()


pdf("../images/CN0_2d_non_trivial2.pdf")
x <- seq(-1, 1, length= 50)
y <- x
f <- function(x, y) { r <- -(x-y)^2;(1-r) }
z <- outer(x, y, f)
z[is.na(z)] <- 1
op <- par(bg = "white")
persp(x, y, z, theta = -30, phi = 0, expand = 0.95, col = "lightblue")
dev.off()


# if not installed, install scatterplot3d
#install.packages("scatterplot3d")
require(scatterplot3d)
pdf("../images/tree_data_plot_regression.pdf")
data(trees)
s3d <- scatterplot3d(trees, type = "h", color = "blue",
                     angle = 55, scale.y = 0.7, pch = 16, main = "Adding elements")
my.lm <- lm(trees$Volume ~ trees$Girth + trees$Height)
s3d$plane3d(my.lm)
dev.off()
#Grith=circonference

# s3d$points3d(seq(10, 20, 2), seq(85, 60, -5), seq(60, 10, -10),
#              col = "red", type = "h", pch = 8)

