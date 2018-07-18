/**
 * Author: Barry Li
 * Javascript Image Text Segmentation
 * 
 * Segments an image containing text into blocks of text
 *
 * https://github.com/JFBarryLi/ITSegmenter
 *
 */
 
var outputRects = {};
 
 function textSegment(imgPath, fThreshhold, eps, minPts, sharpness, drawRects, splitRects, convertToImage, canvasId) {
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
 * sharpness: 			float
 * 						Sharpness filter parameter; Default:0.6
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
	if (sharpness === undefined) { sharpness = 0.6};
	if (drawRects === undefined) { drawRects = 0};
	if (splitRects === undefined) { splitRects = 0};
	if (convertToImage === undefined) { convertToImage = 1};
 
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
		sharpen(contextf, width, height, sharpness);

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
		//if (h/w > 1) { continue; }
		//if (w < 40) { continue; }
		//if (h < 40) { continue; }
		//if (h*w > 2000) { continue; }
		
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
 * ctx: 			obj 
 *					Canvas context object
 *
 * w: 				int
 *					Width of the image
 *
 * h: 				int
 *					Height of the image
 *
 * mix: 			float
 *					Sharpness parameter; 0.1 to 0.9. Sharpest being 0.9
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
 * arr: 			[x, y, cluster_id]
 *					The input array to DBSCAN, where x and y correspond to the coordinates of a point. cluster_id is undefined by default.
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
 *		   			clusters = {key = 1 : value = [[x1,y1],[x2,y2],...], ...}
*/

	var index = kdbush(arr);	
	var so = setOps;
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
		var S = so.complement(N, [arr[i]]);
		
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
				S = so.union(S,N);
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
	
	var Neighbours = index.within(Pt[0], Pt[1], eps).map(function(id) { return arr[id]; });
	
	return Neighbours;
	
/*  	var so = setOps;
	Neighbours = [];
	for (var i = 0; i < arr.length; i++) {
		if (distFunc(Pt, arr[i]) <= eps) {
			// Add to Neighbours
			Neighbours = so.union(Neighbours,[arr[i]]);
		}
	}
	return Neighbours; */
}

function distFunc(Q, P) {
	//Euclidean distance
	D = Math.sqrt(Math.pow((P[0]-Q[0]),2)+Math.pow((P[1]-Q[1]),2)); 	
	return D;
}

/* --------------------------------------------------------------------------------------------------------------- */


/**
 * tracking - A modern approach for Computer Vision on the web.
 * @author Eduardo Lundgren <edu@rdo.io>
 * @version v1.1.3
 * @link http://trackingjs.com
 * @license BSD
 */


