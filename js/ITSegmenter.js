/**
 * Author: Barry Li
 * Javascript Image Text Segmentation
 * 
 * Segments an image containing text into blocks of text
 *
 * https://github.com/JFBarryLi/ITSegmenter
 *
 */

include("js\\findcorners.js");
include("js\\setOps.js");
 
var outputRects = {};
 
 function textSegment(imgPath, fThreshhold, eps, minPts, sharpness, drawRects, splitRects) {
/* 
 * Parameters:
 * -----------
 * imgPath: 	String
 * 				File path to the image
 *
 * fThreshhold: int
 * 				Fast Threshhold; Default:100, higher = less corners
 *
 * eps: 		int
 *      		Maximum distance between two points to be considered neighbours; Default:15
 *
 * minPts: 		int
 *		   		Minimum number of points required to form a cluster; Default:5
 *
 * sharpness: 	float
 * 				Sharpness filter parameter; Default:0.6
 *
 * drawRects: 	bol
 * 				Option to draw bounding boxes on the image; Default:0
 *
 * splitRects: 	bol
 * 				Option to split the text segments into individual images; Default:0
 *
 * Returns:
 * --------
 * outputRects:		obj
 *				Dicitonary of clusters and their corresponding bounding box. outputRects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 * 
 */
	if (fThreshhold === undefined) { fThreshhold = 100};
	if (eps === undefined) { eps = 15};
	if (minPts === undefined) { minPts = 5};
	if (sharpness === undefined) { sharpness = 0.6};
	if (drawRects === undefined) { drawRects = 0};
	if (splitRects === undefined) { splitRects = 0};
 
	var src = imgPath; 																							
	var image = new Image();																					//Creating a new image
	image.src = src;																							//Linking the new image object to the path specified
	image.crossOrigin = "Anonymous";																			//Chrome canvas security
	
	var canvaso = document.createElement("CANVAS");																//Create a canvas for the original image
	var canvasf = document.createElement("CANVAS");																//Create a canvas for the segmented image
	//canvaso.setAttribute("style", "display:block; margin-left: auto; margin-right: auto; width: 40%;");
	//document.body.appendChild(canvaso);
	
	var width;
	var height;
	
	var contexto = canvaso.getContext("2d");																	//Original image drawing context on the canvas
	var contextf = canvasf.getContext("2d");																	//Segmented image drawing context on the canvas
	
	
	image.onload = function() {
		width = image.width;
		height = image.height;
		
		canvaso.width = width																					//Resizing the original canvas width to the image width
		canvaso.height = height																					//Resizing the original canvas height to the image height
		
		canvasf.width = width																					//Resizing the segmented canvas width to the image width
		canvasf.height = height																					//Resizing the segmented canvas height to the image height
	
		contexto.drawImage(image, 0, 0, width, height);															//Draw the original image to canvaso	
		contextf.drawImage(image, 0, 0, width, height);															//Draw the original image to canvasf
		
		sharpen(contextf, width, height, sharpness);															//Applies the sharpen filter to canvasf

		var corArr = findCorners(contextf, width, height, fThreshhold);											//Find corners using FAST and stores the coordinates in an array
 		var P = DBSCAN(corArr, eps, minPts);																	//Group the corners together using DBSCAN and return clusters = {key = 1 : value = [[x1,y1],[x2,y2],...], ...} 
		outputRects = textRect(contexto, P);																	//Constructs bounding box for each cluster of text		 

		if (drawRects == 1) {
			var fImg = document.createElement("img");															//Create an img element
			fImg.setAttribute('src', canvaso.toDataURL("image/png"));											//Set the src of the img element to canvaso
			fImg.setAttribute("style", "display:block; margin-left: auto; margin-right: auto;");				//Styling of the img element
			document.body.appendChild(fImg);																	//Append the element to body
		}
		var br = document.createElement("br");																	//Create line break element
		document.body.appendChild(br);																			//Append line break element
		
		if (splitRects == 1) {
			cropRects(outputRects,image);																		//Crop the image into segments of texts
		}
		return outputRects;
	} 
}

