(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script',config.scheme+'://www.google-analytics.com/analytics.js','ga');

google = kendo.observable();

google.log = function(message,type) {
	(pi||console).log(message,type,"Google");
}

// Determine where we're being run, in the simulator, on a mobile device, or on the web?
if (/icenium\.com/.test(document.location.host))
	google.set("uri", "http://app.icenium.com/Mist/Workspace/"+config.id+"/index.html");
else if (kendo.support.mobileOS)
	google.set("uri",config.id+"://index.html");
else
	google.set("uri",config.server+"/index.html");

// If we're in the simulator or on the web we use Web analytics, otherwise we use the plugin.
if (window.plugins) {
	
	$(function() {
        // Init
        window.plugins.gaPlugin.init(function(){
            google.log("Analytics Initialized.");
        }, function(e) {
            google.log("Initialization Error!","error");
        }, config.google.mobile, 10);
        // Exit
        $(document.body).on("unload", function() {
            if (window.plugins) {
                window.plugins.gaPlugin.exit(function() {
                    google.log("Analytics cleaned up.")
                }, function() {
                    google.log("Error exiting analytics.","error")
                });
            }
        });
        
        /*
         Available functions:
            window.plugins.gaPlugin.trackEvent(onSuccess, onError, category, eventAction, eventLabel, eventValue);
                1.  onSuccess - a function that will be called on success
                2.  onError - a function that will be called on error.
                3.  category - This is the type of event you are sending such as "Button", "Menu", etc.
                4.  eventAction - This is the type of event you are sending such as "Click", "Select". etc.
                5.  eventLabel - A label that describes the event such as Button title or Menu Item name.
                6.  eventValue - An application defined integer value that can mean whatever you want it to mean.
            window.plugins.gaPlugin.setVariable(onSuccess, onError, index, value);
                1.  onSuccess - a function that will be called on success
                2.  onError - a function that will be called on error.
                3.  index - the numerical index representing one of your variable slots (1-20).
                4.  value - Arbitrary string data associated with the index.
            window.plugins.gaPlugin.trackPage(onSuccess, onError, url)
                1.  resultHandler - a function that will be called on success
                2.  errorHandler - a function that will be called on error.
                3.  url - The url of the page hit you are logging.
        */
        google.trackEvent = function(category, eventAction, eventLabel, eventValue, onSuccess, onError) {
            window.plugins.gaPlugin.trackEvent(onSuccess || $.noop, onError || $.noop, category, eventAction, eventLabel, (typeof(eventValue) != "undefined") ? eventValue : 0);
        }
        google.setVariable = function(index, value, onSuccess, onError) {
            window.plugins.gaPlugin.setVariable(onSuccess || $.noop, onError || $.noop, index, value || 0);
        }
        google.trackPage = function(url, onSuccess, onError) {
            window.plugins.gaPlugin.trackPage(onSuccess || $.noop, onError || $.noop, url)
        }
	});
} else {
	
	$(function() {
        // Init
        ga('create', config.google.web, {
            'cookieDomain': config.google.domain
        });
        /*
         Available functions:
            ga.trackEvent(onSuccess, onError, category, eventAction, eventLabel, eventValue);
                1.  category - This is the type of event you are sending such as "Button", "Menu", etc.
                2.  eventAction - This is the type of event you are sending such as "Click", "Select". etc.
                3.  eventLabel - A label that describes the event such as Button title or Menu Item name.
                4.  eventValue - An application defined integer value that can mean whatever you want it to mean.
            ga('send', 'pageview', {'page':url});
                1.  url - The url of the page hit you are logging.
        */
        google.trackEvent = function(category, eventAction, eventLabel, eventValue) {
            ga('send', 'event', category, eventAction, eventLabel, (typeof(eventValue) != "undefined") ? eventValue : 0);
        }
        google.setVariable = function(variable, value) {
            if (typeof(variable) != "undefined" && typeof(value) != "undefined")
	            ga('set', variable, value);
        }
        google.trackPage = function(url) {
    		ga('send', 'pageview', {'page': url});
        }
    });
}

// Since everything is one page, we need to log pages everytime the view changes.
$(function() {
	try {
		// On each page show, register as a page view.
		app.bind("init",function(e) {
			// On initial load, log the initial page load.
			google.trackPage(google.get('uri')+"#"+app.options.initial);
			var layouts = app.pane.viewEngine.layouts;
			for (var layout in layouts)
				layouts[layout].bind("show", function(e) {
					google.trackPage(e.view.id);
				});
		});
	} catch(e) {
		(pi||console).log(e);
	}
});

if (pi && pi.console) pi.console.bind("change",function(e) {
	switch (e.action) {
		case "add":
            try {
			for (var i=0; i<e.items.length; i++) {
				if ( typeof(e.items[i]) == "object" )
					switch (e.items[i].type.toLowerCase()) {
						case "e":
						case "error":
						case "d":
						case "debug":
							// CAUTION: GA value must be an integer.
							e.items[i].account = account.get("dataSource.options.selected.email","");
							e.items[i].keys = Object.keys ? Object.keys(e.items[i]) : "";
							if (google.trackEvent)
								google.trackEvent(e.items[i].category, e.items[i].type, JSON.stringify(e.items[i]), e.items[i].value);
							else if (typeof(window.console) != "undefined") // For IE 8 and below!
                                    // CAUTION: This must be console.log, or else we might get an endless loop.
                                    window.console.log( ({
                                        message : e.message,
                                        trackEvent : google.trackEvent ? google.trackEvent.toString() : "",
                                        trackPage : google.trackPage ? google.trackPage.toString() : "",
                                        stack : typeof(e.stack) != "undefined" ? e.stack.toString() : ""
                                    }).toString() );
							break;
					}
			}
            } catch(e) {
                // CAUTION: This must be console.log, or else we might get an endless loop.
				if (typeof(window.console) != "undefined") // For IE 8 and below!
					window.console.log( ({
                    	message : e.message,
                    	stack : typeof(e.stack) != "undefined" ? e.stack.toString() : ""
                	}).toString() );
            }
			break;
	}
});