// function toDataURL(url, callback) {
	// var xhr = new XMLHttpRequest();
	// xhr.onload = function() {
		// var reader = new FileReader();
		// reader.onloadend = function() {
			// callback(reader.result);
		// }
		// reader.readAsDataURL(xhr.response);
	// };
	
	// xhr.open('GET', url);
	// xhr.responseType = 'blob';
	// xhr.send();
// }

var dataurl;

function encodeImageFileAsURL(element) {
	var file = element.files[0];
	var reader = new FileReader();
	reader.onloadend = function() {
		dataurl = reader.result;
	}
	reader.readAsDataURL(file);
}


function submit() {
	
	var thresh = $("#thresh").val();
	var eps = $("#eps").val();
	var minPts = $("#minPts").val();
	var dia = $("#dia").val();
	var amt = $("#amt").val();
	var autoCrop = document.getElementById("cropCheck").checked;
	
	if (thresh == "") {thresh = 60;}
	if (eps == "") {eps = 15;}
	if (minPts == "") {minPts = 5;}
	if (dia == "") {dia = 10;}
	if (amt == "") {amt = 1;}
	
	
	//data:image/jpeg;base64,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
	
	textSegment(dataurl, thresh, eps, minPts, dia, amt, 1, autoCrop, 0, "demo-canvas");
	
	
}
