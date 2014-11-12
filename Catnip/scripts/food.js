$(function() {
    var me, today;
    
    today = new Date().trimToDate();
    me = '1bac2d70-69a0-11e4-8481-bd60c9634975';

	config.set("food", pi.observable());
	config.set("food.preferences", pi.data.DataSource.create({
		source: "Everlive.DailyFoodPreferences",
        serverFiltering: true,
        serverPaging: true,
        page: 1,
        pageSize: 3,
        filter: [
            {field: 'User', operator: 'eq', value: me},
            {field: 'Date', operator: 'eq', value: today.toISOString()}
        ],
        sort: {field: 'Priority', dir: 'ascending'},
        change: function () {
            var data, saved;
            data = this.data();
            saved = {
                first: data[0],
                second: data[1],
                third: data[2]
            };
            config.set('food.saved', saved);
            $('input.genre').each(function () {
                updateGenres.call(this);
            });

        }
    })).fetch();
	
	var dataUriPrefix = 'http://api.everlive.com/v1/kD5Tly50Vf6nm8kn/';
	var priorityToCategoryId = {};
	var userId = config.get("user.id","");
	
	
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
	
    
    function updateGenres(saved) {
		var combobox = $(this);
		var priority = combobox.attr('priority');
        var saved = config.get('food.saved');
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
	}
    	
	$('.set-genres').on('click', function() {
		var uri = dataUriPrefix + 'DailyFoodPreferences';

		var date = new Date().trimToDate();
		
		function getExisting() {
			var filter = JSON.stringify({
                User: me,
				Date: date.toISOString()
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
			var newPrefs = Object.keys(priorityToCategoryId).sort().map(function(priority, normalizedPriority) {
				return {
					User: me,
					Date: date.trimToDate(),
					PreferenceDate: date.toISOString(),
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
