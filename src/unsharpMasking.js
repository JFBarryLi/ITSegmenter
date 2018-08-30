/**
 * Author: Barry Li
 * Javascript Unsharp Masking
 *
 * Image + negative of Gaussian blurred image
 * Gaussian blur is approximated by 3 box blur
 *
 * https://github.com/JFBarryLi/ITSegmenter
 *
 */

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
