$(function() {
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
	$.get('/ajax/results')
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
						"restaurant": "Pasara",
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


});
