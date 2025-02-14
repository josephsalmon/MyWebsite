<html dir="ltr" lang="en"> 



<?php	include("menu_codes.php"); ?>


<?php

if( isset($_GET['page']) ){
	include($_GET['page'].".php");
}else{
	include("news.php");
}

?>


</div><!-- .entry-content --> 
		</div><!-- #post-## --> 
 
				
			<div id="comments"> 
 
 
			<p class="nocomments">Comments are closed.</p> 
 
 
								
			</div><!-- #comments --> 
 
 
	</div><!-- #content --> 
</div><!-- #container --> 
 
    <style>#content { margin: 0px 50px  36px 50px; }</style> 
 
</div><!-- #main --> 
 

				

	<div id="footer" role="contentinfo"> 
		<div id="colophon"> 
 
 
 
			<div id="site-info"> 
				<a href="index_codes.php" > 
					Back to News</a> 
			</div><!-- #site-info --> 
 
			<div id="site-generator" style="text-align:right"> 
					Copyright &copy; 2011		 
			</div><!-- #site-generator --> 
 
		</div><!-- #colophon --> 
	</div><!-- #footer --> 
 
</div><!-- #wrapper --> 
 
</body> 
</html> 






		

<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-34336869-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
				
	</body>
</html>
