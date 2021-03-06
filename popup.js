var localPreferences = {},
	cvInstalled = false,
	oskInstalled = false;

(function() {
	// Check if ChromeVox is installed
	chrome.management.get("kgejglhpjiefppelpmljglcjbhoiplfn", function(extInf) {
		console.log(chrome.runtime.lastError);
		(chrome.runtime.lastError) ? cvInstalled = false : cvInstalled = true; 
		console.log(cvInstalled);
	});

	// Check if Chrome Virtual Keyboard is installed
	chrome.management.get("pflmllfnnabikmfkkaddkoolinlfninn", function(extInf) {
		(chrome.runtime.lastError) ? oskInstalled = false : oskInstalled = true;
		console.log(oskInstalled);
	});
})();

$(document).ready(function() {

	chrome.storage.local.get({ user: "", preferences: {}}, function(results) {
		initializePopup(results);
	});

	// keyInFormSubmit
	$("#key-in-form").submit(onKeyInFormSubmit);

	// Go to initial servlet
	$("#npg-link").click(function(e) {
		e.preventDefault();
		chrome.tabs.create({ url: 'https://cajerofacil.apsis4all.eu/initialservlet' }); 
	});

	$("#log-out-btn").click(function(e) {
		e.preventDefault();
		chrome.storage.local.clear();
		localPreferences = {};
		chrome.tabs.reload();
	});

	// Form buttons
	$("#magnifier-enabled").click(onMagnifierEnabledClick);
	$("#magnification-level").on("change", onMagnificationChange);
	$("#screenreader-enabled").click(onScreenreaderEnabledClick);
	$("#default-colours").click(onDefaultColoursClick);
	$("#background-colour").change(onBackgroundColourChange);
	$("#foreground-colour").change(onForegroundColourChange);
	$("#monochrome-theme-enabled").click(onMonochromeEnabledClick);
	$("#font-size").change(onFontSizeChange);
	$("#font-size-disabled").click(onFontSizeDisabledClick);
	$("#screen-keyboard-enabled").click(onScreenKeyboardEnabledClick);
	$("#simplifier-enabled").click(onSimplifierEnabledClick);
	$("#save-to-c4a").click(onSaveToCloud4allClick);

}); 

