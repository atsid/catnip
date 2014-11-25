$(function() {
	window.food = pi.data.DataSource.create({
		source: "Everlive.FoodCategories",
		storage: "localStorage"
	});
	window.food.read();
	window.food.getDefaultPreferences = function(defaults) {
		return $.extend({
			"Date" : config.get("today"),
			"User" : myAccount.get("Id"),
			"FoodCategory" : "",
			"Food" : ""
		},defaults);
	}
	window.food.onChange = function(e) {
		if (e.action === "itemchange" && e.field === "FoodCategory") {
			var dataSource = this;
			e.items.forEach(function(item,index) {
				var id = item.get("FoodCategory"), record = window.food.get(id);
				if (id && record)
					item.set("Food", record.get("Name"));
				else
					dataSource.remove(item);
			});
			this.sync();
		}
	}
});