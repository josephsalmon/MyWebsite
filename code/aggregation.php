 
 
	<div id="main"> 
 
		<div id="container"> 
			<div id="content" role="main"> 
 
 
				<div id="post-11" class="post-11 page type-page hentry category-uncategorized"> 
											<h1 class="entry-title">Aggregation methods</h1> 
					
					<div class="entry-content"> 
					
					<script type="text/javascript">
  MathJax.Hub.Config({
    extensions: ["tex2jax.js"],
    "HTML-CSS": { scale: 100 }
  });
</script>
<br/>
<h3>Introduction</h3> 
<p> We consider  the problem of combining  a set of linear estimators in
non-parametric regression model with Gaussian 
noise. Focusing on the exponentially weighted aggregate (EWA),  we prove a PAC-Bayesian type inequality that leads
to sharp oracle inequalities in discrete but also in 
continuous settings. The framework covers the combinations of various procedures such as
least square regression, kernel ridge regression, 
shrinking estimators, etc. We show that the proposed aggregate
provides an adaptive estimator in the exact minimax sense without neither discretizing the range of tuning
parameters nor splitting the set of observations.</p> 

<h3>Theoretical results</h3> 

<p>
Throughout this work, we focus on the homoscedastic regression model with Gaussian additive noise. More
precisely, we assume that we are given a vector 
$\newcommand{\YY}{\boldsymbol Y}
\def\T{\top}
\def\xxi{{\boldsymbol{\xi}}}
\newcommand{\ff}{\boldsymbol{f}}
\newcommand{\diag}{diag}
\newcommand{\E}{\mathbb{E}}
\newcommand{\R}{\mathbb{R}}
\YY=(y_1,\dotsc,y_n)^\T \in \R^n$ obeying the model:
\begin{equation}
y_i=f_i+\xi_i,   \quad \text{for} \; \; i=1,\ldots,n,
\end{equation}
where $\xxi=(\xi_1,\ldots, \xi_n)^\T$ is a centered Gaussian random vector, $f_i=\mathbf{f}(x_i)$ where
\(\mathbf{f}\) is an unknown function $\mathcal{X} \rightarrow \R$ and $x_1,\ldots, x_n \in \mathcal{X}$ are
deterministic points. Our objective is to 
recover the vector $\ff=(f_1,\ldots,f_n)$, i.e., the $\textit{signal}$,  based on the data 
$y_1,\ldots,y_n$. In our work,  the noise variance  $\sigma^2$ is assumed to be known.

</p>

<div class="math-header">Exponentially Weighted Aggregates</div>
<p> Let $\newcommand{\hatflbd}{\hatf_{\!\lambda}} \newcommand{\hatr}{\hat{r}} \newcommand{\intlbd}{\int_{\Lambda}}
\newcommand{\hatf}{\boldsymbol{\hat{f}}} \newcommand{\hatrlbd}{\hatr_{\lambda}} \newcommand{\hatrw}{\hatr_{\omega}}
\newcommand{\hatfEWA}{{\hatf}_{\text{EWA}}}
 r_\lambda=\E(\|\hatflbd-\ff\|_n^2)$ denote the risk of the estimator $\hatflbd$, for any
$\lambda\in\Lambda$, and let $\hatrlbd$ be an estimator of $r_\lambda$. The precise form of 
$\hatrlbd$ strongly depends on the nature of the constituent estimators. For any probability
distribution $\pi$ over the set $\Lambda$ and for any $\beta>0$, we define the probability measure of
exponential weights, $\hat\pi$, by the following formula:
\begin{equation}\label{eq:def_weights}
\hat\pi(d\lambda)=\theta(\lambda)\pi(d\lambda)\qquad\text{with}\qquad
\theta(\lambda)=\frac{\exp(-n\hatrlbd/\beta)  }{\intlbd \exp(-n\hatrw/\beta) \pi(d\omega) }.
\end{equation}
The corresponding exponentially weighted aggregate, henceforth denoted by $\hatfEWA$, is the expectation
of the $\hatflbd$ w.r.t.  the probability 
measure $\hat{\pi}$:
\begin{equation}\label{eq:def_estimator}
\hatfEWA= \intlbd\hatflbd ~\hat{\pi}(d\lambda) \, . 
\end{equation}
It is convenient and customary to use the terminology of Bayesian statistics: the measure $\pi$ is called
<b>prior</b>, the measure $\hat\pi$ is called 
<b>posterior</b> and the aggregate $\hatfEWA$ is then the <b>posterior mean</b>. The parameter $\beta$
is referred to as the <b>temperature parameter</b>.
</p>

<p>In this study, we mainly consider a family of linear filter. After (orthogonaly) transforming the original 1D
signal with the DCT, we combine the estimators obtained by using several Pinsker's Filter (i.e., by varying
the shrinking parameters). With the notation $\newcommand{\DST}{\mathcal D}A_{\alpha,w}=\DST^\top\!\diag\big((1-k^{\alpha}/w)_+;k=1,\ldots,n\big)\DST$,
the preliminary estimates can be expressed as: $\hatflbd=A_{\alpha,w}\YY$. With those estimates and a particular 
choice of the prior, we can prove that combining Pinsker's type filters with EWA leads to an asymptotically
sharp adaptive procedure over Sobolev ellipsoids. The prior used in practice is defined by

\begin{equation}\label{eq:prior_pinsker}
 \pi(d\lambda)=
\frac{2n_\sigma^{-\alpha/(2\alpha+1)}}{\big(1+n_\sigma^{-\alpha/(2\alpha+1)}w\big)^{3}}e^{-\alpha}d\alpha dw .
\end{equation} 

In practice we also compare the peformance of aggregating the Pinsker's filters by combining various 
shrinking paramters taken on a geometric grid for $\alpha$ and  $w$. Moreover the choice for the parameter
$\beta$ given by our oracle inequality leads to pick $\beta=8\sigma^2$, though in practice it may be choosen
smaller ($4\sigma^2$ or $2\sigma^2$). 

 </p>


<p>See corresponding  Matlab <a href="index_codes.php?page=EWA">Demo</a>.
</p>

			


<h3>Contact us</h3>  
<p>Please <a href="index_codes.php?page=contact">contact</a> us if you have any question.</p> 



