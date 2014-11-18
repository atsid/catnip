pi = pi || {};
pi.ui = pi.ui || {};
pi.ui.Validator = kendo.ui.Validator;
kendo.ui.Validator = pi.ui.Validator.extend({
	init : function(element,options) {
		$(element).removeAttr('data-role'); // Having a data-role attribute screws up binding to the selected record.
		options = options || {};
		pi.ui.Widget.attributeOptions.call(this,element,options);
		pi.ui.Validator.fn.init.call(this,element,options);
		options = this.options;
		if (this.options.autoBind != "false") {
			this.bindValues(this.element,this.options);
			this.configureSelected(this.element,this.options);
			this.options = options; // WARNING: Binding selected record to this same element overwrites options with original attribute values.
		}
		return this;
	},
	setOptions : function(options) {
		pi.ui.Widget.attributeOptions.call(this,this.element,options);
		pi.ui.Validator.fn.setOptions.apply(this,arguments);
	},
	bindValues : function(element,options) {
		if (!this.options.dataSource) return;
		// Auto-setup data-binding
		$(element).find(':input[name],:input[data-name],div[data-name],span[data-name]').each(function(index,element){
			var element = $(element);
			if (!element.attr('data-bind')) {
				var name = (element.attr('data-name') || element.attr('name')),
					type = (element.attr('data-type') || element.attr('type') || element.prop('tagName'));
				switch (type.toLowerCase()) {
					case "radio":
					case "checkbox":
					case "switch":
						element.attr('data-bind',"checked:"+name);
						break;
					case "textarea":
					case "editor":
						element.attr('data-bind',"text:"+name);
						break;
					case "buttongroup":
						element.attr('data-bind',"index:"+name);
						break;
					case "tabstrip":
						element.attr('data-bind',"selectedIndex:"+name);
						break;
					case "select":
					default:
						element.attr('data-bind',"value:"+name);
						break;
				}
			}
		});
	},
	configureSelected : function(element,options) {
		if (!this.options.dataSource) return;
		// Handle the selecting and binding to a single record in the datasource.
		var $this = $(element), that=this;
		this.options.dataSource.options.bind("change", function(e) {
			switch (e.field) {
				case "selected":
					e.value = this.get(e.field);
					/* I don't want to fail silently.  If this isn't a Model, we have a problem.
					if (e.value instanceof kendo.data.Model) {
					} */
					// CAUTION: There are problems when binding with the form itself, so bind with the children.
					if (kendo.mobile)
						kendo.bind($this.children(), e.value, kendo.mobile.ui, kendo.ui);
					else
						kendo.bind($this.children(), e.value, kendo.ui);
					that.hideMessages(); // required for firefox
					break;
			}
		});
	},
	validateInput : function(input) {
		var result = pi.ui.Validator.fn.validateInput.apply(this,arguments);
		if (kendo.support.mobileOS && kendo.support.mobileOS.android && kendo.support.mobileOS.flatVersion < 400)
			this.hideMessages();
		return result;
	}
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.ui.roles.validator = kendo.ui.Validator;

$(function() {
	$("form[data-storage],form[data-source]").each(function(index,element) {
		var $this = $(this);
		// Instantiate a validator for every form.
		// WARNING: Force creation of validator, so we can use the kendo's internal parseOption functions.
		// We can't use our own attributeOptions function because if the data-role attribute exists on the form
		// tag, initWidget fails if dataSource contains pound signs!
		if (!$this.attr('data-role'))
			$this.attr('data-role','validator');
		/*
		$this.data("kendoValidator", new kendo.ui.Validator(element));
		*/
		
        if ($this.attr("data-auto-submit") != "false") {
			$this.bind("submit",function(e) {
				var validator = $this.data("kendoValidator");
				// If datasource, sync changes.
				if (validator && validator.validate() && validator.options.dataSource)
                    if (validator.options.dataSource.hasChanges()) {
                        /*
                        if ($this.attr("data-loader") != "false") {
	                        app.pane.loader.show();
                            validator.options.dataSource.one("change", function(){
                                app.pane.loader.hide();
                            });
                        }
                        */
						validator.options.dataSource.sync();
                    }
			});
            // Handle the enter key when inside a form field
            $this.bind("keyup",function(e) {
                // NOTE: I've never liked that forms submit by executing a click on the first button. 
                // If you want to do something onSubmit, add a submit handler. This will trigger that, 
                // as will a button click on a submit button.
                // CAUTION: Allow uninterrupted return key in textareas.
                if (e.keyCode == 13 && $(e.target).prop('tagName').toUpperCase() != "TEXTAREA")
                    $this.trigger("submit");
            });
        }
		
        // Handle desktop ESC key
		$this.bind("keyup",function(e) {
			if (e.keyCode == 27 && e.target)
				$(e.target).blur();
		});
	});
});