function findCorners(ctx, width, height, fThreshhold) {
/*
 * Parameters:
 * -----------
 * ctx: 			obj 
 *					Canvas context object
 *
 * width:			int
 *        			Width of the canvas
 *
 * height: 			int
 *		   			Height of the Canvas
 *
 * fThreshhold: 	int
 *					FAST threshhold 
 * Returns:
 * --------
 * outArr:			array
 *		   			[[x1,y1],[x2,y2],...]
*/	
	var outArr = [];																							//Initialize output array
	Fast.THRESHOLD = fThreshhold;																				//Set the FAST Threshhold
	
	var imageData = ctx.getImageData(0, 0, width, height);														//Get image data from the canvas									
	var gray = TImage.grayscale(imageData.data, width, height);													//Convert the image into gray scale
	var corners = Fast.findCorners(gray, width, height);														//Find all the corners using FAST
	
	for (var i = 0; i < corners.length; i += 2) {
		ctx.fillStyle = '#f00';
		ctx.fillRect(corners[i], corners[i + 1], 1, 1);															//Paint a pixel for every corner found
		outArr.push([corners[i],corners[i + 1]]);																//Append the coordinate of each corner into the output array
	}
	return outArr;
}


function textRect(ctx, P) {
/*
 * Parameters:
 * -----------
 * ctx: 		obj 
 *				Canvas context object
 *
 * P: 			array
 *        		Output of DBSCAN; P = {key = 1 : value = [[x1,y1],[x2,y2],...], ...}
 *
 * Returns:
 * --------
 * rects:		obj
 *				Dicitonary of clusters and their corresponding bounding box. rects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 *
 *
*/	
	var rects = {};																								//Initialize the rects object
	var centroids = [];																							//Initialize the centroids array
	
	C = 0;																										//Set counter to 0
	for (var key in P) {
		var xMax = Math.max.apply(null, P[key].map(function(elt) { return elt[0]; }));							//Calculates the maximum x value in the cluster
		var xMin = Math.min.apply(null, P[key].map(function(elt) { return elt[0]; }));							//Calculates the minimum x value in the cluster
		var yMax = Math.max.apply(null, P[key].map(function(elt) { return elt[1]; }));							//Calculates the maximum y value in the cluster
		var yMin = Math.min.apply(null, P[key].map(function(elt) { return elt[1]; }));							//Calculates the minimum y value in the cluster
		var h = yMax - yMin;																					//Height of the cluster
		var w = xMax - xMin;																					//Width of the cluster
		if (key == 'noise') { continue; }																		//Skip the noise cluster
		//if (h/w > 1) { continue; }
		//if (w < 40) { continue; }
		//if (h < 40) { continue; }
		//if (h*w > 2000) { continue; }
		drawPoly(ctx, [Math.max(0, xMin-5), Math.max(0, yMin-5)], [Math.max(0, xMin-5), Math.max(0, yMax+5)], [Math.max(0, xMax+5), Math.max(0, yMax+5)], [Math.max(0, xMax+5), Math.max(0, yMin-5)]);					//Draw the bounding box for the cluster
		C = C + 1;																								//Increment the counter
		
		
		rects[C] = [Math.max(0, xMin-5), Math.max(0, xMax+5), Math.max(0, yMin-5), Math.max(0, yMax+5)];															//Rectangle Object; Rects {} = {Key = C : Value = [xMin, xMax, yMin, yMax]}
		
		centroids.push([Math.round(xMin+(xMax-xMin)/2), Math.round(yMin+(yMax-yMin)/2),,C]);					//Centroids Array; Centroids [] = [[x1, y1], [x2, y2], ...]
	}
	return rects;
}

