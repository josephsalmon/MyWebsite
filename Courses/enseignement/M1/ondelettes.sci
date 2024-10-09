function f = MakeFilter(Type,Par)
// MakeFilter -- Generate Orthonormal QMF Filter for Wavelet Transform
//  Usage
//    f = MakeFilter(Type,Par)
//  Inputs
//    Type   string, 'Haar', 'Beylkin', 'Coiflet', 'Daubechies',
//           'Symmlet', 'Vaidyanathan','Battle'
//    Par    integer, e.g. if Type = 'Coiflet', Par=3 specifies
//           a Coiflet-3 wavelet
//  Outputs
//    f    quadrature mirror filter
//
//  Description
//    The Haar filter (which could be considered a Daubechies-2) was the
//    first wavelet, though not called as such, and is discontinuous.
//
//    The Beylkin filter places roots for the frequency response function
//    close to the Nyquist frequency on the real axis.
//
//    The Coiflet filters are designed to give both the mother and father
//    wavelets 2*Par vanishing moments; here Par may be one of 1,2,3,4 or 5.
//
//    The Daubechies filters maximize the smoothness of the father wavelet 
//    (or "scaling function") by maximizing the rate of decay of its Fourier
//    transform.  They are indexed by their length, Par, which may be one of
//    4,6,8,10,12,14,16,18 or 20.
//
//    Symmlets are the "least asymmetric" compactly-supported wavelets with
//    maximum number of vanishing moments, here indexed by Par, which ranges
//    from 4 to 10.
//
//    The Vaidyanathan filter gives an exact reconstruction, but does not
//    satisfy any moment condition.  The filter has been optimized for
//    speech coding.
//
//    The Battle-Lemarie filter ...... Par = 1, 3 or 5
//
//  See Also
//    FWT_PO, IWT_PO, FWT2_PO, IWT2_PO, WPAnalysis
//
//  References
//    The books by Daubechies and Wickerhauser.
//

if Type == 'Haar',
	f = [1 1] ./ sqrt(2);
end

if Type == 'Beylkin',
	f = [	.099305765374 .424215360813 .699825214057 .449718251149 ...
  -.110927598348 -.264497231446      .026900308804 .155538731877 -.017520746267 -.088543630623 .019679866044 .042916387274 -.017460408696 -.014365807969 .010040411845 .001484234782 -.002736031626 .000640485329 ];
end

if Type == 'Coiflet',
 if Par==1,
  f = [ .038580777748 -.126969125396 -.077161555496 .607491641386 .745687558934 .226584265197 ];
 end
 if Par==2,
  f = [ .016387336463 -.041464936782 -.067372554722     .386110066823 .812723635450 .417005184424     -.076488599078 -.059434418646 .023680171947     .005611434819 -.001823208871 -.000720549445 ];
 end
 if Par==3,
  f = [ -.003793512864 .007782596426 .023452696142     -.065771911281 -.061123390003 .405176902410     .793777222626 .428483476378 -.071799821619     -.082301927106 .034555027573 .015880544864     -.009007976137 -.002574517688 .001117518771     .000466216960 -.000070983303 -.000034599773 ];
 end
 if Par==4,
  f = [ .000892313668 -.001629492013 -.007346166328     .016068943964 .026682300156 -.081266699680     -.056077313316 .415308407030 .782238930920     .434386056491 -.066627474263 -.096220442034     .039334427123 .025082261845 -.015211731527     -.005658286686 .003751436157 .001266561929     -.000589020757 -.000259974552 .000062339034     .000031229876 -.000003259680 -.000001784985 ];
 end
 if Par==5,
  f = [ -.000212080863 .000358589677 .002178236305     -.004159358782 -.010131117538 .023408156762     .028168029062 -.091920010549 -.052043163216     .421566206729 .774289603740 .437991626228     -.062035963906 -.105574208706 .041289208741     .032683574283 -.019761779012 -.009164231153     .006764185419 .002433373209 -.001662863769     -.000638131296 .000302259520 .000140541149     -.000041340484 -.000021315014 .000003734597     .000002063806 -.000000167408 -.000000095158 ];
 end
