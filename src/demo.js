window.onload = function() {
	var image = new Image();
	image.src = "img/demo.jpg";
	
	var canvas = document.getElementById("demo-canvas");
	var ctx = canvas.getContext("2d");
	
	image.onload = function() {
		width = image.width;
		height = image.height;
		
		canvas.width = width
		canvas.height = height
		ctx.drawImage(image, 0, 0, width, height);	
	}
	
}

function submit() {
	
	var thresh = $("#thresh").val();
	var eps = $("#eps").val();
	var minPts = $("#minPts").val();
	var sharp = $("#sharp").val();
	
	if (thresh == "") {thresh = 100;}
	if (eps == "") {eps = 15;}
	if (minPts == "") {minPts = 5;}
	if (sharp == "") {sharp = 0.6;}
		
	textSegment("img/demo.jpg", thresh, eps, minPts, sharp, 1, 0, 0, "demo-canvas");
}
