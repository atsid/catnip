$(function() {
	try {
		window.account = pi.data.DataSource.create({
			id : "Catnip.Account",
			source : "Everlive.Users",
			storage : "localStorage",
			template : $("#LoginForm"),
			/* Test ONLY!!! */
			default : {
				// "Id" : "1bac2d70-69a0-11e4-8481-bd60c9634975",
				"Name" : "Jason Hinebaugh",
				"Email" : "jason.hinebaugh@atsid.com",
				"Username" : "jason.hinebaugh@atsid.com",
				"Password" : "" // "jason"
			}
			/*
			default : {
				"Username" : "",
				"Email" : "",
				"Password" : ""
			}
			*/
		});
		window.account.options.bind("change", function(e) {
			if (e.field === "selected") {
				if (window.myAccount = this.get(e.field)) {
					window.myAccount.bind("set", function(e) {
						if (e.field === "access_token") {
							if (e.value) {
								// on Login
								
							} else {
								// on Logout
								
							}
						}
					});
				}
			}
		});
		
	} catch(e) {
		(pi||console).log(e);
	}
});