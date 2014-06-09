'use strict'

var url = "http://193.27.9.220/Apsis4allBackend/rest/ProfileService",
	uri = "http://registry.gpii.org/common/",
	c4aPreferencesServer = "http://preferences.gpii.net/user/",
	mmToPt = 2.834645669; 	// milimeters to Points factor

// Receive messages from popup
chrome.runtime.onMessage.addListener(
	function(req, sen, sendResponse) {
		if (req.hasOwnProperty("username") && req.hasOwnProperty("password")) {
			for (var i in req) {
				console.log(i + ": " + req[i]);
			}
			makeRequest(req);
			sendResponse({ type: "connectionACK", status: "success"});
		}

		if ((req.hasOwnProperty("action")) && (req.action === "savetoC4a")) {
			uploadPreferencesToCloud4all();
		}
	}
);

chrome.storage.onChanged.addListener(function(changes, namespace) {
	var newPreferences = changes.preferences.newValue;

	if (newPreferences) {
		setPreferences(newPreferences);
	} else {
		chrome.tabs.query({ currentWindow : true}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				chrome.tabs.reload(tabs[i].id);
			}
		});
	}
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	if (!chrome.runtime.lastError) {
		setTab();	
	} else {
		console.log(chrome.runtime.lastError.message);
	}
}); 

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	setTab();
});

function setTab() {
	chrome.storage.local.get("preferences", function(results) {
		if (results.preferences) {
			setPreferences(results.preferences);
		}
	});
}

// Handle XMLHttpRequest
function makeRequest(data) {

	var xhr = new XMLHttpRequest();
	var reqStatus = {type: "connectionStatus"};

	xhr.open( "POST", url, true);

	xhr.setRequestHeader('Content-Type', 'application/json');

	xhr.onreadystatechange = function() {

		reqStatus.status = xhr.status;
		
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				// the transaction has finished with a status of OK
				
				var profile = JSON.parse(xhr.response);
				console.log(profile);
				if (profile.hasOwnProperty("isValid")) {
					if (profile["isValid"] === "true") {
						console.log("Profile is valid");
						reqStatus.statusText = xhr.statusText;
						savePreferences({username: data.username, prefsXML: profile.profile});
 					}
				}
			// The transaction has ended with a status other than OK
			} else {
				reqStatus.statusText = xhr.statusText;
			}
			chrome.runtime.sendMessage(reqStatus);
		} else {
			chrome.runtime.sendMessage(reqStatus);
		}
	}

	xhr.send(JSON.stringify(data));
}

