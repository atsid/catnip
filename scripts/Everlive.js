everlive = new Everlive(config.everlive.toJSON());

everlive.log = function(message,type) {
	(pi||console).log(message, type, "Everlive");
}

everlive.onSuccess = function(data) {
	if (data.result) {
		data.result.id = data.result.principal_id;
		account.set("dataSource.options.selected.Id", data.result.principal_id);
		account.set("dataSource.options.selected.id", data.result.principal_id);
		account.set("dataSource.options.selected.everlive", data.result);
		account.set("dataSource.options.selected.password", "");
	} else {
		data.event = "Everlive Login";
		data.message = "Everlive returned successfully, but there was no result property!";
		everlive.log(data,"e");
	}
	account.beforeShow();
}

everlive.onFailure = function(e) {
	// Fire modal alert first, so we don't add the extra log text.
    modal.alert(templates.login.everlive.event, templates.login.everlive.login, "sad");
	e.event = templates.login.everlive.event;
	everlive.log(e,"error");
}

everlive.onAccountChange = function(e) {
	e.value = this.get(e.field);
	switch(e.field) {
		case "token":
			if (e.value.length) {
				// NOTE: Using the long form getter for better null handling.
				if (!account.get("dataSource.options.selected.everlive.access_token","").length)
					// Now Everlive login!
					// CAUTION: Since we've succeeded on the Flikshop side, we assume we have the correct password.
					everlive.Users.login(
						// WARNING: All login email addresses will be lowercase.
						account.get("dataSource.options.selected.email").toLowerCase(),
						account.get("dataSource.options.selected.password"),
						everlive.onSuccess,
						function(data) {
							if (data.code == 205) {
								// Assume first Everlive login and create a new Everlive User.
								everlive.Users.register(
									account.get("dataSource.options.selected.email").toLowerCase(),
									account.get("dataSource.options.selected.password"),
									{
										DisplayName : profile.get("dataSource.options.selected.DisplayName"),
										Email : profile.get("dataSource.options.selected.Email"), // Email can be mixed case.
										Language : profile.get("dataSource.options.selected.Language")
									},
									function(data) {
										// After we create a user, we must also now login as that user.
										everlive.Users.login(
											account.get("dataSource.options.selected.email").toLowerCase(),
											account.get("dataSource.options.selected.password"),
											everlive.onSuccess,
											everlive.onFailure);
									},
									function(data) {
										if (data.code == 201) {
											// Fire modal alert first, so we don't add the extra log text.
											modal.alert(templates.login.everlive.event, templates.login.everlive.sync, "sad");
											data.category = "Everlive";
											data.event = templates.login.everlive.event;
											data.message = account.get("dataSource.options.selected.email","").toLowerCase()+" already exists but passwords do not match!";
											everlive.log(data,"error");
										} else {
											everlive.onFailure(data);
										}
									});
							} else {
								everlive.onFailure(data);
							}
						});
			} else {
				this.set("everlive",null);
				everlive.Users.logout(function(){
					// success
				}, function(data) {
					// Clean everlive manually
					if (everlive && everlive.setup)
						everlive.setup.token = null;
				});
			}
			break;
		case "everlive":
			if (e.value)
				// WARNING: Don't use set() (compound or not) because it turns the filter into an Observable Array, which causes a parse error!
				e.value.filter = [
					{field : "Owner", operator : "eq", value : account.get("dataSource.options.selected.everlive.principal_id")}
				];
			break;
	}
}

$(function() {
	account.dataSource.options.bind("set",function(e) {
		if (e.field == "selected") {
			var selected = this.get(e.field);
			if (selected instanceof kendo.data.Model) {
				selected.unbind("change",everlive.onAccountChange);
			}
			selected = e.value;
			if (selected instanceof kendo.data.Model) {
				if (selected.get("everlive")) {
					// Initialize Everlive using token, if present
					$.extend(everlive.setup, {
						token : selected.get("everlive.access_token"),
						tokenType : selected.get("everlive.token_type")
					});
				}
				everlive.onAccountChange.call(selected,{ field:"everlive" });
				selected.bind("change",everlive.onAccountChange);
			}
		}
	});
});
