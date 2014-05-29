$(document).ready(function() {

	chrome.storage.local.get({ user: "", preferences: {}}, function(results) {
		initializePopup(results);
	});

	// keyInFormSubmit
	$("#key-in-form").submit(onKeyInFormSubmit);

	$("#npg-link").click(function(e) {
		e.preventDefault();
		chrome.tabs.create({ url: 'https://cajerofacil.apsis4all.eu/initialservlet' }); 
	});

	$("#log-out-btn").click(function(e) {
		e.preventDefault();
		chrome.storage.local.clear();
	});
}); 

// Receiving messages from Background
chrome.runtime.onMessage.addListener(
	function(req, sen, response) {
		// the message comes from the connection handler
		if (req.type === "connectionACK") {
			if (req.statusText !== "OK") {
				$('.formStatus').show().html(req.status + ": " + req.statusText);
			}
		}
		
	}
);

// When preferences change
chrome.storage.onChanged.addListener(function(changes, areaName) {
	chrome.storage.local.get({ user: "", preferences: {}}, function(results) {
		initializePopup(results);
	});
}); 

function onKeyInFormSubmit(e) {
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
	});
}

function initializePopup(userInfo) {
	if (userInfo.user === "") {
		$('#form-div').show();
		$("#username").focus();
		$('#preferences-div').hide();
	} else {
		$('#preferences-div').show();
		$('#form-div').hide();
		for (var i in userInfo.preferences) {
			console.log(i + ": " + userInfo.preferences[i]);
		}
	}

}