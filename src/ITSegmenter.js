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
include("src\\kdbush.js");
 
 
var outputRects = {};
 
 function textSegment(imgPath, fThreshhold, eps, minPts, dia, amt, drawRects, splitRects, convertToImage, canvasId) {
/* 
 * Parameters:
 * -----------
 * imgPath: 			string
 * 						File path to the image
 *
 * fThreshhold: 		int
 * 						Fast Threshhold; Default:100, higher = less corners
 *
 * eps: 				int
 *      				Maximum distance between two points to be considered neighbours; Default:15
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
 * Returns:
 * --------
 * outputRects:			obj
 *						Dicitonary of clusters and their corresponding bounding box. outputRects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 * 
 */
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
	
	
	//Create a canvas for the segmented image
	var canvasf = document.createElement("CANVAS");	
	
	if (convertToImage == 0 && canvasId === undefined) {
		canvaso.setAttribute("style", "display:block; margin-left: auto; margin-right: auto;");
		document.body.appendChild(canvaso);
	}
	
	var width;
	var height;
	
	//Original image drawing context on the canvas
	var contexto = canvaso.getContext("2d");	
	//Segmented image drawing context on the canvas
	var contextf = canvasf.getContext("2d");																	
	
	image.onerror = function() {
		alert("Image path not valid");
	}
	
	image.onload = function() {
		width = image.width;
		height = image.height;
		
		canvaso.width = width
		canvaso.height = height
		
		canvasf.width = width
		canvasf.height = height
		
		//Draw the original image to canvaso
		contexto.drawImage(image, 0, 0, width, height);	
		//Draw the original image to canvasf
		contextf.drawImage(image, 0, 0, width, height);															
		
		//Applies the sharpen filter to canvasf
		if (dia != 0) {
			sharpen(contextf, width, height, dia, amt);
		}
		//Find corners using FAST and stores the coordinates in an array
		var corArr = findCorners(contextf, width, height, fThreshhold);	
		
		//Group the corners together using DBSCAN and return clusters = {key = 1 : value = [[x1,y1],[x2,y2],...], ...}
 		var P = DBSCAN(corArr, eps, minPts); 
		
		//Constructs bounding box for each cluster of text	
		outputRects = textRect(contexto, P);																		 

		if (drawRects == 1 && convertToImage == 1) {
			var fImg = document.createElement("img")
			//Set the src of the img element to canvaso
			fImg.setAttribute('src', canvaso.toDataURL("image/png"));
			fImg.setAttribute("style", "display:block; margin-left: auto; margin-right: auto;");
			document.body.appendChild(fImg);
		}
		var br = document.createElement("br");
		document.body.appendChild(br);
		
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
 * Parameters:
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
 * Returns:
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
		ctx.fillStyle = '#f00';
		//Paint a pixel for every corner found
		ctx.fillRect(corners[i], corners[i + 1], 1, 1);
		//Append the coordinate of each corner into the output array
		outArr.push([corners[i],corners[i + 1]]);
	}
	return outArr;
}


