/*globals CustomEvent*/
/*jslint browser: true*/

var Gesture = (function () {
    "use strict";

    var SHAKE_THRESHOLD = 40,
        SHAKE_TIMEOUT_MIN = 200,
        SHAKE_TIMEOUT_MAX = 1500,
        SHAKE_TIMEOUT_LOCK = 3000,
        Gesture = function (element) {
            var self = this;

            self.element = element || document;
            self.motionListenerBound = null;
            self.listenLevel = 0;
            self.init();

        },
        lastPeakTime = null;

    Gesture.prototype.trigger = function () {
        var event = new CustomEvent("shake", false, true);
        this.element.dispatchEvent(event);

        // Lock event listener
        this.stopListener();
        window.setTimeout(this.startListener.bind(this), SHAKE_TIMEOUT_LOCK);
    };

    Gesture.prototype.motionListener = function (e) {
        var acc = e.acceleration,
            x = Math.abs(Math.round(acc.x)),
            y = Math.abs(Math.round(acc.y)),
            z = Math.abs(Math.round(acc.z)),
            peakTime,
            diff;

        if (x >= SHAKE_THRESHOLD || y >= SHAKE_THRESHOLD || z >= SHAKE_THRESHOLD) {
            peakTime = Date.now();
            diff = peakTime - lastPeakTime;
            if (SHAKE_TIMEOUT_MIN <= diff && diff <= SHAKE_TIMEOUT_MAX) {
                this.trigger();
            }
            lastPeakTime = peakTime;
        }
    };

    Gesture.prototype.startListener = function () {
        lastPeakTime = Date.now();
        window.addEventListener("devicemotion", this.motionListenerBound, true);
    };

    Gesture.prototype.stopListener = function () {
        window.removeEventListener("devicemotion", this.motionListenerBound, true);
    };

    Gesture.prototype.init = function () {
        this.motionListenerBound = this.motionListener.bind(this);
    };

    Gesture.prototype.destroy = function () {
        this.stopListener();
    };

    return Gesture;
}());



