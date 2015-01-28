// Setup namespaces
pi = pi||{};
pi.mobile = pi.mobile||{};
pi.mobile.ui = pi.mobile.ui||{};
// helper functions
if (!kendo.data.binders.widget.attr)
	kendo.data.binders.widget.attr = kendo.data.Binder.extend({
		init: function(widget, bindings, options) {
			kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);
			this.widget = widget;
		},
		refresh: kendo.data.binders.attr.fn.refresh
	});
// Extend and replace the original
pi.mobile.ui.PhotoUpload = kendo.ui.Widget.extend({
	dirty : false,
	init : function(element, options) {
		pi.ui.Widget.attributeOptions.apply(this, arguments);
		this.initDatasource(element, options);
		this.setMaxSize(element, options);
		kendo.ui.Widget.fn.init.apply(this, arguments);
		this.options = pi.observable(this.options);
		this.render(element,options);
		$(element).data("kendoPhotoUpload", this);
	},
	src : function(newSrc) {
		try {
			// CAUTION: A null value has a type of "object"!!
			if (newSrc || newSrc === "") {
				this._uri = newSrc;
				this.img.attr("src", (newSrc.length < 1000) ? newSrc : "data:image/jpeg;base64," + newSrc);
			} else {
				return this._uri || this.img.attr("src");
			}
		} catch(e) {
			e.event = "Handle File Source";
			(pi||console).log(e,"error");
		}
	},
	value : function(newVal) {
		var field, bindObj,
			bind = this.element.attr('data-bind'),
			type = this.element.attr('data-type') || "string";
		try {
			if (bind) {
				bindObj = JSON.parse( bind.replace(/\b(\w+)\b\s*:/g,"\"$1\":").replace(/:\s*\b([\w\.]+)\b/g,":\"$1\"").replace(/^\s*{?(.*)}?\s*$/, "{$1}") );
				field = (bindObj && bindObj.value) ? bindObj.value : bind;
			}
		} catch(e) {
			field = bind;
		}
		field = field.split(".").pop();
		// CAUTION: A null value has a type of "object"!!
		if (newVal || newVal === "") {
			this._value = newVal;
			if (typeof(newVal) === "object" && field)
				this.input.val(newVal[field] || "");
			else
				this.input.val(newVal);
		} else {
			if (type === "object")
				return this._value;
			else if (typeof(this._value) === "object" && field)
				return this._value[field];
			else
				return this._value || this.input.val();
		}
	},
	initDatasource : function(element, options) {
		if (!options.dataSource)
			return;
		if (typeof(options.dataSource) === "string" && options.dataSource.toLowerCase() === "everlive.files" ) {
			options.name = options.name || $(element).attr("data-name") || $(element).attr("name") || "file";
			if (!options.maxSize || options.maxSize > 4 * 1000 * 1000)
				options.maxSize = 4 * 1000 * 1000;
			
			var _this = this;
			if (!options.autoUpload) {
				this.form = $(element).parents("form").bind("submit", function(e) {
					if (_this.dirty) {
						_this.uploadFile();
						return false; // cancel submit
					} else {
						return true;
					}
				});
			}
		}
	},
	setMaxSize : function(element, options) {
		if (!options.maxSize)
			return;
		// Set string version now
		if (options.maxSize > 1000000000)
			options.maxSizeString = Math.floor(options.maxSize * 100 / 1000000000) / 100 + "GB";
		else if (options.maxSize > 1000000)
			options.maxSizeString = Math.floor(options.maxSize * 100 / 1000000) / 100 + "MB";
		else if (options.maxSize > 1000)
			options.maxSizeString = Math.floor(options.maxSize * 100 / 1000) / 100 + "KB";
		else
			options.maxSizeString = options.maxSize + " Bytes";
	},
	render : function(element,options) {
		var _this = this;
		// element
		this.element = $(element);
		// wrap
		if (this.element.is("div") || this.element.is("span"))
			this.wrap = this.element.addClass("km-photo-upload");
		else
			this.wrap = this.element.wrap('<div class="km-photo-upload">').parent();
		// input
		if (this.element.is("input")) {
			this.input = this.element;
			if (this.element.attr("type") === "image")
				this.img = this.element;
			if (this.element.attr("type") === "file")
				this.file = this.element;
		}
		// img
		if (this.element.is("img"))
			this.img = this.element;
		if (!this.img)
			this.img = $('<img>').appendTo(this.wrap).attr('src', this.element.attr('src') || this.element.attr('value') || "");
		// input, part 2
		if (!this.input) {
			this.input = $('<input type="image" name="' + options.name + '" />').appendTo(this.wrap);
			this.input.attr('value', this.element.attr('value')).attr('src', this.element.attr('src'));
			if (this.element.attr('data-bind')) {
				this.input.attr('data-bind', this.element.attr('data-bind'));
				this.element.removeAttr('data-bind');
			}
		}
		// buttons
		if (navigator.camera) {
			if (this.file)
				this.file.hide();
			var cameraConfig = {
				destinationType : Camera.DestinationType.DATA_URL,
				// destinationType : Camera.DestinationType.NATIVE_URI,
				mediaType : Camera.MediaType.PICTURE,
				encodingType: Camera.EncodingType.JPEG,
				correctOrientation : true,
			};
			if (this.options.width)
				cameraConfig.targetWidth = parseInt(this.options.width);
			if (this.options.height)
				cameraConfig.targetHeight = parseInt(this.options.height);
			if (this.options.quality)
				cameraConfig.quality = parseInt(this.options.quality);
			this.cameraButton = $('<button>Camera</button>').appendTo(this.wrap).kendoMobileButton({
				icon : "camera",
				click : function(e) {
					navigator.camera.getPicture(
						function() {
							_this.selectSuccess.apply(_this, arguments);
						},
						function() {
							_this.selectError.apply(_this, arguments);
						},
						$.extend({
							sourceType : Camera.PictureSourceType.CAMERA
						}, cameraConfig)
					);
				}
			});
			this.libraryButton = $('<button>Photos</button>').appendTo(this.wrap).kendoMobileButton({
				icon : "organize",
				click : function(e) {
					navigator.camera.getPicture( 
						function() {
							_this.selectSuccess.apply(_this, arguments);
						},
						function() {
							_this.selectError.apply(_this, arguments);
						},
						$.extend({
							sourceType : Camera.PictureSourceType.PHOTOLIBRARY
						}, cameraConfig)
					);
				}
			});
			this.deleteButton = $('<button>Delete</button>').appendTo(this.wrap).kendoMobileButton({
				icon : "delete",
				click : function(e) {
					_this.uploadSuccess("");
				}
			});
		} else {
			if (!this.file)
				this.file = $('<input type="file" />').appendTo(this.wrap);
			this.file.bind("change", function(e) {
				_this.selectSuccess($(this).val());
			});
		}
	},
	/*
	select: function(e) {
		try {
			if (this.options.maxSize)
				for (var i=0; i<e.files.length; i++) {
					if (e.files[i].size > this.options.maxSize) {
						// TO DO: Replace this with registering an error through Kendo Validator.
						alert("The file (" + e.files[i].name + ") is larger than " + this.options.maxSizeString + ". Please select another.");
						if (e) e.preventDefault();
						return false;
					}
					this.reader.readAsDataURL(e.files[0].rawFile);
				}
		} catch(e) {
			e.event = "Postcard Photo FileReader Selection";
			e.modal = true;
			postcard.log(e,"e");
		}
	},
	*/
	selectSuccess: function(uri) {
		if ( this.options.maxSize) {
			if ( (uri.length > this.options.maxSize) || (this.file && this.file[0].files.length && this.file[0].files[0].size > this.options.maxSize) ) {
				this.trigger("error", { message: "The file selected is larger than " + this.options.maxSizeString + ". Please select another." });
				return;
			}
		}
		if (this._uri !== uri)
			this.dirty = true;
		this._uri = uri;
		this.src(uri);
		this.trigger("change", {src: uri});
		if (this.autoupload && this.dirty)
			this.uploadFile();
	},
	selectError: function(error) {
		(pi||console).log(error);
	},
	uploadFile : function() {
		var _this = this;
		if (!this.dirty)
			return;
		if (this._uri && this._uri.length > 1000) {
			var _this = this, file = {
				"Filename": "photo.jpg",
				"ContentType": "image/jpeg",
				"base64": this._uri
			};
			
			Everlive.$.Files.create(file,
				function(data) {
					if (data.result) {
						_this.uploadSuccess(data.result);
					} else {
						(pi||console).log("Unknown result: " + JSON.stringify(data));
					}
				},
				this.uploadError);
		}
		else if (this._uri) {
			var _this = this,
				options = new FileUploadOptions(),
				ft = new FileTransfer();
			options.fileName = this._uri.split("/").pop();
			options.headers = Everlive.$.buildAuthHeader();
			switch (options.fileName.split(".").pop()) {
				case "jpg":
				case "jpeg":
					options.mimetype = "image/jpeg";
					break;
				case "png":
					options.mimetype = "image/png";
					break;
				case "gif":
					options.mimetype = "image/gif";
					break;
				default:
					return;
			}
			ft.upload(this._uri, 
					Everlive.$.Files.getUploadUrl(),
					function(r) {
						var responseCode = r.responseCode;
						var res = JSON.parse(r.response);
						if (res.Result && res.Result.length) {
							_this.uploadSuccess(res.Result[0]);
						} else {
							(pi||console).log("Unknown result: " + r.response);
						}
					},
					_this.uploadError,
					options);
		}
	},
	uploadSuccess : function(newFile) {
		try {
			var oldFile = this.value();
			this.dirty = false;
			if (oldFile && oldFile.Id)
				Everlive.$.Files.destroySingle({Id: oldFile.Id});
			this.value(newFile);
			if (newFile.Uri)
				this._uri = newFile.Uri;
			else if (newFile.src)
				this._uri = newFile.src;
			else
				this._uri = "";
			this.src(this._uri);
			this.trigger("change", {src: this.src(), value: this.value()});
			if (!this.options.autoUpload && this.form)
				this.form.trigger("submit");
		} catch(e) {
			e.event = "Photo Upload Post-Processing";
			(pi||console).log(e,"error");
		}
	},
	uploadError : function(e) {
		var error = {
			event : "Photo Upload Error",
			message : e.message || "Photo Upload Error"
		}
		if (e.body) {
			e.body = JSON.parse(e.body);
			error.code = e.body.code,
			error.message = e.body.message
		}
		if (typeof(FileTransferError) != "undefined") {
			switch(error.code) {
				case FileTransferError.FILE_NOT_FOUND_ERR:
					error.message = templates.postcards.fields.sent.upload.missing;
					break;
					
				case FileTransferError.INVALID_URL_ERR:
					error.message = "INVALID_URL_ERR"
					break;
			}
		}
		(pi||console).log(error,"error");
	}
});
// The auto-widget creation is based on the kendo.mobile.ui.roles registry, so don't forget to update this!
kendo.mobile.ui.roles.photoupload = pi.mobile.ui.PhotoUpload;