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
	var dia = $("#dia").val();
	var amt = $("#amt").val();
	
	
	if (thresh == "") {thresh = 60;}
	if (eps == "") {eps = 15;}
	if (minPts == "") {minPts = 5;}
	if (dia == "") {dia = 10;}
	if (amt == "") {amt = 1;}
	
	// var f1 = function () {
		// var r = $.Deferred();
		// textSegment("img/demo.jpg", thresh, eps, minPts, sharp, 1, 1, 1);
		// return r;
	// };
	
	// var f2 = function () {
		// $("img").prependTo("form");
	// }
	
	// f1().done(f2());

	textSegment("img/demo.jpg", thresh, eps, minPts, dia, amt, 1, 1, 1);
	
}
