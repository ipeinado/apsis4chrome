(function() {

	var divContainer = $("<div class='simple-container'></ul>");
	var counter = 0;
	
	$(":header, p, blockquote, article, ul, img").each(function() {
		if ($(this).prop("tagName") == "UL") {
			counter++;
			$(this).addClass("collapsed-list").attr("id", "list_" + counter.toString());

			var button = $("<a>[List]</a>").addClass("expand-button").attr("id", "list_" + counter.toString());
			$(divContainer).append(button);

		}
		$(divContainer).append(this);
	});

	$("body").html(divContainer);

})();

//	$(".collapsed-list").children().css("display", "none");
$(".collapsed-list").attr("title", "click on the list to expand it");

$(".expand-button").click(function(e) {
	e.preventDefault();
	var listId = $(this).attr("id");
	var ul = $("ul").filter(function() {
		return ($(this).attr("id") == listId); 
	});
	$(ul[0]).toggle();
});

$(".collapsed-list").css("display", "none");


