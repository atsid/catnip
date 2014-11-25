$(function() {
    // Initialize variables
    var today = new Date();
	today = [today.getFullYear(), ("0"+(today.getMonth()+1)).substr(-2), ("0"+today.getDate()).substr(-2)];
	
	// Set configuration
    window.preferences = pi.data.DataSource.create({
        source: "Everlive.DailyPreferences",
		storage: "localStorage", // Used to default to yesterday's preferences
		template: $('#dailyprefs'),
		debug: false,
        serverFiltering: true,
        filter: window.account.getFilter(),
		default : {
			"User": window.myAccount ? window.myAccount.get("Id") : "",
			"Date": today.join(""),
			"StartTime": new Date(today.join("-")+" "+$('#dailyprefs input[name=StartTime]').attr('min')),
			"EndTime": new Date(today.join("-")+" "+$('#dailyprefs input[name=EndTime]').attr('max'))
		}
    });
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
			this.sync();
		}
	});
	
	window.myAccount.bind("change", function(e) {
		if (e.field === "access_token") {
			if (this.get(e.field).length)
				window.preferences.filter(window.account.getFilter());
			else
				window.preferences.reset()._filter = [];
		}
	}).trigger("change", {field:"access_token"});
    
});
