/* 
pi.ui.Widget
pi.mobile.ui.Widget
Copyright 2014 MillionMunkeys, LLC
http://www.millionmunkeys.net/
*/
// Setup namespaces
pi = (typeof(pi) != "undefined") ? pi : {};
pi.ui = pi.ui||{};
pi.mobile = pi.mobile||{};
pi.mobile.ui = pi.mobile.ui||{};
pi.ui.Widget = {
	init : function(element,options) {
		/* This is an example of when to call widget functions. */
		pi.ui.Widget.attributeOptions.apply(this,arguments);
		pi.ui.Widget.fn.init.apply(this,arguments);
		/* 
			WARNING: Setting options is done by $.extend(this.options,options)!  Even initially!
			This means that the options object is never replaced, so we must make this a Pi object
			at creation time!  On the plus side, this also means that any updates to the options 
			will not replace our Pi Observable.
			CAUTION: Some option items throw errors inside observables, so you must do the next
			line on a case-by-case basis.
		*/
    	// this.options = pi.observable(this.options);  // CAUTION: Throws too many errors to be universal!
	},
	attributeOptions : function(element,options) {
		options = options || {};
		element = $(element);
        if (element[0].attributes) {
            $.extend(options, pi.ui.Widget.attributeTemplate.call(this, element.attr('data')) );
            for (var i=0, option; i<element[0].attributes.length; i++) {
                option = element[0].attributes[i].name;
                if (option.substr(0,5) == "data-") {
					switch (option) {
						case "data-source":
						case "data-text-field":
						case "data-value-field":
							break;
						default:
							option = option.substr(5);
							break;
					}
					option = option.split("-");
					for (var w=1; w<option.length; w++)
						option[w]=option[w].charAt(0).toUpperCase()+option[w].substr(1);
					option = option.join("");
				} else {
					switch (option) {
						case "id":
						case "placeholder":
						case "height":
						case "width":
						case "multiple":
							break;
						default:
							continue;
					}
				}
                options[option] = pi.ui.Widget.attributeTemplate.call(this, options[option] || element[0].attributes[i].value);
            }
        }
		return options;
	},
	attributeTemplateRegEx : /#=?([^#]*)#/,
    attributeTemplate : function(value) {
		var match, result, parent=window;
		if (typeof(value) == "string") {
			RegExp.lastIndex=0;
			while(match = value.match(pi.ui.Widget.attributeTemplateRegEx)) {
				// kendo templates allow for equations in templates, so we have to use eval.
				try { 
					result = eval(match[1]);
				} catch(e) {
					result = null;
				}
				if (typeof(result) != "object" && typeof(result) != "function")
					value = value.replace(pi.ui.Widget.attributeTemplateRegEx, result);
				else
					return result;
			}
		}
		if (value === "false")
			value = false;
		else if (value === "true")
			value = true;
		return value;
    }
};

/* WARNING: It is impossible to get access to the Widget object that all other objects inherit from.
	So you much also override any other child object that you wish to use the Widget functions. */
	
// Store the original
pi.mobile.ui.View = kendo.mobile.ui.View;
// Extend and replace the original
kendo.mobile.ui.View = pi.mobile.ui.View.extend({
    init : function(element,options) {
		pi.ui.Widget.attributeOptions.apply(this,arguments);
		pi.mobile.ui.View.fn.init.apply(this,arguments);
    	// this.options = pi.observable(this.options);  // CAUTION: Throws too many errors to be universal!
	}
});
kendo.mobile.ui.roles.view = kendo.mobile.ui.View;

// Store the original
pi.mobile.ui.Drawer = kendo.mobile.ui.Drawer;
// Extend and replace the original
kendo.mobile.ui.Drawer = pi.mobile.ui.Drawer.extend({
    init : function(element,options) {
		if (options.transition) {
			var transition = options.transition.split(":");
			if (transition[0] === "overlay") {
				if (transition.length > 1 && transition[1].replace(/^\s*(.*)\s*$/, "$1") === "blur")
					this._moveViewTo = this._overlayBlurView;
				else
					this._moveViewTo = $.noop;
			}
		}
		pi.mobile.ui.Drawer.fn.init.apply(this,arguments);
	},
	_overlayBlurView : function(blur) {
		if (blur) {
			this.element.css({background: "rgba(255,255,255,0.5)"});
			this.currentView.element.css({
				"filter": "blur(4px)",
				"-o-filter": "blur(4px)",
				"-ms-filter": "blur(4px)",
				"-moz-filter": "blur(4px)",
				"-webkit-filter": "blur(2px)",
			});
		} else {
			this.element.css({background: "transparent"});
			this.currentView.element.css({
				"filter": "none",
				"-o-filter": "none",
				"-ms-filter": "none",
				"-moz-filter": "none",
				"-webkit-filter": "none",
			});
		}
	}
});
kendo.mobile.ui.roles.drawer = kendo.mobile.ui.Drawer;

/* Grid is handled in Grid.js
// Store the original
pi.ui.Grid = kendo.ui.Grid;
// Extend and replace the original
kendo.ui.Grid = pi.ui.Grid.extend({
    init : function(e) {
		pi.ui.Widget.attributeOptions.apply(this,arguments);
		pi.ui.Grid.fn.init.apply(this,arguments);
    	this.options = pi.observable(this.options);
	}
});
kendo.ui.roles.grid = kendo.ui.Grid;
*/

$(function(){
    $('[placeholder^=#][placeholder$=#]').each(function(index,element){
	    $(element).attr("placeholder", pi.ui.Widget.attributeTemplate.call(element,$(element).attr("placeholder")));
    });
    $('[data-title^=#][data-title$=#]').each(function(index,element){
	    $(element).attr("data-title", pi.ui.Widget.attributeTemplate.call(element,$(element).attr("data-title")));
    });
    $('[data-required-msg^=#][data-required-msg$=#]').each(function(index,element){
	    $(element).attr("data-required-msg", pi.ui.Widget.attributeTemplate.call(element,$(element).attr("data-required-msg")));
    });
    $('[data-email-msg^=#][data-email-msg$=#]').each(function(index,element){
	    $(element).attr("data-email-msg", pi.ui.Widget.attributeTemplate.call(element,$(element).attr("data-email-msg")));
    });
    $('[data-pattern-msg^=#][data-pattern-msg$=#]').each(function(index,element){
	    $(element).attr("data-pattern-msg", pi.ui.Widget.attributeTemplate.call(element,$(element).attr("data-pattern-msg")));
    });
})