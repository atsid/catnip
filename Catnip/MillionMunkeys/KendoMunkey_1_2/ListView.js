// Setup namespaces
pi = pi||{};
pi.mobile = pi.mobile||{};
pi.mobile.ui = pi.mobile.ui||{};
// Store the original
pi.mobile.ui.ListView = kendo.mobile.ui.ListView;
// Extend and replace the original
kendo.mobile.ui.ListView = pi.mobile.ui.ListView.extend({
	init : function(element,options) {
		pi.ui.Widget.attributeOptions.apply(this,arguments);
        this._configure(element,options);
		pi.mobile.ui.ListView.fn.init.apply(this,arguments);
		// It's not documented, but ListView accepts a pullOffset options value.  It just doesn't pass it to the Scroller.
		if (this.options.pullOffset < 0) {
			this._scrollerInstance.setOptions({
				pullToRefresh: this.options.pullToRefresh, // pullToRefresh must exist to set pullOffset!
				pullOffset: this.options.pullOffset
			})
		}
    },
    _configure : function(element,options) {
        if (typeof(options.dataSource) == "undefined" || typeof(options.template) != "undefined")
            return;
        var headerTemplate = $(element), template;
        if (headerTemplate.prop("tagName").toUpperCase() == "UL") {
            headerTemplate = headerTemplate.children("li").first();
	        template = headerTemplate.children("ul");
            if (!template.length) {
                options.template = headerTemplate.html();
            } else {
                template.detach();
                options.headerTemplate = headerTemplate.html();
		        options.template = template.children("li").html();
	        }
        } else {
            options.template = headerTemplate.html();
        }
    }
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.mobile.ui.roles.listview = kendo.mobile.ui.ListView;