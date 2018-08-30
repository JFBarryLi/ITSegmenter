/**
 * Author: Barry Li
 * Javascript k-d Tree implementation
 * 
 * Constructs k-d Tree recursively using quickSelect for finding median
 * Perform range search by recursing through the nodes
 *
 * https://github.com/JFBarryLi/ITSegmenter
 *
 */

function kdTree(points) {
/*
 * INFO:
 * -----
 * kdTree class 
 * initiate a new instance to construct the index
 * call kdTree.rangeSearch(x, y, r) to query the tree
 * tree nodes can be accessed by kdTree.nodes
 *
 * PARAM:
 * -----------
 * points: 				array: [[x1, y1], [x2,y2], ...]
 *						The input array, where x and y correspond to the coordinates of a point
 *
 */
	
	var nodes = [];	
	var tempPoints = points;
	kdTreeIndex(tempPoints, 0);
	this.nodes = nodes;
	this.rootNode = nodes[nodes.length - 1];
	
	function kdTreeIndex(points, depth) {
	/*
	 * INFO:
	 * -----
	 * k-d Tree constructor
	 * Recursively construct the tree by using quickSelect to find median
	 * then partition the dataset into left and right node
	 *
	 * PARAM:
	 * -----------
	 * points: 				array: [[x1, y1], [x2,y2], ...]
	 *						The input array, where x and y correspond to the coordinates of a point
	 *
	 * depth				int
	 *						Tree depth, determines the dimension for partitioning
	 *
	 */
		
		
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
	
	function node(position, leftChild, rightChild, depth) {
	/*
	 * INFO:
	 * -----
	 * The node class have 4 keys:
	 * position stores the coordinate of the node
	 * leftChild stores another node object
	 * rightChild stores another node objet
	 * depth is the current depth of the node
	 *
	 */
	
		this.position = position;
		this.leftChild = leftChild;
		this.rightChild = rightChild;
		this.depth = depth; 
	}
	

	this.rangeSearch = function(x, y, r) {
		var Neighbours = [];
		rangeSearch(x, y, r, this.rootNode, Neighbours);
		return Neighbours;
	};
		
}

function quickSelect(points, left, right, k, axis) {
/*
 * INFO:
 * -----
 * Selects the k-th smallest element of an array within left-right recursively
 *
 * PARAM:
 * -----------
 * points: 				array: [[x1, y1], [x2,y2], ...]
 *						The input array, where x and y correspond to the coordinates of a point
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
 * points: 				array: [[x1, y1], [x2,y2], ...]
 *						The input array, where x and y correspond to the coordinates of a point
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
 * points: 			array: [[x1, y1], [x2,y2], ...]
 *					The input array, where x and y correspond to the coordinates of a point
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

function rangeSearch(x, y, r, node, Neighbours) {
/*
 * INFO:
 * -----
 * Perform a circular range query with radius r, 
 * about the query point [x, y] and 
 * returns all points within the query range in the Neighbours array
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
 * r:					int
 *						radius of query circle
 *
 * node:	 			obj
 *						node object 
 *
 * Neighbours			array: []
 *						input array where the neighbouring points will be placed in
 *
 *
 * RETURNS:
 * --------
 * Neighbours: 			array: [[x1, y1], [x2,y2], ...]
 *		   				array containing neighbouring points
 */

	
	var rSquare = r * r;
	
	//If the node is a leaf and its squareDist to x,y is less than rSquare, add it to the Neighbours array
	if (node.leftChild == undefined && node.rightChild == undefined) {
		if (squareDist(node.position, [x,y]) <= rSquare) {
			Neighbours.push(node.position);
		}
		return;
	
	//TODO####
	//Need to figure out how to define a node's region
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
	
	//Traverse down the left node if it exist and the query point is on the left hyperplane
	} else {
		if (node.leftChild != undefined && isLeft(x, y, node) == true) {
			rangeSearch(x, y, r, node.leftChild, Neighbours);
		} else {
			rangeSearch(x, y, r, node.rightChild, Neighbours);
		}
		return;
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
 * descendants:	 		array: [[x1, y1], [x2,y2], ...]
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
	
	//compares perpendicular square distance between the node's position and the query point
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
 * P: 					array: [x, y]
 *						2D Point in an array
 *
 * Q:	 				array: [x, y]
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

function isLeft (x, y, node) {
/*
 * INFO:
 * -----
 * Check if a query point lies on the left hyperplane or right hyperplane
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
 *
 * RETURNS:
 * --------
 * truth: 				bol
 *						true/false
 */
 
	var axis = node.depth % 2;
	
	if (axis == 0) {
		if (x <= node.position[0]) {
			return true;
		} else {
			return false;
		}
	} else {
		if (y <= node.position[1]) {
			return true;
		} else {
			return false;
		}
	}
	
}


