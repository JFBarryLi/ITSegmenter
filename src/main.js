function submit() {
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
 * rects:		obj
 *				Dicitonary of clusters and their corresponding bounding box. rects {} = {key = 1 : value = [[xMin1, xMax1, yMin1, yMax1],...],...}
 * 
 */
	imgPath = document.getElementById('pathInput').value;
	
	textSegment(imgPath, 100, 15, 5, 0.6, 1, 1);

}

