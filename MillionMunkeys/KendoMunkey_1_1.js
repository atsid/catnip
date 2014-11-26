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

/* WARNING: A collection of messages is a potential memory hog!  Never retain console messages, and also never retain 
   references to error objects, preventing garbage collection.  Also, using console.log to log object details is a 
   known memory leak, since logged objects cannot be garbage collected. */
pi = (typeof(pi) != "undefined") ? pi : {};
pi.console = pi.observable([]);
pi.log = function(message, type, category) {
    try {
        if (typeof(message) != "object")
            message = { 
                message: message, 
                category : category,
                type: type 
            }
		else if (message.toJSON) // Simplify observable objects
			message = message.toJSON();
        if (message.type == undefined)
            message.type = type || "";
        if (message.category == undefined)
            message.category = category || "";
        if (message.modal && modal.alert)
            modal.alert(message.title||message.event||message.category||"",message.message,(message.type=="error")?"sad":"happy");
        // Concatenate all details for console.log
        switch (message.type.toLowerCase()) {
            case "error":
            case "e":
                message.message="[ERROR] "+message.message;
                break;
            case "info":
            case "i":
                message.message="[INFO] "+message.message;
                break;
            case "warning":
            case "w":
                message.message="[WARNING] "+message.message;
                break;
            case "debug":
            case "d":
                message.message="[DEBUG] "+message.message;
                break;
        }
        if (message.category.length)
            message.message = message.category.toUpperCase() + ": " + message.message;
        
		if (pi.console)
	        pi.console.push(message);
        else if (typeof(window.console) != "undefined") // For IE 8 and below!
	        window.console.log(message.message);
		
    } catch(e) {
		if (pi.console)
	        pi.console.push(e);
        else if (typeof(window.console) != "undefined")
            window.console.log(e.message);
    }
}
pi.console.bind("change", function(e) {
	switch (e.action) {
		case "add":
			for (var i=0, message; i<e.items.length; i++) {
				try {
					if (typeof(e.items[i]) != "object") {
						this.splice(e.index+i,1,{ message: e.items[i].toString() });
						continue;
					} else if (e.items[i] instanceof Error) {
						// CAUTION: JSON.stringify can't convert and error object, so we must build our own!
						this.splice(e.index+i,1,{
							type : "Error",
							name : e.items[i].name || "",
							event : e.items[i].event || "",
							message : e.items[i].message || "",
							description : e.items[i].description || "",
							keys : Object.keys ? Object.keys(e.items[i]) : "",
							stack : e.items[i].stack || ""
						});
					// CAUTION: If you change an observable to plain object, the ObservableArray just makes it an observable again!
					/*
                    } else if(e.items[i].toJSON) {
                        this.splice(e.index+i,1,e.items[i].toJSON());
					*/
					} else {
						e.items[i].type = (e.items[i].type != undefined)?e.items[i].type:"";
						switch (e.items[i].type.toLowerCase()) {
							case "error":
							case "e":
								e.items[i].type = "Error";
								console.log( JSON.stringify(e.items[i]) );
								break;
							case "debug":
							case "d":
								e.items[i].type = "Debug";
								console.log( JSON.stringify(e.items[i]) );
								break;
							case "warning":
							case "w":
								e.items[i].type = "Warning";
								console.log( e.items[i].message );
								break;
							case "info":
							case "i":
							default:
								e.items[i].type = "Info";
								console.log( e.items[i].message );
								break;
						}
					}
				} catch(e) {
                    console.log( ({
                        message : e.message,
                        stack : typeof(e.stack) != "undefined" ? e.stack.toString() : ""
                    }).toString() );
				}
			}
			break;
	}
});

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
					option = option.substr(5).split("-");
					for (var w=1; w<option.length; w++)
						option[w]=option[w].charAt(0).toUpperCase()+option[w].substr(1);
					option = option.join("");
					if (option == "source")
						option = "dataSource";
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
});

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

