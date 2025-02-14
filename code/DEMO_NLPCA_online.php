
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h2>Simple example on Saturn<a name="1"></a></h2>
   <p>We present here the NL-PCA algorithm to denoise Poisson corrupted images. Two versions are proposed. The default one is the
      one dealing directly with the Poisson structure (anscombe=0). The second one is the one performing a variance stabilization
      step / Anscombe transform (anscombe=1).
   </p>
    <i>Article: "Poisson noise reduction with non-local PCA"</i> <br/>
 <p>Authors: J. Salmon, <?php echo '<a href="'.$deledalle_charlesalban[2].'"> C.-A. ' .$deledalle_charlesalban[0]. '</a>' ;?>, 
<?php echo '<a href="'.$willett_rebecca[2].'"> R. ' .$willett_rebecca[0]. '</a>' ;?>,<?php echo '<a href="'.$harmany_zachary[2].'"> Z. ' .$harmany_zachary[0]. '</a>' ;?>, ICASSP 2012, <a href="../papers/ICASSP12_SDWH.pdf">PDF</a>. <br/>                       


Matlab toolbox for 2D images <a href="demos/NLPCA_code.zip">NLPCA_code.ZIP</a> (fast v2:
<a href="demos/NLPCA_v2_code.zip">NLPCA_v2_code.ZIP</a> thanks to Anthony Wang and Albert Oh).
Matlab toolbox for hyperspectral images <a href="demos/NLPCA_hyperspectral_code.zip">NLPCA_hyperspectral_code.ZIP</a> (fast v2:
<a href="demos/NLPCA_hyperspectral_v2_code.zip">NLPCA_hyperspectral_v2_code.ZIP</a>
thanks to Anthony Wang and Albert Oh).

<br>
Copyright (C) 2012 NL-PCA project.  See The GNU Public License (GPL)</p>
</pre><h2>Initialization<a name="2"></a></h2><pre class="codeinput">clear <span class="string">all</span>
close <span class="string">all</span>

addpath(<span class="string">'functions'</span>)
addpath(<span class="string">'tools'</span>)
addpath(<span class="string">'Anscombe'</span>)

</pre><h2>Parameters<a name="3"></a></h2><pre class="codeinput">Patch_width=20;         <span class="comment">% Patch width</span>
nb_axis=4;              <span class="comment">% Number of axis in the "PCA"</span>
nb_iterations=20;       <span class="comment">% Max number of iteration</span>
nb_clusters=14;         <span class="comment">% Number of clusters in the kmeans step</span>
eps_stop=1e-1;          <span class="comment">% Stoping criterion</span>
epsilon_cond=1e-3;      <span class="comment">% Condition number for Hessian inversion</span>
double_iteration=1;     <span class="comment">%0/1 to activate a double iteration of the algorithm</span>
anscombe=0;             <span class="comment">% Direct Poisson (0) and  Anscombe + Gaussian (1)</span>
</pre><h2>Loading 'Saturn' image<a name="4"></a></h2><pre class="codeinput">ima_ori=double(imread(<span class="string">'./data/saturn.tif'</span>));
ima_ori= ima_ori((1:256)+70,(1:256));
</pre><h2>Noisy image generation<a name="5"></a></h2><pre class="codeinput">peak=0.1;
sd=1;
rng(sd)
Q = max(max(ima_ori)) /peak;
ima_lambda = ima_ori / Q;
ima_lambda(ima_lambda == 0) = min(min(ima_lambda(ima_lambda &gt; 0)));
ima_nse_poiss = knuth_poissrnd(ima_lambda);
[m,n]=size(ima_nse_poiss);

func_clustering=@(X) clustering_litekmeans(X,Patch_width,nb_clusters,m,n);
func_thresholding = @(ima_ppca) no_thresholding(ima_ppca);
</pre><h2>Denoising part<a name="6"></a></h2><pre class="codeinput">tic
<span class="keyword">if</span> anscombe==1
    eps_stop=1e-3;
    epsilon_cond=1e-5;
    func_denoising_patches=@(X)<span class="keyword">...</span>
        gaussian_NL_PCA(X{1},nb_axis,nb_iterations,<span class="keyword">...</span>
        X{2},X{3},eps_stop,epsilon_cond);
    func_recontruction=@(X) reconstruction_gaussian(X);
    ima_nse_poiss_anscombe = 2*sqrt(ima_nse_poiss + 3/8);
    [ima_fil,ima_int,~,~]=NL_PCA(ima_nse_poiss_anscombe,<span class="keyword">...</span>
        Patch_width,nb_axis,nb_clusters,func_thresholding,<span class="keyword">...</span>
        func_recontruction,func_denoising_patches,func_clustering,<span class="keyword">...</span>
        double_iteration);

    ima_fil = Anscombe_inverse_exact_unbiased_Foi(ima_fil);
    ima_int = Anscombe_inverse_exact_unbiased_Foi(ima_int);
<span class="keyword">else</span>
    func_recontruction=@(X) reconstruction_poisson(X);
    func_denoising_patches=@(X)<span class="keyword">...</span>
         poisson_NL_PCA(X{1},nb_axis,nb_iterations,X{2},X{3},<span class="keyword">...</span>
         eps_stop,epsilon_cond);

    [ima_fil,ima_int,~,~]=NL_PCA(ima_nse_poiss,<span class="keyword">...</span>
        Patch_width,nb_axis,nb_clusters,func_thresholding,<span class="keyword">...</span>
        func_recontruction,func_denoising_patches,func_clustering,<span class="keyword">...</span>
        double_iteration);
