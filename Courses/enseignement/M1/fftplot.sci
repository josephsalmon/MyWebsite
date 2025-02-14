function fftplot(f,freqnyq);
N = length(f);

freqaxis = linspace(-freqnyq/2,freqnyq/2,N);
fshift(1:N/2) = f(N/2+1:N);
fshift(N/2+1:N)= f(1:N/2);
plot2d(freqaxis,fshift);
