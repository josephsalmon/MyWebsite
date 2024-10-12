
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h2>Simple example on Cameraman<a name="1"></a></h2><pre> We present here the standard version of our NLM-SAP
 algorithm. The kernel used to compare the shapes is
 trapezoidal. See also README.TXT in the associate zip file for
 more details.</pre><pre> We use 4 directionnal quarter pies and an isotropic one, all of
 them with 3 scales (15 shapes in total). We illustrate the
 benefits of combining the estimates based on different shapes
 rather than using only a single one.</pre><pre> See also DEMO_NLMSAP_FAST.m, DEMO_NLMSAP_GAUSS_8DIRECTIONS.m</pre><pre> Copyright (C) 2011 NLM-SAP project
 Authors: \( \textbf{C-A. Deledalle} \), \(\textbf{V. Duval} \)
 and \(\textbf{J. Salmon} \)</pre><pre> See The GNU Public License (GPL)</pre><pre class="codeinput"><span class="comment">%---------------------------------------------------------------------</span>
<span class="comment">%</span>
<span class="comment">%   This file is part of NLM-SAP.</span>
<span class="comment">%</span>
<span class="comment">%   NLM-SAP is free software: you can redistribute it and/or modify</span>
<span class="comment">%   it under the terms of the GNU General Public License as</span>
<span class="comment">%   published by the Free Software Foundation, either version 3 of</span>
<span class="comment">%   the License, or (at your option) any later version.</span>
<span class="comment">%</span>
<span class="comment">%   NLM-SAP is distributed in the hope that it will be useful,</span>
<span class="comment">%   but WITHOUT ANY WARRANTY; without even the implied warranty of</span>
<span class="comment">%   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the</span>
<span class="comment">%   GNU General Public License for more details.</span>
<span class="comment">%</span>
<span class="comment">%   You should have received a copy of the GNU General Public</span>
<span class="comment">%   License along with NLM-SAP.  If not, see</span>
<span class="comment">%   &lt;http://www.gnu.org/licenses/&gt;.</span>

close <span class="string">all</span>
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

<span class="comment">% Initialize random seed</span>
randn(<span class="string">'seed'</span>, 2);
</pre><h2>Build the true and noisy images<a name="4"></a></h2><pre class="codeinput">img     = double(imread(<span class="string">'cameraman.png'</span>));
[M,N]   = size(img);
img_nse = img + sig * randn(size(img));
</pre><h2>Build the shapes<a name="5"></a></h2><pre class="codeinput">L = 2;           <span class="comment">% number of size levels</span>
R = 4;           <span class="comment">% radius of the first level (evolution as R*sqrt(2)^(n-1)</span>
A = 0;           <span class="comment">% number of angle partitions (precisely 2^A)</span>
shapes = cat(3, <span class="keyword">...</span>
             build_pie(M,N,L,R/2,A), <span class="keyword">...</span>
             build_pie(M,N,L,R/sqrt(2),A), <span class="keyword">...</span>
             build_pie(M,N,L,R,A));

tic
</pre><h2>Compute the NL-Shapes estimations<a name="6"></a></h2><pre class="codeinput">[nlsum, sumphi, sumphi2, deriv] = <span class="keyword">...</span>
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
</pre><h2>Compute risks maps<a name="7"></a></h2><pre class="codeinput">riskmat = risk_sure(img_nse, nlsum, deriv, sig);
</pre><h2>Filter risks maps<a name="8"></a></h2><pre class="codeinput">riskemp = (repmat(img_nse, [1 1 nbshapes]) - nlsum).^2;
divmat = riskmat - riskemp;
[divmat_diff riskmat_diff] = riskfilter_yaroslavsky(divmat, riskmat);
</pre><h2>Aggregation step with EWA<a name="9"></a></h2><pre class="codeinput">[img_NLMSAP, beta_NLMSAP] = <span class="keyword">...</span>
    aggregation_EWA(nlsum, divmat_diff, temperature);

toc
</pre><pre class="codeoutput">Elapsed time is 45.264874 seconds.
</pre><h2>Display the shapes<a name="10"></a></h2><pre class="codeinput">figure
plot_shapes(shapes);
</pre><img vspace="5" hspace="5" src="DEMO_NLMSAP_01.png"> <h2>Display result<a name="11"></a></h2><pre class="codeinput">figure
subplot(1,3,1)
plotimage(img_nse);
title(<span class="string">'Noisy'</span>);
subplot(1,3,2);
plotimage(nlsum(:,:,6));
title(<span class="string">'Estimate obtained with only one isotropic shape'</span>);
subplot(1,3,3);
plotimage(img_NLMSAP);
title(<span class="string">'Combination obtained by NLM-SAP'</span>);
linkaxes
</pre><img vspace="5" hspace="5" src="DEMO_NLMSAP_02.png"> <p class="footer"><br>
      Copyright &reg; 2011 <br></p>
</div>
<!--
##### SOURCE BEGIN #####
%% Simple example on Cameraman
%
%   We present here the standard version of our NLM-SAP
%   algorithm. The kernel used to compare the shapes is
%   trapezoidal. See also README.TXT in the associate zip file for
%   more details.
%
%   We use 4 directionnal quarter pies and an isotropic one, all of
%   them with 3 scales (15 shapes in total). We illustrate the
%   benefits of combining the estimates based on different shapes
%   rather than using only a single one.
%
%   See also DEMO_NLMSAP_FAST.m, DEMO_NLMSAP_GAUSS_8DIRECTIONS.m
%
%   Copyright (C) 2011 NLM-SAP project
%   Authors: \( \textbf{C-A. Deledalle} \), \(\textbf{V. Duval} \)
%   and \(\textbf{J. Salmon} \)
%
%   See The GNU Public License (GPL)

%REPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASHREPLACE_WITH_DASH_DASH-
%
%   This file is part of NLM-SAP.
%
%   NLM-SAP is free software: you can redistribute it and/or modify
%   it under the terms of the GNU General Public License as
%   published by the Free Software Foundation, either version 3 of
%   the License, or (at your option) any later version.
%
%   NLM-SAP is distributed in the hope that it will be useful,
%   but WITHOUT ANY WARRANTY; without even the implied warranty of
%   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
%   GNU General Public License for more details.
%
%   You should have received a copy of the GNU General Public
%   License along with NLM-SAP.  If not, see
%   <http://www.gnu.org/licenses/>.

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

% Initialize random seed
randn('seed', 2);

%% Build the true and noisy images
img     = double(imread('cameraman.png'));
[M,N]   = size(img);
img_nse = img + sig * randn(size(img));

%% Build the shapes
L = 2;           % number of size levels
R = 4;           % radius of the first level (evolution as R*sqrt(2)^(n-1)
A = 0;           % number of angle partitions (precisely 2^A)
shapes = cat(3, ...
             build_pie(M,N,L,R/2,A), ...
             build_pie(M,N,L,R/sqrt(2),A), ...
             build_pie(M,N,L,R,A));

tic

%% Compute the NL-Shapes estimations
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

toc

%% Display the shapes
figure
plot_shapes(shapes);

%% Display result
figure
subplot(1,3,1)
plotimage(img_nse);
title('Noisy');
subplot(1,3,2);
plotimage(nlsum(:,:,6));
title('Estimate obtained with only one isotropic shape');
subplot(1,3,3);
plotimage(img_NLMSAP);
title('Combination obtained by NLM-SAP');
linkaxes
##### SOURCE END #####
-->