// Receiving messages from Background
chrome.runtime.onMessage.addListener(
	function(req, sen, response) {

		if (req.type === "connectionStatus") {
			if ((req.status == 200)) {
				$("#help-text").hide();
				$("#connection-status").show().css("color", "red").html(req.status + ": " + req.statusText);
			} else {
				$("#help-text").hide();
				$("#connection-status").show().css("color", "orange").html(req.status + ": " + req.statusText);
			}
			
			$("#username, #password").val("");
		}

		if ((req.hasOwnProperty("action")) && (req.action === "savetoC4a")) {
			if (req.status == 200) {
				$("#preferences-saved-to-c4a").html("<p class='text-success'>Preferences saved to Cloud4all</p>").show();	
			} else {
				$("#preferences-saved-to-c4a").html("<p class='text-danger'>Preferences not saved - ERROR " + req.status + "</p>").show();
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
		console.log("Fields are empty");
		if (pwd === "") {
			$('.password-form-group').addClass('has-error');
		}
		if (uname === "") {
			$('.username-form-group').addClass('has-error');
		}
		$("#help-text").hide();
		$('#connection-status').show().html("Please complete all fields");
		return; 
	}

	chrome.runtime.sendMessage({ password: pwd, username: uname}, function(response) {
		if (response.type === "connectionACK") {
			console.log("connection acknowledged by background");
		}
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
			if (localPreferences.magnifierEnabled) {
				$("#magnifier-enabled").prop('checked', true);
				$("#magnification-level").prop("disabled", false);	
			} else {
				$("#magnifier-enabled").prop('checked', false);
				$("#magnification-level").prop("disabled", true);
			}
		}

		if (localPreferences.hasOwnProperty("magnification")) {
			$("#magnification-level").attr("value", localPreferences.magnification);
		}

		if (localPreferences.hasOwnProperty("screenColour")) {
			$("#default-colours").prop("checked", true);
			$("#background-colour-label, #foreground-colour-label").prop("disabled", true);

		} else {
			$("#default-colours").prop("checked", false);
		}

		if (localPreferences.hasOwnProperty("screenReaderEnabled")) {
			if (cvInstalled) {
				$("#screenreader-checkbox").show();
				$("#screenreader-not-installed").hide();

				if (localPreferences.screenReaderEnabled) {
					$("#screenreader-enabled").prop("checked", true);
				} else {
					$("#screenreader-enabled").prop("checked", false);
				}
				
			} else {
				$("#screenreader-checkbox").hide();
				$("#screenreader-not-installed").show();
			}
		}

		if (localPreferences.hasOwnProperty("backgroundColour")) {
			$("#background-colour").attr("value", "#" + localPreferences.backgroundColour);
			$("#background-colour-label, #foreground-colour-label").css("background", "#" + localPreferences.backgroundColour);
		}

		if (localPreferences.hasOwnProperty("foregroundColour")) {
			$("#foreground-colour").attr("value", "#" + localPreferences.foregroundColour);
			$("#background-colour-label, #foreground-colour-label").css("color", "#" + localPreferences.foregroundColour);
		}

		if (localPreferences.hasOwnProperty("theme")) {
			var theme = localPreferences.theme;
			if (theme === "monochrome") {
				$("#monochrome-theme-enabled").prop("checked", true);
				$("#background-colour, #foreground-colour").prop("disabled", true);
			} else {
				$("#monochrome-theme-enabled").prop("checked", false);
				$("#background-colour, #foreground-colour").prop("disabled", false);

			}
		}

		if (localPreferences.hasOwnProperty("fontSize")) {
			$("#font-size").attr("value", localPreferences.fontSize);
			// $("#font-size").value(localPreferences["fontSize"]);
		} else {
			$("#font-size-disabled").prop("checked", true);
			$("#font-size").prop("disabled", true);
		}

		if (localPreferences.hasOwnProperty("fontSizeDisabled")) {
			if (localPreferences.fontSizeDisabled) {
				$("#font-size-disabled").prop("checked", true);
				$("#font-size").prop("disabled", true);	
			} else {
				$("#font-size-disabled").prop("checked", false);
				$("#font-size").prop("disabled", false);	
			}
			
		}

		if (localPreferences.hasOwnProperty("onScreenKeyboardEnabled")) {
			if (oskInstalled) {
				$("#screen-keyboard-checkbox").show();
				$("#screen-keyboard-not-installed").hide();
				console.log("OKSINSTALLED IS TRUE");

				if (localPreferences.onScreenKeyboardEnabled) {
					$("#screen-keyboard-enabled").prop("checked", true);
				} else {
					$("#screen-keyboard-enabled").prop("checked", false);
				}
			} else {
				console.log("OKSINSTALLED IS NOT TRUE");
				$("#screen-keyboard-checkbox").hide();
				$("#screen-keyboard-not-installed").show();
			}
		}

		if (localPreferences.hasOwnProperty("simplifier")) {
			if (localPreferences.simplifier) {
				$("#simplifier-enabled").prop("checked", true);
			} else {
				$("#simplifier-enabled").prop("checked", false);
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
		localPreferences.magnifierEnabled = false;
	}
	chrome.storage.local.set({preferences: localPreferences});
}

function onMagnificationChange() {
	console.log("Magnification has changed");
	localPreferences.magnification = parseFloat($("#magnification-level").val());
	chrome.storage.local.set({preferences: localPreferences});
}

function onScreenreaderEnabledClick(e) {
	if (this.checked) {
		localPreferences.screenReaderEnabled = true;
	} else {
		localPreferences.screenReaderEnabled = false;
	}
	chrome.storage.local.set({preferences: localPreferences});
}

function onDefaultColoursClick(e) {
	if (this.checked) {
		localPreferences.screenColour = "default";
		chrome.tabs.reload();
	} else {
		delete localPreferences.screenColour;
	}
	localPreferences.highContrastEnabled = true;
	chrome.storage.local.set({ preferences : localPreferences }); 
}

function onBackgroundColourChange() {
	$("#background-colour-label, #foreground-colour-label").css("background", this.value);
	localPreferences.backgroundColour = this.value.slice(1, 7);
	chrome.storage.local.set({preferences: localPreferences});
}

function onForegroundColourChange() {
	$("#background-colour-label, #foreground-colour-label").css("color", this.value);
	localPreferences.foregroundColour = this.value.slice(1, 7);
	chrome.storage.local.set({preferences: localPreferences});
}

function onMonochromeEnabledClick(e) {
	if (this.checked) {
		localPreferences.theme = "monochrome";
		$("#background-colour, #foreground-colour").prop("disabled", true);

	} else {
		delete localPreferences.theme;
		$("#background-colour, #foreground-colour").prop("disabled", false);
	}
	chrome.storage.local.set({preferences: localPreferences});
}

function onFontSizeChange() {
	var fs = $("#font-size").val();
	localPreferences.fontSize = parseInt(fs);
	chrome.storage.local.set({preferences: localPreferences});
}

function onFontSizeDisabledClick(e) {
	if (this.checked) {
		$("#font-size").prop("disabled", true);
		localPreferences.fontSizeDisabled = true;
		chrome.tabs.reload();
	} else {
		$("#font-size").prop("disabled", false);
		delete localPreferences.fontSizeDisabled;
	}
	
	chrome.storage.local.set({ preferences : localPreferences });
}

function onScreenKeyboardEnabledClick(e) {
	if (this.checked) {
		localPreferences.onScreenKeyboardEnabled = true;
	} else {
		localPreferences.onScreenKeyboardEnabled = false;
	}
	chrome.storage.local.set({ preferences : localPreferences });
}

function onSimplifierEnabledClick(e) {
	if (this.checked) {
		localPreferences.simplifier = true;
	} else {
		localPreferences.simplifier = false;
	}
	chrome.storage.local.set({ preferences : localPreferences });
}

function onSaveToCloud4allClick(e) {
	e.preventDefault();
	chrome.runtime.sendMessage({ action : "savetoC4a"}, function(response) {
		console.log(response);
	});
}