var dataurl;

function encodeImageFileAsURL(element) {
	var file = element.files[0];
	$('#customFileLabel').text(file.name);
	var reader = new FileReader();
	reader.onloadend = function() {
		dataurl = reader.result;
		drawCanvas(dataurl, "demo-canvas")
	}
	reader.readAsDataURL(file);

}

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
		
		if (width < 500 || height < 500) {
			$('canvas').css('width', '50%');
			
		} else if ($(window).width() > 1300 && width >= 500) {
			$('canvas').css('width', '40%');
		} else {
			$('canvas').css('width', '80%');
		}
		
		if ($(window).width() < 1.5*width) {
			$('#' + canvasId).css('width', '75%');
		}
		
		ctx.drawImage(image, 0, 0, width, height);
		$('#imgDim').text(width+"x"+height);	

		$("#scaleRangeSlider").css("display", "block");
		$(".slider-text").css("display", "block");
		
		var slider = document.getElementById("scaleRangeSlider");
		var output = document.getElementById("sliderOutput");
		output.innerHTML = slider.value;

		var canvaso = document.createElement("canvas");
		var ctxo = canvaso.getContext("2d");
		canvaso.width = width;
		canvaso.height = height;
		ctxo.drawImage(canvas, 0, 0);
		
		slider.oninput = function() {
			output.innerHTML = this.value;
			scaleCanvas(this.value, canvas, canvaso);
			$('#imgDim').text(canvas.width+"x"+canvas.height);	
		}
		
	}
}


function submitData() {
	
	var thresh = $("#thresh").val();
	var eps = $("#eps").val();
	var minPts = $("#minPts").val();
	var dia = $("#dia").val();
	var amt = $("#amt").val();
	var autoCrop = document.getElementById("cropCheck").checked;
	
	if (thresh == "") {thresh = 60;}
	if (eps == "") {eps = 15;}
	if (minPts == "") {minPts = 5;}
	if (dia == "") {dia = 10;}
	if (amt == "") {amt = 1;}
		
	var canvas = document.getElementById("demo-canvas");
	canvasDataUrl = canvas.toDataURL();
	$(window).scrollTo('#top',300);
	textSegment(canvasDataUrl, thresh, eps, minPts, dia, amt, 1, autoCrop, 0, "demo-canvas");
	
	
}