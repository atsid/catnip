// WARNING: There should only ever be one record in the datasource!
config = pi.data.DataSource.create({
	id : "Catnip.Config",
	// storage : "localStorage",
	default : {
		id : "catnip",
		server : {
			results : "https://catnip-ats.herokuapp.com/results"
		},
		version : "0.2.1",
		everlive : {
			apiKey : "kD5Tly50Vf6nm8kn",
			scheme : "http"
		},
		google : {
			scheme : "http",
			domain : "none"
		}
	}
});
// This call will fire the JIT handler for selected.
config = config.options.get("selected");

// Init Everlive connection
Everlive.init(config.get("everlive").toJSON());

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
	window.config.set("google.domain", "icenium.com");
}
// Local Server
else if (/localhost/.test(document.location.host)) {
	window.config.set("scheme", "http");
	window.config.set("google.domain", "none");
}
