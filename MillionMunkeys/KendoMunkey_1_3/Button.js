// Setup namespaces
pi = pi||{};
pi.mobile = pi.mobile||{};
pi.mobile.ui = pi.mobile.ui||{};
// Store the original
pi.mobile.ui.Button = kendo.mobile.ui.Button;
// Extend and replace the original
kendo.mobile.ui.Button = pi.mobile.ui.Button.extend({
	init : function(element, options) {
		pi.mobile.ui.Button.fn.init.apply(this,arguments);
		if (kendo.support.mobileOS && kendo.support.mobileOS.android && kendo.support.mobileOS.flatVersion < 400)
			this.element.kendoTouch({tap:this.touchClick});
	},
	touchClick : function(e) {
		if (e.event && e.event.target) {
			console.log("Transfering touch event to click handler.");
			$(e.event.target).trigger("click");
		}
	}
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.mobile.ui.roles.button = kendo.mobile.ui.Button;