function textRect(ctx, P) {
/*
 * Parameters:
 * -----------
 * ctx: 				obj 
 *						Canvas context object
 *
 * P: 					array
 *        				Output of DBSCAN; P = {key = 1 : value = [[x1,y1],[x2,y2],...], ...}
 *
 * Returns:
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
 * Parameters:
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
 * Parameters:
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
		cImg.setAttribute("style", "display:block; margin-left: auto; margin-right: auto;");
		document.body.appendChild(cImg);
	 
		var br = document.createElement("br");
		document.body.appendChild(br);
	}

		
}


function include(url) {
/*
 * Parameters:
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

/**
 * Image Sharpening using Unsharp Masking
 * 
 */
function sharpen(ctx, w, h, dia, amt) {
/*
 * Parameters:
 * -----------
 * ctx: 			obj 
 *					Canvas context object
 *
 * w: 				int
 *					Width of the image
 *
 * h: 				int
 *					Height of the image
 *
 * dia: 			float
 *					diameter Gaussian blur diameter, must be greater than 1.
 *
 * amt: 			float
 *					Scalar of Unsharp Mask
 *
*/	
	
	var outputData = ctx.createImageData(w, h);
	
	var srcBuff = ctx.getImageData(0, 0, w, h).data;
	
	//Gaussian Blur on the image
	var blurred = TImage.blur(srcBuff, w, h, dia);
	
	//Create an unsharpMask by subtracting the Gaussian Blurred image from the original
	//IE doesn't support map on Uint8ClampedArray
	try {
		var unsharpMask = srcBuff.map(function(item, index) {
			return item - blurred[index];
		});
	}
	catch(err) {
		var srcBuff = Array.prototype.slice.call(srcBuff);
		var unsharpMask = srcBuff.map(function(item, index) {
			um = item - blurred[index];
			if (um > 255) {
				um = 255;
			} else if (um < 0) {
				um = 0;
			}
			return Math.round(um);
		});
	}
	
	//Add the unsharpMask to the original image, thus emphasizing the edges
	for (i = 0; i < outputData.data.length; i++) {
		outputData.data[i] = srcBuff[i] + unsharpMask[i];
    }
	
	ctx.putImageData(outputData, 0, 0);
	
}


/* --------------------------------------------------------------------------------------------------------------- */



/**
 * Javascript Implementation of DBSCAN using K-Dimensional trees for Range Query
 * 
 */
 
function DBSCAN(arr, eps, minPts) {
        
/*
 * Parameters:
 * -----------
 * arr: 			[[x1, y1], [x2,y2], ...]
 *					The input array to DBSCAN, where x and y correspond to the coordinates of a point.
 *
 * eps: 			int
 *      			Maximum distance between two points to be considered neighbours
 *
 * minPts: 			int
 *		   			Minimum number of points required to form a cluster
 *
 * Returns:
 * --------
 * clusters: 		obj
 *		   			clusters = {key = clusterID : value = [[x1,y1],[x2,y2],...], ...}
*/

	var index = kdbush(arr);	
	var cluster_id = {};
	
	//Cluster counter
	var C = 0 
	for (var i = 0; i < arr.length; i++) {
		
		//Check if already processed
		if (cluster_id[arr[i]] != undefined) { continue; } 
		//Find neighbours
		N = RangeQuery(arr, arr[i], eps, index); 
		
		if (N.length < minPts) {
			//Noise points
			cluster_id[arr[i]] = 'noise';
			continue;
		}
		
		//Next cluster
		C = C + 1; 
		
		//Expand Cluster --------------------------------------------------------------
		
		//Label initial point
		cluster_id[arr[i]] = C;
		
		//Seed set
		//Seed set should be the Neighbours set - current point, but it doesn't make any difference, since it will just get ignored
		var S = N;
		
		for (var j = 0; j < S.length; j++) {
			//Change noise to border point
			if (cluster_id[S[j]] == 'noise') { 
				cluster_id[S[j]] = C; 					
			} 							
			//Check if already processed
			if (cluster_id[S[j]] != undefined) { continue; } 
			
			//Label neighbour
			cluster_id[S[j]] = C
			
			//Find neighbours
			N = RangeQuery(arr, S[j], eps, index);
			
			//Density check
			if (N.length >= minPts) {
				//Add new neighbours to seed set
				S.push.apply(S,N); //Theorectically incorrect, but practically the same result as a union and much faster
				//S = [...new Set([...S, ...N])]; //Only works for ES6
			}
		}		
	}
	 
	var clusters = {};
	//This for loop converts cluster_id {key = [x,y]: value = cluster_id,...} to clusters{cluster_id : value = [[x1,y1],[x2,y2],...],...}
	for (var key in cluster_id) {	
		if (!(cluster_id[key] in clusters)) {							
			//Create a new key in the dicitonary
			clusters[cluster_id[key]] = [];	
		}
		//Append coordinates to a given key
		clusters[cluster_id[key]].push(key.split(","));
	}
	return clusters;

}
function RangeQuery(arr, Pt, eps, index) {
	//RangeQuery in a k-d tree 
	var Neighbours = index.within(Pt[0], Pt[1], eps).map(function(id) { return arr[id]; });
	return Neighbours;
}

function distFunc(Q, P) {
	//Euclidean distance
	D = Math.sqrt(Math.pow((P[0]-Q[0]),2)+Math.pow((P[1]-Q[1]),2)); 	
	return D;
}

/* --------------------------------------------------------------------------------------------------------------- */
