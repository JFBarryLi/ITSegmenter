$(function () {
	Path.map("#/home").to(function(){$(window).stop(true,true).scrollTo('#main-title', 300)});
	Path.map("#/intro").to(function(){$(window).stop(true,true).scrollTo('#intro', 300)});
	Path.map("#/its").to(function(){$(window).stop(true,true).scrollTo('#its', 300)});
	Path.map("#/batch").to(function(){$(window).stop(true,true).scrollTo('#batch', 300)});

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


