var url = "http://193.27.9.220/Apsis4allBackend/rest/ProfileService",
	mmToPt = 2.834645669;
	preferences = {}; 

// Receive messages from popup
chrome.runtime.onMessage.addListener(
	function(req, sen, sendResponse) {
		if (req.hasOwnProperty("username") && req.hasOwnProperty("password")) {
			for (var i in req) {
				console.log(i + ": " + req[i]);
			}
			makeRequest(req);
			sendResponse({ keyInACK: true});
		}
	}
);

// Handle XMLHttpRequest
function makeRequest(data) {

	var xhr = new XMLHttpRequest();
	var reqStatus = {};

	xhr.open( "POST", url, true);

	xhr.setRequestHeader('Content-Type', 'application/json');

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				// the transaction has finished with a status of OK
				reqStatus.status = xhr.status;
				var profile = JSON.parse(xhr.response);
				console.log(profile);
				if (profile.hasOwnProperty("isValid")) {
					if (profile["isValid"] === "true") {
						console.log("Profile is valid");
						reqStatus.statusText = xhr.statusText;
						transformPreferences(profile.profile);

					} else {
						console.log("Profile is invalid");
						reqStatus.statusText = "Profile is not valid";
					}
				}
			// The transaction has ended with a status other than OK
			} else {
				reqStatus.status = xhr.status;
				reqStatus.statusText = xhr.statusText;
			}

			chrome.runtime.sendMessage(reqStatus, function(response) {});
		}
	}

	xhr.send(JSON.stringify(data));
}

function transformPreferences(prefsXml) {
	var prefs = $.xml2json(prefsXml);
	console.log(prefs);
	if (prefs.hasOwnProperty("ScreenEnhancement")) {
		var screnh = prefs["ScreenEnhancement"]["Value"];
		if ((screnh[6] === "1") ||  (screnh[7] === "1")) {
			preferences.magnificationEnabled = true; 
			if (screnh.slice(0, 3) === "101") {
				preferences.magnification = screenEnhancementValues["101"];
			} else if (screnh.slice(0, 3) === "100") {
				preferences.magnification = screenEnhancementValues["100"]
			} else {
				preferences.magnification = screenEnhancementValues[screnh.slice(1, 3)];
			}

		} else {
			preferences.magnificationEnabled = false; 
			preferences.magnification = 1; 
		}
	}

	if (prefs.hasOwnProperty("ScreenReader")) {
		var scrread = prefs["ScreenReader"];
		if (scrread[7] === "1" || scrread[6] === "1") {
			preferences.screenReaderEnabled = true;
		} else {
			preferences.screenReaderEnabled = false; 
		}
	}

	if (prefs.hasOwnProperty("ColourOfBackground")) {
		preferences.backgroundColour = prefs["ColourOfBackground"]["Value"];
	}

	if (prefs.hasOwnProperty("ColourOfText")) {
		preferences.foregroundColour = prefs["ColourOfText"]["Value"];
	}

	if (prefs.hasOwnProperty("CharacterSize")) {
		var charsize = prefs["CharacterSize"]["Value"];
		preferences.fontSize = Math.round((parseInt(bcdToInt[charsize.slice(0, 4)])*10 + parseInt(bcdToInt[charsize.slice(4, 8)]))*mmToPt);
	}

	console.log(preferences);
}

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
