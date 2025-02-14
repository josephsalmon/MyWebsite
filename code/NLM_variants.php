 
 
	<div id="main"> 
 
		<div id="container"> 
			<div id="content" role="main"> 
 
 
				<div id="post-11" class="post-11 page type-page hentry category-uncategorized"> 
											<h1 class="entry-title">Patch-based image denoising</h1> 
					
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
Since their introduction in denoising, the family of non-local methods, 
whose Non-Local Means (NL-Means) is the most famous member, 
has proved its ability to challenge other powerful methods such as wavelet based approaches, 
or variational techniques. 
Though simple to implement and efficient in practice, the classical NL-Means algorithm suffers  
from several limitations: noise artifacts are created around edges and regions with few repetitions 
in the image are not treated at all. We present here several solution to improve this method, either by considering  
better reprojection from the patches space to the original pixel space, or by considering general shapes for the 
patches
</p> 

<h3>Noise Model</h3> 

<p> We are concerned with the problem of the restoration of noisy images. We assume that
we are given a grayscale image $I$ being a noisy version of an unobservable image $I^\star$. 
In this context one usually deals with  additive Gaussian noise:
\begin{equation}\newcommand{\boldx}{\mathbf x}
\newcommand{\N}{\mathbb{N}}
\newcommand{\sfP}{\textsf{P}}
\newcommand{\R}{\mathbb{R}}
\newcommand{\sfP}{P}
\newcommand{\itrue}{\mathbf f}
\newcommand{\inoisy}{\mathbf Y} 
\newcommand{\INLM}{\hat{ \mathbf {f}} ^{NLM}}
\newcommand{\INLMLPR}{\hat{\mathbf{f}}^{NLM-LPR}}
\newcommand{\wnlm}[2]{\omega ( #1 , #2 )}
\newcommand{\patch}{P}
\newcommand{\argmin}{\mathop{\mathrm{arg\,min}}}

\inoisy(\boldx)=\itrue(\boldx)+\boldsymbol{\varepsilon}(\boldx) \: ,
\end{equation} 
where $\boldx=(x,y) \in \Omega$, is any pixel in the image $\Omega$ and $\boldsymbol{\varepsilon}$ is a centered Gaussian noise with known variance $\sigma^2$.<!-- In the sequel the image is of size $M\times N$. --> 
</p>

<h3>Non-Local Means (NLM)</h3> 
<p>
<img src="idee_patch.gif" alt="Home" height="200" width="200" style="float:right; margin-left:1em"> 
The approach introduced by Buades et al. (2005) proposes to denoised the pixel, by averaging similar pixels.
The main idea was to measure pixel similarity through patches: one considers that two pixels are similar when two small
images (a patch) of the same size and centered around each one look alike. This method extends the approach used for Bilateral Filtering
or Yaroslavsky's Filter, to the space of patches. Let us defined the patches more precisely. For some odd integer $W=2W_1+1>0$ with $W_1 \in \N$ and for some pixel $\boldx\in \Omega$, the patch with $W^2$ elements and upper left corner $\boldx$ is by definition the matrix 
$\sfP_\boldx=\sfP_\boldx^{\inoisy,W}=(\inoisy(\boldx+\tau), \tau \in [ 0, W-1 ]^2)$ (the exponent $W$ is omitted when no confusion can occur). 
 
 Note that this uncommon notation is used to simplify the writing of the new reprojections 
methods introduced above.

Using kernel smoothing with patches,   we can now defined the NL-Means estimator of the pixel $\boldx$.

\begin{equation}\label{eq2}
\INLM(\boldx)=\frac{\sum_{\boldx'}  K(\|\sfP_{\boldx-\delta_{W}}^\inoisy-\sfP_{\boldx'-\delta_{W}}^\inoisy\|/h) \cdot \inoisy(\boldx')}{\sum_{\boldx''} 
K(\|\sfP_{\boldx-\delta_{W}}^I-\sfP_{\boldx''-\delta_{W}}^I\|/h)} \:,
\end{equation}
where $\boldx'$ runs in $\Omega$, $K$ is a kernel function, $h>0$ is the bandwidth and $\|\cdot\|$ is a norm on $\R^{W^2}$. 
</p>

Below we present some variants of this method.

<div class="math-header">NLM-LPR: Local Polynomial Regression</div>   

In this work we focus on the theoretical properties of the NLM but also of other estimators such as the linear filters (LF),
the Yaroslavsky filter (YF),  and an oracle estimator (it is not a proper estimator since it has access to 
partial information from the original/non-corrupted image).

Our extension adapt local polynomial regression to all the methods mentioned. Indeed, NLM can be seen as a zero order polynomial fitting
using some weights $\alpha$ such that $\INLM(\boldx)=\sum_{\boldx'}  \alpha_{\boldx',\boldx} \inoisy(\boldx')$.

Though it is also common in the statistics litterature to consider other order of polynomial approximation. For an order $r$,
we have

\begin{align}
%\begin{cases}
\INLMLPR(\boldx) &= \widehat{a}^{(\boldx)}_0\\
\widehat{\mathbf{a}}^{(\boldx)}&=\argmin_{\mathbf{a}} \sum_{\boldx'} \alpha_{\boldx,\boldx'} \left(\inoisy(\boldx) - \sum_{0 \leq |s| \leq r} a_s \, (\boldx - \boldx')^s\right)^2,
%\end{cases}
\end{align}
Here the exponent $s$ is used for mutlipolynomial indices. We show that for particular classes of images, 
the improvement by going up the the ordre $r=2$ is already enough to improve the visual and numerical of the methods.



					<br/><br/><br/>Paper: <b>

<br/>
<i>"Oracle inequalities and minimax rates for non-local means and related adaptive kernel-based methods"</i><br />

<?php echo '<a href="'.$ariascastro_ery[2].'"> E. ' .$ariascastro_ery[0]. '</a>' ;?>, J. Salmon, 
<?php echo '<a href="'.$willett_rebecca[2].'"> R. ' .$willett_rebecca[0]. '</a>' ;?>,  SIAM J. Imaging Sci., vol.5, pp. 944--992, 2012, <a href="../papers/MinimaxNLM_ACSW.pdf">PDF</a>. </br><br/>

<p>Corresponding  Matlab <a href="index_codes.php?page=NLMLPR">Demo</a> and toolbox <a href="demos/NLMLPR_code.zip">ZIP</a></b>.




<div class="math-header">NLM-Reprojections</div>   


<p><img  src="zone_recherche_wav_reproj.gif" alt="Home" height="200" width="200"  style="float:right; margin-left:1em">
 It is important to remember that each pixel belong to $W\times W$ patches. So, after having
denoised each patch in the image we have as many pixel estimates. One can benefit from
those various estimates by combining them rather than just selecting the value corresponding
to the central position  (cf. animation). The first solution propsed was to combine with a 
uniform averaging the pixels estimates. Though by considering weighted average with 
weights proportionnal to the inverse of the estimated variance, one can reduce the common
"halo of noise" created by the NLM around the edges.<br/>&nbsp; 
</p>



<h3>Various Reprojections (Box-kernel)</h3>


						<table class="tableau">
					
					<tbody>

					
					<tr><td style="text-align:center" ><a href="../images/cam_select_reprojection_central_sig20_w_9_r1_5.png">
				       Central<br/>PSNR=28.19 </a></td>
					<td style="text-align:center" ><a href=" ../images/cam_select_reprojection_mean_sig20_w_9_r1_5.png">
					   Uniform Average <br/>PSNR=28.68</a></td>
					<td style="text-align:center" ><a href=" ../images/cam_select_reprojection_variance_sig20_w_9_r1_5.png">
					 Weighted Average<br/> PSNR=29.13 </a></td>
					
					</tr>
					
					
					<tr>					
					<td style="text-align:center" ><a href=" ../images/cam_select_reprojection_central_sig20_w_9_r1_5.png">
					<img  src="../images/cam_select_reprojection_central_sig20_w_9_r1_5.png" alt="barco" height="150" width="150"/></a></td>
					<td   style="text-align:center"><a href="../images/cam_select_reprojection_mean_sig20_w_9_r1_5.png">
					<img  src="../images/cam_select_reprojection_mean_sig20_w_9_r1_5.png" alt="bridge" height="150" width="150"/></a></td>
					<td  style="text-align:center"><a href="../images/cam_select_reprojection_variance_sig20_w_9_r1_5.png">
					<img  src="../images/cam_select_reprojection_variance_sig20_w_9_r1_5.png" alt="barbara" height="150" width="150"/></a></td>

					</tr>
					
					
					
					
					
					
					</tr>
					</tbody></table>
			


					<br/>Papers: <b>

<br/>
<i>"From Patches to Pixels in Non-Local methods: Weighted-Average Reprojection"</i><br />

J. Salmon and <?php echo '<a href="'.$strozecki_yann[2].'"> Y. ' .$strozecki_yann[0]. '</a>' ;?>, ICIP, 2010, <a href="../papers/ICIP10.pdf">PDF</a>. </br>


</br>	<i>"Patch Reprojections for Non Local Methods"</i><br/>
J. Salmon and <?php echo '<a href="'.$strozecki_yann[2].'"> Y. ' .$strozecki_yann[0]. '</a>' ;?>, Signal Processing, vol.92, pp. 477 - 489, 2012. <a href="../papers/NLM_Reprojections_Salmon_Strozecki.pdf" target="_blank">PDF</a>. </br> </br>

<p>Corresponding  Matlab <a href="index_codes.php?page=NLM_reprojection">Demo</a> and toolbox <a href="demos/Reprojections_code.zip">ZIP</a></b>.


<div class="math-header">NLM-Shape Adaptive Patches (NLM-SAP)</div>   

<p> Another method consider to reduce the "halo of noise" due to the NLM, is to generalize the shape of the patches.
Instead of using simple square patches, we propose to extend the NLM algorithm  with more general families of shapes. Examples
are classical squares, disks, but also bands and pie (cf. figure). 
The main point of this work is define a pertinent tool to 
locally aggregate the various estimations obtained for each pixel thanks to each shape. The technical tool we consider 
is the SURE (Stein Unbaised Risk Estimate), based on the Stein's Lemma. We apply the SURE to the NLM using shapes, instead of
using SURE to simply determine the bandwith or the patch width. 
</p>


\begin{equation}\newcommand{\ihat}{\hat{\itrue}}
\ihat(\boldx)= \frac{\sum_{\boldx' \in \Omega} \wnlm{\boldx}{\boldx'} \inoisy(\boldx')}{\sum_{\boldx' \in \Omega} \wnlm{\boldx}{\boldx'}} \, ,
\end{equation}
where the weights $\wnlm{\boldx}{\boldx'}$ depend on patches around $\boldx$ and $\boldx'$. The denominator is
a normalizing factor which ensures the weights sum to one. The original weights in the NL-Means are of the following form:
\begin{equation}\label{eq:nlm_weights}
\wnlm{\boldx}{\boldx'}=  \varphi \left( \frac{\|\patch_{\boldx} -\patch_{\boldx'}\|_{2,a}^2}{2h^2} \right)
\, ,
\end{equation}
where $h>0$ is the bandwidth parameter, $\varphi$ is the kernel used to measure similarity between
patches, $\|\cdot\|_{2,a}$ is a weighted Euclidean norm using a Gaussian kernel, and $a$ is
the bandwidth  that controls the concentration of the kernel around the central pixel.

In order to deal with patches of arbitrary shapes, we reformulate the way
the distance between two pixels is measured in terms
of patches. The weighted Euclidean distance $\|\cdot\|_{2,a}$ used above
can be generalized using the following expression:
\begin{equation}\label{eq:shape_distance}
d^2_{\mathbf S}(\boldx,\boldx')=\sum_{\tau \in \Omega} \mathbf{S}(\tau)
(\inoisy(\boldx+\tau)-\inoisy(\boldx'+\tau))^2 \, ,
\end{equation}
where $\mathbf{S}$ encodes the shape we aim at.
</p>


<p><b>Squares</b>: To begin with, we apply our framework to the most commonly used
shapes, i.e., the square shapes of odd length (so the squares have centers we can
consider).  For instance, choosing:
\begin{equation}\label{eq:lambda_simple_nlm}
 \mathbf{S}(\tau)=\left \{ \begin{array}{ll}
1, \,  &\mbox{ if } \|\tau\|_\infty \le \frac{p-1}{2}\, ,\\
\\
0, \, &\mbox{ otherwise},
\end{array} \right.
\end{equation}
leads to the classical (simplified) NL-Means definition with square patches of size $p \times p$ and
distance between patches measured by the Euclidean norm.
</p>
<p><b>Gaussian</b>
The original, but less common choice, is to set:
\begin{equation}\label{eq:lambda_original_nlm}
 \mathbf{S}(\tau)=\left \{ \begin{array}{ll}
\exp(-(\tau_1^2+\tau_2^2)/2a^2), \,  &\mbox{ if } \|\tau\|_\infty \le
\frac{p-1}{2}\, ,\\
\\
0, \, &\mbox{ otherwise.}
\end{array} \right.
\end{equation}
The last equation means that the norm $ \|\cdot\|_{2,a}$
is used to measure the distance between patches in the definition of the NL-Means. This limits
the influence of square patches corners and leads to a more isotropic comparison between patches.
</p>
<p><b>Disks</b>: Disk shapes are defined in the same way, using the Euclidean norm instead:
\begin{equation}
 \mathbf{S}(\tau)=\left \{ \begin{array}{ll}
1, \,  &\mbox{ if } \|\tau\|_2 \le \frac{p-1}{2}\, ,\\
\\
0, \, &\mbox{ otherwise.}
\end{array} \right.
\end{equation}
<img src="../code/pies_L3_R4_A0.png" alt="Home" height="150" width="180" style="float:right; margin-left:1em">
A non-binary version may also be defined for pixels crossed by the boundary.</p>
<p><b>Pie slices</b>: We study a family of shapes, denoted as "pie",
whose elements are defined with three parameters: two angles and a radius.
These shapes represent a portion of a disk delimited byeq
two lines and surrounding the discrete central pixel.

</p>



<p><b>Bands</b>: This family of shapes is simply composed of rectangles, potentially rotated and
decentered with respect to the pixel of interest.
<img src="../code/rectangles_8_5x10.png" alt="Home" height="100" width="200" style="float:right; margin-left:1em"> 
</p>

<p>We have also provided a fast implementation of the method thanks to FFT calculations.  Moreover, we have considered
several rules to aggregates thanks to SURE the shape-based estimates obtained. </p>

	<table class="tableau">
					
					<tbody>

					
					<tr>
					<td style="text-align:center" ><a href=" ../images/DEMO_NLMSAP_gauss_cameraman_01.png">
					   Example of using several shapes and combining them </a></td>
					<td style="text-align:center" ><a href=" ../images/DEMO_NLMSAP_gauss_cameraman.png">
					   The shapes used</a></td>
					
					</tr>
					
					
					<tr>					
					<td style="text-align:center" ><a href=" ../images/DEMO_NLMSAP_gauss_cameraman_01.png">
					<img  src="../images/DEMO_NLMSAP_gauss_cameraman_01.png" alt="illustration" height="400" width="500"/></a></td>
					<td   style="text-align:center"><a href="../images/DEMO_NLMSAP_gauss_cameraman.png">
					<img  src="../images/DEMO_NLMSAP_gauss_cameraman.png" alt="shapes" height="300" width="300"/></a></td>
					

					</tr>
					
					
					
					
					
					
					
					</tbody></table>



 

					<br/>Papers: <br/>
															<b>
  <i>"Anisotropic Non-Local Means with Spatially Adaptive Patch Shapes"</i> <br/>
<?php echo '<a href="'.$deledalle_charlesalban[2].'"> C.-A. ' .$deledalle_charlesalban[0]. '</a>' ;?>                            
 J. Salmon, <?php echo '<a href="'.$duval_vincent[2].'"> V. ' .$duval_vincent[0]. '</a>' ;?>, SSVM 2011, 
                            <a href="../papers/SSVM11_NLMSAP.pdf">PDF</a>. <br/><br/>

			    <i>"Non-Local Methods with Shape-Adaptive Patches (NLM-SAP)"</i> <br/>
<?php echo '<a href="'.$deledalle_charlesalban[2].'"> C.-A. ' .$deledalle_charlesalban[0]. '</a>' ;?>                            
 J. Salmon, <?php echo '<a href="'.$duval_vincent[2].'"> V. ' .$duval_vincent[0]. '</a>' ;?>, J. Math. Imaging Vis., vol.43, pp. 103-120, 2012, 
                            <a href="../papers/JMIV11_NLMSAP.pdf">PDF</a>. <br/><br/>
<p>Corresponding  Matlab <a href="index_codes.php?page=NLMSAP" >DEMO</a> and toolbox <a href="demo/NLMSAP_code.zip">ZIP</a>. </b>

				
<br/><br/>


<h3>Contact us</h3>  
Please <a href="index_codes.php?page=contact">contact</a> us if you have any question. 				

