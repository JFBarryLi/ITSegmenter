window.onload = function() {
	function drawCanvas(src, canvasId) {
		var image = new Image();
		image.src = src;
		
		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext("2d");
		
		image.onload = function() {
			width = image.width;
			height = image.height;
			
			canvas.width = width
			canvas.height = height
			ctx.drawImage(image, 0, 0, width, height);		
		}
	}
	drawCanvas("img/demo1.jpg", "demo-canvas1");
	drawCanvas("img/demo2.jpg", "demo-canvas2");
	drawCanvas("img/demo3.jpg", "demo-canvas3");
	drawCanvas("img/demo4.jpg", "demo-canvas4");
	
}

function submitData() {
	
	var thresh = $("#thresh").val();
	var eps = $("#eps").val();
	var minPts = $("#minPts").val();
	var dia = $("#dia").val();
	var amt = $("#amt").val();
	
	var src, canvas;
	
	if (thresh == "") {thresh = 60;}
	if (eps == "") {eps = 15;}
	if (minPts == "") {minPts = 5;}
	if (dia == "") {dia = 10;}
	if (amt == "") {amt = 1;}
	
	if ($("#demo-canvas1").parent().prop("class") == "carousel-item active") {
		src = "img/demo1.jpg";
		canvas = "demo-canvas1";
	} else if ($("#demo-canvas2").parent().prop("class") == "carousel-item active") {
		src = "img/demo2.jpg";
		canvas = "demo-canvas2";
	} else if ($("#demo-canvas3").parent().prop("class") == "carousel-item active") {
		src = "img/demo3.jpg";
		canvas = "demo-canvas3";
	} else if ($("#demo-canvas4").parent().prop("class") == "carousel-item active") {
		src = "img/demo4.jpg";
		canvas = "demo-canvas4";
	}
	
	$(window).scrollTo('#top',300);
	textSegment(src, thresh, eps, minPts, dia, amt, 1, 0, 0, canvas);
	
}
