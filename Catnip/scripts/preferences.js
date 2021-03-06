// Initialize variables
Date.prototype.setTimeString = function(timeString) {
	var time = timeString.split(":");
	this.setHours(time[0]);
	this.setMinutes(time[1]);
	this.setSeconds(0);
	this.setMilliseconds(0);
	return this;
}
Date.prototype.getTimeString = function() {
	return ("0"+this.getHours()).substr(-2) + ":" + ("0"+this.getMinutes()).substr(-2) + ":" + ("0"+this.getSeconds()).substr(-2);
}
Date.prototype.getUTCTimeCode = function() {
	return ("0"+this.getUTCHours()).substr(-2) + ("0"+this.getUTCMinutes()).substr(-2);
}

$(function() {
	try {
		// Override TimePicker functionality
		var TimePicker = kendo.ui.TimePicker;
		kendo.ui.TimePicker = TimePicker.extend({
			init : function(element, options) {
				var that = this;
				TimePicker.fn.init.apply(this, arguments);
				if (kendo.support.mobileOS) {
					$(this.element[0]).attr("disabled", true).click(function() {
						that.open();
					});
				}
			}
		});
		kendo.ui.roles.timepicker = kendo.ui.TimePicker;
		
		// Set configuration
		window.preferences = pi.data.DataSource.create({
			id: "Lunch.DailyPreferences",
			source: "Everlive.DailyPreferences",
			storage: "localStorage", // Used to default to yesterday's preferences
			template: $('#dailyprefs'),
			transport: {
				read: {
					beforeSend: function(xhr) {
						try {
							xhr.setRequestHeader("X-Everlive-Filter",JSON.stringify({
								// WARNING: If there's a server interruption, plan for window.myPreferences temporarily not existing.
								Date : window.myPreferences.get("Date") || config.getToday(),
								Group : window.myPreferences ? window.myPreferences.get("Group") : window.myAccount.get("Groups")[0]
							}));
						} catch(e) {
							e.event = "Adding Preferences Filter";
							(pi||console).log(e);
						}
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
			debug: true,
			serverFiltering: false,
			expand: { User: true },
			error: function(e) {
				if (e.xhr)
					switch (e.xhr.status) {
						case 403:
							// ignore
							return;
						case 303:
						case 404:
							// Bad record; start over.
							delete window.myPreferences;
							window.preferences.reset();
							window.preferences.migratePreferences();
							window.preferences.read();
							return; // don't display
						default:
							var response = JSON.parse(e.xhr.responseText);
							response.status = e.xhr.status;
							response.statusText = e.xhr.statusText
							e = response;
							break;
					}
				(pi||console).log({
					type: "error",
					message: (e.message && e.message.length) ? e.message : (e.status + ": " + e.statusText),
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
									window.preferences.open(!item[e.field]);
									item.ModifiedAt = new Date();
								});
								this.sync();
								break;
							case "StartTime":
								e.items.forEach(function(item, index) {
									// Update Time Zone
									item.set("TimezoneOffset", item.StartTime.getTimezoneOffset());
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
									// Update Time Zone
									item.set("TimezoneOffset", item.StartTime.getTimezoneOffset());
									// Update time code
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
							case "Group":
								e.items.forEach(function(item, index) {
									item.ModifiedAt = new Date();
								});
								this.one("requestEnd", function(e) {
									this.read();
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
		window.preferences.bind("error", window.account.forbidden);
		window.preferences.open = function(open) {
			var $header = $('.km-header #preferences');
			if (window.preferences.options.get("disabled"))
				open = false;
			else if (typeof(open) === "undefined" && parseInt($header.css("margin-top")) < 0)
				open = true;
			if (open) {
				$('.km-header #preferences').animate({
					"margin-top" : "10px"
				});
				$('#opener .k-icon').removeClass("k-i-collapse").addClass("k-i-expand");
			} else {
				$('.km-header #preferences').animate({

					"margin-top" : -$header.height() - ((kendo.support.mobileOS && kendo.support.mobileOS.ios && kendo.support.mobileOS.majorVersion >= "7") ? 30 : 20) + "px"
				}).find('input.k-input').blur();
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
		
		// Fix invalid data
		window.preferences.options.bind("change", function(e) {
			if (e.field === "selected") {
				e.value = this.get(e.field);
				if (e.value instanceof kendo.data.ObservableObject) {
					// CAUTION: Convert User to Object
					if (e.value.User === window.myAccount.get("Id"))
						e.value.User = window.myAccount;
					// CAUTION: Convert to javascript Date objects.
					if (typeof(e.value.StartTime) === "string")
						e.value.StartTime = new Date(e.value.StartTime);
					if (typeof(e.value.EndTime) === "string")
						e.value.EndTime = new Date(e.value.EndTime);
					/*
					if (typeof(e.value.ModifiedAt) === "string")
						e.value.ModifiedAt = new Date(e.value.ModifiedAt);
					if (typeof(e.value.CreatedAt) === "string")
						e.value.CreatedAt = new Date(e.value.CreatedAt);
					*/
				}
			}
		});
		
		window.preferences.bind("requestEnd", function(e) {
			if (window.myAccount && window.myAccount.Id && e.type === "read")
				$('#lastsync').html("<label>Last Sync: <span class=\"modified\">"+new Date()+"</span></label>");
		});
		
		window.preferences.bind("requestEnd", function(e) {
			if (window.myAccount && window.myAccount.Id && e.type === "read")
				this.bind("change", window.preferences.myPreferences);
		});
		window.preferences.migratePreferences = function() {
			try {
				if (window.myPreferences) {
					if (window.myPreferences.Date !== config.getToday()) {
						// If defaulting to yesterday's preferences, update the Date field, and clear 'Id' to fire the create method.
						var startTime = new Date(), endTime = new Date();
							startTime.setHours(window.myPreferences.StartTime.getHours(), window.myPreferences.StartTime.getMinutes(), 0, 0);
							endTime.setHours(window.myPreferences.EndTime.getHours(), window.myPreferences.EndTime.getMinutes(), 0, 0);
						window.myPreferences.Group = (typeof(window.groups.options.selected) === "object") ? window.groups.options.selected.Id : window.myAccount.get("Groups")[0],
						window.myPreferences.Date = config.getToday();
						window.myPreferences.OptOut = true; // Default to "out" so people have to input an answer.
						window.myPreferences.CreatedAt = null; // WARNING: Don't set these during creation!!
						window.myPreferences.ModifiedAt = null; // WARNING: Don't set these during creation!!
						window.myPreferences.StartTime = startTime;
						window.myPreferences.EndTime = endTime;
						window.myPreferences.TimezoneOffset = startTime.getTimezoneOffset();
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
						"Group": (typeof(window.groups.options.selected) === "object") ? window.groups.options.selected.Id : window.myAccount.get("Groups")[0],
						"Date": config.getToday(),
						"StartTime": startTime,
						"StartTimeCode": startTime.getUTCTimeCode(),
						"EndTime": endTime,
						"EndTimeCode": endTime.getUTCTimeCode(),
						"TimezoneOffset": startTime.getTimezoneOffset(),
						// "CreatedAt": new Date(), // WARNING: Don't set these during creation!!
						// "ModifiedAt": new Date(), // WARNING: Don't set these during creation!!
						"OptOut": true // Default to "out" so people have to input an answer.
					}));
				}
				window.myPreferences.dirty = true;
			} catch(e) {
				e.event = "Migrate myPreferences";
				(pi||console).log(e);
			}
		}
		window.preferences.myPreferences = function(e) {
			try{
				// CAUTION: This handler is only added after a RequestEnd with a sync action, so there is no "itemchange" action.
				// NOTE: We want to process this code block, even if the item count is zero.
				if (e.items) {
					this.unbind("change", window.preferences.myPreferences);
					// WARNING: Don't use filter because even local filter fires requestEnd for an endless loop!
					// this.filter({field:"User.Id",operator:"eq",value:window.myAccount.get("Id")});
					var serverPreferences;
					for (var i=0, myId=window.myAccount.get("Id"); i<e.items.length; i++) {
						var userId = (typeof(e.items[i].User) === "object") ? e.items[i].User.Id : e.items[i].User;
						if (userId === myId) {
							if (serverPreferences)
								this.remove(e.items[i]); // cleanup duplicate records
							else
								serverPreferences = e.items[i];
						}
					}
					var myModifiedAt = (window.myPreferences && window.myPreferences.ModifiedAt && window.myPreferences.ModifiedAt.getTime) ? window.myPreferences.ModifiedAt.getTime() : 0;
					if (!serverPreferences || myModifiedAt > serverPreferences.ModifiedAt.getTime()) {
						window.preferences.migratePreferences(); // do this again to cleanup bad data
						if (serverPreferences) {
							this.remove(serverPreferences);
							// CAUTION: If two versions of the same record, don't delete on the server
							if (serverPreferences.id === window.myPreferences.id)
								this._destroyed.pop();
						} else {
							// Don't try to destroy local records on the server!
							// WARNING: Mobile Safari doesn't have the empty() function for Arrays!
							if (this._destroyed.empty)
								this._destroyed.empty();
							else while (this._destroyed.length)
								this._destroyed.pop();
						}
						// WARNING: This must come AFTER removing serverPreferences.
						// There is a bug where the timestamp on the server is less by milliseconds until the next GET.
						// If we don't do this after, the remove() will delete both the server record and the local record!
						this.options.set("selected", this.add(window.myPreferences));
						this.sync();
					} else {
						window.myPreferences = this.options.set("selected", serverPreferences);
						if (this._destroyed.length)
							this.sync();
					}
					this.options.set("disabled", !!window.myPreferences.get("OptOut"));
					// Always start closed
					// window.preferences.open(false);
				}
			} catch(e) {
				e.event = "Find myPreferences";
				(pi||console).log(e);
			}
		}
		
		window.preferences.bind("change", function(e) {
			try {
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
				// CAUTION: Undecided StartTimeCode and EndTimeCode are intentionally reversed, so they are always changed with the first entry.
				var food = {}, undecided = { Users: {}, StartTimeCode: "2400", EndTimeCode: "0000" }, results = [];
				this.view().forEach(function(daily,index) {
					if (!daily.User || typeof(daily.User) === "string")
						return;
					if (daily.OptOut) {
						// undecided.Users[daily.User.Id] = daily; // CAUTION: OptOuts shouldn't affect undecided.
						results.push({
							User: daily.User.Id,
							DisplayName: daily.User.DisplayName,
							Preference: 0,
							Food: "Out",
							sort: -1
						});
					}
					else if (daily.Brought) {
						// undecided.Users[daily.User.Id] = daily; // CAUTION: Brought shouldn't affect undecided.
						results.push({
							User: daily.User.Id,
							DisplayName: daily.User.DisplayName,
							StartTimeCode: daily.StartTimeCode,
							EndTimeCode: daily.EndTimeCode,
							Preference: 1,
							Food: "Brought",
							sort: 0
						});
					} else if (daily.FoodCategories && daily.FoodCategories.length) {
						daily.FoodCategories.forEach(function(id,index) {
							var record = window.food.get(id);
							if (record) {
								food[record.Name] = food[record.Name] || { Users: {}, StartTimeCode: daily.StartTimeCode, EndTimeCode: daily.EndTimeCode };
								food[record.Name].Users[daily.User.Id] = 1;
								if (daily.StartTimeCode < food[record.Name].StartTimeCode)
									food[record.Name].StartTimeCode = daily.StartTimeCode;
								if (daily.EndTimeCode > food[record.Name].EndTimeCode)
									food[record.Name].EndTimeCode = daily.EndTimeCode;
							} else {
								window.food.read(); // Maybe we're out of date
							}
						});
					} else {
						// CAUTION: There must be an undecided array in case the undecided person doesn't overlap anyone else!
						undecided.Users[daily.User.Id] = daily;
					}
				});
				// Build results
				for (var pref in food) {
					this.view().forEach(function(daily,index) {
						if (!daily.User || typeof(daily.User) === "string")
							return;
						if (daily.OptOut)
							return;
						if (daily.Brought)
							return;
						if (daily.StartTimeCode < food[pref].EndTimeCode && daily.EndTimeCode > food[pref].StartTimeCode) {
							results.push({
								User: daily.User.Id,
								DisplayName: daily.User.DisplayName,
								StartTimeCode: daily.StartTimeCode,
								EndTimeCode: daily.EndTimeCode,
								Preference: food[pref].Users[daily.User.Id], // CAUTION: Could be null
								Food: pref
							});
							if (undecided.Users[daily.User.Id])
								delete undecided.Users[daily.User.Id];
						}
					});
				}
				// Do this in two loops & AFTER we've deleted unecessary undecideds, after checking ALL food types.
				for (var userId in undecided.Users) {
					var daily = undecided.Users[userId];
					if (daily.StartTimeCode < undecided.StartTimeCode)
						undecided.StartTimeCode = daily.StartTimeCode;
					if (daily.EndTimeCode > undecided.EndTimeCode)
						undecided.EndTimeCode = daily.EndTimeCode;
				}
				for (var userId in undecided.Users) {
					var daily = undecided.Users[userId];
					results.push({
						User: daily.User.Id,
						DisplayName: daily.User.DisplayName,
						StartTimeCode: daily.StartTimeCode,
						EndTimeCode: daily.EndTimeCode,
						Preference: 0,
						Food: "Undecided"
					})
				}
				window.results.data(results);
			} catch(e) {
				e.event = "Processing All Preferences";
				(pi||console).log(e);
			}
		});
		
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange") {
					var value = e.items[0].get(e.field);
					if (e.field === "Id" && value) {
						try {
							for (var userId, i=0, items=window.preferences.data(), myId=value; i<items.length; i++) {
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
							window.preferences.migratePreferences();
							// Populate results
							window.preferences.trigger("change");
							// Check server
							window.preferences.cycle();
						} catch(e) {
							e.event = "MyPreferences Initialization";
							(pi||console).log(e);
						}
					}
				} else if (e.action === "remove") {
					if (window.preferences.timeout)
						window.clearTimeout(window.preferences.timeout);
					delete window.myPreferences;
					window.preferences.reset();
				}
			} catch(e) {
				e.event = "Preference Account Change";
				(pi||console).log(e);
			}
		}).trigger("change", { action: "itemchange", field: "Id", items: [window.myAccount] });
	} catch(e) {
		e.event = "Daily Preferences Instantiation";
		(pi||console).log(e);
	}
});