(function() {
  /**
   * FAST intends for "Features from Accelerated Segment Test". This method
   * performs a point segment test corner detection. The segment test
   * criterion operates by considering a circle of sixteen pixels around the
   * corner candidate p. The detector classifies p as a corner if there exists
   * a set of n contiguous pixelsin the circle which are all brighter than the
   * intensity of the candidate pixel Ip plus a threshold t, or all darker
   * than Ip − t.
   *
   *       15 00 01
   *    14          02
   * 13                03
   * 12       []       04
   * 11                05
   *    10          06
   *       09 08 07
   *
   * For more reference:
   * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.60.3991&rep=rep1&type=pdf
   * @static
   * @constructor
   */
  Fast = {};

  /**
   * Holds the threshold to determine whether the tested pixel is brighter or
   * darker than the corner candidate p.
   * @type {number}
   * @default 40
   * @static
   */
  Fast.THRESHOLD = 40;

  /**
   * Caches coordinates values of the circle surrounding the pixel candidate p.
   * @type {Object.<number, Int32Array>}
   * @private
   * @static
   */
  Fast.circles_ = {};

  /**
   * Finds corners coordinates on the graysacaled image.
   * @param {array} The grayscale pixels in a linear [p1,p2,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {number} threshold to determine whether the tested pixel is brighter or
   *     darker than the corner candidate p. Default value is 40.
   * @return {array} Array containing the coordinates of all found corners,
   *     e.g. [x0,y0,x1,y1,...], where P(x0,y0) represents a corner coordinate.
   * @static
   */
  Fast.findCorners = function(pixels, width, height, opt_threshold) {
    var circleOffsets = this.getCircleOffsets_(width);
    var circlePixels = new Int32Array(16);
    var corners = [];

    if (opt_threshold === undefined) {
      opt_threshold = this.THRESHOLD;
    }

    // When looping through the image pixels, skips the first three lines from
    // the image boundaries to constrain the surrounding circle inside the image
    // area.
    for (var i = 3; i < height - 3; i++) {
      for (var j = 3; j < width - 3; j++) {
        var w = i * width + j;
        var p = pixels[w];

        // Loops the circle offsets to read the pixel value for the sixteen
        // surrounding pixels.
        for (var k = 0; k < 16; k++) {
          circlePixels[k] = pixels[w + circleOffsets[k]];
        }

        if (this.isCorner(p, circlePixels, opt_threshold)) {
          // The pixel p is classified as a corner, as optimization increment j
          // by the circle radius 3 to skip the neighbor pixels inside the
          // surrounding circle. This can be removed without compromising the
          // result.
          corners.push(j, i);
          j += 3;
        }
      }
    }

    return corners;
  };

  /**
   * Checks if the circle pixel is brighter than the candidate pixel p by
   * a threshold.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   */
  Fast.isBrighter = function(circlePixel, p, threshold) {
    return circlePixel - p > threshold;
  };

  /**
   * Checks if the circle pixel is within the corner of the candidate pixel p
   * by a threshold.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   */
  Fast.isCorner = function(p, circlePixels, threshold) {
    if (this.isTriviallyExcluded(circlePixels, p, threshold)) {
      return false;
    }

    for (var x = 0; x < 16; x++) {
      var darker = true;
      var brighter = true;

      for (var y = 0; y < 9; y++) {
        var circlePixel = circlePixels[(x + y) & 15];

        if (!this.isBrighter(p, circlePixel, threshold)) {
          brighter = false;
          if (darker === false) {
            break;
          }
        }

        if (!this.isDarker(p, circlePixel, threshold)) {
          darker = false;
          if (brighter === false) {
            break;
          }
        }
      }

      if (brighter || darker) {
        return true;
      }
    }

    return false;
  };

  /**
   * Checks if the circle pixel is darker than the candidate pixel p by
   * a threshold.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   */
  Fast.isDarker = function(circlePixel, p, threshold) {
    return p - circlePixel > threshold;
  };

  /**
   * Fast check to test if the candidate pixel is a trivially excluded value.
   * In order to be a corner, the candidate pixel value should be darker or
   * brighter than 9-12 surrounding pixels, when at least three of the top,
   * bottom, left and right pixels are brighter or darker it can be
   * automatically excluded improving the performance.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   * @protected
   */
  Fast.isTriviallyExcluded = function(circlePixels, p, threshold) {
    var count = 0;
    var circleBottom = circlePixels[8];
    var circleLeft = circlePixels[12];
    var circleRight = circlePixels[4];
    var circleTop = circlePixels[0];

    if (this.isBrighter(circleTop, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleRight, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleBottom, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleLeft, p, threshold)) {
      count++;
    }

    if (count < 3) {
      count = 0;
      if (this.isDarker(circleTop, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleRight, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleBottom, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleLeft, p, threshold)) {
        count++;
      }
      if (count < 3) {
        return true;
      }
    }

    return false;
  };

  /**
   * Gets the sixteen offset values of the circle surrounding pixel.
   * @param {number} width The image width.
   * @return {array} Array with the sixteen offset values of the circle
   *     surrounding pixel.
   * @private
   */
  Fast.getCircleOffsets_ = function(width) {
    if (this.circles_[width]) {
      return this.circles_[width];
    }

    var circle = new Int32Array(16);

    circle[0] = -width - width - width;
    circle[1] = circle[0] + 1;
    circle[2] = circle[1] + width + 1;
    circle[3] = circle[2] + width + 1;
    circle[4] = circle[3] + width;
    circle[5] = circle[4] + width;
    circle[6] = circle[5] + width - 1;
    circle[7] = circle[6] + width - 1;
    circle[8] = circle[7] - 1;
    circle[9] = circle[8] - 1;
    circle[10] = circle[9] - width - 1;
    circle[11] = circle[10] - width - 1;
    circle[12] = circle[11] - width;
    circle[13] = circle[12] - width;
    circle[14] = circle[13] - width + 1;
    circle[15] = circle[14] - width + 1;

    this.circles_[width] = circle;
    return circle;
  };
}());