function drawPoly(ctx, UL, LL, LR, UR) {
/*
 * Parameters:
 * -----------
 * ctx: 	obj 
 *			Canvas context object
 *
 * UL: 		array
 *        	Upper Left Coordinates; UL = [x,y]
 *
 * LL: 		array
 *			Lower Left Coordinates; LL = [x,y]
 *
 * LR: 		array
 *			Lower Right Coordinates; LR = [x,y]
 *
 * UR: 		array
 *			Upper Right Coordinates; UR = [x,y]
 *
 */		
	ctx.beginPath();																							//Context draw begin
	ctx.moveTo(UL[0],UL[1]);																					//Move to top left corner
	ctx.lineTo(LL[0],LL[1]);																					//Left line
	ctx.lineTo(LR[0],LR[1]);																					//Bottom line
	ctx.lineTo(UR[0],UR[1]);																					//Right line
	ctx.closePath();																							//Top line to close the contour
	ctx.stroke();																								//Draw the contour
}

function cropRects(rects,img) {
/*
 * Parameters:
 * -----------
 * rects:		obj
 *				Dicitonary of clusters and their corresponding bounding box. rects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 *
 * img: 		obj 
 *				Image object
 *
 */				
	var tempCanvas = document.createElement("canvas");															//Create a tempCanvas in the document
	var tCtx = tempCanvas.getContext("2d");																		//Create a context for the tempCanvas
	for (var i = 1; i <= Object.keys(rects).length; i++) {														//Loops through every key in rects{}	
		var width = rects[i][1] - rects[i][0];																	//Set width = xMax - xMin
		var height = rects[i][3] - rects[i][2];																	//Set height = yMax - yMin
		tempCanvas.width = width;																				//Set tempCanvas width to width
		tempCanvas.height = height;																				//Set tempCanvas height to height
		tCtx.drawImage(img, rects[i][0], rects[i][2], width, height, 0, 0, width, height);						//Draw cropped image on tempCanvas

		var cImg = document.createElement("img");																//Create image element
		cImg.setAttribute('src', tempCanvas.toDataURL("image/png"));											//Set image src to tempCanvas DataURL
		cImg.setAttribute("style", "display:block; margin-left: auto; margin-right: auto;");					//Styling of the image
		document.body.appendChild(cImg);																		//Append image to the document
	 
		var br = document.createElement("br");																	//Create a break element
		document.body.appendChild(br);																			//Append break element to the document
	}

		
}


function include(url) {
/*
 * Parameters:
 * -----------
 * url:		string
 *			path and filename; path//js//example.js
 *
 */			
	
    var head = document.getElementsByTagName('head')[0];														//Head elements
    var script = document.createElement('script');																//Create script element
    script.type = 'text/javascript';																			//Script type
    script.src = url;																							//Script source
    head.appendChild(script);																					//Append script element to the first head element
}



/* -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * Author: Mike Cao
 * Canvas Sharpen
 * "https://gist.github.com/mikecao/65d9fc92dc7197cb8a7c.js"
 */
function sharpen(ctx, w, h, mix) {
	
/*
 * Parameters:
 * -----------
 * ctx: 	obj 
 *			Canvas context object
 *
 * w: 		int
 *			Width of the image
 *
 * h: 		int
 *			Height of the image
 *
 * mix: 	float
 *			Sharpness parameter; 0.1 to 0.9. Sharpest being 0.9
 *
*/	
	
	
    var x, sx, sy, r, g, b, a, dstOff, srcOff, wt, cx, cy, scy, scx,
        weights = [0, -1, 0, -1, 5, -1, 0, -1, 0],
        katet = Math.round(Math.sqrt(weights.length)),
        half = (katet * 0.5) | 0,
        dstData = ctx.createImageData(w, h),
        dstBuff = dstData.data,
        srcBuff = ctx.getImageData(0, 0, w, h).data,
        y = h;

    while (y--) {
        x = w;
        while (x--) {
            sy = y;
            sx = x;
            dstOff = (y * w + x) * 4;
            r = 0;
            g = 0;
            b = 0;
            a = 0;

            for (cy = 0; cy < katet; cy++) {
                for (cx = 0; cx < katet; cx++) {
                    scy = sy + cy - half;
                    scx = sx + cx - half;

                    if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
                        srcOff = (scy * w + scx) * 4;
                        wt = weights[cy * katet + cx];

                        r += srcBuff[srcOff] * wt;
                        g += srcBuff[srcOff + 1] * wt;
                        b += srcBuff[srcOff + 2] * wt;
                        a += srcBuff[srcOff + 3] * wt;
                    }
                }
            }

            dstBuff[dstOff] = r * mix + srcBuff[dstOff] * (1 - mix);
            dstBuff[dstOff + 1] = g * mix + srcBuff[dstOff + 1] * (1 - mix);
            dstBuff[dstOff + 2] = b * mix + srcBuff[dstOff + 2] * (1 - mix);
            dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
        }
    }

    ctx.putImageData(dstData, 0, 0);
}

