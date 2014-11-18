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
        message.message="FLIKSHOP: "+message.message;
        
        if (pi.log)
            pi.log.push(message);
        else if (typeof(window.console) != "undefined") // For IE 8 and below!
	        window.console.log(message.message);
		
    } catch(e) {
        if (pi.log)
            pi.log.push(e);
        else if (typeof(window.console) != "undefined")
            window.console.log(e.message);
    }
	pi.console.push(message);
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