config = pi.observable({
	scheme : "http",
	server : "http://localhost:8080",
	version : "0.1.0",
	everlive : {
		apiKey : "kD5Tly50Vf6nm8kn",
		scheme : "http"
	}
});
Everlive.init(config.get("everlive"));

config.set("user", {
	"id" : "1bac2d70-69a0-11e4-8481-bd60c9634975"
});