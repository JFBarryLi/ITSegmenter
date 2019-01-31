/**
 * Author: Barry Li
 * Javascript Image Text Segmentation
 * 
 * Segments an image containing text into blocks of text
 *
 * https://github.com/JFBarryLi/ITSegmenter
 *
 */

include("src\\findCorners.js");
include("src\\unsharpMasking.js");
include("src\\DBSCAN.js");
include("src\\kdTree.js");
 
 
var outputRects = {};
 
 function textSegment(imgPath, fThreshhold, eps, minPts, dia, amt, drawRects, splitRects, convertToImage, canvasId) {
/*
 * INFO:
 * -----
 * Image Text Segmentation by detecting corners using FAST and Unsharp Masking
 * Clustering corners together using DBSCAN with a kd-Tree data structure
 * Drawing bounding boxes on the resulting cluster
 *
 * PARAM:
 * -----------
 * imgPath: 			string
 * 						File path to the image
 *
 * fThreshhold: 		int
 * 						Fast Threshhold; Default:100, higher = less corners
 *
 * eps: 				int
 *      				Maximum distance between two p.oints to be considered neighbours; Default:15
 *
 * minPts: 				int
 *		   				Minimum number of points required to form a cluster; Default:5
 *
 * dia: 				float
 *						diameter Gaussian blur diameter, must be greater than 1.
 *
 * amt: 				float
 *						Scalar of Unsharp Mask
 *
 * drawRects: 			bol
 * 						Option to draw bounding boxes on the image; Default:0
 *
 * splitRects: 			bol
 * 						Option to split the text segments into individual images; Default:0
 *
 * convertToImage:		bol
 *						Option to convert canvas to image
 *
 * canvasId:			string
 *						Option to segment a specific canvas
 *
 *
 * RETURNS:
 * --------
 * outputRects:			obj
 *						Dicitonary of clusters and their corresponding bounding box. outputRects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 * 
 */
 
	//Default values
	if (fThreshhold === undefined) { fThreshhold = 100};
	if (eps === undefined) { eps = 15};
	if (minPts === undefined) { minPts = 5};
	if (dia === undefined) { sharpness = 10};
	if (amt === undefined) { sharpness = 1};
	if (drawRects === undefined) { drawRects = 0};
	if (splitRects === undefined) { splitRects = 0};
	if (convertToImage === undefined) { convertToImage = 1};
	
	var begin = Date.now();
 
	var src = imgPath; 																							
	var image = new Image();
	image.src = src;
	
	if (canvasId === undefined) {
		//Create a canvas for the original image
		var canvaso = document.createElement("CANVAS");	
	} else {
		var canvaso = document.getElementById(canvasId);	
	}
	
	if (convertToImage == 0 && canvasId === undefined) {
		document.body.appendChild(canvaso);
	}
	
	var width;
	var height;
	
	//Original image drawing context on the canvas
	var contexto = canvaso.getContext("2d");																	
	
	image.onerror = function() {
		alert("Image Error");
	}
	
	image.onload = function() {
		width = image.width;
		height = image.height;
		
		canvaso.width = width
		canvaso.height = height

		//Scale factor to reduce to 400x400 pixels
		if (height * width > 160000) {
			var scale = Math.round(160000/height/width*100)/100
		} else {
			var scale = 1
		}
		var invScale = Math.round(1/scale*100)/100
		
		//Draw the original image to canvaso
		contexto.drawImage(image, 0, 0, width, height);	
		
		//Scaled canvas
		canvasf = scaleCanvas(scale, canvaso)
		//Scaled image drawing context on the canvas
		var contextf = canvasf.getContext("2d");															
		
		//Applies the sharpen filter to canvasf
		if (dia != 0) {
			sharpen(contextf, width*scale, height*scale, dia, amt);
		}
		//Find corners using FAST and stores the coordinates in an array
		var corArr = findCorners(contextf, width*scale, height*scale, fThreshhold);	
		
		//Group the corners together using DBSCAN and return clusters = {key = 1 : value = [[x1,y1],[x2,y2],...], ...}
 		var P = DBSCAN(corArr, eps, minPts); 
		
		//Scale P backto original size
		Object.keys(P).map(function(key, index) {
			var scaledArray = P[key].map(function(ele) {
				return [ele[0] * invScale, ele[1] * invScale];
			});
		  P[key] = scaledArray;
		});
		
		//Constructs bounding box for each cluster of text	
		outputRects = textRect(contexto, P);																		 

		if (drawRects == 1 && convertToImage == 1) {
			var fImg = document.createElement("img")
			//Set the src of the img element to canvaso
			fImg.setAttribute('src', canvaso.toDataURL("image/png"));
			document.body.appendChild(fImg);
		}
		
		if (splitRects == 1) {
			//Crop the image into segments of texts
			cropRects(outputRects,image);
		}
		console.log(Date.now() - begin);
		return outputRects;
	} 
}

function findCorners(ctx, width, height, fThreshhold) {
/*
 * INFO:
 * -----
 * Features from Accelerated Segment Test (FAST) Corner detection
 * https://github.com/eduardolundgren/tracking.js/blob/master/src/features/Fast.js
 *
 * PARAM:
 * -----------
 * ctx: 				obj 
 *						Canvas context object
 *
 * width:				int
 *        				Width of the canvas
 *
 * height: 				int
 *		   				Height of the Canvas
 *
 * fThreshhold: 		int
 *						FAST threshhold 
 * RETURNS:
 * --------
 * outArr:				array
 *		   				[[x1,y1],[x2,y2],...]
 */	
	var outArr = [];
	Fast.THRESHOLD = fThreshhold;
	
	//Get image data from the canvas	
	var imageData = ctx.getImageData(0, 0, width, height);		
	//Convert the image into gray scale
	var gray = TImage.grayscale(imageData.data, width, height);
	//Find all the corners using FAST	
	var corners = Fast.findCorners(gray, width, height);
	
	for (var i = 0; i < corners.length; i += 2) {
		//Append the coordinate of each corner into the output array
		outArr.push([corners[i],corners[i + 1]]);
	}
	return outArr;
}


