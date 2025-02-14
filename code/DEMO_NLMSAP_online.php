
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h1 class="intro"></h1><br><introduction></introduction>
   <h2>Simple example on Cameraman<a name="1"></a></h2>
   <p>We present here the standard version of our NLM-SAP algorithm. The kernel used to compare the shapes is trapezoidal. See also
      README.TXT in the associate zip file for more details.
   </p>
   <p>First demo (DEMO_NLMSAP.m): We use 4 directionnal quarter pies and an isotropic one, all of them with 3 scales (15 shapes
      in total). We illustrate the benefits of combining the estimates based on different shapes rather than using only a single
      one.
   </p>
   <p>Second demo (DEMO_NLMSAP_FAST.m): We use 3 isotropic Gaussian shapes. We illustrate the benefits of combining the estimates based
      on different sizes rather than using only a single one.
   </p>
   <p>See DEMO_NLMSAP.m, DEMO_NLMSAP_FAST.m, DEMO_NLMSAP_GAUSS_8DIRECTIONS.m</p><pre class="codeinput">close <span class="string">all</span>
clear <span class="string">all</span>
addpath(<span class="string">'tools'</span>);
addpath(<span class="string">'functions'</span>);
</pre><h2>STANDARD version of the NLM-SAP<a name="2"></a></h2>
   <h2>Parameters initialization<a name="3"></a></h2><pre class="codeinput">sig             = 20;            <span class="comment">% standard-deviation of the noise</span>
hW              = 5;             <span class="comment">% half-size of the search window</span>
alpha           = 0.7;           <span class="comment">% h^2=alpha^2*sigma^2/2 for 7x7 patches</span>
                                 <span class="comment">% h^2 is adapted for other shapes in</span>
                                 <span class="comment">% proportion of the 0.99-quantile.</span>
temperature     = 0.4*sig.^2;    <span class="comment">% Temperature for EWA</span>
</pre><h2>Build the true and noisy images<a name="4"></a></h2><pre class="codeinput">img     = double(imread(<span class="string">'cameraman.png'</span>));
[M,N]   = size(img);
</pre><h2>Initialize the random seed<a name="5"></a></h2><pre class="codeinput">randn(<span class="string">'seed'</span>, 2);
img_nse = img + sig * randn(size(img));
</pre><h2>Build the shapes<a name="6"></a></h2><pre class="codeinput">L = 2;           <span class="comment">% number of size levels</span>
R = 4;           <span class="comment">% radius of the first level (evolution as R*sqrt(2)^(n-1)</span>
A = 0;           <span class="comment">% number of angle partitions (precisely 2^A)</span>
shapes = cat(3, <span class="keyword">...</span>
             build_pie(M,N,L,R/2,A), <span class="keyword">...</span>
             build_pie(M,N,L,R/sqrt(2),A), <span class="keyword">...</span>
             build_pie(M,N,L,R,A));
</pre><h2>Display the shapes<a name="7"></a></h2><pre class="codeinput">figure
plot_shapes(shapes);
</pre><img vspace="5" hspace="5" src="DEMO_NLMSAP_online_01.png"> <h2>Compute the NL-Shapes estimations<a name="8"></a></h2><pre class="codeinput">tic
[nlsum, sumphi, sumphi2, deriv] = <span class="keyword">...</span>
    NLMSAP_trapezoid(img_nse, hW, shapes, alpha, sig);
nbshapes = size(nlsum, 3);
</pre><pre class="codeoutput">Apply NLM-SAP (Trapezoidal kernel) -- shape #1
Apply NLM-SAP (Trapezoidal kernel) -- shape #2
Apply NLM-SAP (Trapezoidal kernel) -- shape #3
Apply NLM-SAP (Trapezoidal kernel) -- shape #4
Apply NLM-SAP (Trapezoidal kernel) -- shape #5
Apply NLM-SAP (Trapezoidal kernel) -- shape #6
Apply NLM-SAP (Trapezoidal kernel) -- shape #7
Apply NLM-SAP (Trapezoidal kernel) -- shape #8
Apply NLM-SAP (Trapezoidal kernel) -- shape #9
Apply NLM-SAP (Trapezoidal kernel) -- shape #10
Apply NLM-SAP (Trapezoidal kernel) -- shape #11
Apply NLM-SAP (Trapezoidal kernel) -- shape #12
Apply NLM-SAP (Trapezoidal kernel) -- shape #13
Apply NLM-SAP (Trapezoidal kernel) -- shape #14
Apply NLM-SAP (Trapezoidal kernel) -- shape #15
</pre><h2>Compute risks maps<a name="9"></a></h2><pre class="codeinput">riskmat = risk_sure(img_nse, nlsum, deriv, sig);
</pre><h2>Filter risks maps<a name="10"></a></h2><pre class="codeinput">riskemp = (repmat(img_nse, [1 1 nbshapes]) - nlsum).^2;
divmat = riskmat - riskemp;
[divmat_diff riskmat_diff] = riskfilter_yaroslavsky(divmat, riskmat);
</pre><h2>Aggregation step with EWA<a name="11"></a></h2><pre class="codeinput">[img_NLMSAP, beta_NLMSAP] = <span class="keyword">...</span>
    aggregation_EWA(nlsum, divmat_diff, temperature);
</pre><h2>Total time<a name="12"></a></h2><pre class="codeinput">toc
</pre><pre class="codeoutput">Elapsed time is 30.423400 seconds.
</pre><h2>Display result<a name="13"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100  1400 400])

