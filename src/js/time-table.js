/*jslint browser: true, plusplus: true*/

var TimeTable = (function () {
    "use strict";

    var TimeTable = function (logList) {
            this.logListElement = null;
            this.table = {
                workStart: null,
                workEnd: null,
                activity: []
            };

            this.init(logList);
        };

    function timestampToTime(timestamp) {
        var d, h, m;

        if (!timestamp) {
            return "--:--";
        }

        // Timer class returns UNIX Timestamp (number of seconds...)
        d = new Date(timestamp * 1000);
        h = d.getHours();
        m = d.getMinutes();

        h = (h < 10 ? "0" : "") + h;
        m = (m < 10 ? "0" : "") + m;

        return h + ":" + m;
    }

    function createListElement(activity) {
        var duration = "",
            durationTime = activity.duration,
            h,
            m,
            s,
            tmp;

        if (durationTime > 0 && activity.type === "break") {
            h = Math.floor(activity.duration / 3600);
            m = Math.floor(activity.duration / 60);
            s = activity.duration % 60;

            if (h > 0) {
                duration = " (" + h + ":" + m + ")";
            } else {
                if (m > 0) {
                    duration = " (" + m + " " + (m > 1 ? "mins" : "min") + ")";
                } else {
                    duration = " (" + s + " " + (s > 1 ? "secs" : "sec") + ")";
                }
            }
        }

        tmp = document.createElement("li");
        tmp.className = "li-has-multiline";

        tmp.innerHTML = timestampToTime(activity.start)
            + '<span class="li-text-sub">'
            + activity.name
            + duration
            + '</span>';

        return tmp;
    }

    TimeTable.prototype.getActivityStats = function (currentTimestamp) {
        var table = this.table,
            activities = table.activity,
            activitiesLength = activities.length,
            tmpAct,
            workSum = 0,
            breakSum = 0,
            i;

        if (activitiesLength === 0) {
            return {
                workTime: 0,
                breakTime: 0
            };
        }

        // Get all without last one
        for (i = 0; i < activitiesLength - 1; i++) {
            tmpAct = activities[i];

            if (tmpAct.duration > 0) {
                if (tmpAct.type === "break") {
                    breakSum += tmpAct.duration;
                } else {
                    workSum += tmpAct.duration;
                }
            }
        }

        tmpAct = activities[activitiesLength - 1];
        if (tmpAct.type === "break") {
            breakSum += currentTimestamp - tmpAct.start;
        } else {
            workSum += currentTimestamp - tmpAct.start;
        }

        return {
            workTime: workSum,
            breakTime: breakSum
        };
    };

    TimeTable.prototype.getLastActivityType = function () {
        var activities = this.table.activity;

        if (activities.length === 0) {
            return null;
        }

        return activities[activities.length - 1].type;
    };

    TimeTable.prototype.refresh = function () {
        var i,
            logListElement = this.logListElement,
            activities = this.table.activity,
            activitiesLength = activities.length,
            docFragment = document.createDocumentFragment();

        // Clear elements
        while (logListElement.firstChild) {
            logListElement.removeChild(logListElement.firstChild);
        }

        for (i = activitiesLength - 1; i >= 0; i--) {
            docFragment.appendChild(createListElement(activities[i]));
        }

        if (activitiesLength === 0) {
            docFragment.appendChild(createListElement({
                name: "No work activity found",
                start: null
            }));
        }

        logListElement.appendChild(docFragment);
    };

    TimeTable.prototype.getEstimatedQuittingTime = function (workHours, currentTimestamp) {
        var table = this.table,
            activityStats;

        if (table.activity.length === 0) {
            return null;
        }

        if (table.workEnd) {
            return table.workEnd;
        }

        activityStats = this.getActivityStats(currentTimestamp);
        return table.workStart + activityStats.breakTime + workHours * 3600;
    };

    TimeTable.prototype.getBreakTime = function (currentTimestamp) {
        var activityStats;

        activityStats = this.getActivityStats(currentTimestamp);
        return activityStats.breakTime;
    };

    TimeTable.prototype.pushActivity = function (activity) {
        var table = this.table,
            tableActivity = table.activity,
            tableActivityLength,
            tmpAct;

        switch (activity.type) {
        case "start":
            this.reset();
            table.workStart = activity.start;
            break;
        case "end":
            table.workEnd = activity.start;
            break;
        }

        if (activity.type === "") {
            activity.type = "break";
        }

        tableActivityLength = tableActivity.push(activity);

        // Update duration time for previous activity
        if (tableActivityLength > 1) {
            tmpAct = tableActivity[tableActivityLength - 2];
            tmpAct.duration = activity.start - tmpAct.start;
        }

        table.activity = tableActivity;
        this.refresh();
    };

    TimeTable.prototype.reset = function () {
        var table = this.table;

        table.workStart = null;
        table.workEnd = null;
        table.activity = [];
        this.refresh();
    };

    TimeTable.prototype.init = function (element) {
        this.logListElement = element;
        this.refresh();
    };

    return TimeTable;
}());
