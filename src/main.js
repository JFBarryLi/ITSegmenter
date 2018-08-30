$(function () {
	Path.map("#/home").to(function(){$(window).stop(true,true).scrollTo('#main-title', 300)});
	Path.map("#/intro").to(function(){$(window).stop(true,true).scrollTo('#intro', 300)});
	Path.map("#/usm").to(function(){$(window).stop(true,true).scrollTo('#usm', 300)});
	Path.map("#/fast").to(function(){$(window).stop(true,true).scrollTo('#fast', 300)});
	Path.map("#/kdTree").to(function(){$(window).stop(true,true).scrollTo('#kdTree', 300)});
	Path.map("#/dbscan").to(function(){$(window).stop(true,true).scrollTo('#dbscan', 300)});
	Path.map("#/segImg").to(function(){$(window).stop(true,true).scrollTo('#segImg', 300)});


    Path.listen();
});

$(function() {
		var layout = '#layout';
		var sbar = '#sbar';
		var sidebarTog = '#sidebarTog';

	function toggleClass(id) {
		var classId = String($(id).attr('class'));
		if(classId.indexOf('active') == -1) {
			$(id).addClass('active');
		} else {
			$(id).removeClass('active');
		}
	}

	$(sidebarTog)[0].addEventListener('click', function(e) {	  
		toggleClass(layout);
		toggleClass(sbar);
		toggleClass(sidebarTog);
		e.preventDefault();
  });
}());


