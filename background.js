var url = "http://193.27.9.220/Apsis4allBackend/rest/ProfileService",
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
	}
);

chrome.storage.onChanged.addListener(function(changes, namespace) {
	var newPreferences = changes.preferences.newValue;
	setPreferences(newPreferences);
});

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
	var prefs = $.xml2json(userInfo.prefsXML),
	preferences = {};
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

	if (prefs.hasOwnProperty("ColourOfBackground")) {
		preferences.backgroundColour = prefs["ColourOfBackground"]["Value"];
	}

	if (prefs.hasOwnProperty("ColourOfText")) {
		preferences.foregroundColour = prefs["ColourOfText"]["Value"];
	}

	if (prefs.hasOwnProperty("ColourAvoidance")) {
		if (prefs["ColourAvoidance"]["Value"][4] === "1") {
			preferences.theme = "monochrome";
		}
	}

	if (prefs.hasOwnProperty("CharacterSize")) {
		var charsize = prefs["CharacterSize"]["Value"];
		var charsizemm = parseInt(bcdToInt[charsize.slice(0, 4)])*10 + parseInt(bcdToInt[charsize.slice(4, 8)]);
		if (charsizemm < 5) {
			preferences.fontSize = "normal";
		} else if ((charsizemm >= 5) && (charsizemm < 9)) {
			preferences.fontSize = "large";
		} else if (charsizemm >= 9) {
			preferences.fontSize = "x-large";
		}
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

	console.log(preferences);
	chrome.storage.local.set({ user: userInfo.username, preferences: preferences }, function() {
		if (chrome.runtime.lastError) {
			console.log("Error storing");
		}
	}); 
}

function setPreferences(preferences) {
	console.log(preferences);
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
