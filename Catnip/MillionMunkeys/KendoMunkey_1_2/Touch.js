// Setup namespaces
pi = pi||{};
pi.ui = pi.ui||{};
// Store the original
pi.ui.Touch = kendo.ui.Touch;
// Extend and replace the original
kendo.ui.Touch = pi.ui.Touch.extend({
	init : function(element,options) {
		var that = this;
		pi.ui.Touch.fn.init.apply(this,arguments);
		if (options.enableSwipe) {
			that.events.bind("start", $.proxy(that, "_vswipestart"));
			that.events.bind("move", $.proxy(that, "_vswipemove"));
		}
	},
	_vswipestart: function(e) {
		if (Math.abs(e.y.velocity) * 2 >= Math.abs(e.x.velocity)) {
			e.sender.capture();
		}
	},

	_vswipemove: function(e) {
		var that = this,
			options = that.options,
			touch = e.touch,
			duration = e.event.timeStamp - touch.startTime,
			direction = touch.y.initialDelta > 0 ? "down" : "up";

		if (
			Math.abs(touch.y.initialDelta) >= options.minXDelta &&
			Math.abs(touch.x.initialDelta) < options.maxYDelta &&
			duration < options.maxDuration
			)
		{
			that.trigger("swipe", {
				direction: direction,
				touch: e.touch
			});

			touch.cancel();
		}
	}
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.ui.roles.touch = kendo.ui.Touch;
kendo.ui.plugin(kendo.ui.Touch);