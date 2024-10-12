
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h1 class="intro">Simple example on Swoosh</h1><br><introduction>
      <p>We present here the following methods for Local Polynomial Regression (LPR) in the case of
      <br>-Linear Filter (LF)
      <br>-Yaroslavksy's filter (YF)
      <br>-Non-Local Means (NLM)
      <br>-Non-Local Means-Average (NLMA)
      <br>-Membership oracle (MO)
      <p>The kernel used is the box kernel. See also DEMO_NLMLPR.m and README.TXT in the associate zip file for more details.</p>
      
 <p>Authors: \( \textbf{E. Arias-Castro} \), \(\textbf{J. Salmon} \) and \(\textbf{R. Willett} \)</p>
 <p>Copyright (C) 2011 NLM-LPR project See The GNU Public License (GPL)</p>
   </introduction>
   <h2>Initialization<a name="1"></a></h2><pre class="codeinput">close <span class="string">all</span>
clear <span class="string">all</span>
addpath(<span class="string">'tools'</span>);
addpath(<span class="string">'functions'</span>);
</pre><h2>Build the true and noisy images<a name="2"></a></h2><pre class="codeinput">sigma=50;
ima = mean(double(imread(<span class="string">'data/swoosh.png'</span>)),3);
ima_nse = ima + sigma * randn(size(ima));
</pre><h2>Parameters initialization<a name="3"></a></h2><pre class="codeinput">param.patch_width=7;
param.search_width=15;

param.h_NLM=3.5*param.patch_width*param.patch_width*sigma^2;
<span class="comment">%param.h_OYF=900;%</span>
<span class="comment">%param.h_YF=10*(sigma)^2;%</span>
<span class="comment">%param.h_NLMA=4*sigma^2/(param.patch_width)^2;</span>
</pre><h2>Compute the NLM-LPR estimations for \(r=0,1,2\)<a name="4"></a></h2><pre class="codeinput">tic
ima_fil_NLM0=NLM0(ima_nse,param.h_NLM,param.search_width,param.patch_width);
ima_fil_NLM1=NLM1(ima_nse,param.h_NLM,param.search_width,param.patch_width);
ima_fil_NLM2=NLM2(ima_nse,param.h_NLM,param.search_width,param.patch_width);

<span class="comment">% Other methods:</span>
<span class="comment">% LF         :  ima_fil_LF0=LF0(ima_nse,param.search_width);</span>
<span class="comment">% YF         :  ima_fil_YF0=YF1(ima_nse,param.h_YF,param.search_width);</span>
<span class="comment">% NLMA       :  ima_fil_NLMA0=NLM2(ima_nse,param.h_NLMA,param.search_width,param.patch_width);</span>
<span class="comment">% Oracle YF  :  ima_fil_OYF0=OYF2(ima,ima_nse,param.h_OYF,param.search_width);</span>
</pre><h2>Total time<a name="5"></a></h2><pre class="codeinput">toc
</pre><pre class="codeoutput">Elapsed time is 379.851588 seconds.
</pre><h2>Display result<a name="6"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100  700 700])

subplot(2,2,1)
plotimage(ima_nse);
title(<span class="string">'Noisy'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,2,2);
plotimage(ima_fil_NLM0);
title(<span class="string">'Estimate with NLM and r=0'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,2,3);
plotimage(ima_fil_NLM1);
title(<span class="string">'Estimate with NLM and r=1'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(2,2,4);
plotimage(ima_fil_NLM2);
title(<span class="string">'Estimate with NLM and r=2'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);

linkaxes
</pre><img vspace="5" hspace="5" src="DEMO_NLMLPR_online_01.png"> <p class="footer"><br>
      Copyright &reg; 2011 <br></p>
</div>
<!--
##### SOURCE BEGIN #####
%% Simple example on Swoosh
%
% We present here the following methods for Local Polynomial Regression (LPR)
% in the case of 
%  
% -Linear Filter (LF) 
%
% -Yaroslavksy's filter (YF) 
%
% -Non-Local Means (NLM)
%
% -Non-Local Means-Average (NLMA)
%
% -Membership oracle (MO) 
%
%
% The kernel used is the box kernel. 
% See also README.TXT in the associate zip file for
% more details.
%
% See DEMO_NLMLPR.m
%

%% Initialization
close all
clear all
addpath('tools');
addpath('functions');

%% Build the true and noisy images
sigma=50;
ima = mean(double(imread('data/swoosh.png')),3);
ima_nse = ima + sigma * randn(size(ima));

%% Parameters initialization
param.patch_width=7;
param.search_width=15;

param.h_NLM=3.5*param.patch_width*param.patch_width*sigma^2;       
%param.h_OYF=900;% 
%param.h_YF=10*(sigma)^2;%
%param.h_NLMA=4*sigma^2/(param.patch_width)^2;


%% Compute the NLM-LPR estimations for \(r=0,1,2\)
tic
ima_fil_NLM0=NLM0(ima_nse,param.h_NLM,param.search_width,param.patch_width);
ima_fil_NLM1=NLM1(ima_nse,param.h_NLM,param.search_width,param.patch_width);
ima_fil_NLM2=NLM2(ima_nse,param.h_NLM,param.search_width,param.patch_width);

% Other methods:
% LF         :  ima_fil_LF0=LF0(ima_nse,param.search_width); 
% YF         :  ima_fil_YF0=YF1(ima_nse,param.h_YF,param.search_width); 
% NLMA       :  ima_fil_NLMA0=NLM2(ima_nse,param.h_NLMA,param.search_width,param.patch_width); 
% Oracle YF  :  ima_fil_OYF0=OYF2(ima,ima_nse,param.h_OYF,param.search_width); 

%%  Total time
toc

%% Display result
figure('Position',[100 100  700 700])

subplot(2,2,1)
plotimage(ima_nse);
title('Noisy');
set(get(gca,'Title'),'FontSize',16);
subplot(2,2,2);
plotimage(ima_fil_NLM0);
title('Estimate with NLM and r=0');
set(get(gca,'Title'),'FontSize',16);
subplot(2,2,3);
plotimage(ima_fil_NLM1);
title('Estimate with NLM and r=1');
set(get(gca,'Title'),'FontSize',16);
subplot(2,2,4);
plotimage(ima_fil_NLM2);
title('Estimate with NLM and r=2');
set(get(gca,'Title'),'FontSize',16);

linkaxes

##### SOURCE END #####
-->
