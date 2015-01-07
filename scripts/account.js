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

	} catch(e) {
		e.event = "Account Instantiation";
		(pi||console).log(e);
	}
});