/* 
pi.data.DataSource
Copyright 2014 MillionMunkeys, LLC
http://www.millionmunkeys.net/

WARNING: We're not overriding DataSource, because Kendo adds other stuff to the prototype
after definition using local functions, and will probably do more in the future, which
makes this a moving target, and not a good option for creating our own child class.
// pi.data.DataSource = kendo.data.DataSource;
// kendo.data.DataSource = pi.data.DataSource.extend({});
*/
pi = pi || {};
pi.data = pi.data || {};
pi.data.DataSource = {
	create : function(options) {
		var result;
		options = options || {};
		if (typeof(options) === "string")
			options = {source:options};
		else if (options.constructor === Array)
			options = {data:options};
		pi.data.DataSource.configureTransport(options);
		pi.data.DataSource.configureDebug(options);
		pi.data.DataSource.everliveAuthentication(options);
		pi.data.DataSource.configurePaging(options);
		pi.data.DataSource.configureSchema(options);
		pi.data.DataSource.configureModel(options);
		// Call initial function
		result = new kendo.data.DataSource(options);
		// CAUTION: Kendo uses the apply function to add options to an internal object.
		// So we can only do this after instantiation when this internal object is finally made available to us.
		result.options = pi.observable(result.options);
		// CAUTION: Built-in Everlive functions require a reference to the dataSource.
		if (result.transport)
			result.transport.dataSource = result;
		// Setup localStorage details
		pi.data.DataSource.configureSelected.apply(result);
		pi.data.DataSource.configureStorage.apply(result);
		pi.data.DataSource.configureDefault.apply(result);
		pi.data.DataSource.everliveSetup.apply(result);
		// Lastly, if data is present, fire the JIT filter so selected has a value.
		result.options.get("selected");
		return result;
	},
	configureTransport : function(options) {
		// WARNING: 'options' is passed by reference, so we must use the original object, and we can't guarantee it will be an observable.
		if (options.source == undefined && options.storage)
			options.source = options.storage;
		if (typeof(options.source) == "string") {
			if (options.source == "false") return;
			// CAUTION: The following is a safe way to prevent errors, but it also means
			// that if you forget an id, your data will overwrite each other.
			if (!options.id)
				options.id = options.source;
			// Case 1: REST URL
			if (/:\/\//.test(options.source)) {
				options.transport = options.transport || {};
				// If not present, assume all REST operations.
				options.method = (options.method || "get,put,post,delete").split(",");
				for (var i=0; i<options.method.length; i++)
					switch (options.method[i].toLowerCase()) {
						case "read":
						case "get":
							options.transport.read = { 
								url : options.source,
								type : "GET"
							}
							break;
						case "create":
						case "put":
							options.transport.create = {
								url : options.source,
								type : "PUT"
							}
							break;
						case "update":
						case "post":
							options.transport.update = {
								url : options.source,
								type : "POST"
							}
							break;
						case "destroy":
						case "delete":
							options.transport.destroy = {
								url : options.source,
								type : "DELETE"
							}
					}
			}
			// Case 2: Everlive DataSource
			else if ( /^everlive\.(.+)/.test( options.source.toLowerCase() ) ) {
				options.source = options.source.split('.');
				options.type = "everlive";
				options.batch = false; // WARNING: batch MUST be false for Everlive to work!
				options.transport = options.transport || {};
				options.transport.typeName = options.source[1];
				options.source = options.source.join('.');
				// NOTE: We don't need to kepp a reference to the Everlive config object, since it's already stored in Everlive.$.
			}
		}
	},
	beforeSend: function (xhr) {
		xhr.setRequestHeader("X-Everlive-Debug", true);
	},
	configureDebug : function(options) {
		if (options.debug && options.transport) {
			var methods = (options.method || "get,put,post,delete").split(",");
			methods.forEach(function(method,index) {
				switch (method) {
					case "get":
					case "read":
						method = "read";
						break;
					case "put":
					case "update":
						method = "update";
						break;
					case "post":
					case "create":
						method = "create";
						break;
					case "delete":
					case "destroy":
						method = "destroy";
						break;
				}
				if (!options.transport[method])
					options.transport[method] = {};
				options.transport[method].beforeSend = pi.data.DataSource.beforeSend;
			});
		}
	},
	everliveSetup : function() {
		if (this.options.source !== "Everlive.Users")
			return;
		$.extend(Everlive.$.setup, {
			token : this.options.get("selected.access_token",null),
			tokenType : this.options.get("selected.token_type",null)
		});
	},
	everliveAuthentication : function(options) {
		if (options.source !== "Everlive.Users")
			return;
		options.transport = {
			success : function(data) {
				var selected = this.dataSource.options.get("selected");
				if (data.result) {
					for (var field in data.result)
						selected.set(field, data.result[field]);
					if (data.result.principal_id)
						selected.set("id", data.result.principal_id);
					else if (data.result.Id)
						selected.set("id", data.result.Id);
					// selected.set("Password", "");
				} else {
					(pi||console).log(new Error({
						name : "Everlive Login Failure",
						message : "Everlive returned successfully, but there was no result property!"
					}));
				}
			},
			read : function() {
				var that = this, selected = this.dataSource.options.get("selected");
				Everlive.$.Users.login( 
					selected.get("Username"),
					selected.get("Password"))
					.then(
						function (data) {
							that.success(data);
							Everlive.$.Users.getById(data.result.principal_id)
							.then(
								function(data) {
									that.success(data);
								}, function (error) {
									alert(JSON.stringify(error));
								}
							);
						},
						function (error) {
							error.type = error.type || "Everlive Login Failure";
							error.message = error.message || "Invalid username/password combination";
							(pi||console).log(error);
						}
					);
			},
			create : function() {
				var that = this, selected = this.dataSource.options.get("selected");
				if (!selected.get("Username").length || !selected.get("Password").length)
					return; // Blank record
				Everlive.$.Users.register(
					selected.get("Username"),
					selected.get("Password"),
					selected.toJSON(),
					function (data) {
						Everlive.$.Users.login(
							selected.get("Username"),
							selected.get("Password"),
							function (data) {
								that.success(data);
								Everlive.$.Users.getById(data.result.principal_id).then(that.success, function (error) {
									alert(JSON.stringify(error));
								});
							},
							function (error) {
								error.type = error.type || "Everlive Login Failure";
								(pi||console).log(error);
							}
						)
					},
					function (error) {
						error.type = error.type || "Everlive Account Creation Failure";
						(pi||console).log(error);
					}
				);
			},
			update : function() {
				var selected = this.dataSource.options.get("selected");
				if (selected.get("NewPassword") !== selected.get("Password")) {
					Everlive.$.Users.changePassword(
						selected.get("Username"),
						selected.get("Password"),
						selected.get("NewPassword"),
						true,
						function (data) {
							// WARNING: We clear the passwords, and prompt the user on the next update action, so that password are not visible in the browser javascript inspector!!
							selected.set("Password","");
							delete selected.NewPassword;
						},
						function (error) {
							error.type = error.type || "Everlive Account Update Failure";
							(pi||console).log(error);
						}
					);
				}
			},
			destroy : function() {
				var dataSource = this.dataSource;
				Everlive.$.Users.logout(
					function (data) {
						// do nothing
						dataSource.reset();
					},
					function (error) {
						// Clean everlive manually
						Everlive.$.setup.token = null;
						Everlive.$.setup.tokenType = null;
						dataSource.reset();
					}
				);
			}
		};
	},
	configurePaging : function(options) {
		if (options.pageSize != undefined && options.page == undefined)
			options.page = 1;
	},
	configureSchema : function(options) {
		if (typeof(options.schema) == "string")
			switch (options.schema) {
				case "coldfusion":
				case "cfquery":
					options.schema = {
						// format: "cfquery",
						data: "data",
						total: "total",
						error: function(response) {
							alert(response.message);
							return response.message;
						},
						parse: function(response) {
							var result = { data: [] };
							if (options.primarykeys != undefined)
								result.primarykey = options.primarykeys;
							if (response.COLUMNS[response.COLUMNS.length-1] == "RECORDCOUNT")
								result.total = response.DATA[0][response.COLUMNS.length-1];
							for (var i=0; i<response.DATA.length; i++) {
								result.data[i] = {};
								for (var c=0; c<response.COLUMNS.length; c++) {
									var data = response.DATA[i][c];
									if (typeof(data) == "undefined" || data == null)
										data = "";
									else if (typeof(data) == "string" && data.substr(0,3) == "{ts")
										data = new Date( Date.parse( data.substr(5,data.length-7) ) );
									else if (data == "true")
										data = true;
									else if (data == "false")
										data = false;
									result.data[i][response.COLUMNS[c].toLowerCase()] = data;
								}
							}
							return result;
						}
					}
					break;
				default:
					options.schema = {}; // CAUTION: Let the defaults reign! e.g. Everlive sets a unique "data" value.
					break;
			}
		if (options.type == "everlive") {
			options.schema = options.schema || {};
			// There's a bug in Everlive datastores, that they don't copy data over to the lowercase "id" property.
			options.schema.data = function(response) {
				var data = response.Result;
				if (data instanceof Array)
					for (var i=0; i<data.length; i++) {
						data[i].id = data[i].Id;
						// CAUTION: This is done in two parts, here for setting uids, and in setGuid for setting guids.
						if (typeof(data[i].guid) != "undefined")
							data[i].uid = data[i].guid;
					}
				return data;
			}
		}
	},
	configureModel : function(options) {
		if (!options.template) {
			if (options.schema && !options.schema.model)
				// WARNING: If there's no model, sync() doesn't work, as well as a lot of other things.
				(pi||console).log("CAUTION: A DataSource without a model cannot run the sync() function, plus a lot of other things won't work either! You should supply either a 'template' option to auto-create the model, or a schema.model value.","i");
			return;
		}
		var template = $(options.template), defaultEditable = (options.editable) ? options.editable : "true";
		if (!options.schema)
			options.schema = {};
		options.schema.model = options.schema.model || {};
		options.schema.model.id = options.schema.model.id || [];
		options.schema.model.fields = options.schema.model.fields || {};
		// CAUTION: For dropdown datasources that require fields as an array.
		options.fields = options.fields || [];
		if (options.type == "everlive") {
			options.schema.model.id = Everlive.idField;
			options.schema.model.fields[Everlive.idField] = { type:"string" };
			options.fields.push({
				field : Everlive.idField,
				type : "string"
			});
		} else {
			template.find(':input[data-name][data-id],:input[data-name][data-key=primary],:input[data-name][data-key=autonumber]').each(function() { 
				options.schema.model.id.push($(this).attr('data-name')) 
			});
			if (options.schema.model.id.length)
				options.schema.model.id = options.schema.model.id.join(",");
			else
				delete options.schema.model.id;
		}
		template.find(':input[name],:input[data-name]').each(function(index){
			var $field = $(this);
			var details = pi.ui.Widget.attributeOptions(this,{});
			delete details.bind;
			delete details.set;
			delete details.get;
			delete details.unbind;
			// type
			switch ($field.prop('tagName').toLowerCase()) {
				case "select":
					details.role = details.role || "select";
					if (details.role.toLowerCase() == "multiselect" || !!$field.attr('multiple')) {
						details.multiple = true;
						delete details.type; // Type must NOT exist to pass multiple values
					} else {
						details.multiple = false;
						// Don't force a type
					}
					delete details.role;
					break;
				case "textarea":
				case "input":
					if (details.type == null)
						switch ($field.attr('data-type') || $field.attr('type')) {
							case "date":
							case "datetime":
							case "datetime-local":
							case "time":
								details.type = "date";
								break;
							case "number":
							case "month":
								details.type = "number";
								break;
							default:
								details.type = "string";
								break;
						}
						break;
			}
			// default
			details.defaultValue = $field.attr('value');
			if (typeof(details.defaultValue) == "undefined")
				delete details.defaultValue;
			// editable
			if (details.editable == "false" || details.editable == false)
				details.editable = false;
			else
				details.editable = true;
			details.field = $field.attr('data-name') || $field.attr('name');
			// add to fields
			if (!options.schema.model.fields[details.field])
				options.fields.push(details);
			// add to model
			options.schema.model.fields[details.field] = details;
		});
		delete options.template;
	},
	setGUID : function(e) {
		// NOTE: The purpose of this function is to maintain a consistent UID across the life of a record.
		// Currently Kendo changes the UID value after everything!
		if (e && e.items) {
			for (var i=0; i<e.items.length; i++)
				if (typeof(e.items[i].guid) == "undefined")
					e.items[i].set("guid", e.items[i].uid); // Use set() so it is marked as dirty.
				else if (e.items[i].uid != e.items[i].guid)
					e.items[i].uid = e.items[i].guid;
		}
	},
	storeData : function(e) {
		for (var i=0, data=this.data(), result=[]; i<data.length; i++) {
			result.push(data[i].toJSON());
			result[i].dirty = data[i].dirty;
		}
		this.options.storage.setItem(this.options.id, JSON.stringify(result));
		this.options.storage.setItem(this.options.id+"_destroyed", JSON.stringify(this._destroyed));
	},
	configureStorage : function() {
		switch (this.options.source) {
			case "local":
			case "localStorage":
				this.options.storage = "localStorage";
				break;
			case "session":
			case "sessionStorage":
				this.options.storage = "sessionStorage";
				break;
		}
		switch (this.options.storage || "") {
			case "local":
			case "localStorage":
				this.options.storage = "localStorage";
				break;
			case "session":
			case "sessionStorage":
				this.options.storage = "sessionStorage";
				break;
			default:
				return;
		}
		this.options.type = this.options.type || this.options.storage;
		this.options.storage = window[this.options.storage];
		this.bind("change", function(e){
			pi.data.DataSource.setGUID.apply(this,arguments);
		});
		// Retrieve existing data if present
		var data = this.options.storage.getItem(this.options.id);
		// WARNING: Android 2.x throws an error if you pass a null value to JSON.parse!  New versions do not.
		if (!this.data().length && data)
			this.reset(JSON.parse(data));
		/* Will be handled when we trigger("change") below.
		for (var i=0, data=this.data(); i<data.length; i++)
			data[i].uid = data[i].guid || data[i].uid;
		*/
		var destroyed = this.options.storage.getItem(this.options.id+"_destroyed");
		if (destroyed) {
			this._destroyed = new kendo.data.ObservableArray(JSON.parse(destroyed));
		}
		// Don't execute this right now; execute it after a later change.
		this.bind("change", function(e) {
			pi.data.DataSource.storeData.apply(this,arguments)
		});
	},
	configureSelected : function() {
		// Handle the selection of a single record in the datasource.
		if (!this.options.selected)
			this.options.selected = "first";
		switch (this.options.selected) {
			case "first":
			case "last":
				this.options.defaultSelected = this.options.selected;
				break;
			default:
				this.options.defaultSelected = "first";
				break;
		}
		var that = this;
		this.bind("requestEnd",function(e) {
			that.one("change", function(e) {
				// New records, set the selected record again.
				if (this.options.selected instanceof kendo.data.ObservableObject) {
					// WARNING: Don't use set("selected") or we get an infinite loop!
					if (this.options.selected.uid)
						this.options.set("selected", this.getByUid(this.options.selected.uid));
				}
			});
		});
		this.bind("change",function(e) {
			if (e.action == "remove" && this.options.selected instanceof kendo.data.ObservableObject) {
				if (this.options.selected.uid && !this.getByUid(this.options.selected.uid))
					// Selected record was removed
					this.options.set("selected", this.options.get("defaultSelected","first"));
			}
		});
		// CAUTION: Don't execute right away, because there won't be any data yet, so we'll do this as a filter.
		this.options.bind("get", function(e) {
			e.value = this[e.field];
			if (e.field === "selected" && !(e.value instanceof kendo.data.ObservableObject)) {
				if (typeof(e.value) == "undefined")
					e.value = this.defaultSelected; // If it doesn't exist, that's okay.
				if (typeof(e.value) == "undefined") // still
					e.value = "first";
				if (that.view().length) {
					if (e.value == "first")
						e.value = 0;
					else if (e.value == "last")
						e.value = that.view().length-1;
					// CAUTION: Beware infinite loops!
					if (typeof(e.value) == "number")
						this.set("selected", that.view()[e.value]);
					else if (typeof(e.value) == "string")
						this.set("selected", that.get(e.value));
				}
			}
		});
	},
	configureDefault : function() {
		if (!this.options.default) return;
		// CAUTION: If an authentication datasource, this function creates a new record on logout and throws an error.
		// if (this.options.source === "Everlive.Users") return;
		this.bind("change", function(e) {
			if (!this.data().length)
				this.add( Object.create(this.options.default.toJSON ? this.options.default.toJSON() : this.options.default) );
		}).trigger("change",{action:"init"});
	}
}