subplot(1,3,1)
plotimage(img_nse);
title(<span class="string">'Noisy'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(1,3,2);
plotimage(nlsum(:,:,2));
title(<span class="string">'Estimate with only one isotropic shape'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(1,3,3);
plotimage(img_NLMSAP);
title(<span class="string">'Combination obtained by NLM-SAP'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
linkaxes
</pre><img vspace="5" hspace="5" src="DEMO_NLMSAP_online_02.png"> <h2>FAST version of the NLM-SAP:<a name="14"></a></h2>
   <h2>Build 3 disk shapes<a name="15"></a></h2><pre class="codeinput">L = 1;           <span class="comment">% number of size levels</span>
R = 4;           <span class="comment">% radius of the first level (evolution as R*sqrt(2)^(n-1)</span>
A = 0;           <span class="comment">% number of angle partitions (precisely 2^A)</span>
shapes = cat(3, <span class="keyword">...</span>
             build_pie(M,N,L,R/2,A), <span class="keyword">...</span>
             build_pie(M,N,L,R/sqrt(2),A), <span class="keyword">...</span>
             build_pie(M,N,L,R,A));
</pre><h2>Display the shapes<a name="16"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[400 400  1500 500])
plot_shapes(shapes);
</pre><img vspace="5" hspace="5" src="DEMO_NLMSAP_online_03.png"> <h2>Compute the 3 NL-Shapes estimations<a name="17"></a></h2><pre class="codeinput">tic
[nlsum, sumphi, sumphi2, deriv] = <span class="keyword">...</span>
    NLMSAP_trapezoid(img_nse, hW, shapes, alpha, sig);
nbshapes = size(nlsum, 3);
</pre><pre class="codeoutput">Apply NLM-SAP (Trapezoidal kernel) -- shape #1
Apply NLM-SAP (Trapezoidal kernel) -- shape #2
Apply NLM-SAP (Trapezoidal kernel) -- shape #3
</pre><h2>Compute risks maps<a name="18"></a></h2><pre class="codeinput">riskmat = risk_var(sumphi, sumphi2);
</pre><h2>Aggregation step with WAV<a name="19"></a></h2><pre class="codeinput">[img_fast_NLMSAP, beta_fast_NLMSAP] = aggregation_WAV(nlsum, riskmat);
</pre><h2>Total time<a name="20"></a></h2><pre class="codeinput">toc
</pre><pre class="codeoutput">Elapsed time is 6.153982 seconds.
</pre><h2>Display result<a name="21"></a></h2><pre class="codeinput">figure(<span class="string">'Position'</span>,[100 100  1400 400])

subplot(1,3,1)
plotimage(img_nse);
title(<span class="string">'Noisy'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(1,3,2);
plotimage(nlsum(:,:,2));
title(<span class="string">'Estimate with only one isotropic shape'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
subplot(1,3,3);
plotimage(img_fast_NLMSAP);
title(<span class="string">'Combination obtained by NLM-SAP'</span>);
set(get(gca,<span class="string">'Title'</span>),<span class="string">'FontSize'</span>,16);
linkaxes
</pre><img vspace="5" hspace="5" src="DEMO_NLMSAP_online_04.png"></p>
</div>
<!--
##### SOURCE BEGIN #####
	 
%% Simple example on Cameraman
%
% We present here the standard version of our NLM-SAP
% algorithm. The kernel used to compare the shapes is
% trapezoidal. See also README.TXT in the associate zip file for
% more details.
%
% First demo (DEMO_NLMSAP.m): We use 4 directionnal quarter pies and
% an isotropic one, all of
% them with 3 scales (15 shapes in total). We illustrate the
% benefits of combining the estimates based on different shapes
% rather than using only a single one.
%
% Second demo (DEMO_NLMSAP_FAST.m): We use 3 isotropic Gaussian shapes.
% We illustrate the benefits
% of combining the estimates based on different sizes rather than
% using only a single one.
%
% See DEMO_NLMSAP.m, DEMO_NLMSAP_FAST.m, DEMO_NLMSAP_GAUSS_8DIRECTIONS.m

close all
clear all
addpath('tools');
addpath('functions');

%% STANDARD version of the NLM-SAP


%% Parameters initialization
sig             = 20;            % standard-deviation of the noise
hW              = 5;             % half-size of the search window
alpha           = 0.7;           % h^2=alpha^2*sigma^2/2 for 7x7 patches
                                 % h^2 is adapted for other shapes in
                                 % proportion of the 0.99-quantile.
temperature     = 0.4*sig.^2;    % Temperature for EWA



%% Build the true and noisy images
img     = double(imread('cameraman.png'));
[M,N]   = size(img);

%% Initialize the random seed
randn('seed', 2);
img_nse = img + sig * randn(size(img));

%% Build the shapes
L = 2;           % number of size levels
R = 4;           % radius of the first level (evolution as R*sqrt(2)^(n-1)
A = 0;           % number of angle partitions (precisely 2^A)
shapes = cat(3, ...
             build_pie(M,N,L,R/2,A), ...
             build_pie(M,N,L,R/sqrt(2),A), ...
             build_pie(M,N,L,R,A));
%% Display the shapes
figure
plot_shapes(shapes);
         


%% Compute the NL-Shapes estimations
tic
[nlsum, sumphi, sumphi2, deriv] = ...
    NLMSAP_trapezoid(img_nse, hW, shapes, alpha, sig);
nbshapes = size(nlsum, 3);

%% Compute risks maps
riskmat = risk_sure(img_nse, nlsum, deriv, sig);

%% Filter risks maps
riskemp = (repmat(img_nse, [1 1 nbshapes]) - nlsum).^2;
divmat = riskmat - riskemp;
[divmat_diff riskmat_diff] = riskfilter_yaroslavsky(divmat, riskmat);

%% Aggregation step with EWA
[img_NLMSAP, beta_NLMSAP] = ...
    aggregation_EWA(nlsum, divmat_diff, temperature);

%%  Total time
toc


%% Display result
figure('Position',[100 100  1400 400])

subplot(1,3,1)
plotimage(img_nse);
title('Noisy');
set(get(gca,'Title'),'FontSize',16);
subplot(1,3,2);
plotimage(nlsum(:,:,2));
title('Estimate with only one isotropic shape');
set(get(gca,'Title'),'FontSize',16);
subplot(1,3,3);
plotimage(img_NLMSAP);
title('Combination obtained by NLM-SAP');
set(get(gca,'Title'),'FontSize',16);
linkaxes




%% FAST version of the NLM-SAP
%


%% Build 3 disk shapes
L = 1;           % number of size levels
R = 4;           % radius of the first level (evolution as R*sqrt(2)^(n-1)
A = 0;           % number of angle partitions (precisely 2^A)
shapes = cat(3, ...
             build_pie(M,N,L,R/2,A), ...
             build_pie(M,N,L,R/sqrt(2),A), ...
             build_pie(M,N,L,R,A));

         
%% Display the shapes
figure('Position',[400 400  1500 500])
plot_shapes(shapes);
         


%% Compute the 3 NL-Shapes estimations
tic
[nlsum, sumphi, sumphi2, deriv] = ...
    NLMSAP_trapezoid(img_nse, hW, shapes, alpha, sig);
nbshapes = size(nlsum, 3);

%% Compute risks maps
riskmat = risk_var(sumphi, sumphi2);

%% Aggregation step with WAV
[img_fast_NLMSAP, beta_fast_NLMSAP] = aggregation_WAV(nlsum, riskmat);

%%  Total time
toc

%% Display result
figure('Position',[100 100  1400 400])

subplot(1,3,1)
plotimage(img_nse);
title('Noisy');
set(get(gca,'Title'),'FontSize',16);
subplot(1,3,2);
plotimage(nlsum(:,:,2));
title('Estimate with only one isotropic shape');
set(get(gca,'Title'),'FontSize',16);
subplot(1,3,3);
plotimage(img_fast_NLMSAP);
title('Combination obtained by NLM-SAP');
set(get(gca,'Title'),'FontSize',16);
linkaxes



##### SOURCE END #####
-->
