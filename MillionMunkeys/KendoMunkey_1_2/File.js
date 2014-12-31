// Setup namespaces
pi = pi||{};
pi.mobile = pi.mobile||{};
pi.mobile.ui = pi.mobile.ui||{};
// Extend and replace the original
pi.mobile.ui.PhotoUpload = kendo.ui.Widget.extend({
	dirty : false,
	init : function(element, options) {
		pi.ui.Widget.attributeOptions.apply(this, arguments);
		this.setMaxSize(element, options);
		this.initDatasource(element, options);
		options = $.extend(options,{
			select : this.select,
			upload : this.upload,
			success : this.success,
			error: this.uploadError
		});
		kendo.ui.Widget.fn.init.apply(this, arguments);
		this.renderButtons(element,options);
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
	uploadFile : function(file) {
		
	},
	initDatasource : function(element, options) {
		if (!options.dataSource)
			return;
		if (typeof(options.dataSource) === "string" && options.dataSource.toLowerCase() === "everlive.files" ) {
			options.async.saveURL = Everlive.$.Files.getUploadUrl(); // throw error if Everlive doesn't exist.
			options.async.saveField = options.async.saveField || $(element).attr("data-name") || $(element).attr("name") || "file";
			
			var _this = this;
			if (!options.autoUpload) {
				this.form = $(element).parent("form").bind("submit", function(e) {
					if (_this.dirty) {
						
						return false; // cancel submit
					} else {
						return true;
					}
				});
			}
		}
	},
	renderButtons : function(element,options) {
		var _this = this;
		this.cameraButton = $(element).after("<button>Camera</button>").filter("button"),
		this.libraryButton = $camera.after("<button>Photos</button>").filter("button");
		this.cameraButton.kendoButton({
			icon : "camera",
			click : function(e) {
				navigator.camera.getPicture(
					function(imageUri) {
						_this.fileUri = imageUri;
					}, 
					function(error) {
						(pi||console).log(error);
					}, 
					{
						sourceType : Camera.PictureSourceType.CAMERA,
						destinationType : Camera.DestinationType.FILE_URI,
						mediaType : Camera.MediaType.PICTURE,
						correctOrientation : true,
						targetWidth : 100,
						targetHeight : 100,
						quality : 100
					}
				);
			}
		});
		this.libraryButton.kendoButton({
			icon : "organize",
			click : function(e) {
				navigator.camera.getPicture( 
					function(imageUri) {
						_this.fileUri = imageUri;
					}, 
					function(error) {
						(pi||console).log(error);
					}, 
					{
						sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
						destinationType : Camera.DestinationType.FILE_URI,
						mediaType : Camera.MediaType.PICTURE,
						correctOrientation : true,
						targetWidth : 100,
						targetHeight : 100,
						quality : 100
					}
				);
			}
		});
	},
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
	upload: function(e) {
		try {
			e.data = e.data || {};
			$.extend(e.data, {
				
			});
		} catch(e) {
			e.event = "Build Photo Upload Data";
			postcard.log(e,"e");
		}
	},
	uploadPhoto: function() {
		try {
			var options = new FileUploadOptions();
			options.fileKey = $(element).attr("data-name") || $(element).attr("name") || "file";
			options.fileName = this.fileUri.split("/").pop();
			options.mimeType="image/jpeg";
			
			var e = {data:{}};
			options.params = e.data;
			options.chunkedMode = false;
			
			var ft = new FileTransfer();
			ft.upload(this.fileUri, 
					  Everlive.$.Files.getUploadUrl(), 
					  this.uploadSuccess, 
					  this.uploadError, 
					  options, 
					  true);
		} catch(e) {
			e.event = "App Photo Upload";
			postcard.log(e,"e");
		}
	},
	uploadSuccess : function(e) {
		if (!options.autoUpload && this.form)
			this.form.trigger("submit");
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
kendo.mobile.ui.roles.photopicker = pi.mobile.ui.PhotoPicker;