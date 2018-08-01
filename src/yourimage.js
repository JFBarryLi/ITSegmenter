var dataurl;

function encodeImageFileAsURL(element) {
	var file = element.files[0];
	$('#customFileLabel').text(file.name);
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
		
	textSegment(dataurl, thresh, eps, minPts, dia, amt, 1, autoCrop, 0, "demo-canvas");
	
	
}
