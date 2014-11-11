$(function() {
    var $startTime, $endTime, data, dataSource, startDate, endDate, me, today;
    
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
        
        record = config.get('preferences.current');

        record.set('StartTime', startTime.getShortTime());
        record.set('EndTime', endTime.getShortTime());
        console.log(record);
                                
        $.ajax(restEndpoint + '/' + record.Id, {method: 'put', data: record.toJSON()});
        dataSource.fetch();
    }
    
    // Initialize variables
    today = new Date().trimToDate();
    dataSource = config.get('preferences.dataSource');
    me = '1bac2d70-69a0-11e4-8481-bd60c9634975';
    
    // Set configuration
    config.set("preferences", pi.observable());
    config.set("preferences.dataSource", pi.data.DataSource.create({
        source: "Everlive.DailyPreferences",
        serverFiltering: true,
        filter: [
            {field: 'User', operator: 'eq', value: me},
            {field: 'Date', operator: 'eq', value: today.toISOString()}
        ],
        change: function () {
            var record = (this.at(0)) || this.add({
                'User': me,
                'Date': today.toISOString()
            });
            config.set('preferences.current', record);
        }
    })).fetch();
    // It's common to type the 's' in source as lowercase, so this is an alias.
    config.preferences.datasource = config.preferences.dataSource;
    
    // Set up kendo stuff
    $startTime = $('#startTime').kendoTimePicker({
        change: startTimeChangeHandler
    }).data('kendoTimePicker');
    
    $startTime.min("11:00 AM");
    $startTime.max("3:00 PM");
    
    $endTime = $('#endTime').kendoTimePicker({
        change: endTimeChangeHandler
    }).data('kendoTimePicker');
    
    $endTime.min("11:30 AM");
    $endTime.max("4:00 PM");
    
});
