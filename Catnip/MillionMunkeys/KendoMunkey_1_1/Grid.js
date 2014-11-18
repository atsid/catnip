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