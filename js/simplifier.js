(function() {

	var domUL = $("<ul class='dom-list'></ul>");
	
	$(':header').each(function() {
		if ($(this).prop("tagName") == "H1") {
			$(domUL).append($(this))
		}

		if ($(this).prop("tagName") == "H2") {
			$(domUL).append($(this))
		}

	});

	$("body").html(domUL);

})();