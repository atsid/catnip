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
        filter: [
			{field: 'User', operator: 'eq', value: window.myAccount ? window.myAccount.get("Id") : ""},
            {field: 'Date', operator: 'eq', value: today.join("")}
        ],
		default : {
			"User": window.myAccount ? window.myAccount.get("Id") : "",
			"Date": today.join(""),
			"StartTime": new Date(today.join("-")+" "+$('#dailyprefs input[name=StartTime]').attr('min')),
			"EndTime": new Date(today.join("-")+" "+$('#dailyprefs input[name=EndTime]').attr('max'))
		}
    });
	// If defaulting to yesterday's preferences, update the Date field.
	window.myPreferences = window.preferences.options.get("selected");
	if (window.myPreferences.get("Date") !== today) {
		window.myPreferences.set("Date", today);
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
		var account = this;
		if (e.field === "access_token") {
			if (account.get(e.field).length) {
				window.preferences.filter([
					{field: 'User', operator: 'eq', value: account.get("Id")},
					{field: 'Date', operator: 'eq', value: today.join("")}
				]);
			}
			else {
				window.preferences.reset()._filter = [];
			}
		}
	}).trigger("change", {field:"access_token"});
    
});