end

if Type == 'Daubechies',
 if Par==4,  
  f = [ .482962913145 .836516303738     .224143868042 -.129409522551 ];
 end
 if Par==6, 
  f = [ .332670552950 .806891509311     .459877502118 -.135011020010     -.085441273882 .035226291882 ];
 end
 if Par==8,
  f = [  .230377813309 .714846570553     .630880767930 -.027983769417     -.187034811719 .030841381836     .032883011667 -.010597401785 ];
 end
 if Par==10,
  f = [ .160102397974 .603829269797 .724308528438     .138428145901 -.242294887066 -.032244869585     .077571493840 -.006241490213 -.012580751999     .003335725285         ];
 end
 if Par==12,
  f = [ .111540743350 .494623890398 .751133908021     .315250351709 -.226264693965 -.129766867567     .097501605587 .027522865530 -.031582039317     .000553842201 .004777257511 -.001077301085 ];
 end
 if Par==14,
  f = [ .077852054085 .396539319482 .729132090846     .469782287405 -.143906003929 -.224036184994     .071309219267 .080612609151 -.038029936935     -.016574541631 .012550998556 .000429577973     -.001801640704 .000353713800     ];
 end
 if Par==16,
  f = [ .054415842243 .312871590914 .675630736297     .585354683654 -.015829105256 -.284015542962     .000472484574 .128747426620 -.017369301002     -.044088253931 .013981027917 .008746094047     -.004870352993 -.000391740373 .000675449406     -.000117476784         ];
 end
 if Par==18,
  f = [ .038077947364 .243834674613 .604823123690     .657288078051 .133197385825 -.293273783279     -.096840783223 .148540749338 .030725681479     -.067632829061 .000250947115 .022361662124     -.004723204758 -.004281503682 .001847646883     .000230385764 -.000251963189 .000039347320 ];
 end
 if Par==20,
  f = [ .026670057901 .188176800078 .527201188932     .688459039454 .281172343661 -.249846424327     -.195946274377 .127369340336 .093057364604     -.071394147166 -.029457536822 .033212674059     .003606553567 -.010733175483 .001395351747     .001992405295 -.000685856695 -.000116466855     .000093588670 -.000013264203     ];
 end
end

if Type == 'Symmlet',
 if Par==4,
  f = [ -.107148901418 -.041910965125 .703739068656     1.136658243408 .421234534204 -.140317624179     -.017824701442 .045570345896     ];
 end
 if Par==5,
  f = [ .038654795955 .041746864422 -.055344186117     .281990696854 1.023052966894 .896581648380     .023478923136 -.247951362613 -.029842499869     .027632152958         ];
 end
 if Par==6,  
  f = [ .021784700327 .004936612372 -.166863215412     -.068323121587 .694457972958 1.113892783926     .477904371333 -.102724969862 -.029783751299     .063250562660 .002499922093 -.011031867509 ];
 end
 if Par==7,
  f = [ .003792658534 -.001481225915 -.017870431651     .043155452582 .096014767936 -.070078291222     .024665659489 .758162601964 1.085782709814     .408183939725 -.198056706807 -.152463871896     .005671342686 .014521394762     ];
 end
 if Par==8, 
  f = [ .002672793393 -.000428394300 -.021145686528     .005386388754 .069490465911 -.038493521263     -.073462508761 .515398670374 1.099106630537     .680745347190 -.086653615406 -.202648655286     .010758611751 .044823623042 -.000766690896 ... 
    -.004783458512         ];
 end
 if Par==9,
  f = [ .001512487309 -.000669141509 -.014515578553     .012528896242 .087791251554 -.025786445930     -.270893783503 .049882830959 .873048407349     1.015259790832 .337658923602 -.077172161097     .000825140929 .042744433602 -.016303351226     -.018769396836 .000876502539 .001981193736 ];
 end
 if Par==10,
  f = [ .001089170447 .000135245020 -.012220642630     -.002072363923 .064950924579 .016418869426     -.225558972234 -.100240215031 .667071338154     1.088251530500 .542813011213 -.050256540092     -.045240772218 .070703567550 .008152816799     -.028786231926 -.001137535314 .006495728375     .000080661204 -.000649589896     ];
 end
