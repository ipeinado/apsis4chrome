var localPreferences = {};

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

	// Form buttons
	$("#magnifier-enabled").click(onMagnifierEnabledClick);
	$("#magnification-level").on("change", onMagnificationChange);
	$("#background-colour").change(onBackgroundColourChange);
	$("#foreground-colour").change(onForegroundColourChange);
	$("#screenreader-enabled").click(onScreenreaderEnabledClick);
	$("#font-size-normal").click(onFontSizeNormalClick);
	$("#font-size-large").click(onFontSizeLargeClick);
	$("#font-size-x-large").click(onFontSizeXLargeClick);

	$("#log-out-btn").click(function(e) {
		e.preventDefault();
		chrome.storage.local.clear();
		localPreferences = {};
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
	var username = userInfo.user;
	
	localPreferences = userInfo.preferences;

	if (username === "") {

		$('#form-div').show();
		$("#username").focus();
		$('#preferences-div').hide();

	} else {
		$('#preferences-div-welcome').html("Hey there " + username);
		$('#preferences-div').show();
		$('#form-div').hide();
		
		if (localPreferences.hasOwnProperty("magnifierEnabled")) {
			if (localPreferences["magnifierEnabled"]) {
				$("#magnifier-enabled").prop('checked', true);
				$("#magnification-level").prop("disabled", false);	
			} else {
				$("#magnifier-enabled").prop('checked', false);
				$("#magnification-level").prop("disabled", true);
			}
		}

		if (localPreferences.hasOwnProperty("magnification")) {
			$("#magnification-level").attr("value", localPreferences["magnification"]);
		}

		if (localPreferences.hasOwnProperty("screenReaderEnabled")) {
			if (localPreferences["screenReaderEnabled"]) {
				$("#screenreader-enabled").prop("checked", true);
			} else {
				$("#screenreader-enabled").prop("checked", false);
			}
		}

		if (localPreferences.hasOwnProperty("backgroundColour")) {
			$("#background-colour").attr("value", "#" + localPreferences["backgroundColour"]);
			$("#background-colour-label, #foreground-colour-label").css("background", "#" + localPreferences["backgroundColour"]);
		}

		if (localPreferences.hasOwnProperty("foregroundColour")) {
			$("#foreground-colour").attr("value", "#" + localPreferences["foregroundColour"]);
			$("#background-colour-label, #foreground-colour-label").css("color", "#" + localPreferences["foregroundColour"]);
		}

		if (localPreferences.hasOwnProperty("fontSize")) {
			var fs = localPreferences["fontSize"];
			if (fs === "normal") {
				$("#font-size-normal").prop("checked", true);
			} else if (fs === "large") {
				$("#font-size-large").prop("checked", true);
			} else if (fs === "x-large") {
				$("#font-size-x-large").prop("checked", true);
			}
		}
	}

}

function onMagnifierEnabledClick(e) {
	if (this.checked) {
		localPreferences['magnifierEnabled'] = true;
		$("#magnification-level").prop("disabled", false);
	} else {
		$("#magnification-level").prop("disabled", true);
		localPreferences['magnifierEnabled'] = false;
	}
	chrome.storage.local.set({preferences: localPreferences});
}

function onMagnificationChange() {
	console.log("Magnification has changed");
	localPreferences["magnification"] = parseFloat($("#magnification-level").val());
	chrome.storage.local.set({preferences: localPreferences});
}

function onScreenreaderEnabledClick(e) {
	if (this.checked) {
		localPreferences['screenReaderEnabled'] = true;
	} else {
		localPreferences['screenReaderEnabled'] = false;
	}
	chrome.storage.local.set({preferences: localPreferences});
}

function onBackgroundColourChange() {
	$("#background-colour-label, #foreground-colour-label").css("background", this.value);
	localPreferences["backgroundColour"] = this.value.slice(1, 7);
	chrome.storage.local.set({preferences: localPreferences});
}

function onForegroundColourChange() {
	$("#background-colour-label, #foreground-colour-label").css("color", this.value);
	localPreferences["foregroundColour"] = this.value.slice(1, 7);
	chrome.storage.local.set({preferences: localPreferences});
}

function onFontSizeNormalClick(e) {
	localPreferences["fontSize"] = "normal";
	chrome.storage.local.set({preferences: localPreferences});
}

function onFontSizeLargeClick(e) {
	localPreferences["fontSize"] = "large";
	chrome.storage.local.set({preferences: localPreferences});
}

function onFontSizeXLargeClick(e) {
	localPreferences["fontSize"] = "x-large";
	chrome.storage.local.set({preferences: localPreferences});
}