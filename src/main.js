$(function () {
	Path.map("#/home").to(function(){$(window).stop(true,true).scrollTo('#main-title', 300)});
	Path.map("#/intro").to(function(){$(window).stop(true,true).scrollTo('#intro', 300)});
	Path.map("#/its").to(function(){$(window).stop(true,true).scrollTo('#its', 300)});
	Path.map("#/batch").to(function(){$(window).stop(true,true).scrollTo('#batch', 300)});

    Path.listen();
});