function savePreferences(userInfo) {
	var prefs = $.xml2json(userInfo.prefsXML);
	var preferences = {};
	console.log(prefs);

	if (prefs.hasOwnProperty("ScreenEnhancement")) {
		var screnh = prefs["ScreenEnhancement"]["Value"];
		if ((screnh[6] === "1") ||  (screnh[7] === "1")) {
			preferences.magnifiernabled = true; 
			if (screnh.slice(0, 3) === "101") {
				preferences.magnification = screenEnhancementValues["101"];
			} else if (screnh.slice(0, 3) === "100") {
				preferences.magnification = screenEnhancementValues["100"];
			} else {
				preferences.magnification = screenEnhancementValues[screnh.slice(1, 3)];
			}

		} else {
			preferences.magnifierEnabled = false; 
			preferences.magnification = 1; 
		}
	}

	if (prefs.hasOwnProperty("ScreenReader")) {
		var scrread = prefs["ScreenReader"]["Value"];
		if ((scrread[7] === "1") || (scrread[6] === "1")) {
			preferences.screenReaderEnabled = true;
		} else {
			preferences.screenReaderEnabled = false; 
		}
	}

	if (prefs.hasOwnProperty("SpeechRate")) {
		var sr = prefs["SpeechRate"]["Value"];
		preferences.speechRate = (parseInt(bcdToInt[sr.slice(0, 4)]))*100 + (parseInt(bcdToInt[sr.slice(4, 8)]))*10;
	}

	if (prefs.hasOwnProperty("ColourOfBackground") && prefs.hasOwnProperty("ColourOfText")) {
		var bgColour = prefs["ColourOfBackground"]["Value"];
		var fgColour = prefs["ColourOfText"]["Value"];
		
		preferences.backgroundColour = bgColour;
		preferences.foregroundColour = fgColour;

		if ((bgColour == "FFD700") && (fgColour == "1E90FF")) {
			preferences.screenColour = "default";
		}

	} else {
		preferences.screenColour = "default";		
	}

	if (prefs.hasOwnProperty("ColourAvoidance")) {
		if (prefs["ColourAvoidance"]["Value"][4] === "1") {
			preferences.theme = "monochrome";
		}
	}

	if (prefs.hasOwnProperty("CharacterSize")) {
		var charsize = prefs["CharacterSize"]["Value"];
		var charsizept = Math.floor((parseInt(bcdToInt[charsize.slice(0, 4)])*10 + parseInt(bcdToInt[charsize.slice(4, 8)]))*mmToPt);
		preferences.fontSize = charsizept;
	}

	if (prefs.hasOwnProperty("On_ScreenKeyboard")) {
		if ((prefs["On_ScreenKeyboard"]["Value"].slice(6, 8) == "01") || (prefs["On_ScreenKeyboard"]["Value"].slice(6, 8) === "10")) {
			preferences.onScreenKeyboardEnabled = true;
		} else {
			preferences.onScreenKeyboardEnabled = false;
		}
	}

	// FUTURE: Add values for text complexity
	if (prefs.hasOwnProperty["InterfaceComplexityLevel"]) {
		var intpref = prefs["InterfaceComplexityLevel"]["Value"].slice(2, 4);
		if ((intpref === "01") || (intpref === "10")) {
			preferences.simplifier = true;
		} 
	}

	chrome.storage.local.set({ user: userInfo.username, preferences: preferences }, function() {
		if (chrome.runtime.lastError) {
			console.log("Error in chrome storage local set");
		}
	}); 
}

function setPreferences(preferences) {
	
	if (preferences) {
		
		console.log(preferences);

		if (preferences.hasOwnProperty("magnifierEnabled")) {
			if (preferences.magnifierEnabled) {
				if (preferences.hasOwnProperty("magnification")) {
					chrome.tabs.executeScript({ code : "document.documentElement.setAttribute('zoom', '" + preferences['magnification'].toString() + "')" }, function() {
						if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
					});
				}
			} else {
				chrome.tabs.executeScript({ code : "document.documentElement.removeAttribute('zoom');" }, function() {
					if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
				});
			}
		}

		if (preferences.hasOwnProperty("screenReaderEnabled")) {
			chrome.management.get("kgejglhpjiefppelpmljglcjbhoiplfn", function(extInfo) {
				if (chrome.runtime.lastError) {
					console.log(chrome.runtime.lastError.message)
				} else {
					chrome.management.setEnabled(extInfo.id, preferences.screenReaderEnabled); 	
				}
			});
		}

		if (!preferences.hasOwnProperty("screenColour")) {

			if (preferences.hasOwnProperty("backgroundColour")) {
				var backgroundColour = preferences.backgroundColour;
				chrome.tabs.insertCSS({ code: "* { background: #" + backgroundColour + " !important; }" }, function() {
					if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
				}); 
			} 

			if (preferences.hasOwnProperty("foregroundColour")) {
				var foregroundColour = preferences.foregroundColour;
				chrome.tabs.insertCSS({ code : "* { color: #"+ foregroundColour + " !important; a { text-decoration: underline; } }" }, function() {
					if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
				});
			}
		} 

		if (preferences.hasOwnProperty("theme")) {
			if (preferences["theme"] === "monochrome") {
				chrome.tabs.executeScript({ code : "document.documentElement.setAttribute('theme', 'monochrome');" }, function() {
					if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
				});
			}
		} else {
			chrome.tabs.executeScript({ code : "document.documentElement.removeAttribute('theme');" }, function() {
				if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
			});
		}

		if (preferences.hasOwnProperty("fontSize")) {
			if (!(preferences.hasOwnProperty("fontSizeDisabled"))) {
				chrome.tabs.insertCSS({ code : "html, body, p, span, blockquote, button, ul, li > a { font-size: " + preferences.fontSize + "pt !important; line-height: 1.4em !important; }" }, function() {
					if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
				});	
			}
			
		}

		if (preferences.hasOwnProperty("onScreenKeyboardEnabled")) {
			chrome.management.get("pflmllfnnabikmfkkaddkoolinlfninn", function(extInfo) {
				if (chrome.runtime.lastError) {
					console.log(chrome.runtime.lastError.message);
				} else {
					chrome.management.setEnabled(extInfo.id, preferences.onScreenKeyboardEnabled);
				}
			});
		}

		if (preferences.hasOwnProperty("simplifier")) {
			if (preferences.simplifier) {
				chrome.tabs.executeScript({file: 'js/simplifier.js'}, function() {
					if (chrome.runtime.lastError) { console.log(chrome.runtime.lastError.message); }
				});
			}
		}
	}
}

