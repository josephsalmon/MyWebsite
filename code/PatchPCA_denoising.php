 
 
<div id="main"> 
 
		<div id="container"> 
			<div id="content" role="main"> 
 
 
				<div id="post-612" class="post-612 page type-page hentry category-news"> 
											<h1 class="entry-title">Patch-PCA denoising</h1> 
					
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


In recent years, overcomplete dictionaries combined with sparse learning techniques
became extremely popular in computer vision. While their usefulness is undeniable, the
improvement they provide in specific tasks of computer vision is still poorly understood.
The aim of the present work is to demonstrate that for the task of image denoising, nearly
state-of-the-art results can be achieved using small dictionaries only, provided that
they are learned directly from the noisy image. We focus on two particular type of 
noise: Poisson and Gaussian noise.

</p> 




</p>



<div class="math-header">Poisson noise reduction with non-local PCA (NL-PCA) </div>   

Photon limitations arise in spectral imaging, nuclear medicine, astronomy and night vision. The Poisson distribution used to model this noise has variance equal to its mean so blind application of standard noise removals methods yields significant artifacts. The aim of the present work is to demonstrate that for the task of image denoising, nearly state-of-the-art results can be achieved using small dictionaries only, provided that they are learned directly from the noisy image. To this end, we introduce patch-based denoising algorithms which perform an adaptation of PCA (Principal Component Analysis) for Poisson noise. The results reveal that, despite its simplicity, PCA-flavored denoising appears to be competitive with other state-of-the-art denoising algorithms.
 </br>
</br>



		<table class="tableau">
					
					<tbody>

					
					<tr><td style="text-align:center" ><a href="../images/noisy_saturn.png">
				       (a) Noisy image  </a></td>
					<td style="text-align:center" ><a href=" ../images/denoised_NL_PCA_saturn.png">
					   (b) Reconstructed with our NL-PCA </a></td>
					<td style="text-align:center" ><a href=" ../images/denoised_NL_PCA_anscomb_saturn.png">
					 (c) Anscombe version of the algorithm </a></td>
					
					</tr>
					
					
					<tr>					
					<td style="text-align:center" ><a href=" ../images/noisy_saturn.png">
					<img  src="../images/noisy_saturn.png" alt="barco" height="240" width="240"/></a></td>
					<td   style="text-align:center"><a href="../images/denoised_NL_PCA_saturn.png">
					<img  src="../images/denoised_NL_PCA_saturn.png" alt="bridge" height="240" width="240"/></a></td>
					<td  style="text-align:center"><a href="../images/denoised_NL_PCA_anscomb_saturn.png">
					<img  src="../images/denoised_NL_PCA_anscomb_saturn.png" alt="barbara" height="240" width="240"/></a></td>
					</tr>
					</tr>
					</tbody></table>

	<br/>Papers: <br/>			
					<b>

  <i> "Poisson Noise Reduction with Non-Local PCA"</i>,
					<br> J. Salmon, 
<?php echo '<a href="'.$deledalle_charlesalban[2].'">'  .$deledalle_charlesalban[4].' '.$deledalle_charlesalban[0]. '</a> ';?>, <?php echo '<a href="'.$willett_rebecca[3].'">'  .$willett_rebecca[4].' '.$willett_rebecca[0]. '</a> ';?> and 
<?php echo '<a href="'.$harmany_zachary[2].'">'  .$harmany_zachary[4].' '.$harmany_zachary[0]. '</a> ';?> , 
<font color="#922">ICASSP 2012</font>, <a href="../papers/ICASSP12_SDWH.pdf">PDF</a>
<br/><br/>

<p>Corresponding  Matlab <a href="index_codes.php?page=NLPCA" >DEMO</a> and <a href="demos/NLPCA_code.zip">ZIP</a>.</b></br></br>

The long version of this paper, and a version of the code adding sparsity constraints on the coefficient of the decomposition
is given in the NLSPCA page:
</br>
<b>
  <i> "Poisson Noise Reduction with Non-Local PCA"</i>,