(function() {
  /**
   * TImage utility.
   * @static
   * @constructor
   */
  TImage = {};

  /**
   * Computes gaussian blur. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {number} diameter Gaussian blur diameter, must be greater than 1.
   * @return {array} The edge pixels in a linear [r,g,b,a,...] array.
   */
  TImage.blur = function(pixels, width, height, diameter) {
    diameter = Math.abs(diameter);
    if (diameter <= 1) {
      throw new Error('Diameter should be greater than 1.');
    }
    var radius = diameter / 2;
    var len = Math.ceil(diameter) + (1 - (Math.ceil(diameter) % 2));
    var weights = new Float32Array(len);
    var rho = (radius + 0.5) / 3;
    var rhoSq = rho * rho;
    var gaussianFactor = 1 / Math.sqrt(2 * Math.PI * rhoSq);
    var rhoFactor = -1 / (2 * rho * rho);
    var wsum = 0;
    var middle = Math.floor(len / 2);
    for (var i = 0; i < len; i++) {
      var x = i - middle;
      var gx = gaussianFactor * Math.exp(x * x * rhoFactor);
      weights[i] = gx;
      wsum += gx;
    }
    for (var j = 0; j < weights.length; j++) {
      weights[j] /= wsum;
    }
    return this.separableConvolve(pixels, width, height, weights, weights, false);
  };

  /**
   * Computes the integral image for summed, squared, rotated and sobel pixels.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} opt_integralTImage Empty array of size `width * height` to
   *     be filled with the integral image values. If not specified compute sum
   *     values will be skipped.
   * @param {array} opt_integralTImageSquare Empty array of size `width *
   *     height` to be filled with the integral image squared values. If not
   *     specified compute squared values will be skipped.
   * @param {array} opt_tiltedIntegralTImage Empty array of size `width *
   *     height` to be filled with the rotated integral image values. If not
   *     specified compute sum values will be skipped.
   * @param {array} opt_integralTImageSobel Empty array of size `width *
   *     height` to be filled with the integral image of sobel values. If not
   *     specified compute sobel filtering will be skipped.
   * @static
   */
  TImage.computeIntegralTImage = function(pixels, width, height, opt_integralTImage, opt_integralTImageSquare, opt_tiltedIntegralTImage, opt_integralTImageSobel) {
    if (arguments.length < 4) {
      throw new Error('You should specify at least one output array in the order: sum, square, tilted, sobel.');
    }
    var pixelsSobel;
    if (opt_integralTImageSobel) {
      pixelsSobel = TImage.sobel(pixels, width, height);
    }
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var w = i * width * 4 + j * 4;
        var pixel = ~~(pixels[w] * 0.299 + pixels[w + 1] * 0.587 + pixels[w + 2] * 0.114);
        if (opt_integralTImage) {
          this.computePixelValueSAT_(opt_integralTImage, width, i, j, pixel);
        }
        if (opt_integralTImageSquare) {
          this.computePixelValueSAT_(opt_integralTImageSquare, width, i, j, pixel * pixel);
        }
        if (opt_tiltedIntegralTImage) {
          var w1 = w - width * 4;
          var pixelAbove = ~~(pixels[w1] * 0.299 + pixels[w1 + 1] * 0.587 + pixels[w1 + 2] * 0.114);
          this.computePixelValueRSAT_(opt_tiltedIntegralTImage, width, i, j, pixel, pixelAbove || 0);
        }
        if (opt_integralTImageSobel) {
          this.computePixelValueSAT_(opt_integralTImageSobel, width, i, j, pixelsSobel[w]);
        }
      }
    }
  };

  /**
   * Helper method to compute the rotated summed area table (RSAT) by the
   * formula:
   *
   * RSAT(x, y) = RSAT(x-1, y-1) + RSAT(x+1, y-1) - RSAT(x, y-2) + I(x, y) + I(x, y-1)
   *
   * @param {number} width The image width.
   * @param {array} RSAT Empty array of size `width * height` to be filled with
   *     the integral image values. If not specified compute sum values will be
   *     skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  TImage.computePixelValueRSAT_ = function(RSAT, width, i, j, pixel, pixelAbove) {
    var w = i * width + j;
    RSAT[w] = (RSAT[w - width - 1] || 0) + (RSAT[w - width + 1] || 0) - (RSAT[w - width - width] || 0) + pixel + pixelAbove;
  };

  /**
   * Helper method to compute the summed area table (SAT) by the formula:
   *
   * SAT(x, y) = SAT(x, y-1) + SAT(x-1, y) + I(x, y) - SAT(x-1, y-1)
   *
   * @param {number} width The image width.
   * @param {array} SAT Empty array of size `width * height` to be filled with
   *     the integral image values. If not specified compute sum values will be
   *     skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  TImage.computePixelValueSAT_ = function(SAT, width, i, j, pixel) {
    var w = i * width + j;
    SAT[w] = (SAT[w - width] || 0) + (SAT[w - 1] || 0) + pixel - (SAT[w - width - 1] || 0);
  };

  /**
   * Converts a color from a colorspace based on an RGB color model to a
   * grayscale representation of its luminance. The coefficients represent the
   * measured intensity perception of typical trichromat humans, in
   * particular, human vision is most sensitive to green and least sensitive
   * to blue.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {boolean} fillRGBA If the result should fill all RGBA values with the gray scale
   *  values, instead of returning a single value per pixel.
   * @param {Uint8ClampedArray} The grayscale pixels in a linear array ([p,p,p,a,...] if fillRGBA
   *  is true and [p1, p2, p3, ...] if fillRGBA is false).
   * @static
   */
  TImage.grayscale = function(pixels, width, height, fillRGBA) {
    var gray = new Uint8ClampedArray(fillRGBA ? pixels.length : pixels.length >> 2);
    var p = 0;
    var w = 0;
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var value = pixels[w] * 0.299 + pixels[w + 1] * 0.587 + pixels[w + 2] * 0.114;
        gray[p++] = value;

        if (fillRGBA) {
          gray[p++] = value;
          gray[p++] = value;
          gray[p++] = pixels[w + 3];
        }

        w += 4;
      }
    }
    return gray;
  };

  /**
   * Fast horizontal separable convolution. A point spread function (PSF) is
   * said to be separable if it can be broken into two one-dimensional
   * signals: a vertical and a horizontal projection. The convolution is
   * performed by sliding the kernel over the image, generally starting at the
   * top left corner, so as to move the kernel through all the positions where
   * the kernel fits entirely within the boundaries of the image. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  TImage.horizontalConvolve = function(pixels, width, height, weightsVector, opaque) {
    var side = weightsVector.length;
    var halfSide = Math.floor(side / 2);
    var output = new Float32Array(width * height * 4);
    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var sy = y;
        var sx = x;
        var offset = (y * width + x) * 4;
        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;
        for (var cx = 0; cx < side; cx++) {
          var scy = sy;
          var scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
          var poffset = (scy * width + scx) * 4;
          var wt = weightsVector[cx];
          r += pixels[poffset] * wt;
          g += pixels[poffset + 1] * wt;
          b += pixels[poffset + 2] * wt;
          a += pixels[poffset + 3] * wt;
        }
        output[offset] = r;
        output[offset + 1] = g;
        output[offset + 2] = b;
        output[offset + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   * Fast vertical separable convolution. A point spread function (PSF) is
   * said to be separable if it can be broken into two one-dimensional
   * signals: a vertical and a horizontal projection. The convolution is
   * performed by sliding the kernel over the image, generally starting at the
   * top left corner, so as to move the kernel through all the positions where
   * the kernel fits entirely within the boundaries of the image. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  TImage.verticalConvolve = function(pixels, width, height, weightsVector, opaque) {
    var side = weightsVector.length;
    var halfSide = Math.floor(side / 2);
    var output = new Float32Array(width * height * 4);
    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var sy = y;
        var sx = x;
        var offset = (y * width + x) * 4;
        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;
        for (var cy = 0; cy < side; cy++) {
          var scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
          var scx = sx;
          var poffset = (scy * width + scx) * 4;
          var wt = weightsVector[cy];
          r += pixels[poffset] * wt;
          g += pixels[poffset + 1] * wt;
          b += pixels[poffset + 2] * wt;
          a += pixels[poffset + 3] * wt;
        }
        output[offset] = r;
        output[offset + 1] = g;
        output[offset + 2] = b;
        output[offset + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   * Fast separable convolution. A point spread function (PSF) is said to be
   * separable if it can be broken into two one-dimensional signals: a
   * vertical and a horizontal projection. The convolution is performed by
   * sliding the kernel over the image, generally starting at the top left
   * corner, so as to move the kernel through all the positions where the
   * kernel fits entirely within the boundaries of the image. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} horizWeights The horizontal weighting vector, e.g [-1,0,1].
   * @param {array} vertWeights The vertical vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  TImage.separableConvolve = function(pixels, width, height, horizWeights, vertWeights, opaque) {
    var vertical = this.verticalConvolve(pixels, width, height, vertWeights, opaque);
    return this.horizontalConvolve(vertical, width, height, horizWeights, opaque);
  };

  /**
   * Compute image edges using Sobel operator. Computes the vertical and
   * horizontal gradients of the image and combines the computed images to
   * find edges in the image. The way we implement the Sobel filter here is by
   * first grayscaling the image, then taking the horizontal and vertical
   * gradients and finally combining the gradient images to make up the final
   * image. Adapted from https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @return {array} The edge pixels in a linear [r,g,b,a,...] array.
   */
  TImage.sobel = function(pixels, width, height) {
    pixels = this.grayscale(pixels, width, height, true);
    var output = new Float32Array(width * height * 4);
    var sobelSignVector = new Float32Array([-1, 0, 1]);
    var sobelScaleVector = new Float32Array([1, 2, 1]);
    var vertical = this.separableConvolve(pixels, width, height, sobelSignVector, sobelScaleVector);
    var horizontal = this.separableConvolve(pixels, width, height, sobelScaleVector, sobelSignVector);

    for (var i = 0; i < output.length; i += 4) {
      var v = vertical[i];
      var h = horizontal[i];
      var p = Math.sqrt(h * h + v * v);
      output[i] = p;
      output[i + 1] = p;
      output[i + 2] = p;
      output[i + 3] = 255;
    }

    return output;
  };

  /**
   * Equalizes the histogram of a grayscale image, normalizing the
   * brightness and increasing the contrast of the image.
   * @param {pixels} pixels The grayscale pixels in a linear array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @return {array} The equalized grayscale pixels in a linear array.
   */
  TImage.equalizeHist = function(pixels, width, height){
    var equalized = new Uint8ClampedArray(pixels.length);

    var histogram = new Array(256);
    for(var i=0; i < 256; i++) histogram[i] = 0;

    for(var i=0; i < pixels.length; i++){
      equalized[i] = pixels[i];
      histogram[pixels[i]]++;
    }

    var prev = histogram[0];
    for(var i=0; i < 256; i++){
      histogram[i] += prev;
      prev = histogram[i];
    }

    var norm = 255 / pixels.length;
    for(var i=0; i < pixels.length; i++)
      equalized[i] = (histogram[pixels[i]] * norm + 0.5) | 0;

    return equalized;
  }

}());


