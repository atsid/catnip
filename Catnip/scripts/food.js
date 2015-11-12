$(function() {
	try {
		window.food = pi.data.DataSource.create({
			id: "Lunch.FoodCategories",
			method: "get",
			source: "Everlive.FoodCategories",
			storage: "localStorage",
			sort: { field: "Name", dir: "asc" },
			change: function(e) {
				try {
					var styles = [
						"td.Brought.preference {background-color : rgba(192,192,192,1)}",
						"td.Brought.available {background-color : rgba(192,192,192,0.5)}",
						"td.Undecided.preference {background-color : rgba(192,192,192,1)}",
						"td.Undecided.available {background-color : rgba(192,192,192,0.5)}"
					];
					this.data().forEach(function(item,index) {
						if (item.RGB) {
							styles.push("td."+item.Name+".preference {background-color: rgba("+item.RGB+",1)}");
							styles.push("td."+item.Name+".available {background-color: rgba("+item.RGB+",0.5)}");
						}
					});
					var styleBlock = $('style#LunchColors');
					if (!styleBlock.length)
						styleBlock = $(document.head).append('<style id="LunchColors">').children("#LunchColors");
					styleBlock.empty().text(styles.join("\n"));
				} catch(e) {
					e.event = "Food Category Initialization";
					(pi||console).log(e);
				}
			}
		});
		window.food.bind("error", window.account.forbidden);
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange" && e.field === "Id" && e.items[0].get(e.field))
					window.food.read();
			} catch(e) {
				e.event = "Food List Account Change";
				(pi||console).log(e);
			}
		});
	} catch(e) {
		e.event = "Food Preferences Instantiation";
		(pi||console).log(e);
	}
});