end
 
if Type == 'Vaidyanathan',
 f = [ -.000062906118 .000343631905 -.000453956620    -.000944897136 .002843834547 .000708137504    -.008839103409 .003153847056 .019687215010    -.014853448005 -.035470398607 .038742619293    .055892523691 -.077709750902 -.083928884366    .131971661417 .135084227129 -.194450471766    -.263494802488 .201612161775 .635601059872    .572797793211 .250184129505 .045799334111  ];
end

if Type == 'Battle',
 if Par == 1,
           g = [0.578163    0.280931   -0.0488618   -0.0367309                 0.012003    0.00706442 -0.00274588 -0.00155701                 0.000652922 0.000361781 -0.000158601 -0.0000867523
     ];
 end

 if Par == 3,
        
 g = [0.541736    0.30683    -0.035498    -0.0778079              0.0226846   0.0297468     -0.0121455 -0.0127154              0.00614143 0.00579932    -0.00307863 -0.00274529              0.00154624 0.00133086 -0.000780468 -0.00065562       0.000395946 0.000326749 -0.000201818 -0.000164264              0.000103307
     ];
 end

 if Par == 5,
  g = [0.528374    0.312869    -0.0261771   -0.0914068              0.0208414    0.0433544 -0.0148537 -0.0229951               0.00990635 0.0128754    -0.00639886 -0.00746848              0.00407882 0.00444002 -0.00258816    -0.00268646              0.00164132 0.00164659 -0.00104207 -0.00101912      0.000662836 0.000635563 -0.000422485 -0.000398759      0.000269842 0.000251419 -0.000172685 -0.000159168      0.000110709 0.000101113
     ];
 end
        l = length(g);
        f = zeros(1,2*l-1);
        f(l:2*l-1) = g;
        f(1:l-1) = g(l:-1:2);
end

f = f ./ norm(f);
endfunction
    









function y = MirrorFilt(x)
// MirrorFilt -- Apply (-1)^t modulation
//  Usage
//    h = MirrorFilt(l)
//  Inputs
//    l   1-d signal
//  Outputs
//    h   1-d signal with DC frequency content shifted
//        to Nyquist frequency
//
//  Description
//    h(t) = (-1)^(t-1)  * x(t),  1 <= t <= length(x)
//
//  See Also
//    DyadDownHi
//

 y = -( (-1).^(1:length(x)) ).*x;

endfunction

function y = UpSample(x)
// UpSample -- Upsampling operator
//  Usage
//    u = UpSample(d) 
//  Inputs
//    d   1-d signal, of length n
//  Outputs
//    u   1-d signal, of length 2*n with zeros
//        interpolating alternate samples
//        u(2*i-1) = d(i), i=1,...,n
//
 n = length(x)*2;
 y = zeros(1,n);
 y(1:2:(n-1) )=x;
endfunction

function d = DownDyadHi(x,qmf)
// DownDyadHi -- Hi-Pass Downsampling operator (periodized)
//  Usage
//    d = DownDyadHi(x,f)
//  Inputs
//    x    1-d signal at fine scale
//    f    filter
//  Outputs
//    y    1-d signal at coarse scale
//
//  See Also
//    DownDyadLo, UpDyadHi, UpDyadLo, FWT_PO, iconv
//
 d = iconv( MirrorFilt(qmf),lshift(x));
 n = length(d);
 d = d(1:2:(n-1));
endfunction

