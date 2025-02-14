
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h1 class="intro">Simple example on Barbara</h1><br><introduction>
      <p>We present here the three variations of Gaussian Patch-PCA (GP-PCA) algorithms:</p>
      <p>The first one is the global approach (using PGPCA.m) meaning all the patches in the images are used to compute a global PCA,
         followed by a hard-thresholding of the coefficients. The second one is the local approach (using PLPCA.m) meaning that we
         use a sliding window on which the PCA is performed, before hard- thresholding coefficients. The third one is the hierarchical
         or tree based approach (using PHPCA.m). We keep axis at some iteration and then look for axis on the complement of the space
         the span of the axis already found.
      </p>
      <p>Authors: \( \textbf{C-A. Deledalle} \), \(\textbf{J. Salmon} \) and \(\textbf{A. S. Dalalyan} \)</p>
      <p>Copyright (C) 2011 GP-PCA project See The GNU Public License (GPL)</p>
   </introduction>
   <h2>Initialization<a name="1"></a></h2><pre class="codeinput">clear <span class="string">all</span>
close <span class="string">all</span>

sigma=10;
randn(<span class="string">'seed'</span>, 2);
ima = double(imread(<span class="string">'data/barbara.png'</span>));
ima_nse = ima + sigma * randn(size(ima));

figure(<span class="string">'Position'</span>,[100 100  800 800]);
plotimage(ima_nse);
title(sprintf(<span class="string">'Noisy: \n  PSNR %.2f'</span>, psnr(ima, ima_nse)));
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,12);
</pre><img vspace="5" hspace="5" src="DEMO_GPPCA_online_01.png"> <h2>GLOBAL VERSION: PGPCA.m<a name="2"></a></h2><pre class="codeinput">[hP factor_thr] = PGPCA_best_params(sigma);
threshold = factor_thr * sigma;
func_thresholding = @(ima_ppca) <span class="keyword">...</span>
    hardthresholding(ima_ppca, threshold, sigma);
global_time=tic;
</pre><h2>Patchization step<a name="3"></a></h2><pre class="codeinput">ima_patchs = spatial_patchization(ima_nse, hP);
</pre><h2>Global PCA denoising step<a name="4"></a></h2><pre class="codeinput">[ima_patchs_fil ima_ppca_fil] = <span class="keyword">...</span>
    PGPCA_denoising(ima_patchs, func_thresholding);
</pre><h2>Uniform reprojection step<a name="5"></a></h2><pre class="codeinput">ima_fil_PGPCA = reprojection_UWA(ima_patchs_fil);
global_time=toc(global_time);
</pre><h2>Display<a name="6"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100  800 800])
plotimage(ima_fil_PGPCA);
title(sprintf(<span class="string">'PGPCA: \n  PSNR %.2f'</span>, psnr(ima, ima_fil_PGPCA)));
sprintf(<span class="string">'PGPCA:\n PSNR: %.2f dB \n Computing Time: %.2f s.'</span>,<span class="keyword">...</span>
    psnr(ima, ima_fil_PGPCA),global_time)
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,12);
</pre><pre class="codeoutput">
ans =

PGPCA:
 PSNR: 33.63 dB 
 Computing Time: 7.84 s.

</pre><img vspace="5" hspace="5" src="DEMO_GPPCA_online_02.png"> <h2>LOCAL VERSION: PLPCA.m<a name="7"></a></h2><pre class="codeinput">[hP factor_thr hW] = PLPCA_best_params(sigma);
threshold = factor_thr * sigma;
<span class="comment">% Shift/Redudancy  parameter for the searching zone.</span>
delta = hW; <span class="comment">%&lt; 2*hW+hP;</span>
func_thresholding = @(ima_ppca) <span class="keyword">...</span>
    hardthresholding(ima_ppca, threshold, sigma);
