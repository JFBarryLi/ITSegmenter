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
	
	var sy, sx, offset, r, g, b, a, scy, scx, poffset, wt;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        sy = y;
        sx = x;
        offset = (y * width + x) * 4;
        r = 0;
        g = 0;
        b = 0;
        a = 0;
        for (var cx = 0; cx < side; cx++) {
          scy = sy;
          scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
          poffset = (scy * width + scx) * 4;
          wt = weightsVector[cx];
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

	var sy, sx, offset, r, g, b, a, scy, scx, poffset, wt;
	
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        sy = y;
        sx = x;
        offset = (y * width + x) * 4;
        r = 0;
        g = 0;
        b = 0;
        a = 0;
        for (var cy = 0; cy < side; cy++) {
          scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
          scx = sx;
          poffset = (scy * width + scx) * 4;
          wt = weightsVector[cy];
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
