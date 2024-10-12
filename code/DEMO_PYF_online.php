
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h2>Simple example on Swoosh<a name="1"></a></h2>
   <p>We present here the following neighboor filters</p>
   <p>-LF: Linear filter 
<br>-YF: the Yaroslavky Filter 
<br>-NLM: Non Local Means 
<br>-Wavelet_cycle_denoising: wavelet thresholding (WARNING:rwt
      package required) 
<br>-curveletdenoise: cuvelet denoising (WARNING:curvelet toolbox required) 
<br>-YF_WaveletCycle_fast_precompute:
      Wavelet + YF (WARNING:rwt package required) 
<br>-YF_WaveletCycle_fast_precompute: Curvelet + YF (WARNING:curvelet toolbox required)      
<br>-YF_LF_fast_precompute: LF+YF
   </p><pre class="codeinput"><span class="comment">% Rem: The kernel used is everywhere the box kernel.</span>
<span class="comment">% See also README.TXT in the associate zip file for</span>
<span class="comment">% more details.</span>
<span class="comment">%</span>
<span class="comment">% See DEMO_PYF.m</span>
</pre><h2>Initialization<a name="2"></a></h2><pre class="codeinput">close <span class="string">all</span>
clear <span class="string">all</span>

<span class="comment">% To be downloaded at: www.dsp.rice.edu/software/rice-wavelet-toolbox</span>
addpath(<span class="string">'rwt'</span>)
<span class="comment">% the functions needed are: daubcqf.m, mrdwt.m, mirdwt.m, HardTh.m,</span>
<span class="comment">% SoftTh.m</span>

<span class="comment">% To be downloaded at: www.curvelet.org</span>
addpath(<span class="string">'CurveletDenoise'</span>)
<span class="comment">% the functions needed are: curveletdenoise.m, fdct_wrapping.m,</span>
<span class="comment">% fdct_wrapping_window.m, ifdct_wrapping.m</span>
addpath(<span class="string">'tools'</span>);
addpath(<span class="string">'functions'</span>);
</pre><h2>Build the true and noisy images<a name="3"></a></h2><pre class="codeinput">sigma=50;
ima = mean(double(imread(<span class="string">'data/swoosh.png'</span>)),3);
ima_nse = ima + sigma * randn(size(ima));
</pre><h2>Parameters initialization<a name="4"></a></h2><pre class="codeinput">param.search_width=21;<span class="comment">% half width of the moving average</span>
param.patch_width=7; <span class="comment">%patch width</span>
param.h_Yaro=sqrt(10*(sigma)^2);<span class="comment">%</span>
param.h_NLM=3.5*param.patch_width*param.patch_width*sigma^2;
param.threshold_Wavelet=3.5*sigma;
param.threshold_WaveletCycle=3.5*sigma;
param.threshold_Curvelet=4.5*(sigma/255)^2;
param.h_NLMM=sqrt(0.4*sigma^2);
param.h_YF_Wavelet=sqrt(0.4*sigma^2);
param.h_YF_Curvelet=sqrt(0.4*sigma^2);
</pre><h2>Compute the different filters<a name="5"></a></h2><pre class="codeinput">ima_fil_LF=LF(ima_nse,param.patch_width);
ima_fil_YF=YF_yann(ima_nse,ima_nse,floor(param.search_width/2),param.h_Yaro);
ima_fil_Wav=Wavelet_cycle_denoising(ima_nse,param.threshold_WaveletCycle,0);
ima_fil_Curvelet=255*curveletdenoise(ima_nse/255,param.threshold_Curvelet,0,1);
ima_fil_NLM=NLM(ima_nse,floor(param.patch_width/2),floor(param.search_width/2),<span class="keyword">...</span>
    param.h_NLM/(param.patch_width^2),2);
[ima_fil_YF_WaveletCycle,ima_fil_WaveletCycle]=YF_WaveletCycle_fast_precompute(<span class="keyword">...</span>
    ima_nse,param.h_YF_Wavelet,param.search_width,param.threshold_WaveletCycle,0);
[ima_fil_YF_Curvelet,ima_fil_Curvelet] = YF_Curvelet_fast_precompute(ima_nse,<span class="keyword">...</span>
    param.h_YF_Curvelet,param.search_width,param.threshold_Curvelet,0,1);
ima_fil_NLMM=YF_LF_fast_precompute(ima_nse,param.h_NLMM,param.search_width,<span class="keyword">...</span>
    param.patch_width);
</pre><h2>Display result<a name="6"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100  800 400])

subplot(2,4,1)
plotimage(ima_fil_LF);
title(<span class="string">'Linear'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,4,2);
plotimage(ima_fil_YF);
title(<span class="string">'Yaroslavsky'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,4,3);
plotimage(ima_fil_Wav);
title(<span class="string">'Wavelet '</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,4,4);
plotimage(ima_fil_Curvelet);
title(<span class="string">'Curvelet'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);



