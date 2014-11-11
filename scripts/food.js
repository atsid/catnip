$(function() {
	config.set("food", pi.observable());
	config.set("food.categories", pi.data.DataSource.create({
		source: "Everlive.FoodCategories"
	})).fetch();
	config.set("food.preferences", pi.data.DataSource.create({
		source: "Everlive.DailyFoodPreferences"
	})).fetch();
	// It's common to type the 's' in source as lowercase, so this is an alias.
	config.set("food.datasource", config.get("food.dataSource"));
});