// setOps.js MIT License © 2014 James Abney http://github.com/jabney

// Set operations union, intersection, symmetric difference,
// relative complement, equals. Set operations are fast.
(function(so) {
'use strict';
  
  var uidList = [], uid;

  // Create and push the uid identity method.
  uidList.push(uid = function() {
    return this;
  });

  // Push a new uid method onto the stack. Call this and
  // supply a unique key generator for sets of objects.
  so.pushUid = function(method) {
    uidList.push(method);
    uid = method;
    return method;
  };

  // Pop the previously pushed uid method off the stack and
  // assign top of stack to uid. Return the previous method.
  so.popUid = function() {
    var prev;
    uidList.length > 1 && (prev = uidList.pop());
    uid = uidList[uidList.length-1];
    return prev || null;
  };

  // Processes a histogram consructed from two arrays, 'a' and 'b'.
  // This function is used generically by the below set operation 
  // methods, a.k.a, 'evaluators', to return some subset of
  // a set union, based on frequencies in the histogram. 
  function process(a, b, evaluator) {
    // Create a histogram of 'a'.
    var hist = Object.create(null), out = [], ukey, k;
    a.forEach(function(value) {
      ukey = uid.call(value);
      if(!hist[ukey]) {
        hist[ukey] = { value: value, freq: 1 };
      }
    });
    // Merge 'b' into the histogram.
    b.forEach(function(value) {
      ukey = uid.call(value);
      if (hist[ukey]) {
        if (hist[ukey].freq === 1)
          hist[ukey].freq = 3;
      } else {
        hist[ukey] = { value: value, freq: 2 };
      }
    });
    // Call the given evaluator.
    if (evaluator) {
      for (k in hist) {
        if (evaluator(hist[k].freq)) out.push(hist[k].value);
      }
      return out;
    } else {
      return hist;
    }
  };

  // Join two sets together.
  // Set.union([1, 2, 2], [2, 3]) => [1, 2, 3]
  so.union = function(a, b) {
    return process(a, b, function(freq) {
      return true;
    });
  };

  // Return items common to both sets. 
  // Set.intersection([1, 1, 2], [2, 2, 3]) => [2]
  so.intersection = function(a, b) {
    return process(a, b, function(freq) {
      return freq === 3;
    });
  };

  // Symmetric difference. Items from either set that
  // are not in both sets.
  // Set.difference([1, 1, 2], [2, 3, 3]) => [1, 3]
  so.difference = function(a, b) {
    return process(a, b, function(freq) {
      return freq < 3;
    });
  };

  // Relative complement. Items from 'a' which are
  // not also in 'b'.
  // Set.complement([1, 2, 2], [2, 2, 3]) => [3]
  so.complement = function(a, b) {
    return process(a, b, function(freq) {
      return freq === 1;
    });
  };

  // Returns true if both sets are equivalent, false otherwise.
  // Set.equals([1, 1, 2], [1, 2, 2]) => true
  // Set.equals([1, 1, 2], [1, 2, 3]) => false
  so.equals = function(a, b) {
    var max = 0, min = Math.pow(2, 53), key,
      hist = process(a, b);
    for (var key in hist) {
      max = Math.max(max, hist[key].freq);
      min = Math.min(min, hist[key].freq);
    }
    return min === 3 && max === 3;
  };
})(window.setOps = window.setOps || Object.create(null));



