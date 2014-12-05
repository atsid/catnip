$(function() {
	try {
		window.food = pi.data.DataSource.create({
			id: "Lunch.FoodCategories",
			source: "Everlive.FoodCategories",
			storage: "localStorage"
		});
		window.food.read();
		window.food.getDefaultPreferences = function(defaults) {
			try {
				return $.extend({
					"Date" : config.get("today"),
					"User" : myAccount.get("Id"),
					"FoodCategory" : "",
					"Food" : ""
				},defaults);
			} catch(e) {
				e.event = "Default Preferences";
				(pi||console).log(e);
			}
		}
		window.food.onChange = function(e) {
			try {
				if (e.action === "itemchange" && e.field === "FoodCategory") {
					var dataSource = this;
					e.items.forEach(function(item,index) {
						var id = item.get("FoodCategory"), record = window.food.get(id);
						if (id && record)
							item.set("Food", record.get("Name"));
						else
							dataSource.remove(item);
					});
					if (e.field !== "guid")
						this.sync();
				}
				else if (e.action === "add") {
					e.items.forEach(function(item,index) {
						if (item.get("User") !== window.myAccount.get("Id"))
							// CAUTION: Don't use set("User") so we don't fire an immediate sync
							item.User = window.myAccount.get("Id");
					});
				}
			} catch(e) {
				e.event = "Food Change";
				(pi||console).log(e);
			}
		}
		window.food.init = function(e) {
			try {
				$('#FoodPreferences form').each(function(index,element) {
					var form = $(element).data('kendoValidator');
					if (form && form.options.dataSource)
						form.options.dataSource.filter(window.account.getFilter({field:"Priority",operator:"eq",value:index}));
				});
			} catch(e) {
				e.event = "Food Init";
				(pi||console).log(e);
			}
		}
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange") {
					var value = e.items[0].get(e.field);
					if (e.field === "Id" && value)
						window.food.init();
				} else if (e.action === "remove") {
					$('#FoodPreferences form').each(function(index,element) {
						var form = $(element).data('kendoValidator');
						if (form && form.options.dataSource)
							form.options.dataSource.reset();
					});
				}
			} catch(e) {
				e.event = "Food Account Change";
				(pi||console).log(e);
			}
		});
		// CAUTION: We don't init datasource on page load, because they're not created until application init.
		//.trigger("change", {action:"itemchange",field:"Id",items:window.account.data()});
	} catch(e) {
		e.event = "Food Preferences Instantiation";
		(pi||console).log(e);
	}
});