function d = DownDyadLo(x,qmf)
// DownDyadLo -- Lo-Pass Downsampling operator (periodized)
//  Usage
//    d = DownDyadLo(x,f)
//  Inputs
//    x    1-d signal at fine scale
//    f    filter
//  Outputs
//    y    1-d signal at coarse scale
//
//  See Also
//    DownDyadHi, UpDyadHi, UpDyadLo, FWT_PO, aconv
//
 d = aconv(qmf,x);
 n = length(d);
 d = d(1:2:(n-1));

endfunction

function y = aconv(f,x)
// aconv -- Convolution Tool for Two-Scale Transform
//  Usage
//    y = aconv(f,x)
//  Inputs
//    f    filter
//    x    1-d signal
//  Outputs
//    y    filtered result
//
//  Description
//    Filtering by periodic convolution of x with the
//    time-reverse of f.
//
//  See Also
//    iconv, UpDyadHi, UpDyadLo, DownDyadHi, DownDyadLo
//

 n = length(x);
 p = length(f);
 if p < n,
    xpadded = [x x(1:p)];
 else
    z = zeros(1,p);
    for i=1:p,
     imod = 1 + modulo(i-1,n);
     z(i) = x(imod);
    end
    xpadded = [x z];
 end
 fflip = f(p:-1:1);
// ypadded = filter(fflip,1,xpadded);
ypadded = convol(fflip,xpadded);
 y = ypadded(p:(n+p-1));
endfunction

function y = iconv(f,x)
// iconv -- Convolution Tool for Two-Scale Transform
//  Usage
//    y = iconv(f,x)
//  Inputs
//    f   filter
//    x   1-d signal
//  Outputs
//    y   filtered result
//
//  Description
//    Filtering by periodic convolution of x with f
//
//  See Also
//    aconv, UpDyadHi, UpDyadLo, DownDyadHi, DownDyadLo
//
 n = length(x);
 p = length(f);
 if p <= n,
    xpadded = [x((n+1-p):n) x];
 else
    z = zeros(1,p);
    for i=1:p,
     imod = 1 + modulo(p*n -p + i-1,n);
     z(i) = x(imod);
    end
    xpadded = [z x];
 end
// ypadded = filter(f,1,xpadded);
ypadded = convol(f,xpadded);
 y = ypadded((p+1):(n+p));
endfunction

function y = UpDyadHi(x,qmf)
// UpDyadHi -- Hi-Pass Upsampling operator; periodized
//  Usage
//    u = UpDyadHi(d,f)
//  Inputs
//    d    1-d signal at coarser scale
//    f    filter
//  Outputs
//    u    1-d signal at finer scale
//
//  See Also
//    DownDyadLo, DownDyadHi, UpDyadLo, IWT_PO, aconv
//
 
 y = aconv( MirrorFilt(qmf), rshift( UpSample(x) ) );
endfunction
 
function y = UpDyadLo(x,qmf)
// UpDyadLo -- Lo-Pass Upsampling operator; periodized
//  Usage
//    u = UpDyadLo(d,f)
//  Inputs
//    d    1-d signal at coarser scale
//    f    filter
//  Outputs
//    u    1-d signal at finer scale
//
//  See Also
//    DownDyadLo, DownDyadHi, UpDyadHi, IWT_PO, iconv
//
 y =  iconv(qmf, UpSample(x) );

endfunction

function y = lshift(x)
// lshift -- Circular left shift of 1-d signal
//  Usage
//    l = lshift(x)
//  Inputs
//    x   1-d signal
//  Outputs
//    l   1-d signal 
//        l(i) = x(i+1) except l(n) = x(1)
//

 y = [ x( 2:length(x) ) x(1) ];
endfunction

function y = rshift(x)
// rshift -- Circular right shift of 1-d signal
//  Usage
//    r = rshift(x)
//  Inputs
//    x   1-d signal
//  Outputs
//    r   1-d signal 
//        r(i) = x(i-1) except r(1) = x(n)
//

 n = length(x);
 y = [ x(n) x( 1: (n-1) )];
