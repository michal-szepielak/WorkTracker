/*globals widget, Timer, Gesture, TimeTable, tizen, tau, confirm*/
/*jslint browser: true, plusplus: true*/
var app = (function () {
    "use strict";

    var SHAKE_IN = [100, 50, 100, 50, 200],
        SHAKE_OUT = [400, 50, 400, 100, 1000],
        NOTIFICATION = [500, 100, 500],
        App = function () {
            this.shakeNumber = 0;
            this.shakeTimeout = 2000;
            this.shakeTreshold = 10;
            this.timer = null;
            this.timeTable = null;
            this.currentMode = "stop";
            this.shakeGesture = null;

            this.tizenApp = tizen.application.getCurrentApplication();
        };

    App.prototype.vibrate = function (pattern, tryNumber) {
        var isVibrated = navigator.vibrate(pattern);

        tryNumber = tryNumber || 1;

        if (!isVibrated) {
            if (tryNumber < 20) {
                setTimeout(this.vibrate.bind(this, pattern, tryNumber), 100);
            }
        }
    };

    App.prototype.setMode = function (mode) {
        var ui = this.ui;

        ui.setMode(mode);
        ui.refresh();
        this.currentMode = mode;
    };

    App.prototype.takeABreak = function () {
        var timeTable = this.timeTable,
            lastActivity = timeTable.getLastActivityType();

        if (this.currentMode !== "work" && this.currentMode !== "break") {
            return;
        }

        if (lastActivity !== "break") {
            timeTable.pushActivity({
                start: this.timer.getCurrentTimestamp(),
                name: "Taking a break",
                duration: null,
                type: "break"
            });
            this.setMode("break");
        } else {
            timeTable.pushActivity({
                start: this.timer.getCurrentTimestamp(),
                name: "Back to work",
                duration: null,
                type: "work"
            });
            this.setMode("work");
        }
    };

    App.prototype.endWork = function () {
        var timeTable = this.timeTable;

        if (!confirm("Are you sure to end your work?")) {
            return;
        }

        timeTable.workEnd = new Date();
        this.setMode("start");

        timeTable.pushActivity({
            start: this.timer.stop(),
            name: "Quitting time!",
            duration: null,
            type: "end"
        });
        this.shakeGesture.stopListener();
    };

    App.prototype.startWork = function () {
        var timeTable = this.timeTable;

        timeTable.reset();
        timeTable.pushActivity({
            start: this.timer.start(),
            name: "Workday start",
            duration: null,
            type: "start"
        });
        this.setMode("work");
        this.shakeGesture.startListener();
    };

    App.prototype.setOption = function (key, value) {
        var widgetPref = widget.preferences;

        switch (key) {
        case "eyeBreak":
        case "shake":
            widgetPref.setItem(key, (value ? "true" : "false"));
            break;
        case "workHours":
        case "breakHours":
            widgetPref.setItem(key, parseInt(value, 10));
            break;
        }
        this.ui.refresh();
        return this.getOption(key);
    };

    App.prototype.getOption = function (key) {
        var widgetPref = widget.preferences;

        switch (key) {
        case "eyeBreak":
        case "shake":
            return widgetPref.getItem(key) === "true" ? true : false;
        case "workHours":
        case "breakHours":
            return parseInt(widgetPref.getItem(key), 10);
        }
        return null;
    };

    App.prototype.bindEvents = function () {
        var ui = this.ui,
            self = this;

        document.addEventListener("shake", function () {
            var vibratePattern = self.timeTable.getLastActivityType() === "break" ? SHAKE_OUT : SHAKE_IN;

            if (document.visibilityState === "hidden") {
                // If application is hidden, vibration is disabled
                tizen.application.launch(self.tizenApp.appInfo.id);
            }
            self.vibrate(vibratePattern);
            self.takeABreak();
        }, true);

        document.addEventListener("timerMinuteChange", function (e) {
            var lastTimestamp = e.detail.oldCurrentTimer.lastTimestamp,
                quittingTime = self.timeTable.getEstimatedQuittingTime(self.getOption("workHours"), lastTimestamp);

            ui.refresh();
            if ((quittingTime - lastTimestamp) === 600) {
                if (document.visibilityState === "hidden") {
                    // If application is hidden, vibration is disabled
                    tizen.application.launch(self.tizenApp.appInfo.id);
                }
                self.vibrate(NOTIFICATION);
                tau.openPopup("#workEndPopup");
                setTimeout(tau.closePopup, 5000);
            }
        }, true);

        document.addEventListener("timerHourChange", function () {
            if (document.visibilityState === "hidden") {
                // If application is hidden, vibration is disabled
                tizen.application.launch(self.tizenApp.appInfo.id);
            }
            self.vibrate(NOTIFICATION);
            tau.openPopup("#eyePopup");
            setTimeout(tau.closePopup, 5000);
        }, true);

        this.ui.bindEvents();

    };

    App.prototype.init = function () {
        var timeTable;

        this.ui.init();
        this.timer = new Timer(document.getElementById("clock"));
        timeTable = new TimeTable(document.getElementById("timeTable"));

        this.shakeGesture = new Gesture(document);

        //tizen.power.turnScreenOn();
        //tizen.power.request("SCREEN", "SCREEN_NORMAL");

        timeTable = (localStorage && localStorage.getItem("timeTable")) || timeTable;
        this.timeTable = timeTable;

        this.setMode("start");
        this.bindEvents();
    };

    App.prototype.exit = function () {
        tizen.application.getCurrentApplication().exit();
    };

    return new App();
}());


(function () {
    "use strict";

    window.addEventListener("tizenhwkey", function (ev) {
        if (ev.keyName === "back") {
            if (tau.activePage.id === "main") {
                try {
                    localStorage.setItem("timeTable", app.timeTable);
                } catch (ignore) {
                }
            } else {
                tau.back();
            }
        }
    });

    window.addEventListener("tauinit", function () {
        app.init();
    }, false);
}());