simpleRegAPI = function (){
  require(tcltk);
  nmax <- 600; alpha <- 0.3; beta <- -3;
  x <- rnorm(nmax);
  u <- rnorm(nmax);
  xsc <- tclVar(10); xshift <- tclVar(5);
  sig2 <- tclVar(40);
  n <- tclVar(10);

  base <- tktoplevel(); 
  tkwm.title(base,'Simple regression');
  tt <- tkframe(base, borderwidth=2)
  sliderFrame <- tkframe(tt, borderwidth=2, relief='groove');

  nFrame <- tkframe(sliderFrame, borderwidth=2);
  nLabel <- tklabel(nFrame, text="sample size", width=30);

  xscFrame <- tkframe(sliderFrame, borderwidth=2);
  xscLabel <- tklabel(xscFrame, text="x dispersion", width=30);

  xshiftFrame <- tkframe(sliderFrame, borderwidth=2);
  xshiftLabel <- tklabel(xshiftFrame, text="x average", width=30);
  
  sig2Frame <- tkframe(sliderFrame, borderwidth=2);
  sig2Label <- tklabel(sig2Frame, text="sigma^2", width=30);

  init <- function(){
    #x <<- rnorm(nmax);
    u <<- rnorm(nmax);
  }

  replot <- function(x, y, sig2){
    n <- length(x); mx <- mean(x);
    xy.lm <- lm(y ~ x, list(y=y, x=x));
    plot(x, y, type="p", pch="x", col="blue", xlim=c(-40, 40), ylim=c(-alpha*20+beta-3, alpha*20+beta+3));
    abline(xy.lm$coef, lwd=5, col="red");
    abline(h=0); abline(v=0); abline(beta, alpha, col="green")
    Valpha <- sig2 / sum((x-mx)^2);
    Vbeta <- sig2 * mean(x^2) / sum((x-mx)^2);
    lines(c(0, 0), c(beta-2*sqrt(Vbeta), beta+2*sqrt(Vbeta)), type="l", lwd=4, col="black");
  }
  
  controlPlot <- function(...){
    nn <- as.integer(tclvalue(n));
    xx <- sqrt(as.double(tclvalue(xsc)))*x[1:nn] + as.integer(tclvalue(xshift));
    sig2 <- as.double(tclvalue(sig2))/10;
    yy <- alpha*xx+beta+sqrt(sig2)*u[1:nn];
    replot(xx, yy, sig2);
  }

  otherPlot <- function(...){
    init(); controlPlot();
  }
  
  nSlider <- tkscale(nFrame, from=2, to=nmax, length=600, showvalue=T, variable=n, resolution=1, orient='horizontal', command=controlPlot)
  tkpack(nFrame, nLabel, nSlider, side='left');
    
   xscSlider <- tkscale(xscFrame, from=1, to=100, length=600, showvalue=T, variable=xsc, resolution=1, orient='horizontal', command=controlPlot)
  tkpack(xscFrame, xscLabel, xscSlider, side='left');

  xshiftSlider <- tkscale(xshiftFrame, from=-10, to=10, length=600, showvalue=T, variable=xshift, resolution=1, orient='horizontal', command=controlPlot)
  tkpack(xshiftFrame, xshiftLabel, xshiftSlider, side='left');
  
  sig2Slider <- tkscale(sig2Frame, from=1, to=64, length=600, showvalue=T, variable=sig2, resolution=1, orient='horizontal', command=controlPlot)
  tkpack(sig2Frame, sig2Label, sig2Slider, side='left');

  tkpack(sliderFrame, nFrame, xscFrame, xshiftFrame, sig2Frame, side='top')
  btReset <- tkbutton(tt, command=otherPlot, text='Reset');
  tkpack(tt, sliderFrame, btReset, side='top');
}


simpleRegAPI();
