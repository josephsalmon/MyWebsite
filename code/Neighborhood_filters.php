 
 
	<div id="main"> 
 
		<div id="container"> 
			<div id="content" role="main"> 
 
 
				<div id="post-11" class="post-11 page type-page hentry category-uncategorized"> 
											<h1 class="entry-title">Neighboorod filters</h1> 
					
					<div class="entry-content"> 
					
					<script type="text/javascript">
  MathJax.Hub.Config({
    extensions: ["tex2jax.js"],
    "HTML-CSS": { scale: 100 }
  });
</script>
<br/>
<h3>Introduction</h3> 
<p> 
We focus in this section on neighborood filters. Those filters, starting from linear filters, and going
to Yaroslavsky filter or the Bilateral filter, have been popularized in the 2000's by the introduction of the Non Local
Means (NLM). Here we give some new insights on those methods, focusing on several simpler variants. 
</p> 

<h3>Noise Model</h3> 


<p> We are concerned with the problem of the restoration of noisy images. We assume that
we are given a grayscale image $ \newcommand{\inoisy}{\mathbf Y}  \inoisy$ being a noisy version of an unobservable image $\newcommand{\itrue}{\mathbf f}\itrue$. 
In this context one usually deals with  additive Gaussian noise:
\begin{equation}
\newcommand{\itrue}{\mathbf f}
\newcommand{\inoisy}{\mathbf Y} 
\newcommand{\boldx}{\mathbf x}
\newcommand{\N}{\mathbb{N}}
\newcommand{\sfP}{\textsf{P}}
\newcommand{\R}{\mathbb{R}}
\newcommand{\sfP}{P}
\newcommand{\IYF}{\hat{ \mathbf {f}} ^{YF}}
\newcommand{\PYF}{\hat{ \mathbf {f}} ^{PYF}}
\newcommand{\INLM}{\hat{ \mathbf {f}} ^{NLM}}
\newcommand{\INLMLPR}{\hat{\mathbf{f}}^{NLM-LPR}}
\newcommand{\wnlm}[2]{\omega ( #1 , #2 )}
\newcommand{\patch}{P}
\newcommand{\argmin}{\mathop{\mathrm{arg\,min}}}
\inoisy(\boldx)=\itrue(\boldx)+\boldsymbol{\varepsilon}(\boldx) \: ,
\end{equation} 
where $\boldx=(x,y) \in \Omega$, is any pixel in the image $\Omega$ and $\boldsymbol{\varepsilon}$ is a centered Gaussian noise with known variance $\sigma^2$.<!-- In the sequel the image is of size $M\times N$. --> 
</p>

<h3>The Yaroslavksy filter</h3> 
<p>
In this paragraph we give some new insight on neighboor filters using only pixelwise information to compute image similarity.
Let us remind what we mean by the Yaroslavsky filter. Here is the mathematical formulation: 


\begin{equation}\label{eq2}
\IYF(\boldx)=\frac{\sum_{\boldx'}  K(  [\inoisy(\boldx')-\inoisy(\boldx)]/g) \cdot L( [\boldx'-\boldx]/g) \cdot \inoisy(\boldx')}{\sum_{\boldx''} 
K([\inoisy(\boldx'')-\inoisy(\boldx)]/g) \cdot L([\boldx''- \boldx ]/h)} \:,
\end{equation}
where $\boldx'$ runs in $\Omega$, $K,L$ are kernel functions, $g>0$ and $h>0$ are  bandwidth parameters. 
For simplicity we usually use this filter with both the spatial kernel $L$ and the photometric kernel $K$ being
box kernels. </p>

<h3>The preprocessed Yaroslavksy filter</h3> 


The idea of the preprocessed Yaroslavsky filter (PYF), is to proposed a first estimate $\tilde{f}$ of out targeted image,
and then to use this cleaner version of the image to compute the photometric distance, instead of using the 
original noisy version. Possible candidates for the first step could be wavelet denoising, curvelet denoising,
linear filtering, etc. The PYF could be written in the following way:


\begin{equation}\label{eq3}
\PYF(\boldx)=\frac{\sum_{\boldx'}  K(  [\tilde{f}(\boldx')-\tilde{f}(\boldx)]/g) \cdot L( [\boldx'-\boldx]/g) \cdot \inoisy(\boldx')}{\sum_{\boldx''} 
K([\tilde{f}(\boldx'')-\tilde{f}(\boldx)]/g) \cdot L([\boldx''- \boldx ]/h)} \:.
\end{equation}


					<br/><br/><br/>Papers:

<br/>
<b><i>"A two-stage denoising filter: the preprocessed Yaroslavsky filter"</i><br/>

J. Salmon,
<?php echo '<a href="'.$willett_rebecca[2].'"> R. ' .$willett_rebecca[0]. '</a>' ;?>,
<?php echo '<a href="'.$ariascastro_ery[2].'"> E. ' .$ariascastro_ery[0]. '</a>' ;?>,   2012, <a href="../papers/SSP12.pdf">PDF</a>.</b> </br>

Corresponding  Matlab <a href="index_codes.php?page=PYF">Demo</a> and toolbox <a href="demos/PYF_code.zip">ZIP</a>.



<br/><br/><b> 
<i>"Oracle inequalities and minimax rates for non-local means and related adaptive kernel-based methods"</i><br />

<?php echo '<a href="'.$ariascastro_ery[2].'"> E. ' .$ariascastro_ery[0]. '</a>' ;?>, J. Salmon, 
<?php echo '<a href="'.$willett_rebecca[2].'"> R. ' .$willett_rebecca[0]. '</a>' ;?>,  SIAM J. Imaging Sci., vol.5, pp. 944--992, 2012, <a href="../papers/MinimaxNLM_ACSW.pdf">PDF</a>.</b> </br>

Corresponding Matlab <a href="index_codes.php?page=NLMLPR">Demo</a> and toolbox <a href="demos/NLMLPR_code.zip">ZIP</a>.</br>




<h3>Contact us</h3>  
Please <a href="index_codes.php?page=contact">contact</a> us if you have any question. 				

