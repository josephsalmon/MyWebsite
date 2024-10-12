
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<div xmlns:mwsh="http://www.mathworks.com/namespace/mcode/v1/syntaxhighlight.dtd" class="content">
   <h1 class="intro">Visual comparison between EWA and other procedures: DEMO_EWA_comparison.m</h1><br><introduction>
      <p>This script displays the proposed denoising method used in the corresponding paper , for various 1D signals. The signals are
         first transformed using DCT and then denoised using several methods of shrinkage, with or without aggregation (EWA, SS-ST,
         BJS, ORACLE). We consider one level of noise with standard deviation \( \sigma=0.33\). See also README.TXT in the associate
         zip file for more details.
      </p>
      <p>Authors:  \(\textbf{A. Dalalyan} \) and \( \textbf{J. Salmon} \)</p>
   </introduction>
   <h2>Visualization of the original (non-noisy) signals considered<a name="1"></a></h2>
   <p>Parameters initialization</p><pre class="codeinput">all_signal={<span class="string">'Piece-Regular'</span>,<span class="string">'Ramp'</span>,<span class="string">'Piece-Polynomial'</span>,<span class="string">'HeaviSine'</span>,<span class="keyword">...</span>
    <span class="string">'Doppler'</span>,<span class="string">'Blocks'</span>};
font_size=19;
sigma=1;
signal_size=2^9;
figure_size=[100,100, 1000, 1000];
</pre><p>Display signals of interest</p><pre class="codeinput">fig_signaux1=figure(<span class="string">'Position'</span>, figure_size);
<span class="keyword">for</span> i=1:6
    subplot(3,2,i)
    htitle={char(all_signal(i))};
    [X,Y,absci]=generate_signal(signal_size,char(<span class="keyword">...</span>
        all_signal(i)),sigma);
    data_axis=[0 1 min(X)-0.2 max(X)+0.2];
    plot_article(fig_signaux1,absci,X,htitle,font_size,data_axis);
<span class="keyword">end</span>
</pre><img vspace="5" hspace="5" src="DEMO_EWA_comparison_01.png"> <h2>Visualization of the  denoised signals<a name="3"></a></h2><pre class="codeinput">smooth=0;
plot=1;
verb=0;
saving=0;

<span class="keyword">for</span> i=1:6
    sigma=0.33;
    launching_performance_fft(sigma,all_signal(i),<span class="keyword">...</span>
        signal_size,smooth,verb,plot,saving);
<span class="keyword">end</span>
</pre><img vspace="5" hspace="5" src="DEMO_EWA_comparison_02.png"> <img vspace="5" hspace="5" src="DEMO_EWA_comparison_03.png"> <img vspace="5" hspace="5" src="DEMO_EWA_comparison_04.png"> <img vspace="5" hspace="5" src="DEMO_EWA_comparison_05.png"> <img vspace="5" hspace="5" src="DEMO_EWA_comparison_06.png"> <img vspace="5" hspace="5" src="DEMO_EWA_comparison_07.png"> <p class="footer">
</div>
<!--
##### SOURCE BEGIN #####
%% Visual comparison between EWA and other procedures: DEMO_EWA_comparison.m
% This script displays the proposed denoising method used in the
% corresponding paper , for various 1D signals.
% The signals are first transformed using DCT and then denoised using 
% several methods of shrinkage, with or without aggregation
% (EWA, SS-ST, BJS, ORACLE). We consider one level of noise 
% with standard deviation \( \sigma=0.33\). See also README.TXT in the 
% associate zip file for more details.
%
% Authors:  \(\textbf{A. Dalalyan} \) and \( \textbf{J. Salmon} \)
%
%% Visualization of the original (non-noisy) signals considered
% Parameters initialization
%
all_signal={'Piece-Regular','Ramp','Piece-Polynomial','HeaviSine',...
    'Doppler','Blocks'};
font_size=19;
sigma=1;
signal_size=2^9;
figure_size=[100,100, 1000, 1000];
%%
% Display signals of interest
fig_signaux1=figure('Position', figure_size);
for i=1:6
    subplot(3,2,i)
    htitle={char(all_signal(i))};
    [X,Y,absci]=generate_signal(signal_size,char(...
        all_signal(i)),sigma);
    data_axis=[0 1 min(X)-0.2 max(X)+0.2];
    plot_article(fig_signaux1,absci,X,htitle,font_size,data_axis);
end


 
%% Visualization of the  denoised signals
smooth=0;
plot=1;
verb=0;
saving=0;

for i=1:6  
    sigma=0.33;
    launching_performance_fft(sigma,all_signal(i),...
        signal_size,smooth,verb,plot,saving);
end



##### SOURCE END #####
-->
