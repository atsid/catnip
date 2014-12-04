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
				"EndTime": (new Date()).setTimeString($('#dailyprefs input[name=EndTime]').attr('max'))
			}
		});
		window.preferences.open = function(open) {
			var $header = $('.km-header #preferences');
			if (open === true || parseInt($header.css("margin-top")) < 0)
				$('.km-header #preferences').animate({
					"margin-top" : "20px"
				});
			else
				$('.km-header #preferences').animate({
					"margin-top" : "-110px"
				});
		}
		
		
		// If defaulting to yesterday's preferences, update the Date field, and clear 'Id' to fire the create method.
		window.myPreferences = window.preferences.options.get("selected");
		if (window.myPreferences.get("Date") !== config.get("today")) {
			window.myPreferences.set("Date", config.get("today"));
			window.myPreferences.set("Id", "");
			window.myPreferences.set("id", "");
		}
		window.preferences.bind("change", function(e) {
			if (e.action === "itemchange") {
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
		});
		/*
		window.preferences.bind("requestEnd", function(e) {
			if (e.response.Result) {
				e.response.Result.forEach(function(item,index) {
					item.StartTime = new Date(item.StartTime);
					item.EndTime = new Date(item.EndTime);
				});
			}
		});
		*/
		
		// Login/Logout
		window.account.bind("change", function(e) {
			if (e.action === "itemchange") {
				var value = e.items[0].get(e.field);
				if (e.field === "Id" && value) {
					// NOTE: Immediately add me to the mix, just for logging in today.
					window.preferences.one("requestEnd", function(e) {
						// NOTE: If no record found, we'll create one, then save it.
						if (e.response && e.response.Result && !e.response.Result.length) {
							// Don't use set("User") to avoid a double-POST.
							window.myPreferences.User = value;
							window.preferences.sync();
						}
					});
					window.preferences.filter(window.account.getFilter());
				}
			} else if (e.action === "remove") {
				window.preferences.reset();
			}
		}).trigger("change", {action:"itemchange",field:"Id",items:window.account.data()});
	} catch(e) {
		e.event = "Daily Preferences Instantiation";
		(pi||console).log(e);
	}
});
