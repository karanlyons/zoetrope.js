########
Zoetrope
########

The HTML5 Media Player You Can Understand.

(That's still under development and *almost*—but not quite—ready for stable release.)

.. code-block:: html

	<html>
		<head>
			<script src="./zoetrope/themes/default/default.min.css"></script>
			<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
			<script src="./zoetrope/zoetrope.min.js"></script>
			<script>window.onload = zoetrope.init</script>
		</head>
		<body>
			<video class="zoetrope" poster="./poster.jpg" preload="metadata" infer="hover" controls>
				<source src="./hd.mp4" data-quality="hd" />
				<source src="./sd.mp4" />
				<source src="./hd.webm" data-quality="hd" />
				<source src="./sd.webm" />
			</video>
		</body>
	</html>


.. image:: http://thalia.karanlyons.com/1415130975/clippings/zoetrope.png
	:height: 919px
	:width: 1480px
	:scale: 50%
	:align: center
