// WARNING: There should only ever be one record in the datasource!
Date.prototype.toSortString = function() {
	return this.getFullYear() + ("0"+(this.getMonth()+1)).substr(-2) + ("0"+this.getDate()).substr(-2);
}
configdb = pi.data.DataSource.create({
	id : "Lunch.Config",
	// storage : "localStorage",
	default : {
		id : "com.atsid.labs.lunch",
		server : {
			results : "https://catnip-ats.herokuapp.com/results"
		},
		version : "1.5.0",
		everlive : {
			apiKey : "1V7hKCv6hyKjyPUl",
			scheme : "http"
		},
		google : {
			scheme : "http",
			domain : "none"
		},
		today : new Date().toSortString()
	}
});
// This call will fire the JIT handler for selected.
config = configdb.options.get("selected");
config.getToday = function() {
	var today = new Date().toSortString();
	this.set("today", today);
	return today;
}

if (typeof(window.console) != "undefined") { // For IE 8 and below!
	window.console.log("server: "+JSON.stringify(document.location));
	window.console.log("config: "+JSON.stringify(config.toJSON()));
}

// Mobile App
if (/file:\/\//.test(document.location.href) || (document.location.origin && /file:\/\//.test(document.location.origin)) ) {
	// window.config.set("server", "https://catnip-ats.herokuapp.com/results");
}
// Icenium Simulator
else if (/app\.icenium\.com/.test(document.location.host)) {
	if (!("com.phonegap.plugins.PushPlugin.PushNotification" in cordova.define.moduleMap))
		window.config.set("NoPushNotifications", true);
	window.config.set("google.domain", "icenium.com");
}
// Local Server
else if (/localhost/.test(document.location.host)) {
	window.config.set("scheme", "http");
	window.config.set("google.domain", "none");
}

// Init Everlive connection
Everlive.init(config.get("everlive").toJSON());