endfunction


function wcoef = FWT(x,L,qmf)
// FWT -- Forward Wavelet Transform (periodized, orthogonal)
//  Usage
//    wc = FWT(x,L,qmf)
//  Inputs
//    x    1-d signal; length(x) = 2^J
//    L    Coarsest Level of V_0;  L << J
//    qmf  quadrature mirror filter (orthonormal)
//  Outputs
//    wc    1-d wavelet transform of x.
//
//  Description
//    1. qmf filter may be obtained from MakeFilter   
//    2. usually, length(qmf) < 2^(L+1)
//    3. To reconstruct use IWT
//
//  See Also
//    IWT, MakeFilter
//
  n = length(x);
  J = log2(n);
  wcoef = zeros(1,n) ;
  beta = x(:)';//take samples at finest scale as beta-coeffts
  for j=J-1:-1:L
       alfa = DownDyadHi(beta,qmf);
       wcoef((2^(j)+1):(2^(j+1))) = alfa;
       beta = DownDyadLo(beta,qmf) ;  
  end
  wcoef(1:(2^L)) = beta;
//  wcoef = ShapeLike(wcoef,x);
endfunction

function x = IWT(wc,L,qmf)
// IWT -- Inverse Wavelet Transform 
//  Usage
//    x = IWT(wc,L,qmf)
//  Inputs
//    wc     1-d wavelet transform: length(wc) = 2^J.
//    L      Coarsest scale (2^(-L) = scale of V_0); L << J;
//    qmf    quadrature mirror filter
//  Outputs
//    x      1-d signal reconstructed from wc
//
//  Description
//    Suppose wc = FWT(x,L,qmf) where qmf is an orthonormal quad. mirror
//    filter, e.g. one made by MakeFilter. Then x can be reconstructed by
//      x = IWT(wc,L,qmf)
//
//  See Also
//    FWT, MakeFilter
//
   wcoef = wc(:)';
 x = wcoef(1:2^L);
    n = length(wcoef);
    J = log2(n);
 for j=L:J-1
  x = UpDyadLo(x,qmf) + UpDyadHi(wcoef((2^(j)+1):(2^(j+1))),qmf)  ;
 end
//    x = ShapeLike(x,wc);
endfunction

function sig = MakeSignal(Name,n)
//  MakeSignal -- Make artificial signal
//  Usage
//    sig = MakeSignal(Name,n)
//  Inputs
//    Name   string: 'HeaviSine', 'Bumps', 'Blocks',
//            'Doppler', 'Ramp', 'Cusp', 'Sing', 'HiSine',
//            'LoSine', 'LinChirp', 'TwoChirp', 'QuadChirp',
//            'MishMash', 'WernerSorrows' (Heisenberg),
//            'Leopold' (Kronecker), 'Piece-Regular' (Piece-Wise Smooth),
//      'Riemann','HypChirps','LinChirps', 'Chirps', 'Gabor'
//      'sineoneoverx','Cusp2','SmoothCusp','Gaussian'
//      'Piece-Polynomial' (Piece-Wise 3rd degree polynomial)
//    n      desired signal length
//  Outputs
//    sig    1-d signal
//
//  References
//    Various articles of D.L. Donoho and I.M. Johnstone
//

 t = (1:n) ./n;

