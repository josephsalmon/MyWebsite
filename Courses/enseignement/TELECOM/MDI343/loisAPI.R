loisAPI = function (){
  require(tcltk);
  t <- seq(-5, 5, 0.01);

  init <- function(){
   xm <- -1; xM <- 1;
   if (as.integer(tclvalue(gauss))!=0) {xm <- min(xm, -5); xM <- max(xM, 5);} 
   if (as.integer(tclvalue(chi2))!=0) {xm <- min(xm, -1); xM <- max(xM, 2*as.integer(tclvalue(k)));} 
   if (as.integer(tclvalue(student))!=0) {xm <- min(xm, -5); xM <- max(xM, 5);} 
   if (as.integer(tclvalue(fischer))!=0) {xm <- min(xm, 0); xM <- max(xM, 5);} 
   t<<-seq(xm, xM, 0.01);
   plot(t, t-t, type="n", ylim=c(0,0.7))
  }
  plotGauss <- function(t, quant, ...){
    lines(t, dnorm(t), type="l", lwd=3, col="red");
    if (quant){
      p <- (1-as.integer(tclvalue(alpha))/1000);
      q <- qnorm(p);
      lines(c(q, q), c(0, dnorm(q)), col="green", lwd=5)
    }
  }
  plotChi2 <- function(t, k, quant, ...){
    lines(t, dchisq(t, k), type="l", lwd=3, col="blue", ...);
    if (quant){
      p <- (1-as.integer(tclvalue(alpha))/1000);
      q <- qchisq(p, k);
      lines(c(q, q), c(0, dchisq(q, k)), col="green", lwd=5)
    }
  }
  plotStudent <- function(t, k, quant, ...){
    lines(t, dt(t, k), type="l", lwd=3, col="blue", ...);
    if (quant){
      p <- (1-as.integer(tclvalue(alpha))/1000);
      q <- qt(p, k);
      lines(c(q, q), c(0, dt(q, k)), col="green", lwd=5)
    }
  }
  plotFischer <- function(t, k, l, quant, ...){
    lines(t, df(t, k, l), type="l", lwd=3, col="blue", ...);
    if (quant){
      p <- (1-as.integer(tclvalue(alpha))/1000);
      q <- qf(p, k, l);
      lines(c(q, q), c(0, df(q, k, l)), col="green", lwd=5)
    }
  }

  k <- tclVar(5); 
  l <- tclVar(5);
  alpha <- tclVar(50);
  gauss <- tclVar(0);
  chi2 <- tclVar(1);
  student <- tclVar(0);
  fischer <- tclVar(0);
  quantile <- tclVar(0);

  base <- tktoplevel(); 
  tkwm.title(base,'Gaussian-related distributions');  
  tt <- tkframe(base, borderwidth=2)
  sliderFrame <- tkframe(tt, borderwidth=2, relief='groove');

  kFrame <- tkframe(sliderFrame, borderwidth=2);
  kLabel <- tklabel(kFrame, text="k ", width=10);

  lFrame <- tkframe(sliderFrame, borderwidth=2);
  lLabel <- tklabel(lFrame, text="l ", width=10);

  alphaFrame <- tkframe(sliderFrame, borderwidth=2);
  alphaLabel <- tklabel(alphaFrame, text="alpha=", width=5);
  alphaValueLabel <- tklabel(alphaFrame, text="", width=4);

  actionPerformed = function(...){
    init(); quant <- as.integer(tclvalue(quantile))!=0
    if (as.integer(tclvalue(gauss))!=0) plotGauss(t, quant);
    if (as.integer(tclvalue(chi2))!=0) plotChi2(t, as.integer(tclvalue(k)), quant);
    if (as.integer(tclvalue(student))!=0) plotStudent(t, as.integer(tclvalue(k)), quant);
    if (as.integer(tclvalue(fischer))!=0) plotFischer(t, as.integer(tclvalue(k)), as.integer(tclvalue(l)), quant);
    tkconfigure(alphaValueLabel, text=as.character(as.integer(tclvalue(alpha))/1000));
  }

  kSlider <- tkscale(kFrame, from=1, to=50, length=600, showvalue=T, variable=k, resolution=1, orient='horizontal', command=actionPerformed)
  tkpack(kFrame, kLabel, kSlider, side='left');
  lSlider <- tkscale(lFrame, from=1, to=50, length=600, showvalue=T, variable=l, resolution=1, orient='horizontal', command=actionPerformed)
  tkpack(lFrame, lLabel, lSlider, side='left');
  alphaSlider <- tkscale(alphaFrame, from=1, to=1000, length=600, showvalue=F, variable=alpha, resolution=1, orient='horizontal', command=actionPerformed)
  tkpack(alphaFrame, alphaLabel, alphaValueLabel, alphaSlider, side='left');
  tkpack(sliderFrame, kFrame, lFrame, alphaFrame, side='top')

  cbFrame <- tkframe(tt, borderwidth=2,relief='groove')
  cbGauss <- tkcheckbutton(cbFrame, command=actionPerformed, text='Gaussian', variable=gauss)
  cbChi2 <- tkcheckbutton(cbFrame, command=actionPerformed, text='Chi2', variable=chi2)
  cbStudent <- tkcheckbutton(cbFrame, command=actionPerformed, text='Student', variable=student)
  cbFischer <- tkcheckbutton(cbFrame, command=actionPerformed, text='Fischer', variable=fischer)
  cbQuantile <- tkcheckbutton(cbFrame, command=actionPerformed, text='1-alpha Quantile', variable=quantile)
  tkpack(cbFrame, cbGauss, cbChi2, cbStudent, cbFischer, cbQuantile, side='left');


  tkpack(tt, cbFrame,  sliderFrame, side='top');
}


loisAPI();