function textRect(ctx, P) {
/*
 * INFO:
 * -----
 * Draw bounding boxes for each cluster
 *
 * PARAM:
 * -----------
 * ctx: 				obj 
 *						Canvas context object
 *
 * P: 					array
 *        				Output of DBSCAN; P = {key = 1 : value = [[x1,y1],[x2,y2],...], ...}
 *
 * RETURNS:
 * --------
 * rects:				obj
 *						Dicitonary of clusters and their corresponding bounding box. rects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 *
 *
 */	
	var rects = {};	
	var centroids = [];
	
	//Set counter to 0
	C = 0;
	for (var key in P) {
		//Calculates the maximum x value in the cluster
		var xMax = Math.max.apply(null, P[key].map(function(elt) { return elt[0]; }));
		//Calculates the minimum x value in the cluster
		var xMin = Math.min.apply(null, P[key].map(function(elt) { return elt[0]; }));
		//Calculates the maximum y value in the cluster
		var yMax = Math.max.apply(null, P[key].map(function(elt) { return elt[1]; }));
		//Calculates the minimum y value in the cluster
		var yMin = Math.min.apply(null, P[key].map(function(elt) { return elt[1]; }));
		
		var h = yMax - yMin;
		var w = xMax - xMin;
		
		//Skip the noise cluster
		if (key == 'noise') { continue; }
		
		//Draw the bounding box for the cluster
		drawPoly(ctx, [Math.max(0, xMin-5), Math.max(0, yMin-5)], [Math.max(0, xMin-5), Math.max(0, yMax+5)], [Math.max(0, xMax+5), Math.max(0, yMax+5)], [Math.max(0, xMax+5), Math.max(0, yMin-5)]);
		C = C + 1;
		
		//Rectangle Object; Rects {} = {Key = C : Value = [xMin, xMax, yMin, yMax]}
		rects[C] = [Math.max(0, xMin-5), Math.max(0, xMax+5), Math.max(0, yMin-5), Math.max(0, yMax+5)];
		
		//Centroids Array; Centroids [] = [[x1, y1], [x2, y2], ...]
		centroids.push([Math.round(xMin+(xMax-xMin)/2), Math.round(yMin+(yMax-yMin)/2),,C]);
	}
	return rects;
}

function drawPoly(ctx, UL, LL, LR, UR) {
/*
 * INFO:
 * -----
 * Draw polygons
 *
 * PARAM:
 * -----------
 * ctx: 			obj 
 *					Canvas context object
 *
 * UL: 				array
 *        			Upper Left Coordinates; UL = [x,y]
 *
 * LL: 				array
 *					Lower Left Coordinates; LL = [x,y]
 *
 * LR: 				array
 *					Lower Right Coordinates; LR = [x,y]
 *
 * UR: 				array
 *					Upper Right Coordinates; UR = [x,y]
 *
 */		
	ctx.beginPath();
	ctx.moveTo(UL[0],UL[1]);
	ctx.lineTo(LL[0],LL[1]);
	ctx.lineTo(LR[0],LR[1]);
	ctx.lineTo(UR[0],UR[1]);
	ctx.closePath();
	ctx.stroke();
}

function cropRects(rects,img) {
/*
 * INFO:
 * -----
 * Crop bounding boxes out of an image
 *
 * PARAM:
 * -----------
 * rects:			obj
 *					Dicitonary of clusters and their corresponding bounding box. rects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 *
 * img: 			obj 
 *					Image object
 *
 */				
	var tempCanvas = document.createElement("canvas");
	var tCtx = tempCanvas.getContext("2d");	
	
	for (var i = 1; i <= Object.keys(rects).length; i++) {	
		var width = rects[i][1] - rects[i][0];
		var height = rects[i][3] - rects[i][2];
		tempCanvas.width = width;
		tempCanvas.height = height;
		
		//Draw cropped image on tempCanvas
		tCtx.drawImage(img, rects[i][0], rects[i][2], width, height, 0, 0, width, height);						

		var cImg = document.createElement("img");
		
		//Set image src to tempCanvas DataURL
		cImg.setAttribute('src', tempCanvas.toDataURL("image/png"));
		document.body.appendChild(cImg);
	}

		
}

function scaleCanvas(scale, canvasOriginal) {
/*
 * INFO:
 * -----
 * Scale canvas
 * Use for down sampling a canvas prior to processing
 *
 * PARAM:
 * -----------
 * scale:			float
 *					Scalar parameter for canvas width and height
 *
 * canvasOriginal:	element
 *					Original canvas element to be referenced
 *
 * RETURNS:
 * --------
 * canvasScaled:	canvas
 *					Scaled canvas
 *
 */	

	var w = canvasOriginal.width;
	var h = canvasOriginal.height;
	
	var canvasScaled = document.createElement("CANVAS")
	
	canvasScaled.width = canvasOriginal.width * scale;
	canvasScaled.height = canvasOriginal.height * scale;

	var ctx = canvasScaled.getContext("2d");
	ctx.drawImage(canvasOriginal, 0, 0, w, h, 0, 0, scale * w, scale * h);
	
	return canvasScaled;
}

function include(url) {
/*
 * INFO:
 * -----
 * Load script files
 *
 * PARAM:
 * -----------
 * url:				string
 *					path and filename; path//js//example.js
 *
 */			
	
	var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    head.appendChild(script);
}




