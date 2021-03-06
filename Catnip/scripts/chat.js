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
								// WARNING: If there's a server interruption, plan for window.myPreferences temporarily not existing.
								Date : window.myPreferences.get("Date") || config.getToday(),
								Group : window.myPreferences ? window.myPreferences.get("Group") : window.myAccount.get("Groups")[0]
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
			change: function(e) {
				if (e.action === "add") {
					e.items[0].set("Owner", window.myAccount);
					e.items[0].set("Date", window.myPreferences ? window.myPreferences.get("Date") : config.getToday());
					e.items[0].set("Group", window.myPreferences ? window.myPreferences.get("Group") : window.myAccount.get("Groups")[0]);
					e.items[0].set("TimezoneOffset", new Date().getTimezoneOffset());
					e.items[0].set("CreatedAt", new Date());
				}
			},
			debug: false,
			serverFiltering: false,
			expand: { 
				Owner: true
			},
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
		
		window.chat.show = function() {
			var drawer = $('#chat').data("kendoMobileDrawer");
			if (drawer)
				drawer.show();
		}
		window.chat.scrollToBottom = function() {
			try {
				var drawer = $('#chat').data("kendoMobileDrawer");
				if (drawer)
					drawer.scroller.animatedScrollTo(0, drawer.scroller.dimensions.y.min);
			} catch (e) {
				e.event = "Chat Drawer AutoScroll";
				(pi||console).log(e);
			}
		}
		window.chat.initView = function(e) {
			var drawer = e.sender;
			drawer.one("show", function(e) {
				// CAUTION: We have to add this manually.  Whenever window.chat is refreshed, it resets options.selected.
				var $message = this.element.find('#addMessage');
				this.element.find('.km-footer button').bind("click", function(e) {
					try {
						if ($message.val().length) {
							window.chat.add({ 'Message' : $message.val() });
							window.chat.scrollToBottom();
							window.chat.sync();
							$message.val("");
						}
					} catch(e) {
						e.event = "Create Chat Message";
						(pi||console).log(e);
					}
				});
			});
			drawer.bind("afterShow", function(e) {
				window.chat.scrollToBottom();
				this.element.find("#addMessage").focus();
			}).bind("afterHide", function(e) {
				this.element.find("#addMessage").blur();
			});
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
		
		window.chat.bind("requestEnd", function(e) {
			if (e.type === "read")
				this.one("change", function(e) {
					window.chat.scrollToBottom();
				});
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
