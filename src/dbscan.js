var width, height;
var canvasd;
var ctxd;

window.onload = function() {
	canvasd = document.getElementById("dbscan-canvas");
	ctxd = canvasd.getContext("2d");
	
	drawCanvas("img/demo.jpg", "demo-canvas1");
	drawCanvas("img/demo2.jpg", "demo-canvas2");
	drawCanvas("img/demo3.jpg", "demo-canvas3");
	
	$('#radioDemo2').prop('checked', true);
	document.getElementById('demo-canvas2').style.border = '#f25e5e 3px solid'
	
}

function drawCanvas(src, canvasId) {
	var image = new Image();
	image.src = src;
	
	var canvas = document.getElementById(canvasId);
	var ctx = canvas.getContext("2d");
	
	image.onload = function() {
		width = image.width;
		height = image.height;
		
		canvas.width = width;
		canvas.height = height;
		
		canvasd.width = width;
		canvas.height = height;
		
		ctx.drawImage(image, 0, 0, width, height);		
	}
}

function canvasSelect(id) {
	$('#radioDemo' + id).prop('checked', true);
	if (id == '1') {
		$('#demo-canvas1').css('border', '#f25e5e 3px solid');
		$('#demo-canvas2').css('border', '');
		$('#demo-canvas3').css('border', '');
	} else if (id == '2') {
		$('#demo-canvas1').css('border', '');
		$('#demo-canvas2').css('border', '#f25e5e 3px solid');
		$('#demo-canvas3').css('border', '');
	} else if (id == '3') {
		$('#demo-canvas1').css('border', '');
		$('#demo-canvas2').css('border', '');
		$('#demo-canvas3').css('border', '#f25e5e 3px solid');
	}
}

function tempCanvas(src) {
	var image = new Image();
	image.src = src;
	
	var canvasf = document.createElement("canvas")
	var ctxf = canvasf.getContext("2d");
	
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
	
	image.onload = function() {
		width = image.width;
		height = image.height;
		
		canvasf.width = width;
		canvasf.height = height;
		
		canvasd.width = width;
		canvasd.height = height;
		
		ctxf.drawImage(image, 0, 0, width, height);	

		sharpen(ctxf, width, height, dia, amt);
		var corArr = findCorners(ctxf, width, height, thresh);	
		var P = DBSCAN(corArr, eps, minPts);

		for (var key in P) {
			var color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
			for (i = 0; i < P[key].length; i ++) {
				ctxd.fillStyle = color;
				ctxd.fillRect(P[key][i][0], P[key][i][1], 3, 3);
			}
		}
	}
	
}

function submitData() {
	ctxd.clearRect(0, 0, width, height);
	
	
	if ($('#radioDemo1').prop('checked')) {
		src = "img/demo.jpg";
		tempCanvas(src);
	} else if ($('#radioDemo2').prop('checked')) {
		src = "img/demo2.jpg";
		tempCanvas(src);
	} else if ($('#radioDemo3').prop('checked')) {
		src = "img/demo3.jpg";
		tempCanvas(src);
	}
	
	$(window).scrollTo('#dbscan-canvas',300);

}
