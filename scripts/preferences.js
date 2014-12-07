$(function() {
	try {
		// Initialize variables
		Date.prototype.setTimeString = function(timeString) {
			var time = timeString.split(":");
			this.setHours(time[0]);
			this.setMinutes(time[1]);
			this.setSeconds(0);
			this.setMilliseconds(0);
			return this;
		}
		Date.prototype.getUTCTimeCode = function() {
			return ("0"+this.getUTCHours()).substr(-2) + ("0"+this.getUTCMinutes()).substr(-2);
		}
		
		// Set configuration
		window.preferences = pi.data.DataSource.create({
			id: "Lunch.DailyPreferences",
			source: "Everlive.DailyPreferences",
			storage: "localStorage", // Used to default to yesterday's preferences
			template: $('#dailyprefs'),
			transport: {
				read: {
					beforeSend: function(xhr) {
						xhr.setRequestHeader("X-Everlive-Filter",JSON.stringify({
							Date : config.get("today")
						}));
					}
				},
				create: {
					beforeSend: function(xhr) {
						xhr.setRequestHeader("X-Everlive-Expand",JSON.stringify(window.preferences.options.expand));
					},
					data: function(data) {
						// Fix expand for saving data.
						if (typeof(data.User) === "object")
							data.User = data.User.Id;
					}
				},
				update: {
					beforeSend: function(xhr) {
						xhr.setRequestHeader("X-Everlive-Expand",JSON.stringify(window.preferences.options.expand));
					},
					data: function(data) {
						// Fix expand for saving data.
						if (typeof(data.User) === "object")
							data.User = data.User.Id;
					}
				}
			},
			debug: false,
			serverFiltering: false,
			expand: { User: true },
			change: function(e) {
				try {
					if ( (e.type === "read" || e.action === "itemchange") && e.items) {
						e.items.forEach(function(item,index) {
							if (typeof(item.StartTime) === "string")
								item.StartTime = new Date(item.StartTime);
							if (typeof(item.EndTime) === "string")
								item.EndTime = new Date(item.EndTime);
							if (typeof(item.Brought) === "string")
								item.Brought = (item.Brought === "true") ? true : false;
							if (typeof(item.In) === "string")
								item.In = (item.In === "true") ? true : false;
						});
					}
					if (e.action === "itemchange") {
						if (e.field === "In") {
							e.items.forEach(function(item,index) {
								window.preferences.options.set("enabled", item[e.field]);
							});
						}
						if (e.field === "StartTime") {
							e.items.forEach(function(item, index) {
								// Update time code
								item.set("StartTimeCode", item.StartTime.getUTCTimeCode());
								// Make sure end time is after start time
								var min = new Date(item.StartTime.toString()),
									endDate = new Date(item.EndTime.toString()),
									$endTime = $('#dailyprefs input[name=EndTime]').data("kendoTimePicker");
								min.setMinutes(min.getMinutes() + 30);
								if ($endTime) $endTime.min(min);
								if (min > endDate) {
									min.setMinutes(min.getMinutes() + 30);
									item.set("EndTime", min);
								}
							});
						}
						if (e.field === "EndTime") {
							e.items.forEach(function(item, index) {
								item.set("EndTimeCode", item.EndTime.getUTCTimeCode());
							});
						}
						if (e.field !== "guid")
							this.sync();
					}
				} catch(e) {
					e.event = "Preference Change";
					(pi||console).log(e);
				}
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
		window.preferences.cycle = function() {
			if (window.preferences.hasChanges())
				window.preferences.sync();
			else
				window.preferences.read();
			if (window.preferences.timeout)
				window.clearTimeout(window.preferences.timeout);
			window.preferences.timeout = window.setTimeout(window.preferences.cycle, 5 * 60 * 1000); // check every minute
		}
		
		window.preferences.myPreferences = function(e) {
			try{
				if (e.items) {
					this.unbind("change", window.preferences.myPreferences);
					// WARNING: Don't use filter because even local filter fires requestEnd for an endless loop!
					// this.filter({field:"User.Id",operator:"eq",value:window.myAccount.get("Id")});
					delete window.myPreferences;
					for (var i=0; i<e.items.length; i++) {
						var userId = (typeof(e.items[i].User) === "object") ? e.items[i].User.Id : e.items[i].User;
						if (userId === window.myAccount.get("Id")) {
							window.myPreferences = this.options.set("selected", e.items[i]);
							break;
						}
					}
					if (!window.myPreferences) {
						// NOTE: If we haven't logged in yet today, we'll create one, then save it.
						var startTime = (new Date()).setTimeString($('#dailyprefs input[name=StartTime]').attr('min')), 
							endTime = (new Date()).setTimeString($('#dailyprefs input[name=EndTime]').attr('max'));
						window.myPreferences = this.options.set("selected", this.add({
							"User": window.myAccount.get("Id"),
							"Date": config.get("today"),
							"StartTime": startTime,
							"StartTimeCode": startTime.getUTCTimeCode(),
							"EndTime": endTime,
							"EndTimeCode": endTime.getUTCTimeCode(),
							"In": true
						}));
					}
					if (window.myPreferences instanceof kendo.data.ObservableObject) {
						// If defaulting to yesterday's preferences, update the Date field, and clear 'Id' to fire the create method.
						if (window.myPreferences.get("Date") !== config.get("today")) {
							window.myPreferences.set("Date", config.get("today"));
							window.myPreferences.set("Id", "");
							window.myPreferences.set("id", "");
						}
						this.options.set("enabled", window.myPreferences.get("In"));
						if (this.hasChanges())
							this.sync();
					}
				}
			} catch(e) {
				e.event = "Find myPreferences";
				(pi||console).log(e);
			}
		}
		window.preferences.bind("requestEnd", function(e) {
			if (window.myAccount && window.myAccount.Id && e.type === "read") {
				this.bind("change", window.preferences.myPreferences);
			}
		});
		
		window.preferences.bind("change", function(e) {
			try {
				if (e.action === "remove")
					delete window.myPreferences;
				else if (e.action === "sync" && e.items)
					e.items.forEach(function(item,index) {
						if (item.get("User") === window.myAccount.get("Id"))
							item.set("User", window.myAccount);
					});
			} catch(e) {
				e.event = "Manage Preferences";
				(pi||console).log(e);
			}
		})
		
		window.preferences.results = function(e) {
			try {
				if (e.items) {
					var food = {}, results = [], undecided = true;
					e.items.forEach(function(daily,index) {
						if (!daily.User || typeof(daily.User) === "string")
							return;
						if (!daily.In)
							return;
						if (daily.Brought) {
							// undecided = false; // CAUTION: Brought shouldn't affect undecided.
							if (!food.Brought)
								food.Brought = {};
							food.Brought[daily.User.Id] = 1;
						} else if (daily.FoodCategories) {
							daily.FoodCategories.forEach(function(id,index) {
								undecided = false;
								var record = window.food.get(id);
								if (record) {
									food[record.Name] = food[record.Name] || {};
									food[record.Name][daily.User.Id] = 1;
								} else {
									window.food.read(); // Maybe we're out of date
								}
							});
						}
					});
					if (undecided)
						food["Undecided"] = {};
					for (var pref in food) {
						e.items.forEach(function(daily,index) {
							if (!daily.User || typeof(daily.User) === "string")
								return;
							if (!daily.In)
								return;
							if ((pref !== "Brought" && daily.Brought) || (pref === "Brought" && !daily.Brought))
								return;
							var record = {
								User: daily.User.Id,
								DisplayName: daily.User.DisplayName,
								Preference: food[pref][daily.User.Id], // CAUTION: Could be null
								Food: pref
							};
							for (var timecode=parseInt(daily.StartTimeCode); timecode<daily.EndTimeCode; timecode=(timecode%100) ? timecode+=70 : timecode+=30)
								record["utc"+timecode] = record.Preference ? "preference" : "available";
							results.push(record);
						});
					}
					window.results.data(results);
				}
			} catch(e) {
				e.event = "Processing All Preferences";
				(pi||console).log(e);
			}
		};
		window.preferences.bind("change", window.preferences.results);

		if (window.myAccount && window.myAccount.Id) {
			window.preferences.trigger("requestEnd", { type: "read" });
			window.preferences.trigger("change", { items: window.preferences.data() });
			window.preferences.cycle();
		}
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange") {
					var value = e.items[0].get(e.field);
					if (e.field === "Id" && value)
						window.preferences.read();
				} else if (e.action === "remove") {
					window.preferences.reset();
				}
			} catch(e) {
				e.event = "Preference Account Change";
				(pi||console).log(e);
			}
		});
	} catch(e) {
		e.event = "Daily Preferences Instantiation";
		(pi||console).log(e);
	}
});
