(function() {

	var divContainer = $("<div class='simple-container'></ul>");
	var firstLevelUL = $("<ul class='first-level'></ul>")
	
	$("body *").not("div, script, ul, li, input").each(function() {
		if ($(this).text().length > 0) {
			$(divContainer).append(this);	
		}
		
	});

	$("body").html(divContainer);

})();