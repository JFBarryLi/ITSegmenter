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
	
	
	//Create a canvas for the segmented image
	var canvasf = document.createElement("CANVAS");	
	
	if (convertToImage == 0 && canvasId === undefined) {
		document.body.appendChild(canvaso);
	}
	
	var width;
	var height;
	
	//Original image drawing context on the canvas
	var contexto = canvaso.getContext("2d");	
	//Segmented image drawing context on the canvas
	var contextf = canvasf.getContext("2d");																	
	
	image.onerror = function() {
		alert("Image Error");
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

function scaleCanvas(scale, canvasOutput, canvasOriginal) {
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
 * canvasOutput:	element
 *					Canvas element to scale
 *
 * canvasOriginal:	element
 *					Original canvas element to be referenced
 *
 */	

	var w = canvasOriginal.width;
	var h = canvasOriginal.height;
	
	canvasOutput.width = canvasOriginal.width * scale;
	canvasOutput.height = canvasOriginal.height * scale;

	var ctx = canvasOutput.getContext("2d");
	ctx.drawImage(canvasOriginal, 0, 0, w, h, 0, 0, scale * w, scale * h);
	
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

function sharpen(ctx, w, h, dia, amt) {
/*
 * INFO:
 * -----
 * Convolution image filter to sharpen digital image using Unsharp Masking
 * Gaussian blur is approximated with 3 passes of a box blur
 * Box blur is separated into horizontal and vertical blur
 *
 * PARAM:
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
	//var blurred = TImage.blur(srcBuff, w, h, dia);
	var blurred = gaussBlur(srcBuff, w, h, dia);
 	//Create an unsharpMask by subtracting the Gaussian Blurred image from the original
	var unsharpMask = new Uint8ClampedArray(w*h*4);
		for (var i = 0; i < unsharpMask.length; i++) {
			unsharpMask[i] = srcBuff[i] - blurred[i];
		}
	
	//Add the unsharpMask to the original image, thus emphasizing the edges
	for (i = 0; i < outputData.data.length; i++) {
		outputData.data[i] = srcBuff[i] + amt * unsharpMask[i];
    }
	
	ctx.putImageData(outputData, 0, 0);
	
}

function gaussBlur(srcBuff, w, h, dia) {
/*
 * INFO:
 * -----
 * Gaussian blur approximation by passing Box Blur 3 times
 *
 * PARAM:
 * -----------
 * srcBuff: 			Uint8ClampedArray
 *						Source image data buffer
 *
 * w: 					int
 *        				Width of canvas
 *
 * h: 					int
 *        				Height of canvas
 *
 * dia: 				float
 *        				Diameter of blur
 *
 * RETURNS:
 * --------
 * boxBlurred3:			Float32Array
 *						Boxblurred 3 times image data [R, G, B, A, R2, G2, B2, A2, ...]
 *
 *
 */		

	//Calculate ideal kernel sizes
    var bxs = boxesForGauss(dia/4, 3);
	
	//Box Blur 3 times to approximate Gaussian blur
    var boxBlurred1 = boxBlur(srcBuff, w, h, bxs[0]);
	var boxBlurred2 = boxBlur(boxBlurred1, w, h, bxs[1]);
	var boxBlurred3 = boxBlur(boxBlurred2, w, h, bxs[2]);
	return boxBlurred3;
}

function boxesForGauss(sigma, n) {
/*
 * INFO:
 * -----
 * Calculates optimal box blur size for each passes to approximate Gaussian Blur
 * http://www.peterkovesi.com/papers/FastGaussianSmoothing.pdf
 *
 * PARAM:
 * -----------
 * sigma: 				float
 *						Standard deviation for Gaussian Blur
 *
 * n: 					int
 *        				Number of passes
 *
 * RETURNS:
 * --------
 * sizes:				Array
 *						Array of box blur sizes for each pass
 *
 *
 */	
	
	//Ideal width of kernel
    var wIdeal = Math.sqrt((12 * sigma * sigma / n) + 1);
	
	//First odd integer less than wIdeal
    var wl = Math.floor(wIdeal);  
	
	if(wl % 2 == 0) {
		wl--;
	}
	
	//First odd integer greater than wIdeal
    var wu = wl + 2;
	
	//Ideal number of passes
    var mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
    var m = Math.round(mIdeal);
		
	//Ideal width of kernel for each pass
    var sizes = [];  
	for (var i=0; i<n; i++) {
		sizes.push(i < m ? wl:wu);
	}
    return sizes;
	
}

function boxBlur(srcBuff, w, h, kernelWidth) {
/*
 * INFO:
 * -----
 * Box Blur by separable convolution
 * Vertical convolve then horizontal convolve
 *
 * PARAM:
 * -----------
 * srcBuff: 			Uint8ClampedArray
 *						Source image data buffer
 *
 * w: 					int
 *        				Width of canvas
 *
 * h: 					int
 *        				Height of canvas
 *
 * kernelWidth: 		int
 *        				Width of the convolving kernel
 *
 * RETURNS:
 * --------
 * blurred:				Float32Array
 *						Blurred image data [R, G, B, A, R2, G2, B2, A2, ...]
 *
 *
 */			

	var vertical = boxBlurV(srcBuff, w, h, kernelWidth);
	var blurred = boxBlurH(vertical, w, h, kernelWidth);
	return blurred;
}

function boxBlurV(srcBuff, w, h, kernelWidth) {
/*
 * INFO:
 * -----
 * Vertical convolution
 *
 * PARAM:
 * -----------
 * srcBuff: 			Uint8ClampedArray
 *						Source image data buffer
 *
 * w: 					int
 *        				Width of canvas
 *
 * h: 					int
 *        				Height of canvas
 *
 * kernelWidth: 		int
 *        				Width of the convolving kernel
 *
 * RETURNS:
 * --------
 * output:				Float32Array
 *						Vertically convolved image data [R, G, B, A, R2, G2, B2, A2, ...]
 *
 *
 */	
 
    var halfkernelWidth = Math.floor(kernelWidth / 2);
    var output = new Float32Array(w * h * 4);

	var sy, sx, offset, r, g, b, a, scy, scx, poffset, wt;
	
	//Loop through each column
	for (var x = 0; x < w; x++) {
		
		//Loop through each cell in the column
		for (var y = 0; y < h; y++) {
			sy = y;
			sx = x;
			offset = (y * w + x) * 4;
			r = 0;
			g = 0;
			b = 0;
			a = 0;
			
			//Sum up the values on the column based on the kernel size for each channel
			for (var cy = 0; cy < kernelWidth; cy++) {
				scy = Math.min(h - 1, Math.max(0, sy + cy - halfkernelWidth));
				scx = sx;
				poffset = (scy * w + scx) * 4;
				r += srcBuff[poffset];
				g += srcBuff[poffset + 1];
				b += srcBuff[poffset + 2];
				a += srcBuff[poffset + 3];
			}
			
			//Setting output image data to average value for each channel
			wt = 1 / kernelWidth
			output[offset] = r * wt;
			output[offset + 1] = g * wt;
			output[offset + 2] = b * wt;
			output[offset + 3] = a * wt;
		}
	}
    return output;
}


function boxBlurH(vertical, w, h, kernelWidth) {
/*
 * INFO:
 * -----
 * Horizontal convolution
 *
 * PARAM:
 * -----------
 * srcBuff: 			Uint8ClampedArray
 *						Source image data buffer
 *
 * w: 					int
 *        				Width of canvas
 *
 * h: 					int
 *        				Height of canvas
 *
 * kernelWidth: 		int
 *        				Width of the convolving kernel
 *
 * RETURNS:
 * --------
 * output:				Float32Array
 *						Horizontally convolved image data [R, G, B, A, R2, G2, B2, A2, ...]
 *
 *
 */		

    var kernelWidth = kernelWidth;
    var halfkernelWidth = Math.floor(kernelWidth / 2);
    var output = new Float32Array(w * h * 4);
	
	var sy, sx, offset, r, g, b, a, scy, scx, poffset, wt;

	//Loop through each row
    for (var y = 0; y < h; y++) {
		
		//Loop through each cell in the row
		for (var x = 0; x < w; x++) {
			sy = y;
			sx = x;
			offset = (y * w + x) * 4;
			r = 0;
			g = 0;
			b = 0;
			a = 0;
			
			//Sum up the values on the row based on the kernel size for each channel
			for (var cx = 0; cx < kernelWidth; cx++) {
				scy = sy;
				scx = Math.min(w - 1, Math.max(0, sx + cx - halfkernelWidth));
				poffset = (scy * w + scx) * 4;
				r += vertical[poffset];
				g += vertical[poffset + 1];
				b += vertical[poffset + 2];
				a += vertical[poffset + 3];
			}
			
			//Setting output image data to average value for each channel
			wt = 1 / kernelWidth;
			output[offset] = r * wt;
			output[offset + 1] = g * wt;
			output[offset + 2] = b * wt;
			output[offset + 3] = a * wt;
		}
	}
    return output;	
}


/* --------------------------------------------------------------------------------------------------------------- */
 
function DBSCAN(arr, eps, minPts) {      
/*
 * INFO:
 * -----
 * Javascript Implementation of DBSCAN
 * Group points into cluster based on density by constructing a kdTree, then performing rangeQuery to find neighbours
 *
 * PARAM:
 * -----------
 * arr: 			Array: [[x1, y1], [x2,y2], ...]
 *					The input array to DBSCAN, where x and y correspond to the coordinates of a point.
 *
 * eps: 			int
 *      			Maximum distance between two points to be considered neighbours
 *
 * minPts: 			int
 *		   			Minimum number of points required to form a cluster
 *
 * RETURNS:
 * --------
 * clusters: 		obj
 *		   			clusters = {key = clusterID : value = [[x1,y1],[x2,y2],...], ...}
 */

	var index = kdbush(arr);	
	// var indesx = new kdTree(arr);
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
		//Seed set should be the Neighbours set / current point, but it doesn't make any difference and it's slower than not excluding the current point
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
/*
 * INFO:
 * -----
 * Perform RangeQuery in a k-d Tree data structure
 * Similar to KNN search
 * Returns k-nearest neighbours within a radius of a point
 *
 * PARAM:
 * -----------
 * arr: 			Array: [[x1, y1], [x2,y2], ...]
 *					The input array to DBSCAN, where x and y correspond to the coordinates of a point.
 *
 * Pt:	 			Array: [x, y]
 *					Point array containing co-ordinates
 *
 * eps: 			int
 *      			Maximum distance between two points to be considered neighbours
 *
 * index: 			obj
 *		   			Indexed k-d Tree
 *
 * RETURN:
 * --------
 * Neighbours: 		Array: [[x1, y1], [x2,y2], ...]
 *		   			Array containing neighbouring points
 */
 
	var Neighbours = index.within(Pt[0], Pt[1], eps).map(function(id) { return arr[id]; });
	// var Neighbours = index.rangeSearch(Pt[0], Pt[1], eps);
	return Neighbours;
}

function distFunc(Q, P) {
/*
 * INFO:
 * -----
 * Calculates the Euclidean Distance between 2 points
 *
 * Parameters:
 * -----------
 * Q:	 			Array: [x, y]
 *					Point array containing co-ordinates
 *
 * P:	 			Array: [x, y]
 *					Point array containing co-ordinates
 *
 * Returns:
 * --------
 * D: 				float
 *		   			Distance float
 */
 
	D = Math.sqrt(Math.pow((P[0]-Q[0]),2)+Math.pow((P[1]-Q[1]),2)); 	
	return D;
}

function kdTree(points) {
	var nodes = [];	
	var tempPoints = points;
	kdTreeIndex(tempPoints, 0);
	this.nodes = nodes;
	this.rootNode = nodes[nodes.length - 1];
	//return nodes;
	
	function kdTreeIndex(points, depth) {
		
		//axis(0) --> x-axis, axis(1) --> y-axis
		var axis = depth % 2;
		var len = points.length;
		
		//kth order statistics
		var k = Math.floor((points.length - 1) / 2);
		var bound = points.length - 1;
		
		//select median by axis from points;
		if (k >= 0) {
			var median = quickSelect(points, 0, bound, k, axis);
		} else {
			return;
		}
		
		var tempNode = new node;
		
		//Set node position to median
		tempNode.position = median;
		
		//Populate children nodes if the array contain more than 1 element and kth order is greater than 0
		if (len > 1 && k >= 0) {
				//kdTree points smaller or equal median
				tempNode.leftChild = kdTreeIndex(points.slice(0, k), depth + 1);
				//kdTree points larger median
				tempNode.rightChild = kdTreeIndex(points.slice(k + 1, bound + 1), depth + 1);
		}
		
		tempNode.depth = depth;
		
		nodes.push(tempNode);
		return tempNode;
	}
	
	function node(position, leftChild, rightChild, depth, region) {
		this.position = position;
		this.leftChild = leftChild;
		this.rightChild = rightChild;
		this.depth = depth; 
		this.region = region;
	}
	
	//TODO####
	this.rangeSearch = function(x, y, r) {
		var Neighbours = [];
		rangeSearch(x, y, r, this.rootNode, Neighbours);
		return Neighbours;
	};
		
}

function rangeSearch(x, y, r, node, Neighbours) {
	
	var rSquare = r * r;
	
	//If the node is a leaf and its squareDist to x,y is less than rSquare, add it to the Neighbours array
	if (node.leftChild == undefined && node.rightChild == undefined) {
		if (squareDist(node.position, [x,y]) <= rSquare) {
			Neighbours.push(node.position);
		}
		return;
		
	//If a node's range is completely within the r-hypersphere then it and all its decendent are added to Neighbours
/* 	} else if ("node's region is completely inside r") {
		// add node and all it's decendent to Neighbourts
		var descendants = [];
		getDescendants(node, descendants);
		Neighbours.push(node.position);
		Neighbours.push.apply(Neighbours, descendants);
		return;
		 */
	//If the node's range intersect the r-hypersphere, recursively search through its children	
	} else if (intersects(x, y, node, r)) {
		if (squareDist(node.position, [x,y]) <= rSquare) {
			Neighbours.push(node.position);
		}
		
		if (node.leftChild != undefined) {
			rangeSearch(x, y, r, node.leftChild, Neighbours);
		}
		
		if (node.rightChild != undefined) {
			rangeSearch(x, y, r, node.rightChild, Neighbours);
		}
		return;
	} else {
		if (node.leftChild != undefined) {
			rangeSearch(x, y, r, node.leftChild, Neighbours);
		}
		
		if (node.rightChild != undefined) {
			rangeSearch(x, y, r, node.rightChild, Neighbours);
		}
	}
	
}

function getDescendants(node, descendants) {
/*
 * INFO:
 * -----
 * Recursively push the position of a node's descendants into the descendants array
 *
 * PARAM:
 * -----------
 * node:	 			obj
 *						node object 
 *
 * descendants:	 		Array: [[x1, y1], [x2,y2], ...]
 *						Point array containing descendant positions
 *
 */	
	
	
	if (node.leftChild != undefined) {
		descendants.push(node.leftChild.position);
		getDescendants(node.leftChild, descendants);
	}
	
	if (node.rightChild != undefined) {
		descendants.push(node.rightChild.position);
		getDescendants(node.rightChild, descendants);
	}
	
}

function intersects(x, y, node, r) {
/*
 * INFO:
 * -----
 * Check if a node intersects with a query point with radius r
 *
 * PARAM:
 * -----------
 *
 * x:	 				int
 *						query point x coordinates
 *
 * y:					int
 *						query point y coordinates
 *
 * node:	 			obj
 *						node object 
 *
 * r:					int
 *						radius of query circle
 *
 * RETURNS:
 * --------
 * truth: 				bol
 *						true/false
 */
	
	var rSquare = r * r;
	var axis = node.depth % 2;
	
	if (axis == 0 && squareDist([x, y], [node.position[0], y]) <= rSquare) {
		return true;	
	} else if (axis == 1 && squareDist([x, y], [x, node.position[1]]) <= rSquare) {
		return true;
	} else {
		return false;
	}
	
}

function squareDist(P, Q) {
/*
 * INFO:
 * -----
 * Calculates the square distance between two points to compare distance without using square roots
 *
 * PARAM:
 * -----------
 * P: 					Array: [x, y]
 *						2D Point in an array
 *
 * Q:	 				Array: [x, y]
 *						2D Point in an array
 *
 * RETURNS:
 * --------
 * sD: 					float
 *						Square distance
 */
	
	var dx = P[0] - Q[0];
	var dy = P[1] - Q[1];
	
	sD = dx * dx + dy * dy;
	
	return sD;
}

function quickSelect(points, left, right, k, axis) {
/*
 * INFO:
 * -----
 * Selects the k-th smallest element of an array within left-right recursively
 *
 * PARAM:
 * -----------
 * points: 				Array: [[x1, y1], [x2,y2], ...]
 *						The input array, where x and y correspond to the coordinates of a point.
 *
 * left:	 			int
 *						Leftmost index
 *
 * right:				int
 *						Rightmost index
 *
 * k:					int
 *						kth order statistics
 *
 * axis:				bol
 *						0 = x-axis, 1 = y-axis
 *
 * RETURNS:
 * --------
 * points[k]: 			int
 *						New Pivot index
 */

	//If the array contain only one point return that point
	if (left == right) {
		return points[left];
	}
	
	//Select a random pivotIndex between left and right
	pivotIndex = Math.floor(Math.random() * (right - left + 1) + left);

	pivotIndex = partition(points, left, right, pivotIndex, axis);
	
	//If pivot is in the finaly sorted position return that point else recurse
	if (k == pivotIndex) {
		return points[k];
	} else if (k < pivotIndex) {
		return quickSelect(points, left, pivotIndex - 1, k, axis);
	} else {
		return quickSelect(points, pivotIndex + 1, right, k, axis);
	}
	
}

function partition(points, left, right, pivotIndex, axis) {
/*
 * INFO:
 * -----
 * Partition array of points about a pivot
 *
 * PARAM:
 * -----------
 * points: 				Array: [[x1, y1], [x2,y2], ...]
 *						The input array, where x and y correspond to the coordinates of a point.
 *
 * left:	 			int
 *						Leftmost index
 *
 * right:				int
 *						Rightmost index
 *
 * pivotIndex:			int
 *						Pivot index
 *
 * axis:				bol
 *						0 = x-axis, 1 = y-axis
 *
 * RETURNS:
 * --------
 * storeIndex: 			int
 *						New Pivot index
 */
	
	pivotVal = points[pivotIndex][axis];
	
	//Move pivot to end
	swap(points, pivotIndex, right);	
	
	var storeIndex = left;
	
	for (var i = left; i <= right - 1; i++) {
		//If the point is smaller than the pivotVal then swap it with storeIndex and increment storeIndex
		if (points[i][axis] < pivotVal) {
			swap(points, storeIndex, i);
			storeIndex++;
		}
	}
	
	//Move pivot to final position
	swap(points, right, storeIndex);
	
	return storeIndex;
}

function swap(points , A, B) {
/*
 * INFO:
 * -----
 * Swap the index between points[A] and points[B]
 *
 * PARAM:
 * -----------
 * points: 			Array: [[x1, y1], [x2,y2], ...]
 *					The input array, where x and y correspond to the coordinates of a point.
 *
 * A: 				int
 *      			Index of point A
 *
 * B: 				int
 *      			Index of point B
 *
 */

	var swapTemp = points[A];
	points[A] = points[B];
	points[B] = swapTemp;
}


/* --------------------------------------------------------------------------------------------------------------- */
