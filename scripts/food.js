$(function() {
	config.set("food", pi.observable());
	config.set("food.preferences", pi.data.DataSource.create({
		source: "Everlive.DailyFoodPreferences"
	})).fetch();
	
	var dataUriPrefix = 'http://api.everlive.com/v1/kD5Tly50Vf6nm8kn/';
	var priorityToCategoryId = {};
	var userId = '1bac2d70-69a0-11e4-8481-bd60c9634975';
	
	
	var genresCount = 3;
	var genresBody = $('.genres tbody');
	var rowTemplate = genresBody.children().remove();
	
	var row;
	var i;
	for(i = 0; i < genresCount; i++) {
		row = rowTemplate.clone();
		row.find('.genre').attr('priority', i);
		genresBody.append(row);
	}
	
	$('.genre').each(function() {
		var combobox = $(this);
		var priority = combobox.attr('priority');
		combobox.kendoComboBox({
			dataTextField: "Name",
			dataValueField: "Id",
			dataSource: pi.data.DataSource.create({ // need one data source per combobox
				source: "Everlive.FoodCategories",
				
			}),
			filter: "contains",
			suggest: true,
			change: function() {
				priorityToCategoryId[priority] = this.value();
			}
		});
	});
	
	$('.set-genres').on('click', function() {
		var uri = dataUriPrefix + 'DailyFoodPreferences';

		var date = new Date();
		
		function getExisting() {
			var dateStr = [date.getYear(), (date.getMonth() + 1), date.getDate()].join('-');
			var filter = JSON.stringify({
				Date: dateStr
			});
			$.get(uri + '?filter=' + filter)
				// .done(deleteExisting); // TODO put back
				.done(postNew);
		}
		function deleteExisting(prefsRaw) {
			var prefs = prefsRaw.Result || [];
			if (prefs.length) {
				prefs.forEach(function(pref) {
					$.ajax({
						url: uri + '/' + pref.Id,
						type: 'DELETE',
						complete: postNew
					});
				});
			} else {
				postNew();
			}
		}
		function postNew() {
			var dateStr = date.toISOString();
			var newPrefs = Object.keys(priorityToCategoryId).sort().map(function(priority, normalizedPriority) {
				return {
					User: userId,
					Date: dateStr,
					PreferenceDate: dateStr,
					Priority: Number(normalizedPriority), // zero-based // TODO add Priority on persistence model
					FoodCategory: priorityToCategoryId[priority]
				};
			});
			if (newPrefs.length) {
				// $.post(uri, newPrefs);
				$.ajax({
					url: uri,
					type: 'POST',
					contentType: 'application/json',
					data: JSON.stringify(newPrefs)
				});
			}
		}
		getExisting();
	});
});