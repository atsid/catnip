/*
pi.data.ObservableObject
pi.data.ObservableArray
Copyright 2014 MillionMunkeys, LLC
http://www.millionmunkeys.net/

This library augments the Kendo ObservableObject and ObservableArray so that they conform to the Property Invocation (Pi) programming standard.

CAUTION: Kendo does not track handlers per property, but instead only uses global handlers, so we will do the same.
*/

window.pi = (typeof(pi) != "undefined") ? window.pi : {};
window.pi.data = typeof(window.pi.data) != "undefined" ? window.pi.data : {};

window.pi.data.ObservableObject = kendo.data.ObservableObject.extend({
	exists : function(property) {
		return (typeof(this[property]) != "undefined");
	},
	get : function(property,defaultValue) {
		// WARNING: Webkit considers the empty string as false when evaluated as a boolean!
		var result = kendo.data.ObservableObject.fn.get.apply(this,arguments);
		if (result != undefined)
			return result;
		else
			return defaultValue;
	},
	set : function(property,value) {
		if (typeof(property) == "object") {
			if (property.toJSON)
				property = property.toJSON();
			if (property.constructor == Object) {
				// optional second parameter decides whether to override existing values, or only set if it doesn't exist.
				var config = property, override = (typeof(value) == "boolean")?value:true;
				for (property in config)
					if (override || !this.exists(property))
						this.set(property,config[property]); // Nested call for Single Point of Maintenance
			}
			return this; // Allow chaining
		} else {
			kendo.data.ObservableObject.fn.set.apply(this,arguments);
			// Use this.get() in case we're passed a compound property name.
			return this.get(property); // Allow value chaining
		}
	},
	remove : function(property) {
		var path = property.split(".");
		var property = path.pop();
		var object = this.get(path.join("."));
		if (object) {
			this.set(property,null);
			delete object[property];
		}
		return this; // Allow chaining
	},
	removeAll : function() {
		this.forEach(function(value,field) {
			this.remove(field);
		});
		return this; // Allow chaining
	},
	/*
	bind - In Property Invocation (Pi) Programming we fire the event upon bind by default.
	
	This saves us from having to call it manually, standardizes the call, and is done because the core nature of property-invocation is that we care about the property, even it's initial value.
	*/
	bind : function(eventName, handlers, one, apply) {
		var handler,
			that = this,
			eventNames = (typeof eventName === "string") ? [eventName] : eventName,
			handlersIsFunction = (typeof handlers === "function");
		if (this instanceof kendo.data.ObservableObject)
			kendo.data.ObservableObject.fn.bind.apply(this,arguments);
		if (this instanceof kendo.data.ObservableArray)
			kendo.data.ObservableArray.fn.bind.apply(this,arguments);
		// Fire the handler right away, unless we get passed a false
		if (typeof(apply) == "undefined") {
			if (one)
				apply = false;
			else
				apply = true;
		}
		if (apply) // default is true
			for (var i=0; i<eventNames.length; i++) {
				handler = handlersIsFunction ? handlers : handlers[eventNames[i]];
				// WARNING: If kendo library is updated, make sure that the error object configuration is the same!!
				switch (eventNames[i]) {
					case "set":
						that.forEach(function(value,field) {
							handler.apply(that,[{
								field : field,
								value : value,
								sender : that,
								"_defaultPrevented" : false,
								preventDefault : function(){},
								isDefaultPrevented : false
							}]);
						});
						break;
					case "change":
						that.forEach(function(value,field) {
							handler.apply(that, [{
								field : field,
								sender : that,
								"_defaultPrevented" : false,
								preventDefault : function(){},
								isDefaultPrevented : false
							}]);
						});
						break;
				}
			}
		return this; // allow chaining
	}
});

window.pi.data.ObservableArray = kendo.data.ObservableArray.extend({
	removeAll : function() {
		while (this.length)
			this.shift(); // CAUTION: This will fire "remove" handlers for each item, from first to last
		return this; // Allow chaining
	},
	bind : pi.data.ObservableObject.prototype.bind
});

window.pi.observable = function(object) {
	object = object || {};
	// First get standard Kendo object.
	if (object.constructor == Array)
		return new pi.data.ObservableArray(object);
	else if (!(object instanceof pi.data.ObservableObject) && !(object instanceof pi.data.ObservableArray))
		return new pi.data.ObservableObject(object);
}
