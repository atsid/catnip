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
				"Password" : "",
				"access_token" : "" // required blank value to kick of default navigation.
			}
		});
		window.account.verify = function(e) {
			var layout = this, roles = $(e.view.element).attr("data-user-roles");
			if (roles === "false" && myAccount.get("access_token"))
				app.pane.history.length ? app.replace("#results") : app.navigate("#results");
			else if (roles === "true" && !myAccount.get("access_token"))
				app.pane.history.length ? app.replace("#login") : app.navigate("#login");
		}
		
		window.account.options.bind("change", function(e) {
			if (e.field === "selected") {
				window.myAccount = this.get(e.field);
				if (window.myAccount instanceof kendo.data.ObservableObject) {
					window.myAccount.bind("change", function(e) {
						if (e.field === "access_token" && window.app)
							window.account.verify({view:window.app.view()});
					}).trigger("change", {field:"access_token"});
				}
			}
		}).trigger("change", {field:"selected"});
		
	} catch(e) {
		(pi||console).log(e);
	}
});