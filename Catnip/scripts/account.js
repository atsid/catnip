$(function() {
	try {
		window.account = pi.data.DataSource.create({
			id : "Lunch.Account",
			source : "Everlive.Users",
			storage : "localStorage",
			template : $("form#Profile"),
			transport: {
				create: {
					data: function(data) {
						// Fix expand for saving data.
						if (typeof(data.Photo) === "object" && data.Photo.Id)
							data.Groups[index] = data.Photo.Id;
					}
				},
				update: {
					data: function(data) {
						// Fix expand for saving data.
						if (typeof(data.Photo) === "object" && data.Photo.Id)
							data.Groups[index] = data.Photo.Id;
					}
				}
			},
			expand: { Photo: true },
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
				// Both access_token and Id are required.
				if (roles === "false" && myAccount.get("access_token") && myAccount.get("Id"))
					app.pane.history.length ? app.replace("#results", "overlay:down") : app.navigate("#results", "overlay:down");
				else if (roles === "true" && (!myAccount.get("access_token") || !myAccount.get("Id")))
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
						{field: 'Date', operator: 'eq', value: config.getToday()}
					].concat(filter);
				else
					return [
						{field: 'User.Id', operator: 'eq', value: ""},
						{field: 'Date', operator: 'eq', value: config.getToday()}
					].concat(filter);
			} catch(e) {
				e.event = "Get Account Filter";
				(pi||console).log(e);
			}
		}
		window.account.getInitials = function(data) {
			return data.DisplayName.replace(/\b(.)\w*[\s-]*/g, "$1");
		}
		
		window.account.initView = function(e) {
			try {
				/*
				window.account.bind("requestStart", function(e) {
					window.app.showLoading();
				}).bind("change", function(e) {
					window.app.hideLoading();
				});
				*/

				e.view.one("show", function(e) {
					e.view.element.kendoTouch({
						enableSwipe: true,
						swipe: function(e) {
							if (e.direction === "down")
								window.app.navigate("#:back", "overlay:up reverse");
						}
					});
					e.view.element.find("[name=Photo]").data("kendoPhotoUpload").bind("change", function(e) {
						if (e.src && e.src.length > 1000)
							e.src = "data:image/jpeg;base64," + e.src;
						$(".Avatar img").attr("src", e.src || e.value || "").parents(".Avatar").removeClass("image");
					});
				});
				e.view.bind("afterShow", function(e) {
					// CAUTION: For some reason the datasources get stuck, and every request after the first wouldn't run.
					window.account._dequeueRequest();
					window.groups._dequeueRequest();
					// Now refresh the latest updates from the server
					window.account.read();
					window.groups.read();
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
						// CAUTION: Trigger off of "Id" change instead of "access_token" because "Id" doesn't exist when "access_token" is first set.
						window.myAccount.bind("change", function(e) {
							if (e.field === "Id" && window.app)
								window.account.verify({view:window.app.view()});
							else if (e.field === "DisplayName")
								this.set("Initials", this.get("DisplayName").replace(/\b(.)\w*[\s-]*/g, "$1") );
						}).trigger("change", {field:"Id"});
					}
				}
			} catch(e) {
				e.event = "Set MyAccount";
				(pi||console).log(e);
			}
		}).trigger("change", {field:"selected"});

	} catch(e) {
		e.event = "Account Instantiation";
		(pi||console).log(e);
	}
});