$(function() {
	try {
		// Set configuration
		window.chat = pi.data.DataSource.create({
			id: "Lunch.Chat",
			source: "Everlive.Chat",
			storage: "localStorage",
			template: $('#messages'),
			transport: {
				read: {
					beforeSend: function(xhr) {
						try {
							xhr.setRequestHeader("X-Everlive-Filter",JSON.stringify({
								Date : config.getToday(),
								Group : window.myPreferences.get("Group") || window.myAccount.get("Groups")[0]
							}));
						} catch(e) {
							e.event = "Adding Chat Filter";
							(pi||console).log(e);
						}
					}
				},
				create: {
					data: function(data) {
						// Fix expand for saving data.
						if (typeof(data.Owner) === "object")
							data.Owner = data.Owner.Id;
					}
				},
				update: {
					data: function(data) {
						// Fix expand for saving data.
						if (typeof(data.Owner) === "object")
							data.Owner = data.Owner.Id;
					}
				}
			},
			debug: false,
			serverFiltering: false,
			expand: { Owner: { Photo: true } },
			error: function(e) {
				if (e.xhr && e.xhr.status === 403)
					return;
				(pi||console).log({
					type: "error",
					message: e.errorThrown,
					status: e.status
				});
			}
		});
		window.chat.bind("error", window.account.forbidden);
		
		window.chat.cycle = function() {
			if (window.chat.timeout)
				window.clearTimeout(window.chat.timeout);
			// CAUTION: Don't sync here.  We'll do a manual merge later.
			window.chat.read();
			window.chat.scrollToBottom();
			window.chat.timeout = window.setTimeout(window.chat.cycle, 5 * 60 * 1000); // check every 5 minutes
		}
		
		window.chat.scrollToBottom = function() {
			var scroller = $('#chat').data("kendoMobileDrawer").scroller;
			scroller.scrollTo(0,scroller.dimensions.y.min);
		}
		
		window.chat.bind("change", function(e) {
			try {
				if (e.action === "sync" && e.items)
					this.read();
			} catch(e) {
				e.event = "Refresh Chat";
				(pi||console).log(e);
			}
		});
		
		// Login/Logout
		window.account.bind("change", function(e) {
			try {
				if (e.action === "itemchange") {
					var value = e.items[0].get(e.field);
					if (e.field === "Id" && value) {
						// Check server
						window.chat.cycle();
					}
				} else if (e.action === "remove") {
					if (window.chat.timeout)
						window.clearTimeout(window.chat.timeout);
					window.chat.reset();
				}
			} catch(e) {
				e.event = "Chat Account Change";
				(pi||console).log(e);
			}
		}).trigger("change", { action: "itemchange", field: "Id", items: [window.myAccount] });
	} catch(e) {
		e.event = "Chat Instantiation";
		(pi||console).log(e);
	}
});
