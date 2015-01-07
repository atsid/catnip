$(function() {
	try {
		// Add Push Notification support
		if (!config.get("NoPushNotifications")) {
			document.addEventListener("deviceready", function() {
				window.account.bind("change", function(e) {
					try {
						if (e.action === "itemchange" && e.items[0] === window.myAccount) {
							if (e.field === "access_token" && window.myAccount.get("access_token") && window.myAccount.get("Push")) {
								
								var device = Everlive.$.push.currentDevice();
								if (device.pushToken)
									return;
								// enable notifications on the device 
								// this is what invokes the PushPlugin 
								device.enableNotifications({
									customParamters: {
										Groups: e.items[0].Groups
									},
									iOS: {
										badge: "true",
										sound: "true",
										alert: "true"
									},
									android: {
										senderID: "853777628192"
									},
									notificationCallbackIOS: function() {
										
									},
									notificationCallbackAndroid: function() {
										
									}
								}).then(
									function () {
										// we have permission, register the device for notifications
										return device.getRegistration();    
									},
									function(e) {
										// DENIED for some reason
										e.event = "Enabling Push Notifications";
										(pi||console).log(e);
									}
								).then(
									function (response) {
										// this device is already registered - no need to do it again
										console.log("Device is already registered: " + JSON.stringify(response.result));
										return response;
									},
									function (e) {
										// the device is registered, but it's been removed from Everlive
										// re-register it
										if (e.code === 301 || e.code === 801) {
											// in case we are using the simulator, make a fake token
											if (!device.pushToken) {
												device.pushToken = "some token";
											}
											return device.register();
										}
										else {
											e.event = "Push Notification Reregistration";
											(pi||console).log(e);
										}
									}
								).then(
									function (response) {
										if (response && response.result) {
											window.myDevice = response.result;
											// we have successfully registered and turned on push notifications
											(pi||console).log("Successful Push Notification Registration");
											Everlive.$.push.updateRegistration({
												"Groups" : window.myAccount.get("Groups"),
												"LastLogin" : config.get("today")
											}, function(response) {
												var response = response;
												(pi||console).log("Updated Push Notification Registration");
											}, function(error) {
												error.event = "Update Push Registration";
												(pi||console).log(error);
											});
																	}
										// if there is an existing registration of the device the function will not receive 'registration' parameter
									},
									function (e) {
										e.event = "Check Device Registration Status";
										(pi||console).log(e);
									}
								);
	
							}
							// case 1: logging out of the system
							// case 2: Manually turning off Push Notifications
							else if ( (e.action === "remove" && Everlive.$.push.currentDevice().pushToken )
										|| ( e.field === "Push" && !window.myAccount.get("Push")) ) {
								Everlive.$.push.disableNotifications(
									function(response) {
										var response = response;
									}, function(e) {
										e.event = "Unregister Push Notifications";
										(pi||console).log(e);
									}
								);
							}
						}
					} catch(e) {
						e.event = "Push Notification Initialization";
						(pi||console).log(e);
					}
				}).trigger("change", {action: "itemchange", field: "access_token", items: window.account.data()});
				
				/*
				window.account.bind("change", function(e) {
					try {
						if (e.action === "itemchange" && e.items[0] === window.myAccount) {
							if (e.field === "Groups" && window.myAccount.get("Push")) {
								(pi||console).log("Update Push Notification Triggered");
								Everlive.$.push.updateRegistration({
									"Groups" : window.myAccount.get("Groups"),
									"LastLogin" : config.get("today")
								}, function(response) {
									var response = response;
									(pi||console).log("Updated Push Notification Registration");
								}, function(error) {
									error.event = "Update Push Registration";
									(pi||console).log(error);
								});
							}
						}
					} catch(e) {
						e.event = "Push Notification Update";
						(pi||console).log(e);
					}
					
				}).trigger("change", {action: "itemchange", field: "Groups", items: window.account.data()});
				*/
			});
		}
	} catch(e) {
		e.event = "Push Notification Instantiation";
		(pi||console).log(e);
	}
});