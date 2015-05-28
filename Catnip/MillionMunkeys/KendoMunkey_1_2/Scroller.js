// Setup namespaces
pi = pi||{};
pi.mobile = pi.mobile||{};
pi.mobile.ui = pi.mobile.ui||{};
// Store the original
pi.mobile.ui.Scroller = kendo.mobile.ui.Scroller;
// Extend and replace the original
kendo.mobile.ui.Scroller = pi.mobile.ui.Scroller.extend({
    _initPullToRefresh: function() {
		// WARNING: If you call this multiple times, it doesn't reuse the refreshHint element.
		if (this.refreshHint)
			this.refreshHint.remove();
		pi.mobile.ui.Scroller.fn._initPullToRefresh.apply(this,arguments);
		if (this.options.pullOffset < 0) {
			this.scrollElement.append(this.refreshHint.detach());
			this.refreshHint.css({
				top: "auto",
				bottom: "0.25em"
			});
		}
	},
	_paneChange: function() {
		var that = this;
		pi.mobile.ui.Scroller.fn._paneChange.apply(that,arguments);
		var OUT_OF_BOUNDS_FRICTION = 0.5;
		if (that.options.pullOffset < 0) {
			if ( that.movable.y / OUT_OF_BOUNDS_FRICTION < that.options.pullOffset ) {
				if (!that.pulled)
					that.pulled = true;
			} else if (that.pulled) {
				that.pulled = false;
			}
		}
	}
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.mobile.ui.roles.scroller = kendo.mobile.ui.Scroller;
kendo.mobile.ui.plugin(kendo.mobile.ui.Scroller);