function uploadPreferencesToCloud4all() {
	
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {

		if (xhr.readyState == 4) {
			chrome.runtime.sendMessage({ action: "savetoC4a", status: xhr.status }, function(response) {
				console.log(response);
			});
		}
	};

	chrome.storage.local.get({ user : "", preferences: {} }, function(results) {

		var preferences = {};
				

		if (results.user != "") {

			xhr.open("POST", c4aPreferencesServer + results.user); 
			xhr.setRequestHeader("Content-Type", "application/json");

			if (results.preferences.hasOwnProperty("magnifierEnabled")) {
				preferences[uri + "magnifierEnabled"] = [{"value": results.preferences.magnifierEnabled}];
			}
			if (results.preferences.hasOwnProperty("magnification")) {
				preferences[uri + "magnification"] = [{"value": results.preferences.magnification}];
			}
			if (results.preferences.hasOwnProperty("screenReaderEnabled")) {
				preferences[uri + "screenReaderTTSEnabled"] = [{"value": results.preferences.screenReaderEnabled}];
			}
			if (results.preferences.hasOwnProperty("backgroundColour")) {
				preferences[uri + "backgroundColour"] = [{"value": results.preferences.backgroundColour}];
			}
			if (results.preferences.hasOwnProperty("foregroundColour")) {
				preferences[uri + "foregroundColour"] = [{"value": results.preferences.foregroundColour}];
			}
			if (results.preferences.hasOwnProperty("fontSize")) {
				preferences[uri + "fontSize"] = [{"value": results.preferences.fontSize}];
			}
			if (results.preferences.hasOwnProperty("onScreenKeyboardEnabled")) {
				preferences[uri + "onScreenKeyboardEnabled"] = [{"value": results.preferences.onScreenKeyboardEnabled}];
			}
			if (results.preferences.hasOwnProperty("simplifier")) {
				preferences[uri + "simplifier"] = [{"value": results.preferences.simplifier}];
			}

			xhr.send(JSON.stringify({ preferences: preferences }));
		}
	});
}

// General Use Variables
var bcdToInt = {
	"0000": 0,
	"0001": 1,
	"0010": 2,
	"0011": 3,
	"0100": 4,
	"0101": 5,
	"0110": 6,
	"0111": 7,
	"1000": 8,
	"1001": 9
};

var screenEnhancementValues = {
	"111": 3.5,
	"100": 3,
	"11": 2.5,
	"10": 2,
	"01": 1.5,
	"00": 1
};