<br> J. Salmon, <?php echo '<a href="'.$harmany_zachary[2].'">'  .$harmany_zachary[4].' '.$harmany_zachary[0]. '</a> ';?>, 
<?php echo '<a href="'.$deledalle_charlesalban[2].'">'  .$deledalle_charlesalban[4].' '.$deledalle_charlesalban[0]. '</a> ';?>, <?php echo '<a href="'.$willett_rebecca[3].'">'  .$willett_rebecca[4].' '.$willett_rebecca[0]. '</a> ';?>,
<font color="#922">submitted</font>, 2012, <a href="../papers/JMIV_SHDW12.pdf">PDF</a> <br/>

<p>Corresponding  Matlab <a href="index_codes.php?page=NLSPCA" >DEMO</a> and <a href="demos/NLSPCA_code.zip">ZIP</a>.</b></br></br>



<div class="math-header">Gaussian Patch-PCA (GP-PCA)</div>   

<p>		
In this project we apply the idea of patch-based PCA in the case of Gaussian noise.
We have mainly compare the efficiency of different procedure using PCA as a dictionary
techniques. To this end, we introduce three patch-based
denoising algorithms which perform hard thresholding on the coefficients of the
patches in image-specific orthogonal dictionaries. The algorithms differ by the methodology
of learning the dictionary: local PCA (PLPCA), hierarchical PCA (PHPCA) and global PCA (GHPCA).
We carry out a comprehensive empirical evaluation of the performance of these algorithms in terms
of accuracy and running times. The results reveal that, despite its simplicity, PCA-based
denoising appears to be competitive with the state-of-the-art denoising algorithms, especially
for large images and moderate signal-to-noise ratios.
</p>		


		<table class="tableau">
					
					<tbody>

					
					<tr><td style="text-align:center" ><a href="../images/hill_sig00_lppca_hW10_anoted.png">
				       (a) Local search windows  </a></td>
					<td style="text-align:center" ><a href=" ../images/hill_sig00_hP12_lppca_hW10_dico16first_zone1.png">
					   (b) 16 first axes in window 1 </a></td>
					<td style="text-align:center" ><a href=" ../images/hill_sig00_hP12_lppca_hW10_dico16first_zone2.png">
					 (c) 16 first axes in window 2 </a></td>
					
					</tr>
					
					
					<tr>					
					<td style="text-align:center" ><a href=" ../images/hill_sig00_lppca_hW10_anoted.png">
					<img  src="../images/hill_sig00_lppca_hW10_anoted.png" alt="barco" height="240" width="240"/></a></td>
					<td   style="text-align:center"><a href="../images/hill_sig00_hP12_lppca_hW10_dico16first_zone1.png">
					<img  src="../images/hill_sig00_hP12_lppca_hW10_dico16first_zone1.png" alt="bridge" height="240" width="240"/></a></td>
					<td  style="text-align:center"><a href="../images/hill_sig00_hP12_lppca_hW10_dico16first_zone2.png">
					<img  src="../images/hill_sig00_hP12_lppca_hW10_dico16first_zone2.png" alt="barbara" height="240" width="240"/></a></td>
					</tr>
					</tr>
					</tbody></table>


					<br/>Papers: <br/>			
					<b>
  <i>"Image denoising with patch based PCA: local versus global"</i> <br/>
<?php echo '<a href="'.$deledalle_charlesalban[2].'"> C.-A. ' .$deledalle_charlesalban[0]. '</a>' ;?>, J. Salmon, <?php echo '<a href="'.$dalalyan_arnak[2].'"> A. S. ' .$dalalyan_arnak[0]. '</a>' ;?>, BMVC 2011, 
                            <a href="../papers/BMVC11_DSD.pdf">PDF</a>. <br/><br/>

<p>Corresponding  Matlab <a href="index_codes.php?page=GPPCA" >DEMO</a> and <a href="demos/GP-PCA_code.zip">ZIP</a>.</b>

<br/><br/>


<h3>Contact us</h3>  
Please <a href="index_codes.php?page=contact">contact</a> us if you have any question. 				

