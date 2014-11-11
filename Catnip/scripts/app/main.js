// Enter your Backend Services project APIKey
var everliveApiKey = '';

// Change this to 'http' if you receive a "Your current subscription does not support calls over HTTPS" error fron the BS server
// ADFS authentication will work only with 'https' URI scheme
var everliveScheme = 'https'

///This is the info of Facebook project
var facebookClientId = '',
	facebookRedirectUri = '';

//This is the info of your Google Project
var googleClientId = '',
	googleRedirectUri = '';

///This is the info of LiveID project
var liveIdClientId = '',
	liveIdRedirectUri = '';

///Settings for ADFS authentication
var adfsRealm = '',
    adfsEndpoint = '';


var app = {
	// Application Constructor
	initialize: function() {
		this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicity call 'app.receivedEvent(...);'
	onDeviceReady: function() {
		app.initializeEverlive();
		app.initializeFacebookAuthentication();
		app.initializeGoogleAuthentication(); 
		app.initializeLiveIdAuthentication();
        app.initializeADFSAuthentication();
		navigator.splashscreen.hide();
	},
	initializeEverlive:function() {
		Everlive.init({
			apiKey: everliveApiKey,
            scheme: everliveScheme
		});
	},
	initializeFacebookAuthentication: function() {
		var facebookConfig = {
			name: "Facebook",
			loginMethodName: "loginWithFacebook",
			endpoint: "https://www.facebook.com/dialog/oauth",
			response_type:"token",
			client_id: facebookClientId,
			redirect_uri: facebookRedirectUri,
			access_type:"online",
			scope:"email",
			display: "touch"
		};
		var facebook = new IdentityProvider(facebookConfig); 
		var loginFbBtn = document.getElementById("loginFb");
		loginFbBtn.addEventListener('click', function() {
			facebook.getAccessToken(function(token) {
				Everlive.$.Users.loginWithFacebook(token)
				.then(function(res) {
					console.log(res);
					var message = "Welcome to Everlive!";
					navigator.notification.alert(message, function() {
					}, "Everlive")
				}, function(err) {
					console.log(err);
					navigator.notification.alert(err.message, function() {
					}, "Everlive")
				})
			})
		});
	},
	initializeGoogleAuthentication: function() {
		var googleConfig = {
			name: "Google",
			loginMethodName:"loginWithGoogle",
			endpoint: "https://accounts.google.com/o/oauth2/auth",
			response_type: "token",
			client_id: googleClientId,
			redirect_uri: googleRedirectUri, 				 
			scope: "https://www.googleapis.com/auth/userinfo.profile", 
			access_type: "online",
			display: "touch" 
		};
		var google = new IdentityProvider(googleConfig);
        
		var loginGoogleBtn = document.getElementById("loginGoogle");
		loginGoogleBtn.addEventListener('click', function() {
			google.getAccessToken(function(token) {
				Everlive.$.Users.loginWithGoogle(token)
				.then(function(res) {
					console.log(res);
					var message = "Welcome to Everlive!";
					navigator.notification.alert(message, function() {
					}, "Everlive")
				}, function(err) {
					console.log(err);
					navigator.notification.alert(err.message, function() {
					}, "Everlive")
				})
			})
		});
	},
	initializeLiveIdAuthentication: function() {
		var liveIdConfig = {
			name: "LiveID",
			loginMethodName:"loginWithLiveID",
			endpoint: "https://login.live.com/oauth20_authorize.srf",
			response_type: "token",
			client_id: liveIdClientId,
			redirect_uri: liveIdRedirectUri,				 
			scope: "wl.basic",
			access_type: "online",
			display: "touch"
		};
		var liveId = new IdentityProvider(liveIdConfig);
        
		var loginLiveIdBtn = document.getElementById("loginLiveId");
		loginLiveIdBtn.addEventListener('click', function() {
			liveId.getAccessToken(function(token){
                Everlive.$.Users.loginWithLiveID(token)
				.then(function(res) {
					console.log(res);
					var message = "Welcome to Everlive!";
					navigator.notification.alert(message, function() {
					}, "Everlive")
				}, function(err) {
					console.log(err);
					navigator.notification.alert(err.message, function() {
					}, "Everlive")
				})
            })
		});
	},
    initializeADFSAuthentication: function() {
		var adfsConfig = {
			name: "ADFS",
			loginMethodName: "loginWithADFS",
			endpoint: adfsEndpoint ,
            wa: 'wsignin1.0',
            wtrealm: adfsRealm 
		};
		var adfs = new IdentityProvider(adfsConfig); 
		var loginADFSBtn = document.getElementById("loginADFS");
		loginADFSBtn.addEventListener('click', function() {
			adfs.getAccessToken(function(token){
                Everlive.$.Users.loginWithADFS(token)
				.then(function(res) {
					console.log(res);
					var message = "Welcome to Everlive!";
					navigator.notification.alert(message, function() {
					}, "Everlive")
				}, function(err) {
					console.log(err);
					navigator.notification.alert(err.message, function() {
					}, "Everlive")
				})
            })
		});
	}
};