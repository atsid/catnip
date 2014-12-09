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
					data: function(data) {
						// Fix expand for saving data.
						if (typeof(data.User) === "object")
							data.User = data.User.Id;
					}
				},
				update: {
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
			error: function(e) {
				(pi||console).log({
					type: "error",
					message: e.errorThrown,
					status: e.status
				});
			},
			change: function(e) {
				try {
					if (e.action === "itemchange") {
						switch (e.field) {
							case "OptOut":
								e.items.forEach(function(item,index) {
									window.preferences.options.set("disabled", !!item[e.field]);
									item.ModifiedAt = new Date();
								});
								this.sync();
								break;
							case "StartTime":
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
									item.ModifiedAt = new Date();
								});
								this.sync();
								break;
							case "EndTime":
								e.items.forEach(function(item, index) {
									item.set("EndTimeCode", item.EndTime.getUTCTimeCode());
									item.ModifiedAt = new Date();
								});
								this.sync();
								break;
							case "Brought":
							case "FoodCategories":
								e.items.forEach(function(item, index) {
									item.ModifiedAt = new Date();
								});
								this.sync();
								break;
						}
					}
				} catch(e) {
					e.event = "Preference Change";
					(pi||console).log(e);
				}
			}
		});
		window.preferences.open = function(open) {
			var $header = $('.km-header #preferences');
			if (window.preferences.options.get("disabled"))
				open = false;
			else if (typeof(open) === "undefined" && parseInt($header.css("margin-top")) < 0)
				open = true;
			if (open) {
				$('.km-header #preferences').animate({
					"margin-top" : "20px"
				});
				$('#opener .k-icon').removeClass("k-i-collapse").addClass("k-i-expand");
			} else {
				$('.km-header #preferences').animate({
					"margin-top" : -$header.height()+"px"
				});
				$('#opener .k-icon').removeClass("k-i-expand").addClass("k-i-collapse");
			}
		}
		window.preferences.cycle = function() {
			if (window.preferences.timeout)
				window.clearTimeout(window.preferences.timeout);
			// CAUTION: Don't sync here.  We'll do a manual merge later.
			window.preferences.read();
			window.preferences.timeout = window.setTimeout(window.preferences.cycle, 5 * 60 * 1000); // check every 5 minutes
		}
		
		window.preferences.bind("requestEnd", function(e) {
			if (window.myAccount && window.myAccount.Id && e.type === "read")
				$('#lastsync').html("<label>Last Sync: <span class=\"modified\">"+new Date()+"</span></label>");
		});
		
		window.preferences.options.bind("change", function(e) {
			if (e.field === "selected" && this.get("selected") instanceof kendo.data.ObservableObject)
				this.set("disabled", !!this.get("selected").get("OptOut"));
		});
		
		window.preferences.bind("requestEnd", function(e) {
			if (window.myAccount && window.myAccount.Id && e.type === "read")
				this.bind("change", window.preferences.myPreferences);
		});
		window.preferences.myPreferences = function(e) {
			try{
				if (e.action !== "itemchange" && e.items) {
					this.unbind("change", window.preferences.myPreferences);
					// WARNING: Don't use filter because even local filter fires requestEnd for an endless loop!
					// this.filter({field:"User.Id",operator:"eq",value:window.myAccount.get("Id")});
					var serverPreferences;
					for (var i=0, myId=window.myAccount.get("Id"); i<e.items.length; i++) {
						var userId = (typeof(e.items[i].User) === "object") ? e.items[i].User.Id : e.items[i].User;
						if (userId === myId) {
							serverPreferences = e.items[i];
							break;
						}
					}
					var myModifiedAt = (window.myPreferences.ModifiedAt && window.myPreferences.ModifiedAt.getTime) ? window.myPreferences.ModifiedAt.getTime() : 0;
					if (!serverPreferences || myModifiedAt > serverPreferences.ModifiedAt.getTime()) {
						this.options.set("selected", this.add(window.myPreferences));
						window.myPreferences.dirty = true; // Make sure it syncs
						if (serverPreferences) {
							this.remove(serverPreferences);
							// CAUTION: If two versions of the same record, don't delete on the server
							if (serverPreferences.id === window.myPreferences.id)
								this._destroyed.pop();
						}
						this.sync();
					} else {
						window.myPreferences = this.options.set("selected", serverPreferences);
					}
				}
			} catch(e) {
				e.event = "Find myPreferences";
				(pi||console).log(e);
			}
		}
		
		window.preferences.bind("change", function(e) {
			try {
				/*
				if (e.action === "remove")
					delete window.myPreferences;
				*/
				if (e.action === "sync" && e.items)
					e.items.forEach(function(item,index) {
						if (item.get("User") === window.myAccount.get("Id"))
							item.set("User", window.myAccount);
					});
			} catch(e) {
				e.event = "Manage Preferences";
				(pi||console).log(e);
			}
		});
		
		window.preferences.bind("change", function(e) {
			try {
				var food = {}, results = [], undecided = true;
				this.view().forEach(function(daily,index) {
					if (!daily.User || typeof(daily.User) === "string")
						return;
					if (daily.OptOut)
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
				// Build results
				for (var pref in food) {
					this.view().forEach(function(daily,index) {
						if (!daily.User || typeof(daily.User) === "string")
							return;
						if (daily.OptOut)
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
			} catch(e) {
				e.event = "Processing All Preferences";
				(pi||console).log(e);
			}
		});
		
		try {
			if (window.myAccount && window.myAccount.Id) {
				for (var userId, i=0, items=window.preferences.data(), myId=window.myAccount.get("Id"); i<items.length; i++) {
					// CAUTION: If restored from localStorage, convert to javascript Date objects.
					if (typeof(items[i].ModifiedAt) === "string")
						items[i].ModifiedAt = new Date(items[i].ModifiedAt);
					if (typeof(items[i].CreatedAt) === "string")
						items[i].CreatedAt = new Date(items[i].CreatedAt);
					// Find my record
					userId = (typeof(items[i].User) === "object") ? items[i].User.Id : items[i].User;
					if (userId === myId)
						window.myPreferences = window.preferences.options.set("selected", items[i]);
				}
				if (window.myPreferences) {
					if (window.myPreferences.Date !== config.get("today")) {
						// If defaulting to yesterday's preferences, update the Date field, and clear 'Id' to fire the create method.
						window.myPreferences.Date = config.get("today");
						window.myPreferences.Id = "";
						window.myPreferences.id = "";
						// WARNING: Don't forget to wipe out all of yesterday's data for other people!
						window.preferences.reset([window.myPreferences]);
					}
					
				} else {
					// NOTE: If we haven't logged in yet today, we'll create one, then save it.
					var startTime = (new Date()).setTimeString($('#dailyprefs input[name=StartTime]').attr('min')), 
						endTime = (new Date()).setTimeString($('#dailyprefs input[name=EndTime]').attr('max'));
					window.myPreferences = window.preferences.options.set("selected", window.preferences.add({
						"User": window.myAccount.get("Id"),
						"Date": config.get("today"),
						"StartTime": startTime,
						"StartTimeCode": startTime.getUTCTimeCode(),
						"EndTime": endTime,
						"EndTimeCode": endTime.getUTCTimeCode(),
						"CreatedAt": new Date(),
						"ModifiedAt": new Date()
					}));
				}
				// Populate results
				window.preferences.trigger("change");
				// Check server
				window.preferences.cycle();
			}
		} catch(e) {
			e.event = "MyPreferences Initialization";
			(pi||console).log(e);
		}
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange") {
					var value = e.items[0].get(e.field);
					if (e.field === "Id" && value)
						window.preferences.cycle();
				} else if (e.action === "remove") {
					if (window.preferences.timeout)
						window.clearTimeout(window.preferences.timeout);
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
