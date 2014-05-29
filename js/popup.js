$(document).ready(function() {
	$("#username").focus();

	// keyInFormSubmit
	$("#keyInForm").submit(function(e) {
		e.preventDefault();
		var pwd = $("#password").val();
		var uname = $("#username").val();
		
		if ((pwd === "") || (uname === "")) {
			if (pwd === "") {
				$('.password-form-group').addClass('has-error');
			}
			if (uname === "") {
				$('.username-form-group').addClass('has-error');
			}
			$('.formStatus').show().html("Please complete all fields");
			return; 
		}

		chrome.runtime.sendMessage({ password: pwd, username: uname}, function(response) {
			if (response.keyInACK) {
				$('.password-form-group').removeClass('has-error');
				$('.username-form-group').removeClass('has-error');
			}
			console.log("IN THE RESPONSE");
		});
	});
}); 

// message received
chrome.runtime.onMessage.addListener(
	function(req, sen, response) {
		console.log("STATUS: " + req.status);
		if (req.statusText !== "OK") {
			$('.formStatus').show().html(req.status + ": " + req.statusText);
		}
	}
);