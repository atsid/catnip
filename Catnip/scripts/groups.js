$(function() {
	try {
		window.groups = pi.data.DataSource.create({
			id: "Lunch.myGroups",
			method: "get",
			source: "Everlive.Groups",
			storage: "localStorage",
			serverFiltering: true,
			defaultSelected: "first"
		});
		window.groups.bind("error", window.account.forbidden);
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange" && e.field === "Groups" && window.myAccount.get(e.field)) {
					var myGroups = window.myAccount.get(e.field),
						filter = {
							logic: "or",
							filters: []
						};
					myGroups.forEach(function(groupId,index) {
						filter.filters.push({ field: "Id", operator: "eq", value: groupId });
					});
					window.groups.filter(filter);
				} else if (e.action === "remove") {
					window.groups.reset();
				}
			} catch(e) {
				e.event = "Groups Account Change";
				(pi||console).log(e);
			}
		}).trigger("change", {action: "itemchange", field: "Groups", items:[window.myAccount]});
	} catch(e) {
		e.event = "Groups Instantiation";
		(pi||console).log(e);
	}
});