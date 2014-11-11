// Setup namespaces
pi = pi||{};
pi.mobile = pi.mobile||{};
pi.mobile.ui = pi.mobile.ui||{};
// Store the original
pi.mobile.ui.ModalView = kendo.mobile.ui.ModalView;
// Extend and replace the original
kendo.mobile.ui.ModalView = pi.mobile.ui.ModalView.extend({
	init : function(element,options) {
		pi.mobile.ui.ModalView.fn.init.apply(this,arguments);
		/* 
			WARNING: Setting options is done by $.extend(this.options,options)!  Even initially!
			This means that the options object is never replaced, so we must make this a Pi object
			at creation time!  But, this also means that any updates to the options will not 
			replace our Pi Observable.
		*/
		this.options = pi.observable(this.options);
		kendo.bind(this.element,this.options);
		// Setup buttons to close modal
		var modal = this;
		this.element.find('[type=submit],[type=reset]').each(function(index,element){
			$(this).data("kendoMobileButton").bind("click",function(e){
				e.preventDefault();
				modal.close();
			});
		});
	}
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.mobile.ui.roles.modalview = kendo.mobile.ui.ModalView;