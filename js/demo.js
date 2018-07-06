function submit() {
/* 	
 * Parameters:
 * -----------
 * fThreshhold: int
 *		Fast Threshhold; Default:100, higher = less corners
 *
 * eps: int
 *      Maximum distance between two points to be considered neighbours
 *
 * minPts: int
 *		   Minimum number of points required to form a cluster
 *
 * sharpness: float
 * 			  sharpness filter parameter; Default:0.6 
 *
 * imgPath: String
 * 			File path to the image
 *
 */	
	imgPath = document.getElementById('pathInput').value;
	
	textSegment(100, 15, 5, 0.6, imgPath);

}

