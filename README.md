# ITSegmenter #
Image Text Segmentation using FAST corner detection and DBSCAN clustering.

Return the coordinates and draw bounding boxes around text.

Currently does not work on chrome for local images.
Works on IE11 and HTA.

### Usage ###
Download all the src files and put it in your src folder
Download ITSegmenter.js from the build folder and place it in your src folder

Include the following in the head of the html:  
'<script src="src\ITSegmenter.js"></script>'


Run using:  
textSegment(imgPath);

Output will be stored in the global variable outputRects.


### Documentation and Demo ###
https://jfbarryli.github.io/ITSegmenter/


### TODO ###
* Chrome security settings
* Batch processing
* Redo sharpening filter
* Reduce redundancies
* Create a better demo
* Create documentations
