$(function() {
	
	$("#map").kendoMap({
		center: [35.2681, -97.7448],
		zoom: ($(window).width() >= 768) ? 4 :  ($(window).width() >= 500) ? 3.5 : 3,
		layers: [{
			type: "shape",
			dataSource: {
				type: "geojson",
				transport: {
					read: "scripts/geojson/gz_2010_us_states_20m.json"
				}
			},
			style: {
				fill: {
					opacity: 0.7
				}
			}
		}]
	});
	
	window.allPreferences = pi.data.DataSource.create({
		/*
		data: [
			{ Id: "11", name: "Kris", food: "Sandwiches", preferred: 1, startTimeCode: "1600", endTimeCode: "1800" },
			{ Id: "12", name: "Gary", food: "Sandwiches", preferred: null, startTimeCode: "1600", endTimeCode: "2000" },
			{ Id: "13", name: "Chris", food: "Sandwiches", preferred: null, startTimeCode: "1600", endTimeCode: "2000" },
			{ Id: "14", name: "Jason", food: "Sandwiches", preferred: 1, startTimeCode: "1700", endTimeCode: "1800" },
			{ Id: "15", name: "Pete", food: "Sandwiches", preferred: null, startTimeCode: "1700", endTimeCode: "1900" },
			{ Id: "16", name: "Yoshi", food: "Sandwiches", preferred: null, startTimeCode: "1730", endTimeCode: "1900" },
			
			{ Id: "21", name: "Kris", food: "Salad", preferred: null, startTimeCode: "1600", endTimeCode: "1800" },
			{ Id: "22", name: "Gary", food: "Salad", preferred: 1, startTimeCode: "1600", endTimeCode: "2000" },
			{ Id: "23", name: "Chris", food: "Salad", preferred: null, startTimeCode: "1600", endTimeCode: "2000" },
			{ Id: "24", name: "Jason", food: "Salad", preferred: null, startTimeCode: "1700", endTimeCode: "1800" },
			{ Id: "25", name: "Pete", food: "Salad", preferred: 1, startTimeCode: "1700", endTimeCode: "1900" },
			{ Id: "26", name: "Yoshi", food: "Salad", preferred: null, startTimeCode: "1730", endTimeCode: "1900" },
			{ Id: "27", name: "Derek", food: "Salad", preferred: null, startTimeCode: "1800", endTimeCode: "2000" },
			
			{ Id: "31", name: "Gary", food: "BBQ", preferred: null, startTimeCode: "1600", endTimeCode: "2000" },
			{ Id: "32", name: "Chris", food: "BBQ", preferred: null, startTimeCode: "1600", endTimeCode: "2000" },
			{ Id: "33", name: "Pete", food: "BBQ", preferred: null, startTimeCode: "1700", endTimeCode: "1900" },
			{ Id: "34", name: "Yoshi", food: "BBQ", preferred: null, startTimeCode: "1730", endTimeCode: "1900" },
			{ Id: "35", name: "Derek", food: "BBQ", preferred: 1, startTimeCode: "1800", endTimeCode: "2000" },
		],
		*/
		source: "Everlive.DailyPreferences",
		schema: {
			model: {
				id : "Id",
				fields: {
					Id: "string",
					Name: "string",
					Food: "string",
					StartTimeCode: "string",
					EndTimeCode: "string"
				}
			}
		},
		serverFiltering: true,
		filter: [
			{ field: "Date", operator: "eq", value: config.get("today") }
		],
		expand: {
			"User": true,
			"FoodCategories": true
		},
		requestEnd: function(e) {
			if (e.response && e.response.Result) {
				/*
				e.response.Result.forEach(function(item, index) {
					item.set("DisplayName", item.User.DisplayName);
				});
				*/
				var food = {}, results = [];
				e.response.Result.forEach(function(daily,index) {
					daily.FoodCategories.forEach(function(pref,index) {
						if (!food[pref.Name])
							food[pref.Name] = { min: daily.StartTimeCode, max: daily.EndTimeCode, users:{} };
						if (daily.StartTimeCode < food[pref.Name].min)
							food[pref.Name].min = daily.StartTimeCode;
						if (daily.EndTimeCode > food[pref.Name].max)
							food[pref.Name].max = daily.EndTimeCode;
						food[pref.Name].users[daily.User.Id] = 1;
					});
				});
				for (var pref in food) {
					e.response.Result.forEach(function(daily,index) {
						var record = {
							User: daily.User.Id,
							DisplayName: daily.User.DisplayName,
							Food: pref,
							Preference: food[pref].users[daily.User.Id] // CAUTION: Could be null
						};
						for (var timecode=parseInt(food[pref].min); timecode<food[pref].max; timecode=(timecode%100) ? timecode+=70 : timecode+=30) {
							if (daily.StartTimeCode <= timecode && daily.EndTimeCode > timecode)
								record["utc"+timecode] = record.Preference ? "preference" : "available";
						}
						results.push(record);
					});
				}
				window.results.data(results);
			}
		}
	});
	window.allPreferences.cycle = function() {
		window.allPreferences.read();
		if (window.allPreferences.timeout)
			window.clearTimeout(window.allPreferences.timeout);
		window.allPreferences.timeout = window.setTimeout(window.allPreferences.cycle, 60 * 60); // check every minute
	}
	window.allPreferences.cycle();
	
	window.results = pi.data.DataSource.create({
		group: {
			field: "Food", aggregates: [
				{ field: "DisplayName", aggregate: "count" },
				{ field: "Preference", aggregate: "sum" }
			]
		},
		change: function(e) {
			if (e.items && !e.items.length)
				window.preferences.open(true);
		}
	});
	
	var column = {
		width: "6%"
	};
	$('.all-groups').kendoGrid({
		dataSource : window.results,
		columns : [
			{ field: "Food", title: "", hidden:true, aggregate: ["count"], groupHeaderTemplate: "#=value# (#=aggregates.Preference.sum# preferred)" },
			{ field: "DisplayName", title: "Name", width: "30%" },
			$.extend({ field: "utc1530", title: "&nbsp;", attributes: {class: "#=data.utc1530#"} }, column),
			$.extend({ field: "utc1600", title: "11a", attributes: {class: "#=data.utc1600#"} }, column),
			$.extend({ field: "utc1630", title: "&nbsp;", attributes: {class: "#=data.utc1630#"} }, column),
			$.extend({ field: "utc1700", title: "12p", attributes: {class: "#=data.utc1700#"} }, column),
			$.extend({ field: "utc1730", title: "&nbsp;", attributes: {class: "#=data.utc1730#"} }, column),
			$.extend({ field: "utc1800", title: "1p", attributes: {class: "#=data.utc1800#"} }, column),
			$.extend({ field: "utc1830", title: "&nbsp;", attributes: {class: "#=data.utc1830#"} }, column),
			$.extend({ field: "utc1900", title: "2p", attributes: {class: "#=data.utc1900#"} }, column),
			$.extend({ field: "utc1930", title: "&nbsp;", attributes: {class: "#=data.utc1930#"} }, column),
			$.extend({ field: "utc2000", title: "3p", attributes: {class: "#=data.utc2000#"} }, column),
			$.extend({ field: "utc2030", title: "&nbsp;", attributes: {class: "#=data.utc2030#"} }, column),
		]
	});
	
	/*
	var theData = {};
	config.set("results", pi.observable());
	
	var setDetailData = function (groupId) {
		var detailData = theData.groups[groupId];
		$('#results_detail span.genre').text(detailData.restaurant);
		$('#results_detail span.time').text(detailData.time);
		var theUl = $('#results_detail ul.people');
		theUl.find('li').remove();
		$.each(detailData.group, function (idx, name) {
			theUl.append($('<li></li>').text(name));
		});
	};

	var populateDiv = function () {
		var allGroups = $('.all-groups');
		$.each(theData.groups, function (key, vals) {
			var grpDiv = $('<div></div>').addClass('group').attr('data-group-id', key);
			var grp = $('<div></div>').addClass('details');
			grp.append($('<span></span>').addClass('genre').text(vals.restaurant));
			grp.append($('<span></span>').addClass('time').text(vals.time));
			grp.append($('<span><span class="count-num"></span> people</span>').addClass('count'));
			grp.find('.count-num').text(vals.group.length);

			var iconSpan = $('<span></span>').addClass('group-icon');
			iconSpan.append($('<img />').attr('src', 'img/color-table.png'));

			grpDiv.append(iconSpan);
			grpDiv.append(grp);

			if (key === theData.me.toString()) {
				grpDiv.addClass('user-selected-group');
			}
			grpDiv.on('click', function (evt) {
				var grp = $(evt.target).closest('div.group');
				var groupId = "";
				if (!grp.attr('data-group-id')) {
					groupId = grp.parent('div').attr('data-group-id');
				} else {
					groupId = grp.attr('data-group-id');
				}
				setDetailData(groupId);
				window.location.hash = "#results_detail";
			});
			allGroups.append(grpDiv);
		})
	};
    // URL for the website is: https://catnip-ats.herokuapp.com/
    // will either need to move the all the http hosting to the
    // same server, fix the origin rules or proxy.
	$.get(config.get("server.results"))
		.fail(function () {
			theData = {
				"me": 0,
				"happiness": 0,
				"groups": {
					"0": {
						"restaurant": "Pasara",
						"time": "10:30",
						"group": ["Craig"]
					},
					"1": {
						"restaurant": "Sweet Fire Donna's",
						"time": "13:00",
						"group": ["David", "Jabari", "Gary"]
					},
					"2": {
						"restaurant": "Chinese",
						"time": "13:00",
						"group": ["Kurt", "Ken", "Cary", "Jeff"]
					},
					"3": {
						"restaurant": "Deliahs",
						"time": "14:30",
						"group": ["Josiah", "Tonio", "Kris", "Derek", "Craig", "Gary", "Yoshi"]
					}
				}
			};
			populateDiv();
		})
		.done(function (data) {
			theData = data;
			populateDiv();
		});

	*/

});