kendo.data.DataSource.prototype.reset = function(defaultValues) {
	// NOTE: The purpose of this function is a clean state that doesn't fire off any server synchronization.
	this.data( defaultValues || [] );
	while (this._destroyed.length)
		this._destroyed.pop();
	this.options.set("selected", this.options.get("defaultSelected","first"));
	return this; // allow chaining
}


/* Widget Configuration */

pi.ui = pi.ui||{};
pi.ui.List = {
	init : function(element,options) {
		pi.ui.Widget.attributeOptions.apply(this,arguments);
		if (options.dataSource && !(options.dataSource instanceof kendo.data.DataSource)) {
			if (typeof(options.dataSource) === "string") {
				options.dataSource = $.extend({
					source: options.dataSource
				},options);
				delete options.dataSource.dataSource;
				delete options.dataSource.bind; // reserved function names
				delete options.dataSource.exists; // reserved function names
			} else if (options.dataSource.toJSON) {
				options.dataSource = options.dataSource.toJSON();
			} else if (options.dataSource instanceof Array) {
				options.dataSource = {data:options.dataSource};
			}
			if (options.dataSource && !options.template && (!options.schema || !options.schema.model))
				options.dataSource.template = $(element);
			options.dataSource = pi.data.DataSource.create(options.dataSource);
		}
		// Configure Value Fields for Telerik Cloud Services
		if (options.dataSource && options.dataSource.options.type == "everlive") {
			if (options.dataValueField == undefined)
				options.dataValueField = "uid";
			if (options.valuePrimitive == undefined && (options.dataValueField == "uid" || options.dataValueField == "Id"))
				options.valuePrimitive = true;
		}
		if (typeof(options.value) == "undefined")
			options.index = 0; // select first item
	},
	configureFields : function(element,options) {
		if (!options.dataSource.fields && options.dataSource.options.fields)
			// CAUTION: Dropdowns also require setting the 'fields' option.
			options.dataSource.fields = options.dataSource.options.fields;
	}
}

