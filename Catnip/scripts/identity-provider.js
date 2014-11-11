function getParameterByName(name, url) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = name + "=([^&#]*)";
 			
    console.log("Parameter name: " + name);
    console.log("Url: " + url);
            
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
            
    console.log("Result: " + results);
            
    if (results == null) {
        return false;
    }
    else 
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

var IdentityProvider = function (config) {
    var that = this;
    
    this.getAccessToken = function(callback) {
        console.log("Begin authorization with: " + config.name);
        // Begin Authorization
        var authorize_url;
        if (config.name === 'ADFS') {
            authorize_url = config.endpoint
                            + '?wa=' + config.wa
                            + '&wreply=' + config.wtrealm + '/adfs/token'
                            + '&wtrealm=' + config.wtrealm;
        }
        else {
            authorize_url = config.endpoint
                            + "?response_type=" + config.response_type
                            + "&client_id=" + config.client_id
                            + "&redirect_uri=" + config.redirect_uri
                            + "&display=" + config.display
                            + "&access_type=" + config.access_type
                            + "&scope=" + config.scope;
        }
   
        // call the In-App browser with the authorization URL
        ref = window.open(authorize_url, '_blank', 'location=no');
        
        ref.addEventListener('loadstop', function(event) {
            that.locationChanged(event.url, callback);
        });
        
        ref.addEventListener('loaderror', function(event) {
            alert("Load error: " + event.message);
        });
        
        //The following is required in iPhone as the loadstop event is never fired.
        if (config.name === 'ADFS') {
            ref.addEventListener('loadstart', function(event) {
                that.locationChanged(event.url, callback);
            });
        }
    }
    
    this.locationChanged = function(loc, callback) {
        console.log("Current location: " + loc)
        if (loc.indexOf("access_token=") != -1) {
            ref.close();
            console.log(loc);
            var token = getParameterByName("access_token", loc);
            
            callback(token);
        }
        else {
            console.log("No access_token in url.")
        }
    }
}