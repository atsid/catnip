$(function() {
	try {
		window.account = pi.data.DataSource.create({
			id : "Catnip.Account",
			source : "Everlive.Users",
			storage : "localStorage",
			template : $("#LoginForm"),
			/* Test ONLY!!!
			default : {
				// "Id" : "1bac2d70-69a0-11e4-8481-bd60c9634975",
				"Name" : "Jason Hinebaugh",
				"Email" : "jason.hinebaugh@atsid.com",
				"Username" : "jason.hinebaugh@atsid.com",
				"Password" : "" // "jason"
			} */
			default : {
				"Username" : "",
				"Email" : "",
				"Password" : ""
			}
		});
		window.account.verify = function(e) {
			var layout = this, roles = $(e.view.element).attr("data-user-roles");
			if (roles === "false" && myAccount.get("access_token"))
				router.replace("#results");
			else if (roles === "true" && !myAccount.get("access_token"))
				router.replace("#login");
		}
		
		window.account.options.bind("change", function(e) {
			if (e.field === "selected") {
				window.myAccount = this.get(e.field);
				if (typeof(window.myAccount) instanceof kendo.data.ObservableObject) {
					window.myAccount.bind("set", function(e) {
						if (e.field === "access_token") {
							if (e.value) {
								// on Login
								
							} else {
								// on Logout
								
							}
						}
					});
					window.myAccount.bind("set", preferences.tokenChange);
				}
			}
		});
		
	} catch(e) {
		(pi||console).log(e);
	}
});