if (kendo.ui.Select) {
	// Store the original
	pi.ui.Select = kendo.ui.Select;
	// Extend and replace the original
	kendo.ui.Select = pi.ui.Select.extend({
		init : function(element,options) {
			pi.ui.List.init.apply(this,arguments);
			pi.ui.Select.fn.init.apply(this,arguments);
			pi.ui.List.configureFields.apply(this,arguments);
		}
	});
	// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
	kendo.ui.roles.select = kendo.ui.Select;
}

if (kendo.ui.MultiSelect) {
	// Store the original
	pi.ui.MultiSelect = kendo.ui.MultiSelect;
	// Extend and replace the original
	kendo.ui.MultiSelect = pi.ui.MultiSelect.extend({
		init : function(element,options) {
			pi.ui.List.init.apply(this,arguments);
			pi.ui.MultiSelect.fn.init.apply(this,arguments);
			pi.ui.List.configureFields.apply(this,arguments);
		}
	});
	// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
	kendo.ui.roles.multiselect = kendo.ui.MultiSelect;
}

if (kendo.ui.DropDownList) {
	// Store the original
	pi.ui.DropDownList = kendo.ui.DropDownList;
	// Extend and replace the original
	kendo.ui.DropDownList = pi.ui.DropDownList.extend({
		init : function(element,options) {
			pi.ui.List.init.apply(this,arguments);
			pi.ui.DropDownList.fn.init.apply(this,arguments);
			pi.ui.List.configureFields.apply(this,arguments);
		},
        readonly : function(readonly) {
            pi.ui.DropDownList.fn.readonly.apply(this,arguments);
            this._readonly = readonly;
        }
	});
	// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
	kendo.ui.roles.dropdownlist = kendo.ui.DropDownList;
}

