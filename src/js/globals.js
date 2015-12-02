if (!window.widget) {
    window.widget = {
        preferences: {
            "workHours": "8",
            "breakHours": "1",
            "shake": "true",
            "eyeBreak": "false",
            "getItem": function (item) {
                return this[item];
            },
            "setItem": function (item, value) {
                return this[item] = value;
            }
        }
    };
}

if (!window.tizen) {
    window.tizen = {
        "systeminfo": {},
        "ApplicationControl": {},
        "ApplicationControlData": {},
        "application": {
            "launch": function () {},
            "getCurrentApplication": function () {
                return {
                    exit: function () {
                        console.log("Application was closed");
                    }
                }
            }
        },
        "filesystem": {
            "maxPathLength": 4096
        },
        "power": {
            turnScreenOn: function () {},
            request: function () {}
        },
        "package": {},
        "systemsetting": {},
        "messageport": {},
        "bluetooth": {},
        "content": {},
        "AlarmAbsolute": {},
        "AlarmRelative": {},
        "alarm": {
            "PERIOD_HOUR": 3600,
            "PERIOD_MINUTE": 60,
            "PERIOD_DAY": 86400,
            "PERIOD_WEEK": 604800
        },
        "DownloadRequest": {},
        "download": {},
        "TZDate": {},
        "TimeDuration": {},
        "time": {},
        "AttributeFilter": {},
        "AttributeRangeFilter": {},
        "CompositeFilter": {},
        "SimpleCoordinates": {},
        "SortMode": {}
    };
}

var test = {
   triggerHourChange: function () {
       var eventDetail,
           event = new CustomEvent("timerHourChange", false, true, eventDetail),
           currentTimer = app.timer.currentTimer;

       eventDetail = {
           "currentTimer": currentTimer,
           "oldCurrentTimer": {
               "hours": currentTimer.hours - 1,
               "minutes": currentTimer.minutes,
               "seconds": currentTimer.seconds
           }
       };
       document.dispatchEvent(event);
   }
};