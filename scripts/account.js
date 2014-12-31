$(function() {
	try {
		window.account = pi.data.DataSource.create({
			id : "Lunch.Account",
			source : "Everlive.Users",
			storage : "localStorage",
			template : $("form#Profile"),
			/*
			transport: {
				create: {
					data: function(data) {
						// Fix expand for saving data.
						data.Groups.forEach(function(group,index) {
							if (typeof(group) === "object" && group.Id)
								data.Groups[index] = group.Id;
						})
					}
				},
				update: {
					data: function(data) {
						// Fix expand for saving data.
						data.Groups.forEach(function(group,index) {
							if (typeof(group) === "object" && group.Id)
								data.Groups[index] = group.Id;
						})
					}
				}
			},
			expand: { Groups: true },
			*/
			default : {
				"Id" : "",
				"Username" : "",
				"Email" : "",
				"Password" : "",
				"Push" : true,
				"access_token" : "" // required blank value to kick of default navigation.
			}
		});
        window.account.resetPassword = function (e) {
            $.ajax({
                type: "POST",
                url: "https://api.everlive.com/v1/" + config.get("everlive.apiKey") + "/Users/resetpassword",
                contentType: "application/json",
                data: JSON.stringify({
                    Username: myAccount.get("Username")
                }),
                success: function () {
                    alert("Your password was successfully reset. Please check your email for instructions on choosing a new password.");
                    app.navigate("#login");
                },
                error: function () {
                    alert("Unfortunately, an error occurred resetting your password.")
                }
            });
        }
		window.account.forbidden = function(e) {
			if (e.xhr && e.xhr.status === 403) {
				window.account.remove(window.account.options.get("selected")); // logout
			}
		}
		window.account.verify = function(e) {
			try {
				var layout = this, roles = $(e.view.element).attr("data-user-roles");
				if (roles === "false" && myAccount.get("access_token"))
					app.pane.history.length ? app.replace("#results", "overlay:down") : app.navigate("#results", "overlay:down");
				else if (roles === "true" && !myAccount.get("access_token"))
					app.pane.history.length ? app.replace("#login", "overlay:down reverse") : app.navigate("#login", "overlay:down reverse");
			} catch(e) {
				e.event = "Verify Account Roles";
				(pi||console).log(e);
			}
		}
		window.account.getFilter = function(filter) {
			try {
				filter = filter || [];
				if (filter.constructor !== Array)
					filter = [filter];
				
				if (window.myAccount)
					return [
						{field: 'User.Id', operator: 'eq', value: window.myAccount.get("Id") || ""},
						{field: 'Date', operator: 'eq', value: config.get("today")}
					].concat(filter);
				else
					return [
						{field: 'User.Id', operator: 'eq', value: ""},
						{field: 'Date', operator: 'eq', value: config.get("today")}
					].concat(filter);
			} catch(e) {
				e.event = "Get Account Filter";
				(pi||console).log(e);
			}
		}
		window.account.onPhotoLoad = function(e) {
			$(e.target).parents(".Photo").addClass("image");
		}
		window.account.getInitials = function(data) {
			return data.DisplayName.replace(/\b(.)\w*[\s-]*/g, "$1");
		}
		
		window.account.initView = function(e) {
			try {
				e.view.one("show", function(e) {
					e.view.element.kendoTouch({
						enableSwipe: true,
						swipe: function(e) {
							if (e.direction === "down")
								window.app.navigate("#:back", "overlay:up reverse");
						}
					});
				});
			} catch(e) {
				e.event = "Initialize Profile View";
				(pi||console).log(e);
			}
		}
		
		window.account.options.bind("change", function(e) {
			try {
				if (e.action === "remove") {
					delete window.myAccount;
				}
				if (e.field === "selected") {
					window.myAccount = this.get(e.field);
					if (window.myAccount instanceof kendo.data.ObservableObject) {
						window.myAccount.bind("change", function(e) {
							if (e.field === "access_token" && window.app)
								window.account.verify({view:window.app.view()});
							else if (e.field === "DisplayName")
								this.set("Initials", this.get("DisplayName").replace(/\b(.)\w*[\s-]*/g, "$1") );
						}).trigger("change", {field:"access_token"});
					}
				}
			} catch(e) {
				e.event = "Set MyAccount";
				(pi||console).log(e);
			}
		}).trigger("change", {field:"selected"});
		
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
									function() {
										
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
			});
		}
	} catch(e) {
		e.event = "Account Instantiation";
		(pi||console).log(e);
	}
});