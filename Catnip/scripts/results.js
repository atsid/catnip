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
		*/
		
		window.results = pi.data.DataSource.create({
			group: {
				field: "Food", aggregates: [
					{ field: "DisplayName", aggregate: "count" },
					{ field: "Preference", aggregate: "sum" }
				]
			},
			change: function(e) {
				try {
					if (e.items && !e.items.length)
						window.preferences.open(true);
				} catch(e) {
					e.event = "Result Change";
					(pi||console).log(e);
				}
			}
		});
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
					window.preferences.options.bind("change", function(e) {
						if (e.field === "enabled") {
							var enabled = this.get(e.field,true);
							$('#dailyprefs [name=StartTime]').data("kendoTimePicker").enable(enabled);
							$('#dailyprefs [name=EndTime]').data("kendoTimePicker").enable(enabled);
							$('#dailyprefs [name=Brought]').data("kendoMobileSwitch").enable(enabled);
							$('#dailyprefs [name=FoodCategories]').data("kendoMultiSelect").enable(enabled);
							window.preferences.open(enabled);
						}
					}).trigger("change", { field: "enabled" });
					var multiselect = $('#dailyprefs [name=FoodCategories]').data("kendoMultiSelect");
					multiselect.input.bind("focus", function(e) {
						// e.currentTarget.blur();
						// multiselect.open();
					});
					$('.all-groups').kendoGrid({
						dataSource : window.results,
						columns : [
							{ field: "Food", title: "", hidden:true, aggregate: ["count"], groupHeaderTemplate: "#=value# (#=(aggregates.Preference.sum||0)# preferred)" },
							{ field: "DisplayName", title: "Name", width: "30%" },
							{ field: "utc1530", title: "&nbsp;", width: "6%", attributes: {class: "#=data.Food# #=data.utc1530#"} },
							{ field: "utc1600", title: "11a", width: "6%", attributes: {class: "#=data.Food# #=data.utc1600#"} },
							{ field: "utc1630", title: "&nbsp;", width: "6%", attributes: {class: "#=data.Food# #=data.utc1630#"} },
							{ field: "utc1700", title: "12p", width: "6%", attributes: {class: "#=data.Food# #=data.utc1700#"} },
							{ field: "utc1730", title: "&nbsp;", width: "6%", attributes: {class: "#=data.Food# #=data.utc1730#"} },
							{ field: "utc1800", title: "1p", width: "6%", attributes: {class: "#=data.Food# #=data.utc1800#"} },
							{ field: "utc1830", title: "&nbsp;", width: "6%", attributes: {class: "#=data.Food# #=data.utc1830#"} },
							{ field: "utc1900", title: "2p", width: "6%", attributes: {class: "#=data.Food# #=data.utc1900#"} },
							{ field: "utc1930", title: "&nbsp;", width: "6%", attributes: {class: "#=data.Food# #=data.utc1930#"} },
							{ field: "utc2000", title: "3p", width: "6%", attributes: {class: "#=data.Food# #=data.utc2000#"} },
							{ field: "utc2030", title: "&nbsp;", width: "6%", attributes: {class: "#=data.Food# #=data.utc2030#"} },
						]
					});
					window.results.bind("change", function(e) {
						if (!this.view().length)
							$(".all-groups .k-grid-content tbody").empty().append('<tr><td colspan="13">Nothing yet.</td></tr>');
					}).trigger("change");
				} catch(e) {
					e.event = "Result View Initialization";
					(pi||console).log(e);
				}
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