local_time=tic;
</pre><h2>Patchization step<a name="8"></a></h2><pre class="codeinput">ima_patchs = spatial_patchization(ima_nse, hP);
</pre><h2>Local PCA denoising step<a name="9"></a></h2><pre class="codeinput">ima_patchs_fil = PLPCA_denoising(ima_patchs, func_thresholding, <span class="keyword">...</span>
                                 hW, delta);
</pre><h2>Uniform reprojection step<a name="10"></a></h2><pre class="codeinput">ima_fil_PLPCA = reprojection_UWA(ima_patchs_fil);
local_time=toc(local_time);
</pre><h2>Display<a name="11"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100  800 800])
plotimage(ima_fil_PLPCA);
title(sprintf(<span class="string">'PLPCA: \n  PSNR %.2f'</span>, psnr(ima, ima_fil_PLPCA)));
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,12);
sprintf(<span class="string">'PLPCA:\n PSNR: %.2f dB \n Computing Time: %.2f s.'</span>, <span class="keyword">...</span>
    psnr(ima, ima_fil_PLPCA),local_time)
</pre><pre class="codeoutput">
ans =

PLPCA:
 PSNR: 34.77 dB 
 Computing Time: 15.06 s.

</pre><img vspace="5" hspace="5" src="DEMO_GPPCA_online_03.png"> <h2>HIERARCHICAL VERSION:PHPCA.m<a name="12"></a></h2><pre class="codeinput">[hP factor_thr depth nb_axis_kept] = PHPCA_best_params(sigma);
threshold = factor_thr * sigma;
func_thresholding = @(ima_ppca) <span class="keyword">...</span>
    hardthresholding(ima_ppca, threshold, sigma);
hierarchical_time=tic;
</pre><h2>Patchization step<a name="13"></a></h2><pre class="codeinput">ima_patchs = spatial_patchization(ima_nse, hP);
</pre><h2>Hierarchical PCA denoising step<a name="14"></a></h2><pre class="codeinput">[ima_patchs_fil ima_ppca_fil tree] = <span class="keyword">...</span>
    PHPCA_denoising(ima_patchs, func_thresholding, <span class="keyword">...</span>
                    depth, nb_axis_kept);
</pre><h2>Uniform reprojection step<a name="15"></a></h2><pre class="codeinput">ima_fil_PHPCA = reprojection_UWA(ima_patchs_fil);
hierarchical_time=toc(hierarchical_time);
</pre><h2>Display<a name="16"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100  800 800])
plotimage(ima_fil_PHPCA);
title(sprintf(<span class="string">'PHPCA: \n  PSNR %.2f'</span>, psnr(ima, ima_fil_PHPCA)));
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,12);
sprintf(<span class="string">'PHPCA:\n PSNR: %.2f dB \n Computing Time: %.2f s.'</span>, <span class="keyword">...</span>
    psnr(ima, ima_fil_PHPCA),hierarchical_time)
</pre><pre class="codeoutput">
ans =

PHPCA:
 PSNR: 34.55 dB 
 Computing Time: 12.25 s.

</pre><img vspace="5" hspace="5" src="DEMO_GPPCA_online_04.png"> <p class="footer"><br>
      Copyright &reg; 2011 <br></p>
</div>
<!--
##### SOURCE BEGIN #####
%% Simple example on Barbara
%
% We present here the three variations of Gaussian Patch-PCA (GP-PCA) algorithms:
% 
%
% The first one is the global approach (using PGPCA.m) meaning all the 
% patches in the images are used to compute a global PCA, followed by 
% a hard-thresholding of the coefficients.
% The second one is the local approach (using PLPCA.m) meaning that
% we use a sliding window on which the PCA is performed, before 
% hard- thresholding coefficients.
% The third one is the hierarchical or tree based approach (using PHPCA.m).
% We keep axis at some iteration and then look for axis on the complement
% of the space the span of the axis already found.
%
%
%
%
%
% Authors: \( \textbf{C-A. Deledalle} \), \(\textbf{J. Salmon} \)
% and \(\textbf{A. S. Dalalyan} \)
%
% Copyright (C) 2011 GP-PCA project
% See The GNU Public License (GPL)


