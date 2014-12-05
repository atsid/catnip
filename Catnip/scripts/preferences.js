$(function() {
	try {
		// Initialize variables
		Date.prototype.setTimeString = function(timeString) {
			var time = timeString.split(":");
			this.setHours(time[0]);
			this.setMinutes(time[1]);
			return this;
		}
		
		// Set configuration
		window.preferences = pi.data.DataSource.create({
			id: "Lunch.DailyPreferences",
			source: "Everlive.DailyPreferences",
			storage: "localStorage", // Used to default to yesterday's preferences
			template: $('#dailyprefs'),
			debug: false,
			serverFiltering: true,
			filter: window.account.getFilter(),
			default : {
				"User": window.myAccount ? window.myAccount.get("Id") : "",
				"Date": config.get("today"),
				"StartTime": (new Date()).setTimeString($('#dailyprefs input[name=StartTime]').attr('min')),
				"EndTime": (new Date()).setTimeString($('#dailyprefs input[name=EndTime]').attr('max')),
				"In": true
			}
		});
		window.preferences.open = function(open) {
			var $header = $('.km-header #preferences');
			if (window.preferences.options.get("enabled") === false)
				open = false;
			else if (typeof(open) === "undefined" && parseInt($header.css("margin-top")) < 0)
				open = true;
			if (open)
				$('.km-header #preferences').animate({
					"margin-top" : "20px"
				});
			else
				$('.km-header #preferences').animate({
					"margin-top" : -$header.height()+"px"
				});
		}
		window.preferences.options.bind("change", function(e) {
			if (e.field === "enabled") {
				var enabled = this.get(e.field);
				$('#dailyprefs [name=StartTime]').data("kendoTimePicker").enable(enabled);
				$('#dailyprefs [name=EndTime]').data("kendoTimePicker").enable(enabled);
				$('#dailyprefs [name=Brought]').data("kendoMobileSwitch").enable(enabled);
				$('#dailyprefs [name=FoodCategories]').data("kendoMultiSelect").enable(enabled);
				window.preferences.open(enabled);
			}
		});
		
		window.preferences.bind("change", function(e) {
			try {
				if (e.action === "itemchange") {
					if (e.field === "Brought" || e.field === "In") {
						e.items.forEach(function(item,index) {
							if (item[e.field] === "true")
								item[e.field] = true;
							else if (item[e.field] === "false")
								item[e.field] = false;
						})
					}
					if (e.field === "In") {
						e.items.forEach(function(item,index) {
							window.preferences.options.set("enabled", item[e.field]);
						});
					}
					if (e.field === "StartTime") {
						e.items.forEach(function(item, index) {
							var min = new Date(item.StartTime.toString()),
								endDate = new Date(item.EndTime.toString()),
								$endTime = $('#dailyprefs input[name=EndTime]').data("kendoTimePicker");
							min.setMinutes(min.getMinutes() + 30);
							$endTime.min(min);
							if (min > endDate) {
								min.setMinutes(min.getMinutes() + 30);
								item.set("EndTime", min);
							}
						});
					}
					if (e.field !== "guid")
						this.sync();
				}
				if (e.action === "sync") {
					window.allPreferences.read();
				}
			} catch(e) {
				e.event = "Preference Change";
				(pi||console).log(e);
			}
		});

		window.preferences.bind("change", function(e) {
			if (e.action === "remove") {
				delete window.myPreferences;
			}
			if (e.action === "read") {
				window.myPreferences = this.options.get("selected");
				if (window.myPreferences instanceof kendo.data.ObservableObject) {
					// If defaulting to yesterday's preferences, update the Date field, and clear 'Id' to fire the create method.
					if (window.myPreferences.get("Date") !== config.get("today")) {
						window.myPreferences.set("Date", config.get("today"));
						window.myPreferences.set("Id", "");
						window.myPreferences.set("id", "");
					}
				}
			}
		}).trigger("change", { action: "read" });
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange") {
					var value = e.items[0].get(e.field);
					if (e.field === "Id" && value) {
						// NOTE: Immediately add me to the mix, just for logging in today.
						window.preferences.one("requestEnd", function(e) {
							try {
								if (e.response && e.response.Result) {
									if (!e.response.Result.length) {
										// NOTE: If we haven't logged in yet today, we'll create one, then save it.
										// Don't use set("User") to avoid a double-POST.
										window.myPreferences.User = value;
										window.preferences.sync();
									} else {
										// NOTE: If we haven't logged in today, update the enabled fields.
										window.preferences.options.set("enabled", e.response.Result[0].In);
										window.preferences.open(false);
									}
								}
							} catch(e) {
								e.event = "Preference Request";
								(pi||console).log(e);
							}
						});
						window.preferences.filter(window.account.getFilter());
					}
				} else if (e.action === "remove") {
					window.preferences.reset();
				}
			} catch(e) {
				e.event = "Preference Account Change";
				(pi||console).log(e);
			}
		}).trigger("change", {action:"itemchange",field:"Id",items:window.account.data()});
	} catch(e) {
		e.event = "Daily Preferences Instantiation";
		(pi||console).log(e);
	}
});
