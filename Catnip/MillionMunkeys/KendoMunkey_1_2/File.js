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
		this.setMaxSize(element, options);
		this.initDatasource(element, options);
		kendo.ui.Widget.fn.init.apply(this, arguments);
		this.options = pi.observable(this.options);
		this.render(element,options);
		$(element).data("kendoPhotoUpload", this);
	},
	value : function(newVal) {
		if (typeof(newVal) !== "undefined")
			this.input.val(newVal);
		else
			return this.input.val();
	},
	setMaxSize : function(element, options) {
		if (!options.maxSize) {
			if (options.dataSource && typeof(options.dataSource) === "string" && options.dataSource.toLowerCase() === "everlive.files" )
				// Everlive max is 4MB
				options.maxSize = 4 * 1000 * 1000;
			else
				return;
		}
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
	initDatasource : function(element, options) {
		if (!options.dataSource)
			return;
		if (typeof(options.dataSource) === "string" && options.dataSource.toLowerCase() === "everlive.files" ) {
			options.name = options.name || $(element).attr("data-name") || $(element).attr("name") || "file";
			
			var _this = this;
			if (!options.autoUpload) {
				this.form = $(element).parent("form").bind("submit", function(e) {
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
		if (!this.input) {
			this.input = $('<input type="image" name="' + options.name + '" />').appendTo(this.wrap);
			this.input.attr('value', this.element.attr('value')).attr('src', this.element.attr('src'));
			if (this.element.attr('data-bind')) {
				this.input.attr('data-bind', this.element.attr('data-bind'));
				this.element.removeAttr('data-bind');
			}
		}
		// img
		if (this.element.is("img"))
			this.img = this.element;
		if (!this.img)
			this.img = $('<img>').appendTo(this.wrap).attr('src', this.element.attr('src') || this.element.attr('value') || "");
		// buttons
		if (navigator.camera) {
			if (this.file)
				this.file.hide();
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
						{
							sourceType : Camera.PictureSourceType.CAMERA,
							destinationType : Camera.DestinationType.FILE_URI,
							mediaType : Camera.MediaType.PICTURE,
							encodingType: Camera.EncodingType.JPEG,
							correctOrientation : true,
							targetWidth : 100,
							targetHeight : 100,
							quality : 100
						}
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
						{
							sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
							destinationType : Camera.DestinationType.FILE_URI,
							mediaType : Camera.MediaType.PICTURE,
							encodingType: Camera.EncodingType.JPEG,
							correctOrientation : true,
							targetWidth : 100,
							targetHeight : 100,
							quality : 100
						}
					);
				}
			});
			this.deleteButton = $('<button>Delete</button>').appendTo(this.wrap).kendoMobileButton({
				icon : "delete",
				click : function(e) {
					_this.selectSuccess("");
				}
			});
		} else if (!this.file) {
			this.file = $('<input type="file" />').appendTo(this.wrap);
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
		if (this._uri !== uri)
			this.dirty = true;
		this._uri = uri;
		this.trigger("change", {value: uri});
		if (this.autoupload && this.dirty)
			this.uploadFile();
	},
	selectError: function(error) {
		(pi||console).log(error);
	},
	uploadFile : function() {
		if (!this.dirty)
			return;
		if (this._uri) {
			var _this = this,
				options = new FileUploadOptions(),
				ft = new FileTransfer();
			options.fileKey = "file";
			options.fileName = this._uri.split("/").pop();
			options.headers = Everlive.$.buildAuthHeader();
			options.chunkedMode = false;
			switch (filename.split(".").pop()) {
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
					  _this.uploadSuccess, 
					  _this.uploadError,
					  options);
		}
	},
	uploadSuccess : function(r) {
		var responseCode = r.responseCode;
		var res = JSON.parse(r.response);
		if (res.Result && res.Result.length) {
			// use the Id and the Uri of the uploaded file 
			this.value(res.Result[0].Id);
			this._uri = res.Result[0].Uri;
			this.dirty = false;
			if (!options.autoUpload && this.form)
				this.form.trigger("submit");
		} else {
			(pi||console).log("Unknown result: " + r.response);
		}
	},
	uploadError : function(e) {
		var error = {
			event : "Photo Upload Error",
			code : e.code,
			message : e.message || e.response.message || e.code
		}
		if (typeof(FileTransferError) != "undefined") {
			switch(e.code) {
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