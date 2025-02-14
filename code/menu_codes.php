<head> 
<meta charset="UTF-8" /> 
<meta name="keywords" content="NLM , Aggregation, exponential weights, reprojections, denoising, images, Arias-Castro, Dalalyan, Deledalle, Duval, Harmany Strozecki, Willet" />
<meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7"/> 
<title>Codes | Statistics and Image processing  </title> 
<link rel="profile" href="http://gmpg.org/xfn/11" /> 
<link rel="icon" type="image/png" href="../ubuntu32.png" />

<link rel="stylesheet" type="text/css" media="all" href="style.css" /> 

<script type='text/javascript' src='shCore.js'></script> 
<script type='text/javascript' src='shLegacy.js'></script> 
<script type='text/javascript' src='shBrushJScript.js'></script> 
<script type='text/javascript' src='shBrushXml.js'></script> 
<link type='text/css' rel='stylesheet' href='shCore.css'/> 
<link type='text/css' rel='stylesheet' href='shThemeDefault.css'/> 
<script type='text/javascript'> 
	SyntaxHighlighter.config.clipboardSwf = 'clipboard.swf';
	SyntaxHighlighter.all();
</script> 
<style type="text/css"> 
body { background-color: #d2d3d3; }
</style> 

<script type="text/x-mathjax-config">
MathJax.Hub.Config({
  tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}
});
</script>

<script type="text/javascript"
  src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"">
  MathJax.Hub.Config({
        jax: ["input/TeX", "output/HTML-CSS"],
        delayStartupUntil: "onload"
    });

</script>

</head> 
 
<body class="page page-id-612 page-child parent-pageid-13 page-template page-template-default"> 
<div id="wrapper" class="hfeed"> 
	<div id="header"> 
		<div id="masthead"> 
			<div id="branding" role="banner"> 
					
								<div id="site-title"> 
					<span> 
					</span> 
				</div> 

			
				<div id="site-description">Matlab codes for Statistics and Image Processing</div> 
                
			 <div id="header-box-right"> <a href="index_codes.php" title="Codes" rel="home"> 
						    <img src="test2.png" alt="Home" height="75" width="351"> 
						</a> </div>                
                

	        </div><!-- #branding --> 
			
			<div class="clear"></div> 


<?php include('../contacts_database.php'); ?>
			
<div id="access" role="navigation"> 
<div class="skip-link screen-reader-text"><a href="#content" title="Skip to content">Skip to content</a></div> 
<div class="menu-header"><ul id="menu-navigation" class="menu"><li id="menu-item-868" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=news">News</a></li> 
								
								
<li id="menu-item-847" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=aggregation">Statistical Aggregation</a> 
<ul class="sub-menu"> 
<li id="menu-item-1347" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=EWA">EWA for regression</a></li> 
<!--	<li id="menu-item-1145" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=BJS">BJS</a></li> 
<li id="menu-item-1577" class="menu-item menu-item-type-custom"><a href="index_codes.php?page=kNN">kNN</a></li> 
-->
</ul> 
</li> 
								
								
								
<li id="menu-item-846" class="menu-item menu-item-type-post_type "><a href="index_codes.php?page=NLM_variants"> NLM variants</a> 
<ul class="sub-menu"> 

<!--	<li id="menu-item-859" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=home">Home</a></li> --> 
	<li id="menu-item-1078" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=NLMLPR">NLM-LPR</a></li>
	<li id="menu-item-1078" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=NLMSAP">NLM-SAP</a></li>	
	<li id="menu-item-858" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=NLM_reprojection">NLM-Reprojections</a></li> 
 
</ul> 
</li> 



<li id="menu-item-846" class="menu-item menu-item-type-post_type "><a href="index_codes.php?page=PatchPCA_denoising"> Non Local-PCA denoising</a> 
<ul class="sub-menu"> 

<!--	<li id="menu-item-859" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=home">Home</a></li> --> 

        <li id="menu-item-1078" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=NLPCA">Poisson NLPCA</a></li>
        <li id="menu-item-1078" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=NLSPCA">Poisson NLSPCA</a></li>
        <li id="menu-item-1078" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=GPPCA">Gaussian NLPCA</a></li>
</ul> 
</li> 


<li id="menu-item-1073" class="menu-item menu-item-type-post_type "><a href="index_codes.php?page=Neighborhood_filters"> Neighborhood Filters</a> 
<ul class="sub-menu"> 

	<li id="menu-item-853" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=PYF">PYF</a></li> 
 
</ul> 
</li> 



<!-- <li id="menu-item-848" class="menu-item menu-item-type-post_type"><a href="http://www.mathjax.org/resources/">Resources</a> 
<ul class="sub-menu"> 
	<li id="menu-item-1262" class="menu-item menu-item-type-post_type"><a href="http://www.mathjax.org/download/">Download</a></li> 
	<li id="menu-item-1151" class="menu-item menu-item-type-custom"><a href="/resources/docs/">Documentation</a></li> 
	<li id="menu-item-1257" class="menu-item menu-item-type-post_type"><a href="http://www.mathjax.org/resources/articles-and-presentations/">Articles, Presentations, and Tutorials</a></li> 
	<li id="menu-item-860" class="menu-item menu-item-type-post_type"><a href="http://www.mathjax.org/resources/browser-compatibility/">Browser Compatibility</a></li> 
	<li id="menu-item-856" class="menu-item menu-item-type-post_type"><a href="http://www.mathjax.org/resources/faqs/">FAQs</a></li> 
</ul> 
</li>  -->

<li id="menu-item-854" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=contact">Contacts</a></li> 
<li id="menu-item-1167" class="menu-item menu-item-type-post_type"><a href="index_codes.php?page=download">Download</a></li> 
</ul></div>			</div><!-- #access --> 
 
					</div><!-- #masthead --> 
	</div><!-- #header --> 