subplot(2,4,5)
plotimage(ima_fil_NLM);
title(<span class="string">'NLM '</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,4,6);
plotimage(ima_fil_YF_WaveletCycle);
title(<span class="string">'Wavelet +YF'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,4,7);
plotimage(ima_fil_YF_Curvelet);
title(<span class="string">'Curvelet +YF'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,4,8);
plotimage(ima_fil_NLMM);
title(<span class="string">'LF+YF'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);



linkaxes
</pre><img vspace="5" hspace="5" src="DEMO_PYF_online_01.png"> <p class="footer"><br>
      Copyright &reg; 2011 <br></p>
</div>
<!--
##### SOURCE BEGIN #####
%% Simple example on Swoosh
%
% We present here the following neighboor filters
%  
% -LF: Linear filter 
% -YF: the Yaroslavky Filter 
% -NLM: Non Local Means 
% -Wavelet_cycle_denoising: wavelet thresholding (WARNING:rwt package required)
% -curveletdenoise: cuvelet denoising (WARNING:curvelet toolbox required)
% -YF_WaveletCycle_fast_precompute: Wavelet + YF (WARNING:rwt package required)
% -YF_WaveletCycle_fast_precompute: Curvelet + YF (WARNING:curvelet toolbox required)
% -YF_LF_fast_precompute: LF+YF 


% Rem: The kernel used is everywhere the box kernel. 
% See also README.TXT in the associate zip file for
% more details.
%
% See DEMO_PYF.m



%% Initialization
close all
clear all

% To be downloaded at: www.dsp.rice.edu/software/rice-wavelet-toolbox
addpath('rwt')
% the functions needed are: daubcqf.m, mrdwt.m, mirdwt.m, HardTh.m, 
% SoftTh.m

% To be downloaded at: www.curvelet.org
addpath('CurveletDenoise')
% the functions needed are: curveletdenoise.m, fdct_wrapping.m,
% fdct_wrapping_window.m, ifdct_wrapping.m
addpath('tools');
addpath('functions');

%% Build the true and noisy images
sigma=50;
ima = mean(double(imread('data/swoosh.png')),3);
ima_nse = ima + sigma * randn(size(ima));

%% Parameters initialization
param.search_width=21;% half width of the moving average
param.patch_width=7; %patch width
param.h_Yaro=sqrt(10*(sigma)^2);%
param.h_NLM=3.5*param.patch_width*param.patch_width*sigma^2;       
param.threshold_Wavelet=3.5*sigma;
param.threshold_WaveletCycle=3.5*sigma;
param.threshold_Curvelet=4.5*(sigma/255)^2;
param.h_NLMM=sqrt(0.4*sigma^2);
param.h_YF_Wavelet=sqrt(0.4*sigma^2);    
param.h_YF_Curvelet=sqrt(0.4*sigma^2);

%% Compute the different filters
ima_fil_LF=LF(ima_nse,param.patch_width);
ima_fil_YF=YF_yann(ima_nse,ima_nse,floor(param.search_width/2),param.h_Yaro);
ima_fil_Wav=Wavelet_cycle_denoising(ima_nse,param.threshold_WaveletCycle,0);
ima_fil_Curvelet=255*curveletdenoise(ima_nse/255,param.threshold_Curvelet,0,1);
ima_fil_NLM=NLM(ima_nse,floor(param.patch_width/2),floor(param.search_width/2),...
    param.h_NLM/(param.patch_width^2),2);
[ima_fil_YF_WaveletCycle,ima_fil_WaveletCycle]=YF_WaveletCycle_fast_precompute(...
    ima_nse,param.h_YF_Wavelet,param.search_width,param.threshold_WaveletCycle,0);     
[ima_fil_YF_Curvelet,ima_fil_Curvelet] = YF_Curvelet_fast_precompute(ima_nse,...
    param.h_YF_Curvelet,param.search_width,param.threshold_Curvelet,0,1);
ima_fil_NLMM=YF_LF_fast_precompute(ima_nse,param.h_NLMM,param.search_width,...
    param.patch_width);


%% Display result
figure('Position',[100 100  800 400])

subplot(2,4,1)
plotimage(ima_fil_LF);
title('Linear');
set(get(gca,'Title'),'FontSize',16);
subplot(2,4,2);
plotimage(ima_fil_YF);
title('Yaroslavsky');
set(get(gca,'Title'),'FontSize',16);
subplot(2,4,3);
plotimage(ima_fil_Wav);
title('Wavelet ');
set(get(gca,'Title'),'FontSize',16);
subplot(2,4,4);
plotimage(ima_fil_Curvelet);
title('Curvelet');
set(get(gca,'Title'),'FontSize',16);



subplot(2,4,5)
plotimage(ima_fil_NLM);
title('NLM ');
set(get(gca,'Title'),'FontSize',16);
subplot(2,4,6);
plotimage(ima_fil_YF_WaveletCycle);
title('Wavelet +YF');
set(get(gca,'Title'),'FontSize',16);
subplot(2,4,7);
plotimage(ima_fil_YF_Curvelet);
title('Curvelet +YF');
set(get(gca,'Title'),'FontSize',16);
subplot(2,4,8);
plotimage(ima_fil_NLMM);
title('LF+YF');
set(get(gca,'Title'),'FontSize',16);



linkaxes

##### SOURCE END #####
-->
