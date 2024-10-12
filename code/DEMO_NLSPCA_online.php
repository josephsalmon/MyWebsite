<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h2>Simple example on Ridge<a name="1"></a></h2>
   <p>We present here the NLSPCA algorithm to denoise Poisson corrupted images.
   </p>
    <i>Article: "Poisson noise reduction with non-local PCA"</i> <br/>
 <p>Authors: J. Salmon,
<?php echo '<a href="'.$harmany_zachary[2].'"> Z. ' .$harmany_zachary[0]. '</a>' ;?>,
<?php echo '<a href="'.$deledalle_charlesalban[2].'"> C.-A. ' .$deledalle_charlesalban[0]. '</a>' ;?>,
<?php echo '<a href="'.$willett_rebecca[2].'"> R. ' .$willett_rebecca[0]. '</a>' ;?>.
<a href="../papers/JMIV_SHDW12.pdf">PDF</a>
<br/>
Corresponding  Matlab toolbox :
<br>-2D images <a href="demos/NLSPCA_code.zip">NLSPCA_code.ZIP</a>
<br>-hyperspectral images <a href="demos/NLPCA_hyperspectral_code.zip">NLPCA_hyperspectral_code.ZIP</a> (fast v2:
<a href="demos/NLPCA_hyperspectral_fast_code.zip">NLPCA_hyperspectral_fast_code.ZIP</a>
thanks to Anthony Wang and Albert Oh).
<br>


Copyright (C) 2012 NL-PCA project.  See The GNU Public License (GPL)</p>
</pre><h2>Initialization<a name="2"></a></h2><pre class="codeinput">clear <span class="string">all</span>
close <span class="string">all</span>

addpath(<span class="string">'functions'</span>)
addpath(<span class="string">'tools'</span>)

</pre><h2>Loading 'Ridge' image<a name="2"></a></h2>
<pre class="codeinput">ima_ori=double(imread(<span class="string">'./data/Ridges.png'</span>));
</pre><h2>Noisy image generation<a name="3"></a></h2><pre class="codeinput">peak=0.1;
sd=2;
rng(sd)
Q = max(max(ima_ori)) /peak;
ima_lambda = ima_ori / Q;
ima_lambda(ima_lambda == 0) = min(min(ima_lambda(ima_lambda &gt; 0)));
ima_nse_poiss = knuth_poissrnd(ima_lambda);
[m,n]=size(ima_nse_poiss);
</pre><h2>Parameters:numbers<a name="4"></a></h2><pre class="codeinput">param.Patch_width=20;
param.nb_axis=4;
param.nb_clusters=14;
param.bandwith_smooth=2;
param.sub_factor=2;
param.big_cluster1=1;<span class="comment">% special case for the biggest cluster 1st pass</span>
param.big_cluster2=1;<span class="comment">% special case for the biggest cluster 2nd pass</span>
param.double_iteration=0;<span class="comment">%1 or 2 pass of the whole algorithm</span>
param.eps_stop=5e-3; <span class="comment">%loop stoping criterion</span>
param.epsilon_cond=1e-4;
param.nb_iterations=15;<span class="comment">%number of iteration (Gordon)</span>
param.cste=70;
param.func_tau=@(X) lasso_tau(X{1},X{2},param.cste);
param.bin=1; <span class="comment">% subsampling factor, 0 is without it</span>
</pre><h2>Denoising with NLSPCA<a name="5"></a></h2><pre class="codeinput">tic
ima_fil=NLSPCA(ima_nse_poiss,ima_nse_poiss,param);
toc
</pre><pre class="codeoutput">Elapsed time is 75.562460 seconds.
</pre><h2>Result display<a name="6"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100   1200 600])
ax(1) = subplot(1, 3, 1);
plotimage(Q * ima_nse_poiss);
title(sprintf(<span class="string">'Noisy PSNR = %f'</span>,psnr(Q*ima_nse_poiss, Q*ima_lambda, 255)));
ax(2) = subplot(1, 3, 2);
plotimage(Q * ima_lambda);
title(<span class="string">'Original'</span>);
ax(3) = subplot(1, 3, 3);
plotimage(Q * ima_fil);
title(sprintf(<span class="string">'NLSPCA, PSNR = %f'</span>,psnr(Q*ima_fil, Q*ima_lambda, 255)));
linkaxes(ax);
</pre><img vspace="5" hspace="5" src="DEMO_NLSPCA_online_01.png"> <p class="footer"><br>
      Copyright &reg; 2011 <br></p>
</div>
<!--
##### SOURCE BEGIN #####
%% Simple example on Saturn
%
% We present here the NLSPCA algorithm to denoise Poisson corrupted
% images.
%
% Authors: \(\textbf{J. Salmon} \), \(\textbf{Z.  Harmany} \),
% \( \textbf{C-A. Deledalle} \) and \(\textbf{R. Willett} \)
% Copyright (C) 2012 NLSPCA project.
% See The GNU Public License (GPL)


%% Initialization
clear all
close all

addpath('functions')
addpath('tools')

%% Loading 'Saturn' image
% ima_ori=double(imread('./data/saturn.tif'));
% ima_ori= ima_ori((1:256)+70,(1:256));
% Loading 'Saturn' image
ima_ori=double(imread('./data/Ridges.png'));
%% Noisy image generation
peak=0.1;
sd=2;
rng(sd)
Q = max(max(ima_ori)) /peak;
ima_lambda = ima_ori / Q;
ima_lambda(ima_lambda == 0) = min(min(ima_lambda(ima_lambda > 0)));
ima_nse_poiss = knuth_poissrnd(ima_lambda);
[m,n]=size(ima_nse_poiss);
%% Parameters:numbers

param.Patch_width=20;
param.nb_axis=4;
param.nb_clusters=14;
param.bandwith_smooth=2;
param.sub_factor=2;
param.big_cluster1=1;% special case for the biggest cluster 1st pass
param.big_cluster2=1;% special case for the biggest cluster 2nd pass
param.double_iteration=0;%1 or 2 pass of the whole algorithm
param.eps_stop=5e-3; %loop stoping criterion
param.epsilon_cond=1e-4;
param.nb_iterations=15;%number of iteration (Gordon)
param.cste=70;
param.func_tau=@(X) lasso_tau(X{1},X{2},param.cste);
param.bin=1; % subsampling factor, 0 is without it

%% Denoising with NLSPCA

tic
ima_fil=NLSPCA(ima_nse_poiss,ima_nse_poiss,param);
toc




%% Result display
figure('Position',[100 100   1200 600])
ax(1) = subplot(1, 3, 1);
plotimage(Q * ima_nse_poiss);
title(sprintf('Noisy PSNR = %f',psnr(Q*ima_nse_poiss, Q*ima_lambda, 255)));
ax(2) = subplot(1, 3, 2);
plotimage(Q * ima_lambda);
title('Original');
ax(3) = subplot(1, 3, 3);
plotimage(Q * ima_fil);
title(sprintf('NLSPCA, PSNR = %f',psnr(Q*ima_fil, Q*ima_lambda, 255)));
linkaxes(ax);


##### SOURCE END #####
-->
