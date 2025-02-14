
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h2>Simple example on Cameraman  (cf. DEMO_NLSMSAP_cameraman.m)<a name="1"></a></h2>
   <p>We use 8 directionnal quarter pies. We illustrate the benefits of combining the estimates based on different shapes rather
      than using only a single one.
   </p>
   <p>Authors: \( \textbf{C-A. Deledalle} \), \(\textbf{V. Duval} \) and \(\textbf{J. Salmon} \)</p><pre class="codeinput">close <span class="string">all</span>
clear <span class="string">all</span>
addpath(<span class="string">'tools'</span>);
addpath(<span class="string">'functions'</span>);
</pre><h2>Parameters initialization<a name="2"></a></h2><pre class="codeinput">sig             = 20;
hW              = 5;             <span class="comment">% half-size of the search window</span>
alpha           = 0.7;           <span class="comment">% h^2=alpha^2*sigma^2/2 for 7x7 patches</span>
                                 <span class="comment">% h^2 is adapted for other shapes in</span>
                                 <span class="comment">% proportion of the 0.99-quantile.</span>
temperature     = 0.4*sig.^2;    <span class="comment">% Temperature for EWA</span>
randn(<span class="string">'seed'</span>, 2);                <span class="comment">% Initialize random seed</span>
</pre><h2>Build the true and noisy images<a name="3"></a></h2><pre class="codeinput">img     = double(imread(<span class="string">'cameraman.png'</span>));
[M,N]   = size(img);
img_nse = img + sig * randn(size(img));
</pre><h2>Build 8 directionnal quarter pies<a name="4"></a></h2><pre class="codeinput">L = 1;
R = 8;
A = 2;
shapes = build_pie(M,N,L,R,A);
</pre><h2>Compute the 8 NL-Shapes<a name="5"></a></h2><pre class="codeinput">[nlsum, sumphi, sumphi2, deriv] = NLMSAP_gauss(img_nse, hW, shapes, alpha, sig);
nbtypes = size(nlsum, 3);
</pre><pre class="codeoutput">Apply nlmeans shape #1
Apply nlmeans shape #2
Apply nlmeans shape #3
Apply nlmeans shape #4
Apply nlmeans shape #5
Apply nlmeans shape #6
Apply nlmeans shape #7
Apply nlmeans shape #8
</pre><h2>Compute risks maps<a name="6"></a></h2><pre class="codeinput">riskmat = risk_sure(img_nse, nlsum, deriv, sig);
</pre><h2>Filter  risks maps using Yaroslavsky approach<a name="7"></a></h2><pre class="codeinput">riskemp = (repmat(img_nse, [1 1 nbtypes]) - nlsum).^2;
divmat  = riskmat - riskemp;
[divmat_diff riskmat_diff] = riskfilter_yaroslavsky(divmat, riskmat);
</pre><h2>Aggregation step<a name="8"></a></h2><pre class="codeinput">[result_EWA, beta_EWA] = aggregation_EWA(nlsum, divmat_diff, temperature);
</pre><h2>Display the 8 directions and the aggregated one in the center<a name="9"></a></h2><pre class="codeinput">x=25:125;
y=80:180;
images_8=[nlsum(x,y,8),nlsum(x,y,1),nlsum(x,y,2);<span class="keyword">...</span>
          nlsum(x,y,7),result_EWA(x,y),nlsum(x,y,3);<span class="keyword">...</span>
          nlsum(x,y,6),nlsum(x,y,5),nlsum(x,y,4)];

figure
plotimage(images_8);
figure
plot_shapes(shapes)
</pre><img vspace="5" hspace="5" src="DEMO_NLMSAP_gauss_cameraman_01.png"> <img vspace="5" hspace="5" src="DEMO_NLMSAP_gauss_cameraman_02.png"> <p class="footer"><br>
      Copyright &reg; 2011 <br></p>
</div>
<!--
##### SOURCE BEGIN #####
%% Simple example on Cameraman  (cf. DEMO_NLSMSAP_cameraman.m)
% We use 8 directionnal quarter pies. We illustrate the benefits 
% of combining the estimates based on different shapes rather than using 
% only a single one.
%
% Authors: \( \textbf{C-A. Deledalle} \), \(\textbf{V. Duval} \) and 
% \(\textbf{J. Salmon} \)

close all
clear all
addpath('tools');
addpath('functions');

%% Parameters initialization
sig             = 20;
hW              = 5;             % half-size of the search window
alpha           = 0.7;           % h^2=alpha^2*sigma^2/2 for 7x7 patches
                                 % h^2 is adapted for other shapes in
                                 % proportion of the 0.99-quantile.
temperature     = 0.4*sig.^2;    % Temperature for EWA
randn('seed', 2);                % Initialize random seed
%% Build the true and noisy images
img     = double(imread('cameraman.png'));
[M,N]   = size(img);
img_nse = img + sig * randn(size(img));

%% Build 8 directionnal quarter pies
L = 1;
R = 8;
A = 2;
shapes = build_pie(M,N,L,R,A);

%% Compute the 8 NL-Shapes
[nlsum, sumphi, sumphi2, deriv] = NLMSAP_gauss(img_nse, hW, shapes, alpha, sig);
nbtypes = size(nlsum, 3);

%% Compute risks maps
riskmat = risk_sure(img_nse, nlsum, deriv, sig);

%% Filter  risks maps using Yaroslavsky approach
riskemp = (repmat(img_nse, [1 1 nbtypes]) - nlsum).^2;
divmat  = riskmat - riskemp;
[divmat_diff riskmat_diff] = riskfilter_yaroslavsky(divmat, riskmat);

%% Aggregation step
[result_EWA, beta_EWA] = aggregation_EWA(nlsum, divmat_diff, temperature);

%% Display the 8 directions and the aggregated one in the center
x=25:125;
y=80:180;
images_8=[nlsum(x,y,8),nlsum(x,y,1),nlsum(x,y,2);...
          nlsum(x,y,7),result_EWA(x,y),nlsum(x,y,3);...
          nlsum(x,y,6),nlsum(x,y,5),nlsum(x,y,4)];
      
figure 
plotimage(images_8);
figure
plot_shapes(shapes)



##### SOURCE END #####
-->