/* --------------------------------------------------------------------------------------------------------------- */



/**
 * Author: Barry Li
 * Javascript Implementation of DBSCAN
 * 
 */
 
 
function DBSCAN(arr, eps, minPts) {
	
/*
 * Points Dictionary : {Key = [x, y] : Value = cluster_id}
 * Clusters Dicitonary : {Key = cluster_id : Value = [[x1, y1], [x2, y2], ...]}
 *
 * Parameters:
 * -----------
 * arr: 	[x, y, cluster_id]
 *			The input array to DBSCAN, where x and y correspond to the coordinates of a point. cluster_id is undefined by default.
 *
 * eps: 	int
 *      	Maximum distance between two points to be considered neighbours
 *
 * minPts: 	int
 *		   	Minimum number of points required to form a cluster
 *
 * Returns:
 * --------
 * clusters: obj
 *		   	clusters = {key = 1 : value = [[x1,y1],[x2,y2],...], ...}
*/

	
	var so = setOps;
	var cluster_id = {};
	var C = 0 															//Cluster counter
	for (var i = 0; i < arr.length; i++) {
		if (cluster_id[arr[i]] != undefined) { continue; } 				//Check if already processed
		N = RangeQuery(arr, arr[i], eps); 								//Find neighbours
		
		if (N.length < minPts) {
			cluster_id[arr[i]] = 'noise';
			continue;
		}
		
		C = C + 1; 														//Next cluster
		
		//Expand Cluster
		cluster_id[arr[i]] = C; 										//Label initial point
		
		var S = so.complement(N, [arr[i]]); 							//Seed set
		
		for (var j = 0; j < S.length; j++) {	
			if (cluster_id[S[j]] == 'noise') { 
				cluster_id[S[j]] = C; 					
			} 															//Change noise to border point
			if (cluster_id[S[j]] != undefined) { continue; } 			//Check if already processed
			
			cluster_id[S[j]] = C 										//Label neighbour
			
			N = RangeQuery(arr, S[j], eps); 							//Find neighbours
			
			if (N.length >= minPts) { 									//Density check
				S = so.union(S,N);										//Add new neighbours to seed set
			}
		}		
	}
	 
	var clusters = {};													//Initializing clusters dictionary
	for (var key in cluster_id) {										//This for loop converts cluster_id {key = [x,y]: value = cluster_id,...} to clusters{cluster_id : value = [[x1,y1],[x2,y2],...],...}
		if (!(cluster_id[key] in clusters)) {							
			clusters[cluster_id[key]] = [];								//Create a new key in the dicitonary
		}
		clusters[cluster_id[key]].push(key.split(","));					//Append coordinates to a given key
	}
	return clusters;

}

function RangeQuery(arr, Pt, eps) {
	var so = setOps;													//Initializing set operations
	Neighbours = [];													//Initializing Neighbours array
	for (var i = 0; i < arr.length; i++) {
		if (distFunc(Pt, arr[i]) <= eps) {
			Neighbours = so.union(Neighbours,[arr[i]]); 				//Add to Neighbours
		}
	}
	return Neighbours;
}

function distFunc(Q, P) {
	D = Math.sqrt(Math.pow((P[0]-Q[0]),2)+Math.pow((P[1]-Q[1]),2)); 	//Euclidean distance
	return D;
}

/* --------------------------------------------------------------------------------------------------------------- */
