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
		
		if ($(window).width() < 1.5*width) {
			$('#' + canvasId).css('width', '75%');
		}
		
		ctx.drawImage(image, 0, 0, width, height);
		$('#imgDim').text(width+"x"+height);		
	}
}



function submit() {
	
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
		
	textSegment(dataurl, thresh, eps, minPts, dia, amt, 1, autoCrop, 0, "demo-canvas");
	
	
}