if Name=='HeaviSine',
     sig = 4.*sin(4*%pi.*t);
     sig = sig - sign(t - .3) - sign(.72 - t);
 elseif Name=='Bumps',
     pos = [ .1 .13 .15 .23 .25 .40 .44 .65  .76 .78 .81];
     hgt = [ 4  5   3   4  5  4.2 2.1 4.3  3.1 5.1 4.2];
     wth = [.005 .005 .006 .01 .01 .03 .01 .01  .005 .008 .005];
     sig = zeros(t);
     for j =1:length(pos)
        sig = sig + hgt(j)./( 1 + abs((t - pos(j))./wth(j))).^4;
     end 
 elseif Name=='Blocks',
     pos = [ .1 .13 .15 .23 .25 .40 .44 .65  .76 .78 .81];
     hgt = [4 (-5) 3 (-4) 5 (-4.2) 2.1 4.3  (-3.1) 2.1 (-4.2)];
     sig = zeros(t);
     for j=1:length(pos)
         sig = sig + (1 + sign(t-pos(j))).*(hgt(j)/2) ;
     end
 elseif Name=='Doppler',
     sig = sqrt(t.*(1-t)).*sin((2*%pi*1.05) ./(t+.05));
 elseif Name=='Ramp',
     sig = t - (t >= .37);
 elseif Name=='Cusp',
     sig = sqrt(abs(t - .37));
 elseif Name=='Sing',
     k = floor(n * .37);
     sig = 1 ./abs(t - (k+.5)/n);
 elseif Name=='HiSine',
     sig = sin( %pi * (n * .6902) .* t);
 elseif Name=='LoSine',
     sig = sin( %pi * (n * .3333) .* t);
 elseif Name=='LinChirp',
     sig = sin(%pi .* t .* ((n .* .500) .* t));
 elseif Name=='TwoChirp',
     sig = sin(%pi .* t .* (n .* t)) + sin((%pi/3) .* t .* (n .* t));
 elseif Name=='QuadChirp',
     sig = sin( (%pi/3) .* t .* (n .* t.^2));
 elseif Name=='MishMash',  // QuadChirp + LinChirp + HiSine
     sig = sin( (%pi/3) .* t .* (n .* t.^2)) ;
     sig = sig +  sin( %pi * (n * .6902) .* t);
     sig = sig +  sin(%pi .* t .* (n .* .125 .* t));
 elseif Name=='WernerSorrows',
     sig = sin( %pi .* t .* (n/2 .* t.^2)) ;
     sig = sig +  sin( %pi * (n * .6902) .* t);
     sig = sig +  sin(%pi .* t .* (n .* t));
     pos = [ .1 .13 .15 .23 .25 .40 .44 .65  .76 .78 .81];
     hgt = [ 4  5   3   4  5  4.2 2.1 4.3  3.1 5.1 4.2];
     wth = [.005 .005 .006 .01 .01 .03 .01 .01  .005 .008 .005];
     for j =1:length(pos)
        sig = sig + hgt(j)./( 1 + abs((t - pos(j))./wth(j))).^4;
     end 
 elseif Name=='Leopold',
     sig = (t == floor(.37 * n)/n);  // Kronecker
 elseif Name=='Riemann',
  sqn = round(sqrt(n));
     sig = t .* 0;  // Riemann's Non-differentiable Function
  sig((1:sqn).^2) = 1. ./ (1:sqn);
  sig = real(ifft(sig));
 elseif Name=='HypChirps', // Hyperbolic Chirps of Mallat's book
  alpha = 15*n*%pi/1024;
  beta    = 5*n*%pi/1024;
  t   = (1.001:1:n+.001)./n; 
  f1      = zeros(1,n);
  f2      = zeros(1,n); 
  f1   = sin(alpha./(.8-t)).*(0.1<t).*(t<0.68);
  f2   = sin(beta./(.8-t)).*(0.1<t).*(t<0.75);
  M   = round(0.65*n);
  P  = floor(M/4);
  enveloppe = ones(1,M); // the rising cutoff function 
            enveloppe(1:P) = (1+sin(-%pi/2+((1:P)-ones(1,P))./(P-1)*%pi))/2;
            enveloppe(M-P+1:M) = reverse(enveloppe(1:P));
    env  = zeros(1,n);
    env(ceil(n/10):M+ceil(n/10)-1) = enveloppe(1:M);
  sig     = (f1+f2).*env;
 elseif Name=='LinChirps', // Linear Chirps of Mallat's book
  b  = 100*n*%pi/1024;
  a  = 250*n*%pi/1024;
  t  = (1:n)./n; 
  A1  = sqrt((t-1/n).*(1-t));
  sig = A1.*(cos((a*(t).^2)) + cos((b*t+a*(t).^2)));
 elseif Name=='Chirps', // Mixture of Chirps of Mallat's book
  t  = (1:n)./n.*10.*%pi;  
    f1  = cos(t.^2*n/1024);
  a  = 30*n/1024;
    t  = (1:n)./n.*%pi;  
    f2  = cos(a.*(t.^3));
    f2  = reverse(f2);
  ix  = (-n:n)./n.*20;
   g  = exp(-ix.^2*4*n/1024);
  i1  = (n/2+1:n/2+n);
  i2  = (n/8+1:n/8+n);
  j   = (1:n)/n;
      f3  = g(i1).*cos(50.*%pi.*j*n/1024);
  f4  = g(i2).*cos(350.*%pi.*j*n/1024);
  sig  = f1+f2+f3+f4;
     enveloppe = ones(1,n); // the rising cutoff function 
    enveloppe(1:n/8) = (1+sin(-%pi/2+((1:n/8)-ones(1,n/8))./(n/8-1)*%pi))/2;
    enveloppe(7*n/8+1:n) = reverse(enveloppe(1:n/8));
   sig  = sig.*enveloppe;
        elseif Name=='Gabor', // two modulated Gabor functions in 
         // Mallat's book
  N = 512; 
     t = (-N:N)*5/N;
         j = (1:N)./N;
  g = exp(-t.^2*20);
  i1 = (2*N/4+1:2*N/4+N);
  i2 = (N/4+1:N/4+N);
  sig1 = 3*g(i1).*exp(i*N/16.*%pi.*j);
  sig2 = 3*g(i2).*exp(i*N/4.*%pi.*j);
     sig = sig1+sig2;
 elseif Name=='sineoneoverx', // sin(1/x) in Mallat's book
  N = 1024;
  i = (-N+1:N);
  i(N) = 1/100;
  i = i./(N-1);
  sig = sin(1.5./(i));
  sig = sig(513:1536);
 elseif Name=='Cusp2',
  N = 64;
  i = (1:N)./N;
  x = (1-sqrt(i)) + i/2 -.5;
  M = 8*N;
  sig = zeros(1,M);
  sig(M-1.5.*N+1:M-.5*N) = x;
  sig(M-2.5*N+2:M-1.5.*N+1) = reverse(x);
  sig(3*N+1:3*N + N) = .5*ones(1,N);
 elseif Name=='SmoothCusp',
  sig = MakeSignal('Cusp2');
  N = 64;
  M = 8*N;
  t = (1:M)/M;
  sigma = 0.01;
  g = exp(-.5.*(abs(t-.5)./sigma).^2)./sigma./sqrt(2*%pi);
  g = fftshift(g);
  sig2 = iconv(g',sig)'/M; 
    elseif Name=='Piece-Regular',
  sig1=-15*MakeSignal('Bumps',n);
  t = (1:fix(n/12)) ./fix(n/12);
  sig2=-exp(4*t);
  t = (1:fix(n/7)) ./fix(n/7);
  sig5=exp(4*t)-exp(4);
  t = (1:fix(n/3)) ./fix(n/3);
  sigma=6/40;
  sig6=-70*exp(-((t-1/2).*(t-1/2))/(2*sigma^2));
  sig(1:fix(n/7))= sig6(1:fix(n/7));
  sig((fix(n/7)+1):fix(n/5))=0.5*sig6((fix(n/7)+1):fix(n/5));
  sig((fix(n/5)+1):fix(n/3))=sig6((fix(n/5)+1):fix(n/3));
  sig((fix(n/3)+1):fix(n/2))=sig1((fix(n/3)+1):fix(n/2));
  sig((fix(n/2)+1):(fix(n/2)+fix(n/12)))=sig2;
  sig((fix(n/2)+2*fix(n/12)):-1:(fix(n/2)+fix(n/12)+1))=sig2;
sig(fix(n/2)+2*fix(n/12)+fix(n/20)+1:(fix(n/2)+2*fix(n/12)+3*fix(n/20)))=-ones(1,fix(n/2)+2*fix(n/12)+3*fix(n/20)-fix(n/2)-2*fix(n/12)-fix(n/20))*25;
  k=fix(n/2)+2*fix(n/12)+3*fix(n/20);
  sig((k+1):(k+fix(n/7)))=sig5;
  diff=n-5*fix(n/5);
  sig(5*fix(n/5)+1:n)=sig(diff:-1:1);
  // zero-mean
  bias=sum(sig)/n;
  sig=bias-sig;
    elseif Name=='Piece-Polynomial',
  t = (1:fix(n/5)) ./fix(n/5);
  sig1=20*(t.^3+t.^2+4);
  sig3=40*(2.*t.^3+t) + 100;
  sig2=10.*t.^3 + 45;
  sig4=16*t.^2+8.*t+16;
  sig5=20*(t+4);
  sig6(1:fix(n/10))=ones(1,fix(n/10));
  sig6=sig6*20;
  sig(1:fix(n/5))=sig1;
  sig(2*fix(n/5):-1:(fix(n/5)+1))=sig2;
  sig((2*fix(n/5)+1):3*fix(n/5))=sig3;
  sig((3*fix(n/5)+1):4*fix(n/5))=sig4;
  sig((4*fix(n/5)+1):5*fix(n/5))=sig5(fix(n/5):-1:1);
  diff=n-5*fix(n/5);
  sig(5*fix(n/5)+1:n)=sig(diff:-1:1);
  //sig((fix(n/20)+1):(fix(n/20)+fix(n/10)))=-ones(1,fix(n/10))*20;
  sig((fix(n/20)+1):(fix(n/20)+fix(n/10)))=ones(1,fix(n/10))*10;
  sig((n-fix(n/10)+1):(n+fix(n/20)-fix(n/10)))=ones(1,fix(n/20))*150;
  // zero-mean
  bias=sum(sig)/n;
  sig=sig-bias;
    elseif Name=='Gaussian',
  sig=GWN(n,beta);
  g=zeros(1,n);
  lim=alpha*n;
  mult=%pi/(2*alpha*n);
  g(1:lim)=(cos(mult*(1:lim))).^2;
  g((n/2+1):n)=g((n/2):-1:1);
  g = rnshift(g,n/2);
  g=g/norm(g);
  sig=iconv(g,sig);
       else
     disp(sprintf('MakeSignal: I don*t recognize <<%s>>',Name))
     disp('Allowable Names are:')
        disp('HeaviSine'),
        disp('Bumps'),
        disp('Blocks'),
        disp('Doppler'),
        disp('Ramp'),
        disp('Cusp'),
        disp('Crease'),
        disp('Sing'),
        disp('HiSine'),
        disp('LoSine'),
        disp('LinChirp'),
        disp('TwoChirp'),
        disp('QuadChirp'),
        disp('MishMash'),
        disp('WernerSorrows'),
        disp('Leopold'),
        disp('Sing'),
        disp('HiSine'),
        disp('LoSine'),
        disp('LinChirp'),
        disp('TwoChirp'),
        disp('QuadChirp'),
        disp('MishMash'),
        disp('WernerSorrows'),
        disp('Leopold'),
        disp('Riemann'),
        disp('HypChirps'),
        disp('LinChirps'),
        disp('Chirps'),
        disp('sineoneoverx'),
        disp('Cusp2'),
        disp('SmoothCusp'),
        disp('Gabor'),
        disp('Piece-Regular');
        disp('Piece-Polynomial');
        disp('Gaussian');
 end
 
endfunction