%% Initialization
%
%
clear all
close all

sigma=10;
randn('seed', 2);
ima = double(imread('data/barbara.png'));
ima_nse = ima + sigma * randn(size(ima));

figure('Position',[100 100  800 800]);
plotimage(ima_nse);
title(sprintf('Noisy: \n  PSNR %.2f', psnr(ima, ima_nse)));
set(get(gca,'Title'),'FontSize',12);

%% GLOBAL VERSION: PGPCA.m
%
[hP factor_thr] = PGPCA_best_params(sigma);
threshold = factor_thr * sigma;
func_thresholding = @(ima_ppca) ...
    hardthresholding(ima_ppca, threshold, sigma);
global_time=tic;
%% Patchization step 
ima_patchs = spatial_patchization(ima_nse, hP);

%% Global PCA denoising step
[ima_patchs_fil ima_ppca_fil] = ...
    PGPCA_denoising(ima_patchs, func_thresholding);
%% Uniform reprojection step
ima_fil_PGPCA = reprojection_UWA(ima_patchs_fil);
global_time=toc(global_time);

%% Display
figure('Position',[100 100  800 800])
plotimage(ima_fil_PGPCA);
title(sprintf('PGPCA: \n  PSNR %.2f', psnr(ima, ima_fil_PGPCA)));
sprintf('PGPCA:\n PSNR: %.2f dB \n Computing Time: %.2f s.',...
    psnr(ima, ima_fil_PGPCA),global_time)
set(get(gca,'Title'),'FontSize',12);



%% LOCAL VERSION: PLPCA.m
[hP factor_thr hW] = PLPCA_best_params(sigma);
threshold = factor_thr * sigma;
% Shift/Redudancy  parameter for the searching zone.
delta = hW; %< 2*hW+hP;
func_thresholding = @(ima_ppca) ...
    hardthresholding(ima_ppca, threshold, sigma);
local_time=tic;
%% Patchization step 
ima_patchs = spatial_patchization(ima_nse, hP);
%% Local PCA denoising step
ima_patchs_fil = PLPCA_denoising(ima_patchs, func_thresholding, ...
                                 hW, delta);
%% Uniform reprojection step
ima_fil_PLPCA = reprojection_UWA(ima_patchs_fil);
local_time=toc(local_time);
%% Display
figure('Position',[100 100  800 800])
plotimage(ima_fil_PLPCA);
title(sprintf('PLPCA: \n  PSNR %.2f', psnr(ima, ima_fil_PLPCA)));
set(get(gca,'Title'),'FontSize',12);
sprintf('PLPCA:\n PSNR: %.2f dB \n Computing Time: %.2f s.', ...
    psnr(ima, ima_fil_PLPCA),local_time)


%% HIERARCHICAL VERSION:PHPCA.m
%
[hP factor_thr depth nb_axis_kept] = PHPCA_best_params(sigma);
threshold = factor_thr * sigma;
func_thresholding = @(ima_ppca) ...
    hardthresholding(ima_ppca, threshold, sigma);
hierarchical_time=tic;
%% Patchization step 
ima_patchs = spatial_patchization(ima_nse, hP);
%% Hierarchical PCA denoising step
[ima_patchs_fil ima_ppca_fil tree] = ...
    PHPCA_denoising(ima_patchs, func_thresholding, ...
                    depth, nb_axis_kept);
%% Uniform reprojection step
ima_fil_PHPCA = reprojection_UWA(ima_patchs_fil);
hierarchical_time=toc(hierarchical_time);

%% Display
figure('Position',[100 100  800 800])
plotimage(ima_fil_PHPCA);
title(sprintf('PHPCA: \n  PSNR %.2f', psnr(ima, ima_fil_PHPCA)));
set(get(gca,'Title'),'FontSize',12);
sprintf('PHPCA:\n PSNR: %.2f dB \n Computing Time: %.2f s.', ...
    psnr(ima, ima_fil_PHPCA),hierarchical_time)

##### SOURCE END #####
-->