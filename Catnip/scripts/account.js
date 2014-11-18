try {
	account = pi.data.DataSource.create({
		id : "Catnip.Account",
		source : "Everlive.Users",
		storage : "localStorage",
		/* Test ONLY!!! */
		default : {
			"Id" : "1bac2d70-69a0-11e4-8481-bd60c9634975",
			"Name" : "Jason Hinebaugh",
			"Email" : "jason.hinebaugh@atsid.com",
			"Username" : "jason.hinebaugh@atsid.com",
			"Password" : "jason"
		}
		/*
		default : {
			"Username" : "",
			"Email" : "",
			"Password" : ""
		}
		*/
	});
	account.options.bind("set", function(e) {
		if (e.field === "selected")
			window.myAccount = e.value;
	});
} catch(e) {
	(pi||console).log(e);
}