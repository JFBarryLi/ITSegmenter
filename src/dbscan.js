var width, height;
var canvasf, canvasd;
var ctxf, ctxd;
var image;

window.onload = function() {
	image = new Image();
	image.src = "img/demo.jpg";
	
	var canvaso = document.getElementById("demo-canvas");
	var ctxo = canvaso.getContext("2d");
	
	canvasd = document.getElementById("dbscan-canvas");
	ctxd = canvasd.getContext("2d");
	
	canvasf = document.createElement("canvas");
	ctxf = canvasf.getContext("2d");
	
	image.onload = function() {
		width = image.width;
		height = image.height;
		
		canvaso.width = width
		canvaso.height = height
		
		canvasf.width = width
		canvasf.height = height
		
		canvasd.width = width
		canvasd.height = height
		
		ctxo.drawImage(image, 0, 0, width, height);	
		ctxf.drawImage(image, 0, 0, width, height);
		
		
	}
	
}

function submit() {
	
	ctxd.clearRect(0, 0, width, height);
	
	var thresh = $("#thresh").val();
	var eps = $("#eps").val();
	var minPts = $("#minPts").val();
	var sharp = $("#sharp").val();	
	
	if (thresh == "") {thresh = 100;}
	if (eps == "") {eps = 15;}
	if (minPts == "") {minPts = 5;}
	if (sharp == "") {sharp = 0.6;}
	
	sharpen(ctxf, width, height, sharp);
	var corArr = findCorners(ctxf, width, height, thresh);	
	var P = DBSCAN(corArr, eps, minPts);
	
	for (var key in P) {
		var color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
		for (i = 0; i < P[key].length; i ++) {
			ctxd.fillStyle = color;
			ctxd.fillRect(P[key][i][0], P[key][i][1], 3, 3);
		}
	}
	ctxf.clearRect(0, 0, width, height);
	ctxf.drawImage(image, 0, 0, width, height);
}