//https://github.com/mourner/kdbush
//Author: Mourner
!function(t, o) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = o() : "function" == typeof define && define.amd ? define(o) : t.kdbush = o()
}(this, function() {
    "use strict";
    function e(t, o, n, r, i, s) {
        if (!(i - r <= n)) {
            var h = Math.floor((r + i) / 2);
            !function t(o, n, r, i, s, h) {
                for (; i < s; ) {
                    if (600 < s - i) {
                        var e = s - i + 1
                          , u = r - i + 1
                          , f = Math.log(e)
                          , p = .5 * Math.exp(2 * f / 3)
                          , a = .5 * Math.sqrt(f * p * (e - p) / e) * (u - e / 2 < 0 ? -1 : 1)
                          , d = Math.max(i, Math.floor(r - u * p / e + a))
                          , c = Math.min(s, Math.floor(r + (e - u) * p / e + a));
                        t(o, n, r, d, c, h)
                    }
                    var l = n[2 * r + h]
                      , v = i
                      , g = s;
                    for (M(o, n, i, r),
                    n[2 * s + h] > l && M(o, n, i, s); v < g; ) {
                        for (M(o, n, v, g),
                        v++,
                        g--; n[2 * v + h] < l; )
                            v++;
                        for (; n[2 * g + h] > l; )
                            g--
                    }
                    n[2 * i + h] === l ? M(o, n, i, g) : M(o, n, ++g, s),
                    g <= r && (i = g + 1),
                    r <= g && (s = g - 1)
                }
            }(t, o, h, r, i, s % 2),
            e(t, o, n, r, h - 1, s + 1),
            e(t, o, n, h + 1, i, s + 1)
        }
    }
    function M(t, o, n, r) {
        i(t, n, r),
        i(o, 2 * n, 2 * r),
        i(o, 2 * n + 1, 2 * r + 1)
    }
    function i(t, o, n) {
        var r = t[o];
        t[o] = t[n],
        t[n] = r
    }
    function m(t, o, n, r) {
        var i = t - n
          , s = o - r;
        return i * i + s * s
    }
    function s(t, o, n, r, i) {
        o = o || h,
        n = n || u,
        i = i || Array,
        this.nodeSize = r || 64,
        this.points = t,
        this.ids = new i(t.length),
        this.coords = new i(2 * t.length);
        for (var s = 0; s < t.length; s++)
            this.ids[s] = s,
            this.coords[2 * s] = o(t[s]),
            this.coords[2 * s + 1] = n(t[s]);
        e(this.ids, this.coords, this.nodeSize, 0, this.ids.length - 1, 0)
    }
    function h(t) {
        return t[0]
    }
    function u(t) {
        return t[1]
    }
    return s.prototype = {
        range: function(t, o, n, r) {
            return function(t, o, n, r, i, s, h) {
                for (var e, u, f = [0, t.length - 1, 0], p = []; f.length; ) {
                    var a = f.pop()
                      , d = f.pop()
                      , c = f.pop();
                    if (d - c <= h)
                        for (var l = c; l <= d; l++)
                            e = o[2 * l],
                            u = o[2 * l + 1],
                            n <= e && e <= i && r <= u && u <= s && p.push(t[l]);
                    else {
                        var v = Math.floor((c + d) / 2);
                        e = o[2 * v],
                        u = o[2 * v + 1],
                        n <= e && e <= i && r <= u && u <= s && p.push(t[v]);
                        var g = (a + 1) % 2;
                        (0 === a ? n <= e : r <= u) && (f.push(c),
                        f.push(v - 1),
                        f.push(g)),
                        (0 === a ? e <= i : u <= s) && (f.push(v + 1),
                        f.push(d),
                        f.push(g))
                    }
                }
                return p
            }(this.ids, this.coords, t, o, n, r, this.nodeSize)
        },
        within: function(t, o, n) {
            return function(t, o, n, r, i, s) {
                for (var h = [0, t.length - 1, 0], e = [], u = i * i; h.length; ) {
                    var f = h.pop()
                      , p = h.pop()
                      , a = h.pop();
                    if (p - a <= s)
                        for (var d = a; d <= p; d++)
                            m(o[2 * d], o[2 * d + 1], n, r) <= u && e.push(t[d]);
                    else {
                        var c = Math.floor((a + p) / 2)
                          , l = o[2 * c]
                          , v = o[2 * c + 1];
                        m(l, v, n, r) <= u && e.push(t[c]);
                        var g = (f + 1) % 2;
                        (0 === f ? n - i <= l : r - i <= v) && (h.push(a),
                        h.push(c - 1),
                        h.push(g)),
                        (0 === f ? l <= n + i : v <= r + i) && (h.push(c + 1),
                        h.push(p),
                        h.push(g))
                    }
                }
                return e
            }(this.ids, this.coords, t, o, n, this.nodeSize)
        }
    },
    function(t, o, n, r, i) {
        return new s(t,o,n,r,i)
    }
});