if (kendo.ui.AutoComplete) {
	// Store the original
	pi.ui.AutoComplete = kendo.ui.AutoComplete;
	// Extend and replace the original
	kendo.ui.AutoComplete = pi.ui.AutoComplete.extend({
		init : function(element,options) {
			pi.ui.List.init.apply(this,arguments);
			pi.ui.AutoComplete.fn.init.apply(this,arguments);
			pi.ui.List.configureFields.apply(this,arguments);
		},
        readonly : function(readonly) {
            pi.ui.AutoComplete.fn.readonly.apply(this,arguments);
            this._readonly = readonly;
        }
	});
	// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
	kendo.ui.roles.autocomplete = kendo.ui.AutoComplete;
}

if (kendo.ui.ComboBox) {
	// Store the original
	pi.ui.ComboBox = kendo.ui.ComboBox;
	// Extend and replace the original
	kendo.ui.ComboBox = pi.ui.ComboBox.extend({
		init : function(element,options) {
			pi.ui.List.init.apply(this,arguments);
			pi.ui.ComboBox.fn.init.apply(this,arguments);
			pi.ui.List.configureFields.apply(this,arguments);
		},
        readonly : function(readonly) {
            pi.ui.ComboBox.fn.readonly.apply(this,arguments);
            this._readonly = readonly;
        }
	});
	// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
	kendo.ui.roles.combobox = kendo.ui.ComboBox;
}

