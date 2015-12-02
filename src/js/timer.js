/*globals requestAnimationFrame, cancelAnimationFrame, CustomEvent*/
/*jslint browser: true*/
var Timer = (function () {
    "use strict";

    var Timer = function (clockElement) {
            this.isRunning = false;
            this.clockElement = null;
            this.currentTimer = {
                seconds: null,
                minutes: null,
                hours: null,
                lastTimestamp: 0
            };
            this.init(clockElement);
        },
        rafID = null;

    Timer.prototype.getCurrentTimestamp = function () {
        return Math.floor(Date.now() / 1000);
    };

    Timer.prototype.updateCurrentTimer = function () {
        var currentTimer = this.currentTimer,
            hours = currentTimer.hours,
            minutes = currentTimer.minutes,
            seconds = currentTimer.seconds,
            event,
            hourChange = false,
            minuteChange = false,
            eventDetail;

        if (hours < 0 || minutes < 0 || seconds < 0) {
            return;
        }

        if (seconds >= 60) {
            minutes += Math.floor(seconds / 60);
            seconds = seconds % 60;
            minuteChange = true;
        }

        if (minutes >= 60) {
            hours += Math.floor(minutes / 60);
            minutes = minutes % 60;
            hourChange = true;
        }

        eventDetail = {
            "detail": {
                "oldCurrentTimer": currentTimer,
                "currentTimer": {
                    "hours": hours,
                    "minutes": minutes,
                    "seconds": seconds,
                    "lastTimestamp": 1
                }
            }
        };

        if (hourChange) {
            event = new CustomEvent("timerHourChange", eventDetail);
            document.dispatchEvent(event);
        }

        if (minuteChange) {
            event = new CustomEvent("timerMinuteChange", eventDetail);
            document.dispatchEvent(event);
        }

        currentTimer.seconds = seconds;
        currentTimer.minutes = minutes;
        currentTimer.hours = hours;

    };

    Timer.prototype.print = function () {
        var currentTimer = this.currentTimer,
            hours,
            minutes,
            seconds;

        this.updateCurrentTimer();

        if (!this.clockElement) {
            return;
        }

        seconds = currentTimer.seconds;
        minutes = currentTimer.minutes;
        hours = currentTimer.hours;

        seconds = (seconds < 10 ? "0" : "") + seconds;
        minutes = (minutes < 10 ? "0" : "") + minutes;
        hours = (hours < 10 ? "0" : "") + hours;

        this.clockElement.innerHTML = hours + ":" + minutes + ":" + seconds;
    };

    Timer.prototype.tick = function (stop) {
        var currentTimestamp = this.getCurrentTimestamp(),
            lastTimestamp = this.currentTimer.lastTimestamp;


        if (currentTimestamp !== lastTimestamp) {
            this.currentTimer.lastTimestamp = currentTimestamp;
            this.currentTimer.seconds += currentTimestamp - lastTimestamp;
            this.print();
        }

        if (stop !== true) {
            rafID = requestAnimationFrame(this.tick.bind(this));
        }
    };

    Timer.prototype.reset = function () {
        var currentTimer = this.currentTimer;

        currentTimer.seconds = 0;
        currentTimer.minutes = 0;
        currentTimer.hours = 0;
        currentTimer.lastTimestamp = 0;
        this.print();
    };

    Timer.prototype.start = function () {
        var timestamp = this.getCurrentTimestamp();

        if (rafID !== null) {
            this.stop();
        }

        this.reset();
        this.currentTimer.lastTimestamp = timestamp;
        rafID = requestAnimationFrame(this.tick.bind(this));
        this.isRunning = true;
        return timestamp;
    };

    Timer.prototype.stop = function () {
        cancelAnimationFrame(rafID);
        rafID = null;

        this.tick(true);
        this.isRunning = false;
        return this.currentTimer.lastTimestamp;
    };

    Timer.prototype.init = function (element) {
        this.clockElement = element;
    };

    return Timer;
}());
