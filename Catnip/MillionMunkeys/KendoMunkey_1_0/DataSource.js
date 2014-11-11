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
		pi.data.DataSource.configureTransport(options);
		pi.data.DataSource.configurePaging(options);
		pi.data.DataSource.configureSchema(options);
		if (options.template)
			pi.data.DataSource.configureModel(options);
		// Call initial function
		result = new kendo.data.DataSource(options);
		// CAUTION: Kendo uses the apply function to add options to an internal object.
		// So we can only do this after instantiation when this internal object is finally made available to us.
		result.options = pi.observable(result.options);
		// Setup localStorage details
		pi.data.DataSource.configureStorage.apply(result);
		pi.data.DataSource.configureSelected.apply(result);
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
		if (!options.template) return;
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
		this.bind("change", function(e) {
			pi.data.DataSource.storeData.apply(this,arguments)
		});
		// Retrieve existing data if present
		var data = this.options.storage.getItem(this.options.id);
		// WARNING: Android 2.x throws an error if you pass a null value to JSON.parse!  New versions do not.
		if (!this.data().length && data)
			this.data(JSON.parse(data));
		for (var i=0, data=this.data(); i<data.length; i++)
			data[i].uid = data[i].guid || data[i].uid;
		var destroyed = this.options.storage.getItem(this.options.id+"_destroyed");
		if (destroyed)
			this._destroyed = JSON.parse(destroyed);
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
				if (this.options.selected instanceof kendo.data.Model) {
					// WARNING: Don't use set("selected") or we get an infinite loop!
					if (this.options.selected.uid)
						this.options.set("selected", this.getByUid(this.options.selected.uid));
				}
			});
		});
		this.bind("change",function(e) {
			if (e.action == "remove" && this.options.selected instanceof kendo.data.Model) {
				if (this.options.selected.uid && !this.getByUid(this.options.selected.uid))
					// Selected record was removed
					this.options.set("selected", this.options.get("defaultSelected","first"));
			}
		});
		this.options.bind("change", function(e) {
			switch (e.field) {
				case "selected":
					if (!(this.selected instanceof kendo.data.Model)) {
						if (typeof(this.selected) == "undefined")
							this.selected = this.defaultSelected; // If it doesn't exist, that's okay.
						if (typeof(this.selected) == "undefined") // still
							this.selected = "first";
						if (that.view().length) {
							if (this.selected == "first")
								this.selected = 0;
							else if (this.selected == "last")
								this.selected = that.view().length-1;
							// CAUTION: Beware infinite loops!
							if (typeof(this.selected) == "number")
								this.set("selected", that.view()[this.selected]);
							else if (typeof(this.selected) == "string")
								this.set("selected", that.get(this.selected));
						}
					}
					break;
			}
		});
	}
}

kendo.data.DataSource.prototype.reset = function(defaultValues) {
	// NOTE: The purpose of this function is a clean state that doesn't fire off any server synchronization.
	this.data( defaultValues || [] );
	this.trigger("change");
}


/* Widget Configuration */

pi.ui = pi.ui||{};
pi.ui.List = {
	init : function(element,options) {
		pi.ui.Widget.attributeOptions.apply(this,arguments);
		if (options.dataSource && !(options.dataSource instanceof kendo.data.DataSource)) {
			if (options.dataSource.toJSON)
				options.dataSource = options.dataSource.toJSON();
			if (options.dataSource instanceof Array)
				options.dataSource = {data:options.dataSource};
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