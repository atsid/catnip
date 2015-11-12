$(function() {
	try {
		/*
		$("#map").kendoMap({
			center: [35.2681, -97.7448],
			zoom: ($(window).width() >= 768) ? 4 :  ($(window).width() >= 500) ? 3.5 : 3,
			layers: [{
				type: "shape",
				dataSource: {
					type: "geojson",
					transport: {
						read: "scripts/geojson/gz_2010_us_districts_20m.json"
					}
				},
				style: {
					fill: {
						opacity: 0.7
					}
				}
			}]
		});
		*/
		
		window.results = pi.data.DataSource.create({
			group: {
				field: "Food",
				aggregates: [
					{ field: "DisplayName", aggregate: "count" },
					{ field: "Preference", aggregate: "sum" }
				]
			},
			change : function(e) {
				try {
					if (e.items) {
						var brought, optout;
						e.items.forEach(function(group,index) {
							group.items.forEach(function(item,index) {
								if (item.StartTimeCode && item.EndTimeCode)
									for (var timecode=parseInt(item.StartTimeCode); timecode<item.EndTimeCode; timecode=(timecode%100) ? timecode+=70 : timecode+=30)
										item["utc"+timecode] = item.Preference ? "preference" : "available";
							});
							if (group.value === "Brought")
								brought = index;
							else if (group.value === "Out")
								optout = index;
						});
						if (brought >= 0)
							e.items.push(e.items.splice(brought,1)[0]);
						if (brought < optout)
							optout--;
						if (optout >= 0)
							e.items.push(e.items.splice(optout,1)[0]);
					}
				} catch(e) {
					e.event = "Result Change";
					(pi||console).log(e);
				}
			}
		});
		window.results.showTab = function(show) {
			if (show)
				$('#opener').css({opacity:1}).animate({top:"0px","margin-bottom":"0px"});
			else
				$('#opener').animate({top:"-18px","margin-bottom":"-18px"}).css({opacity:0});
		}
		window.results.initView = function(e) {
			e.view.one("show", function(e) {
				try {
					e.view.scroller.setOptions({
						pullToRefresh: true,
						pull: function() {
							window.preferences.one("requestEnd", function(e) {
								$('#results').data('kendoMobileView').scroller.pullHandled();
							});
							window.preferences.cycle();
						}
					});
					e.view.header.kendoTouch({
						enableSwipe: true,
						swipe: function(e) {
							if (e.direction === "up")
								window.preferences.open(false);
							else if (e.direction === "down")
								window.preferences.open(true);
						}
					});
					$(window).on("orientationchange", function(e) {
						window.preferences.open(false);
					});
					/*
					$('#toggleChat').bind("click", function(e) {
						var drawer = $('#chat').data('kendoMobileDrawer');
						if (drawer.visible)
							drawer.hide();
						else
							drawer.show();
					});
					*/
					window.preferences.options.bind("change", function(e) {
						if (e.field === "disabled") {
							var disabled = this.get(e.field,false);
							$('#dailyprefs [name=StartTime]').data("kendoTimePicker").enable(!disabled);
							$('#dailyprefs [name=EndTime]').data("kendoTimePicker").enable(!disabled);
							$('#dailyprefs [name=Brought]').data("kendoMobileSwitch").enable(!disabled);
							$('#dailyprefs [name=FoodCategories]').data("kendoMultiSelect").enable(!disabled);
							if (disabled)
								window.results.showTab(false);
							else
								window.results.showTab(true);
						}
					}).trigger("change", { field: "disabled" });
					var grid = $('.all-groups').kendoGrid({
						dataSource : window.results,
						columns : [
							{ field: "Food", title: "", hidden:true, aggregate: ["count"], groupHeaderTemplate: "#=value# #=aggregates.Preference.sum?'('+aggregates.Preference.sum+' preferred)':''#" },
							{ field: "DisplayName", title: "Name", width: "30%" }
						]
					}).data("kendoGrid");
					window.groups.options.bind("change", function(e) {
						// CAUTION: Columns are decided by the group
						var group = this.get(e.field),
							StartTimeCode = 1030,
							EndTimeCode = 1600,
							TimeZoneOffset = (window.myPreferences ? window.myPreferences.get("TimezoneOffset") : new Date().getTimezoneOffset()),
							TimeCodeOffset = (TimeZoneOffset / 60 * 100) + (TimeZoneOffset%60),
							columns = [
								{ field: "Food", title: "", hidden:true, aggregate: ["count"], groupHeaderTemplate: "#=value# #=aggregates.Preference.sum?'('+aggregates.Preference.sum+' preferred)':''#" },
								{ field: "DisplayName", title: "Name", width: "30%" }
							];
						if (e.field === "selected") {
							if (typeof(group) === "object") {
								StartTimeCode = parseInt(group.get("StartTimeCode")) || StartTimeCode;
								EndTimeCode = parseInt(group.get("EndTimeCode")) || EndTimeCode;
								for (var timecode = StartTimeCode, utcTimecode, hour, hourString; timecode < EndTimeCode; timecode = (timecode%100) ? timecode+=70 : timecode+=30) {
									utcTimecode = timecode + TimeCodeOffset;
									hour = Math.floor(timecode/100);
									hourString = (hour%12 || 12).toString() + ((hour<12) ? "a" : "p");
									columns.push({
										field: "utc"+utcTimecode, 
										title: (timecode%100) ? "&nbsp;" : hourString, 
										width: "6%", 
										attributes: {
											class: "#=data.Food# #=data.utc"+utcTimecode+"#"
										}
									});
								}
							}
							grid.setOptions({
								dataSource : window.results,
								columns : columns
							});
						}
					}).trigger("change", { field: "selected" });
					window.results.bind("change", function(e) {
						if (!this.view().length)
							$(".all-groups .k-grid-content tbody").empty().append('<tr><td colspan="13">Nothing yet.</td></tr>');
					}).trigger("change");
				} catch(e) {
					e.event = "Result View Initialization";
					(pi||console).log(e);
				}
			});
			e.view.bind("show", function(e) {
				if (!window.preferences.options.get("disabled"))
					window.results.showTab(true);
				setTimeout(function() {
					window.preferences.open(false);
				},1500);
			});
			e.view.bind("beforeHide", function(e) {
				window.results.showTab(false);
			});
		}
		
	} catch(e) {
		e.event = "Results Instantiation";
		(pi||console).log(e);
	}
	
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