pi = pi || {};
pi.ui = pi.ui || {};
pi.ui.Validator = kendo.ui.Validator;
kendo.ui.Validator = pi.ui.Validator.extend({
	init : function(element,options) {
		$(element).removeAttr('data-role'); // Having a data-role attribute screws up binding to the selected record.
		options = options || {};
		pi.ui.List.init.call(this,element,options);
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
				if (validator && validator.validate() && validator.options.dataSource) {
					/*
					if ($this.attr("data-loader") != "false") {
						app.pane.loader.show();
						validator.options.dataSource.one("change", function(){
							app.pane.loader.hide();
						});
					}
					*/
					switch ($this.attr("method")) {
						case "get":
							// CAUTION: For some reason it gets stuck, and every request after the first wouldn't run.
							validator.options.dataSource._dequeueRequest();
							validator.options.dataSource.read();
							break;
						case "delete":
							validator.options.dataSource.remove( validator.options.dataSource.options.get("selected") );
							/*
							if (validator.options.dataSource.options.source === "Everlive.Users") {
								// Authentication databases only
								var blank = validator.options.dataSource.options.get("selected");
								// We don't want to try to create a new blank record on the server
								validator.options.dataSource._data = new Observable([]);
								validator.options.dataSource.sync();
								// But we need the blank record after we're done.
								validator.options.dataSource.data([blank]);
								break;
							}
							*/
							// CAUTION: no break; fall through!
						default:
							if (validator.options.dataSource.hasChanges())
								validator.options.dataSource.sync();
							break;
					}
					return false;
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

// If tileSize doesn't exist in the options list, it cannot be configured by html attribute.
kendo.ui.ColorPicker.fn.options.tileSize = 14;

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

// Setup namespaces
pi = pi||{};
pi.ui = pi.ui||{};
// Store the original
pi.ui.Grid = kendo.ui.Grid;
// Extend and replace the original
kendo.ui.Grid = pi.ui.Grid.extend({
	_attributeTemplateRegEx : /#=?([^#]*)#/,
    /*
    _groups : function() {
        if (this.options.groupable)
            return pi.ui.Grid.fn._groups.apply(this,arguments);
        else
            return 0;
    },
    _updateHeader : function(groups) {
        return pi.ui.Grid.fn._updateHeader.call(this, this.options.groupable?groups:0);
    },
    _renderContent : function(data, colspan, groups) {
        return pi.ui.Grid.fn._renderContent.call(this, data, this.options.groupable?colspan:colspan-groups, this.options.groupable?groups:0);
    },
    */
	init : function(element,options) {
		var that = this;
		that.element = $(element); // NOTE: Assignment temporory; will be overwritten by Widget.fn.init();
		// CAUTION: Can't be observable, because kendo adds items that throw errors during conversion!
		// options = pi.observable(options);
		pi.ui.Widget.attributeOptions.apply(this,arguments);
		pi.ui.List.init.apply(this,arguments);
		this._configureGrid(element,options);
        // Required for new mobile grid functionality
        if (options.dataSource)
            this.dataSource = options.dataSource;
        if (options.columns)
            this.columns = options.columns;
		// $(element).html("");
        that.element.removeAttr("data-role");
		pi.ui.Grid.fn.init.apply(this,arguments);
    },
	attr : function(element,name,defaultValue) {
		if (typeof(element) == "string") {
			if (!this.element) return;
			defaultValue = name;
			name = element;
			element = this.element;
		}
		return this._eval($(element).attr(name)) || defaultValue;
	},
	_eval : pi.ui.Widget.attributeTemplate,
	_configureGrid : function(element,options) {
		var that = this, temp = { element: $(element) };
		/* Stage 1: Get config from thead elements */
		/* ASSUMPTIONS:
			- No colspans
			- No fancy templates
			- No footers or aggregates
		*/
		// Desired Changes from Kendo Defaults
		defaults = {
			// selectable : true, // Double-click to edit
			pageable : (options.pageSize==undefined)?false:true, // default to all if not specified
			navigatable : true,
			editable : true,
			filterable: true,
			sortable: true,
			columnMenu: true,
			resizable: true,
			mobile : (kendo.support.mobileOS ? "phone" : false)
		};
		// don't override existing options
		for (var prop in defaults)
			if (options[prop] == undefined)
				options[prop] = defaults[prop];
		// Columns
		/* 
			Assumptions:
			- Same number of header columns as data columns, e.g. no colspans
		*/
		options.columns = [];
		temp.$headers = temp.element.find("thead tr th");
		temp.$cells = temp.element.find("tbody tr td");
		temp.$cells.each(function(index,element) {
			if (index < temp.$headers.length)
				var $header = temp.$headers.eq(index);
			var details = {
				index : index,
				title : that._eval($header.html()),
				width : that.attr(element,'data-width') || that.attr(element,'width') || ( $header ? ( that.attr($header,'data-width') || that.attr($header,'width') ) : null)
			}
// TO DO: I think the point is that if it's a custom command, it needs to be a button.
			var $commands = $(element).find("input[type=edit],input[type=destroy],input[type=button],button");
			if ($commands.length) {
				details.command = [];
				$commands.each(function(index,element) {
					var type;
					switch (type=$(element).attr("type")) {
						case "delete":
							type="destroy";
							break;
					}
					details.command.push(type);
				});
			} else {
				var $input = $(element).find(":input[name],:input[data-name]");
				if ($input.length == 1) {
					details.field = that.attr($input,'data-name') || that.attr($input,'name') || ($header ? that.attr($header,'data-name') : null);
					details.type = that.attr($input,'data-type') || that.attr($input,'type') || ($header ? that.attr($header,'data-type') : null);
					details.format = that.attr($input,'data-format') || that.attr($input,'format') || ($header ? that.attr($header,'data-format') : null);
					if (details.role = that.attr($input,'data-role')) {
						// We need to force data-role attribute to lower case for internal kendo roles lookup.
						details.kendoEditor = kendo.initWidget( $input.attr('data-role',details.role.toLowerCase()) );
						details.editor = function(container,options) {
							kendo.initWidget( $input.clone().attr('data-role',details.role.toLowerCase()).appendTo(container) );
						}
                        switch (details.role) {
                            case "ColorPicker":
                                details.template = function(data) {
                                    var value = data[details.field];
                                    if (typeof(value) == "string" && value.length)
	                                    return '<div class="k-colorpalette"><div class="k-item" style="background-color:'+value+'">&nbsp;</div></div>';
                                    else
                                        return "";
                                }
                                break;
                            default:
                                details.template = function(data) {
                                    // CAUTION: Use a separate result array, so you don't alter the values in the model.
                                    var id, idField, value, result=[], values = data[details.field];
                                    if (!(values instanceof kendo.data.ObservableArray))
                                        return (values || "");
                                    if (details.kendoEditor.options.dataValueField==undefined || details.kendoEditor.options.dataTextField==undefined || details.kendoEditor.options.dataValueField == details.kendoEditor.options.dataTextField)
                                        return values.join(", "); // no translation necessary
                                    // CAUTION: Check for an Icenium bug where "id" isn't auto-added because there's already an "Id" field with a capital 'I'.
                                    if ( details.kendoEditor.options.dataValueField == "id" || details.kendoEditor.options.dataValueField == "Id" || ( details.kendoEditor.options.dataValueField!=undefined && details.kendoEditor.dataSource.schema!=undefined && details.kendoEditor.dataSource.schema.model!=undefined && details.kendoEditor.dataSource.schema.model.id==details.kendoEditor.options.dataValueField ) )
                                        idField = details.kendoEditor.options.dataValueField;
                                    for (var i=0; i<values.length; i++) {
                                        if (idField)
                                            // simple version
                                            value = details.kendoEditor.dataSource.get(values[i]);
                                        else 
                                            // find source
                                            for (var d=0; d<details.kendoEditor.dataSource.total(); d++) {
                                                value = details.kendoEditor.dataSource.at(d);
                                                if (value[details.kendoEditor.options.dataValueField] == values[i])
                                                    break;
                                                else
                                                    delete value;
                                            }
                                        if ( value instanceof kendo.data.ObservableObject )
                                            result[i] = value.get(details.kendoEditor.options.dataTextField);
                                        // If not found, return empty string to clue the developer in on an error.
                                        if (result[i] == undefined)
                                            result[i] = "";
                                    }
                                    return result.join(", ");
                                }
                                break;
                        }
					} else {
						delete details.role;
					}
				} else {
					details.editor = function(container,options) {
						return options.element.clone().appendTo(container);
					}
				}
			}
			// Clean up values
			if (!details.field) delete details.field;
			if (!details.width) delete details.width;
			if (!details.type) delete details.type;
			if (details.format)
				switch (details.type) {
					case "date":
					case "datetime":
					case "time":
					case "number":
						// apply special kendo date format string.
						if (details.format.substr(0,1) != "{")
							details.format = "{0:"+details.format+"}";
						break;
					default:
						// If it's the name of a function, use the function
						if (typeof(window[details.format]) == "function")
							details.format = window[details.format];
						// pass through whatever's provided.
						break;
				}
			else
				delete details.format;
			options.columns[index] = details;
		});
	}
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.ui.roles.grid = kendo.ui.Grid;