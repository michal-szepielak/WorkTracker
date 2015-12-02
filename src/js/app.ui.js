/*globals app*/
/*jslint browser: true*/
(function (app) {
    "use strict";

    var AppUI = function () {
            this.elements = {
                startButton: null,
                endButton: null,
                workButton: null,
                breakButtonIcon: null,
				breakButtonSmall: null,
                quittingTime: null,
                breakTimer: null,
                shakeSetting: null,
                eyeBreakSetting: null,
                breakHoursSetting: null,
                workingHoursSetting: null,
                breakDurationCaption: null
            };
        };

    function clickChangeNumber() {
        var number = this.parentNode.querySelector(".number"),
            val = parseInt(number.innerHTML, 10) || 0,
            step = parseInt(number.getAttribute("data-step"), 10) || 1,
            max = parseInt(number.getAttribute("data-max"), 10) || 12,
            min = parseInt(number.getAttribute("data-min"), 10) || 0;

        if (this.classList.contains("fa-caret-right")) {
            val = max > val ? val + step : max;
        } else {
            val = min < val ? val - step : min;
        }
        number.innerHTML = val;
    }

    function getNumberElementFromPopupElement(element) {
        while (!element.classList.contains("ui-popup") && element.parentElement && element !== document.body) {
            element = element.parentElement;
        }

        if (!element.classList.contains("ui-popup")) {
            return null;
        }

        return element.querySelector(".number");
    }

    function clickSaveSetting(property) {
        var value;

        value = getNumberElementFromPopupElement(this);
        value = parseInt(value.innerHTML, 10);
        app.setOption(property, value);
    }

    function initNumberControls() {
        var controls = document.querySelectorAll(".input-number .fa-caret-left, .input-number .fa-caret-right"),
            ctrl,
            workingHoursSaveBtn = document.getElementById("workingHoursSave"),
            breakHoursSave = document.getElementById("breakHoursSave"),
            i;

        for (i = 0; i < controls.length; i++) {
            ctrl = controls[i];
            ctrl.onclick = clickChangeNumber;
        }

        workingHoursSaveBtn.addEventListener("vclick", clickSaveSetting.bind(workingHoursSaveBtn, "workHours"), false);
        breakHoursSave.addEventListener("vclick", clickSaveSetting.bind(breakHoursSave, "breakHours"), false);
    }

    function formatTimeString(timestamp) {
        var timeString,
            date,
            h,
            m;

        if (!timestamp) {
            timeString = "--:--";
            //<small>P.M.</small>
        } else {
            date = new Date(timestamp * 1000);
            h = date.getHours();
            m = date.getMinutes();

            h = (h < 10 ? "0" : "") + h;
            m = (m < 10 ? "0" : "") + m;

            timeString = h + ":" + m;
        }
        return timeString;
    }

    function formatTimeDurationString(durationTime, showSeconds) {
        var timeString = "",
            durationNegative = (durationTime < 0),
            h,
            m,
            s;

        durationTime = Math.abs(durationTime);
        showSeconds = showSeconds || false;

        if (!durationTime) {
            timeString = "-";
        } else {
            h = Math.floor(durationTime / 3600);
            m = Math.floor((durationTime - h * 3600) / 60);
            s = durationTime % 60;

            if (h !== 0) {
                timeString = h + " <small>" + (Math.abs(h) > 1 ? "hours" : "hour") + "</small> ";
            }

            if (m !== 0) {
                timeString += m + " <small>" + (Math.abs(m) > 1 ? "mins" : "min") + "</small>";
            }

            if ((s !== 0 && showSeconds) || (h === 0 && m === 0)) {
                timeString += s + " <small>" + (Math.abs(s) > 1 ? "secs" : "sec") + "</small>";
            }
        }
        return (durationNegative ? "- " : "") + timeString;
    }

    AppUI.prototype.init = function () {
        var elements = this.elements;

        elements.startButton = document.getElementById("startButton");
        elements.endButton = document.getElementById("endButton");
        elements.workButton = document.getElementById("workButton");
        elements.breakButtonIcon = document.getElementById("breakButtonIcon");
		elements.breakButtonSmall = document.getElementById("breakButtonSmall");
        elements.quittingTime = document.getElementById("quittingTime");
        elements.breakTimer = document.getElementById("breakLeft");
        elements.shakeSetting = document.getElementById("shakeSetting");
        elements.eyeBreakSetting = document.getElementById("eyeBreakSetting");
        elements.breakHoursSetting = document.getElementById("breakHoursSetting");
        elements.workingHoursSetting = document.getElementById("workingHoursSetting");

        elements.breakDurationCaption = document.getElementById("breakDurationCaption");
        elements.workDurationCaption = document.getElementById("workDurationCaption");

        initNumberControls();
    };

    AppUI.prototype.bindEvents = function () {
        var elements = this.elements,
            self = this;

        // Buttons
        elements.startButton.addEventListener("vclick", app.startWork.bind(app), false);
        elements.endButton.addEventListener("vclick", app.endWork.bind(app), false);
        elements.breakButtonIcon.addEventListener("vclick", app.takeABreak.bind(app), false);
		elements.breakButtonSmall.addEventListener("vclick", app.takeABreak.bind(app), false);
        elements.workButton.addEventListener("vclick", app.takeABreak.bind(app), false);

        // Popup setting - break time
        elements.breakHoursSetting.addEventListener("popupbeforeshow", function () {
            var number = getNumberElementFromPopupElement(this);
            number.innerHTML = app.getOption("breakHours");
        }, false);

        // Popup setting - work day time
        elements.workingHoursSetting.addEventListener("popupbeforeshow", function () {
            var number = getNumberElementFromPopupElement(this);
            number.innerHTML = app.getOption("workHours");
        }, false);

        // Popup setting - gesture on/off
        elements.shakeSetting.addEventListener("change", function () {
            var shake = app.setOption("shake", this.checked);

            if (!shake) {
                app.shakeGesture.stopListener();
            } else if (self.currentMode === "work" || self.currentMode === "break") {
                app.shakeGesture.startListener();
            }
        }, false);

        // Popup setting - gesture on/off
        elements.eyeBreakSetting.addEventListener("change", function () {
            app.setOption("eyeBreak", this.checked);
        }, false);

        // Setting page
        document.getElementById("settings").addEventListener("pagebeforeshow", function () {
            self.refresh();
        }, false);
    };

    AppUI.prototype.setMode = function (mode) {
        var uiElements = this.elements,
            startButton = uiElements.startButton.classList,
            workButton = uiElements.workButton.classList,
            endButton = uiElements.endButton.classList,
            breakButtonIcon = uiElements.breakButtonIcon.classList,
			breakButtonSmall = uiElements.breakButtonSmall.classList;

        switch (mode) {
        case "start":
            // Timer is off, waiting for work start
            startButton.remove("hidden");
            workButton.add("hidden");
            endButton.add("hidden");
            breakButtonIcon.remove("active");
            breakButtonIcon.add("hidden");
			breakButtonSmall.remove("active");
			breakButtonSmall.add("hidden");
            break;

        case "work":
            // Timer is on and measure WORK time
            startButton.add("hidden");
            workButton.add("hidden");
            endButton.remove("hidden");
            breakButtonIcon.remove("active");
            breakButtonIcon.remove("hidden");
			breakButtonSmall.remove("active");
			breakButtonSmall.remove("hidden");
            break;

        case "break":
            // Timer is on and measure BREAK time
            startButton.add("hidden");
            workButton.remove("hidden");
            endButton.add("hidden");
            breakButtonIcon.add("active");
            breakButtonIcon.remove("hidden");
			breakButtonSmall.add("active");
			breakButtonSmall.remove("hidden");
            break;
        }
    };

    AppUI.prototype.refresh = function () {
        this.updateBreakTime();
        this.updateQuittingTime();
        this.elements.shakeSetting.checked = app.getOption("shake");
        this.elements.eyeBreakSetting.checked = app.getOption("eyeBreak");
        this.updateBreakDurationCaption(app.getOption("breakHours"));
        this.updateWorkDurationCaption(app.getOption("workHours"));
    };

    AppUI.prototype.updateQuittingTime = function () {
        var quittingTime;

        quittingTime = app.timeTable.getEstimatedQuittingTime(app.getOption("workHours"), app.timer.getCurrentTimestamp());
        this.elements.quittingTime.innerHTML = formatTimeString(quittingTime);
    };

    AppUI.prototype.updateBreakTime = function () {
        var breakTime;

        breakTime = app.timeTable.getBreakTime(app.timer.getCurrentTimestamp());
        breakTime = app.getOption("breakHours") * 60 - breakTime;
        this.elements.breakTimer.innerHTML = formatTimeDurationString(breakTime);
    };

    AppUI.prototype.updateBreakDurationCaption = function (durationTime) {
        this.elements.breakDurationCaption.innerHTML = formatTimeDurationString(durationTime * 60);
    };

    AppUI.prototype.updateWorkDurationCaption = function (durationTime) {
        this.elements.workDurationCaption.innerHTML = formatTimeDurationString(durationTime * 3600);
    };



    app.ui = new AppUI();
}(app));
