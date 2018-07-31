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
			$( "<p>"+width+"x"+height+"</p>" ).insertBefore( $("#"+canvasId).parent() );			
		}
	}
	drawCanvas("img/demo.jpg", "demo-canvas1");
	drawCanvas("img/demo2.jpg", "demo-canvas2");
	drawCanvas("img/demo3.jpg", "demo-canvas3");
	
	$('#radioDemo2').prop('checked', true);
	document.getElementById('demo-canvas2').style.border = '#f25e5e 3px solid'
	
}



function canvasSelect(id) {
	$('#radioDemo' + id).prop('checked', true);
	if (id == '1') {
		document.getElementById('demo-canvas1').style.border = '#f25e5e 3px solid'
		document.getElementById('demo-canvas2').style.border = ''
		document.getElementById('demo-canvas3').style.border = ''
	} else if (id == '2') {
		document.getElementById('demo-canvas1').style.border = ''
		document.getElementById('demo-canvas2').style.border = '#f25e5e 3px solid'
		document.getElementById('demo-canvas3').style.border = ''
	} else if (id == '3') {
		document.getElementById('demo-canvas1').style.border = ''
		document.getElementById('demo-canvas2').style.border = ''
		document.getElementById('demo-canvas3').style.border = '#f25e5e 3px solid'
	}
}

function submit() {
	
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
	
	if ($('#radioDemo1').prop('checked')) {
		src = "img/demo.jpg";
		canvas = "demo-canvas1";
		$( "<p>Thresh: "+thresh+" | "+"Eps: "+eps+" | "+"minPts: "+minPts+" | "+"<br>"+"dia: "+dia+" | "+"amt: "+amt+"</p>" ).insertAfter( $("#demo-canvas1").parent() );
	} else if ($('#radioDemo2').prop('checked')) {
		src = "img/demo2.jpg";
		canvas = "demo-canvas2";
		$( "<p>Thresh: "+thresh+" | "+"Eps: "+eps+" | "+"minPts: "+minPts+" | "+"<br>"+"dia: "+dia+" | "+"amt: "+amt+"</p>" ).insertAfter( $("#demo-canvas2").parent() );
	} else if ($('#radioDemo3').prop('checked')) {
		src = "img/demo3.jpg";
		canvas = "demo-canvas3";
		$( "<p>Thresh: "+thresh+" | "+"Eps: "+eps+" | "+"minPts: "+minPts+" | "+"<br>"+"dia: "+dia+" | "+"amt: "+amt+"</p>" ).insertAfter( $("#demo-canvas3").parent() );
	}
	
	textSegment(src, thresh, eps, minPts, dia, amt, 1, 0, 0, canvas);
}
