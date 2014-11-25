$(function() {
    
	/*
	var $startTime, $endTime, data, startDate, endDate, today;
    
    // Modify the native Date object (very dangerous, I know, I know...)
    Date.prototype.padNumber = function (num) {
        if (num < 10) {
            num = '0' + num;
        }
        return num.toString();
    };
    
    Date.prototype.trimToDate = function () {
        this.setHours('0');
        this.setMinutes('0');
        this.setSeconds('0');
        this.setMilliseconds('0');
        return this;
    }
    
    Date.prototype.getShortDate = function () {
        var day, month, year;
        
        day = this.padNumber(this.getDate());
        month = this.padNumber(this.getMonth() + 1);
        year = this.getFullYear();
        
        return [year, month, day].join('-');
    };

    Date.prototype.getShortTime = function (full) {
        var arr, hours, minutes, str;
        
        hours = this.padNumber(this.getHours());
        minutes = this.padNumber(this.getMinutes());
        
        arr = [hours, minutes];
        if (full) {
            arr.push('00');
            str = arr.join(':');
        } else {
            str = arr.join('');
        }
        
        return str;
    };
    
    Date.prototype.toISOString = function () {
        return this.getShortDate() + 'T' + this.getShortTime(true) + 'Z'
    };
    
    // Some utility functions
    function startTimeChangeHandler(e) {
        var startDate = new Date($startTime.value());
        if (startDate) {
            startDate.setMinutes(startDate.getMinutes() + 30);
            $endTime.min(startDate);
            startDate.setMinutes(startDate.getMinutes() + 30);
            $endTime.value(startDate);
        }
    }
    
    function endTimeChangeHandler(e) {
        var startTime, endTime, restEndpoint, record;
        
        restEndpoint = 'http://api.everlive.com/v1/kD5Tly50Vf6nm8kn/DailyPreferences';
        
        today = new Date();
        startTime = new Date($startTime.value());
        endTime = new Date($endTime.value());
        
        record = preferences.options.get("selected");

        record.set('StartTime', startTime.getShortTime());
        record.set('EndTime', endTime.getShortTime());
        console.log(record);
                                
        $.ajax(restEndpoint + '/' + record.Id, {method: 'put', data: record.toJSON()});
        window.preferences.fetch();
    }
	*/
    
    // Initialize variables
    var today = new Date();
	today = [today.getFullYear(), ("0"+(today.getMonth()+1)).substr(-2), ("0"+today.getDate()).substr(-2)];
	
	// Set configuration
    window.preferences = pi.data.DataSource.create({
        source: "Everlive.DailyPreferences",
		storage: "localStorage", // Used to default to yesterday's preferences
		template: $('#dailyprefs'),
		debug: false,
        serverFiltering: true,
        filter: [
			{field: 'User', operator: 'eq', value: window.myAccount ? window.myAccount.get("Id") : ""},
            {field: 'Date', operator: 'eq', value: today.join("")}
        ],
		default : {
			"User": window.myAccount ? window.myAccount.get("Id") : "",
			"Date": today.join(""),
			"StartTime": new Date(today.join("-")+" "+$('#dailyprefs input[name=StartTime]').attr('min')),
			"EndTime": new Date(today.join("-")+" "+$('#dailyprefs input[name=EndTime]').attr('max'))
		}
    });
	// If defaulting to yesterday's preferences, update the Date field.
	window.myPreferences = window.preferences.options.get("selected");
	if (window.myPreferences.get("Date") !== today) {
		window.myPreferences.set("Date", today);
		window.myPreferences.set("Id", "");
		window.myPreferences.set("id", "");
	}
	/*
	window.preferences.bind("requestEnd", function(e) {
		if (e.response.Result) {
			e.response.Result.forEach(function(item,index) {
				item.StartTime = new Date(item.StartTime);
				item.EndTime = new Date(item.EndTime);
			});
		}
	});
	*/
	window.preferences.bind("change", function(e) {
		if (e.action === "itemchange") {
			if (e.field === "StartTime") {
				e.items.forEach(function(item, index) {
					var min = new Date(item.StartTime.toString()),
						endDate = new Date(item.EndTime.toString()),
						$endTime = $('#dailyprefs input[name=EndTime]').data("kendoTimePicker");
					min.setMinutes(min.getMinutes() + 30);
					$endTime.min(min);
					if (min > endDate) {
						min.setMinutes(min.getMinutes() + 30);
						item.set("EndTime", min);
					}
				});
			}
			this.sync();
		}
	});
	
	window.myAccount.bind("change", function(e) {
		var account = this;
		if (e.field === "access_token") {
			if (account.get(e.field).length) {
				window.preferences.filter([
					{field: 'User', operator: 'eq', value: account.get("Id")},
					{field: 'Date', operator: 'eq', value: today.join("")}
				]);
			}
			else {
				window.preferences.reset()._filter = [];
			}
		}
	}).trigger("change", {field:"access_token"});
    
});
