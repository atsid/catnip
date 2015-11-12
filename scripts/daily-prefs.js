$(function () {
    var $startTime, $endTime, data, dataSource, record, today;
    
    Date.prototype.padNumber = function (num) {
        if (num < 10) {
            num = '0' + num;
        }
        return num.toString();
    };
    
    Date.prototype.trimToDate = function () {
        this.setUTCHours('0');
        this.setUTCMinutes('0');
        this.setUTCSeconds('0');
        this.setUTCMilliseconds('0');
        return this;
    }
    
    Date.prototype.getShortDate = function () {
        var day, month, year;
        
        day = this.padNumber(this.getDate());
        month = this.padNumber(this.getMonth() + 1);
        year = this.getFullYear();
        
        return year + month + day;
    };

    Date.prototype.getShortTime = function () {
        var hours, minutes;
        
        hours = this.padNumber(this.getHours());
        minutes = this.padNumber(this.getMinutes());
        
        return hours + minutes;
    };

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
        var startTime, endTime;
        
        today = new Date();
        startTime = new Date($startTime.value());
        endTime = new Date($endTime.value());
        
        record.set('StartTime', startTime.getShortTime());
        record.set('EndTime', endTime.getShortTime());
        console.log(record);
        //console.log(dataSource.hasChanges());
        
        //dataSource.sync();
    }
    
    today = new Date().trimToDate();
    dataSource = config.preferences.dataSource;

    record = dataSource.at(0) || dataSource.add({
        'Date': today
    });

    console.log(dataSource.at(0));
    console.log(record);
    
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