<span class="keyword">end</span>
toc
</pre><pre class="codeoutput">Elapsed time is 165.459557 seconds.
</pre><h2>Result display<a name="7"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100   1200 600])
ax(1) = subplot(1, 3, 1);
plotimage(Q * ima_nse_poiss);
title(sprintf(<span class="string">'Noisy PSNR = %f'</span>,psnr(Q*ima_nse_poiss, Q*ima_lambda, 255)));
ax(2) = subplot(1, 3, 2);
plotimage(Q * ima_int);
title(sprintf(<span class="string">'First iteration = %f'</span>,psnr(Q*ima_int, Q*ima_lambda, 255)));
ax(3) = subplot(1, 3, 3);
plotimage(Q * ima_fil);
title(sprintf(<span class="string">'Second iteration = %f'</span>,psnr(Q*ima_fil, Q*ima_lambda, 255)));
linkaxes(ax);
</pre><img vspace="5" hspace="5" src="DEMO_NLPCA_online_01.png"> <p class="footer"><br>
      Copyright &reg; 2012 <br></p>
</div>
<!--
##### SOURCE BEGIN #####
%% Simple example on Saturn
%
% We present here the NL-PCA algorithm to denoise Poisson corrupted
% images.
% Two versions are proposed. The default one is the one dealing directly
% with the Poisson structure (anscombe=0). The second one is the one
% performing a variance stabilization step/ Anscombe transform 
% (anscombe=0).
% 
% Authors: \(\textbf{J. Salmon} \), \( \textbf{C-A. Deledalle} \),
% \(\textbf{R. Willett} \) and  \(\textbf{Z.  Harmany} \)

%   Copyright (C) 2012 NL-PCA project.  See The GNU Public License (GPL)


%% Initialization
clear all
close all

addpath('functions')
addpath('tools')
addpath('Anscombe')

tic
%% Parameters:numbers
Patch_width=20;         % Patch width 
nb_axis=4;              % Number of axis in the "PCA" 
nb_iterations=20;       % Max number of iteration 
nb_clusters=14;         % Number of clusters in the kmeans step
eps_stop=1e-1;          % Stoping criterion
epsilon_cond=1e-3;      % Condition number for Hessian inversion
double_iteration=1;     %0/1 to activate a double iteration of the algorithm
anscombe=0;             % Direct Poisson (0) and  Anscombe + Gaussian (1)

%% Loading 'Saturn' image 
ima_ori=double(imread('../images/saturn.tif'));
ima_ori= ima_ori((1:256)+70,(1:256));

%% Noisy image generation 
peak=0.1;
sd=1;
rng(sd)
Q = max(max(ima_ori)) /peak;
ima_lambda = ima_ori / Q;
ima_lambda(ima_lambda == 0) = min(min(ima_lambda(ima_lambda > 0)));
ima_nse_poiss = knuth_poissrnd(ima_lambda);
[m,n]=size(ima_nse_poiss);

func_clustering=@(X) clustering_litekmeans(X,Patch_width,nb_clusters,m,n);
func_thresholding = @(ima_ppca) no_thresholding(ima_ppca);

%% Denoising part
tic
if anscombe==1   
    eps_stop=1e-3;
    epsilon_cond=1e-5;
    func_denoising_patches=@(X)...
        gaussian_NL_PCA(X{1},nb_axis,nb_iterations,...
        X{2},X{3},eps_stop,epsilon_cond);    
    func_recontruction=@(X) reconstruction_gaussian(X);    
    ima_nse_poiss_anscombe = 2*sqrt(ima_nse_poiss + 3/8);
    [ima_fil,ima_int,~,~]=NL_PCA(ima_nse_poiss_anscombe,...
        Patch_width,nb_axis,nb_clusters,func_thresholding,...
        func_recontruction,func_denoising_patches,func_clustering,...
        double_iteration);
    
    ima_fil = Anscombe_inverse_exact_unbiased_Foi(ima_fil);
    ima_int = Anscombe_inverse_exact_unbiased_Foi(ima_int);    
else    
    func_recontruction=@(X) reconstruction_poisson(X);
    func_denoising_patches=@(X)...
         poisson_NL_PCA(X{1},nb_axis,nb_iterations,X{2},X{3},...
         eps_stop,epsilon_cond);
    
    [ima_fil,ima_int,~,~]=NL_PCA(ima_nse_poiss,...
        Patch_width,nb_axis,nb_clusters,func_thresholding,...
        func_recontruction,func_denoising_patches,func_clustering,...
        double_iteration);          
end
toc

%% Result display
figure('Position',[100 100   1200 600])
ax(1) = subplot(1, 3, 1);
plotimage(Q * ima_nse_poiss);
title(sprintf('Noisy PSNR = %f',psnr(Q*ima_nse_poiss, Q*ima_lambda, 255)));
ax(2) = subplot(1, 3, 2);
plotimage(Q * ima_int);
title(sprintf('First iteration = %f',psnr(Q*ima_int, Q*ima_lambda, 255)));
ax(3) = subplot(1, 3, 3);
plotimage(Q * ima_fil);
title(sprintf('Second iteration = %f',psnr(Q*ima_fil, Q*ima_lambda, 255)));
linkaxes(ax);


##### SOURCE END #####
-->
