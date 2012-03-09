(function (cc) {

    cc.MonthNames = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
    cc.QuarterNames = ["Q1", "Q2", "Q3", "Q4"];
    cc.MillisecondsInDay = 1000 * 60 * 60 * 24;

    cc.Period = Class.extend({
        init: function (periodState) {
            this.periodState = periodState ? periodState : new cc.PeriodState();

        },
        getZoomLevel: function () {
            return this.periodState.getZoomLevel();
        },
        getStart: function () {
            return this.periodState.getStart();
        },
        getEnd: function () {
            return this.periodState.getEnd();
        },
        getView: function () {
            return this.periodState.getView();
        },
        getViewStart: function () {
            return this.periodState.getViewStart();
        },
        getName: function () {
            return this.periodState.getName();
        },
        shift: function (amount) {
            this.periodState.shift(amount);
        },
        zoomIn: function () {
            if (!this.periodState.zoomIn()) {
                this.periodState = this.periodState.getInnerView();
            }
        },
        zoomOut: function () {
            if (!this.periodState.zoomOut()) {
                this.periodState = this.periodState.getOuterView();
            }
        },
        zoomTo: function (to) {
            this.periodState = this.periodState.zoomTo(to);
        }

    });

    cc.PeriodState = Class.extend({
        init: function (options) {
            options = $.extend({
                name: "Undefined",
                start: new Date(),
                zoom: 0
            }, options);

            this._startDate = options.start;
            this._zoomLevel = options.zoom;
            this._maxZoom = options.maxZoom;
            this._minZoom = options.minZoom;
            this._name = options.name;
        },
        getZoomLevel: function () {
            return this._zoomLevel;
        },
        getStart: function () {
            return this._startDate;
        },
        getEnd: function () {
            var date = this._cloneStart();
            this._setEnd(date);
            date.setMilliseconds(-1);
            return date;
        },
        getName: function () {
            return this._name;
        },
        zoomIn: function () {
            if (this._zoomLevel > this._minZoom) {
                this._zoomLevel--;
                return true;
            }
            return false;
        },
        zoomOut: function () {
            if (this._zoomLevel < this._maxZoom) {
                this._zoomLevel++;
                return true;
            }
            return false;
        },
        getView: function () {
            var view = [];
            var date = this.getViewStart();
            var daysInPeriod = Math.abs(
				(this.getStart().getTime() - this.getEnd().getTime()) / cc.MillisecondsInDay);

            for (var i = 0; i < this.getZoomLevel() + 1; i++) {
                view[i] = this._createViewPart(date, daysInPeriod);
                this._increaseViewDate(date);
            }
            view.StartHeader = this._createStartHeader();
            view.DaysInperiod = daysInPeriod;
            return view;
        },
        _cloneStart: function () {
            return new Date(this._startDate.getFullYear(), this._startDate.getMonth(), this._startDate.getDate());
        }

    });

    cc.Day = cc.PeriodState.extend({
        init: function (options) {
            options = $.extend({
                name: "Day",
                start: new Date(),
                zoom: 30,
                minZoom: 1,
                maxZoom: 30
            }, options);
            this._super(options);
        },
        shift: function (amount) {
            this._startDate.setDate(this._startDate.getDate() + amount);
        },
        zoomTo: function (to) {
            this._zoomLevel = 1;
            this._startDate.setFullYear(to.getFullYear());
            this._startDate.setMonth(to.getMonth());
            this._startDate.setDate(to.getDate());
            return this;
        },
        _setEnd: function (date) {
            date.setDate(date.getDate() + this._zoomLevel);
        },
        getViewStart: function () {
            var date = this._cloneStart();
            date.setDate(date.getDate() - 1);
            return date;
        },
        _increaseViewDate: function (date) {
            date.setDate(date.getDate() + 1);
        },
        _createStartHeader: function () {
            return cc.MonthNames[this._startDate.getMonth()] + " " + this._startDate.getFullYear();
        },
        _createViewPart: function (date) {
            return {
                Header: date.getDate() == 1 ? cc.MonthNames[date.getMonth()] + " " + date.getFullYear() : null,
                Label: date.getDate().toString(),
                Value: date.getDate(),
                Subheader: date.getDay() == 1,
                Active: new Date().getDate() == date.getDate() && new Date().getMonth() == date.getMonth() && new Date().getFullYear() == date.getFullYear(), //new Date().toDateString() == date.toDateString(),
                Proportion: 1 / this.getZoomLevel(),
                Date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                DateStart: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                DateEnd: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
                Units : 24
            };
        },
        getInnerView: function () {
            return this;
        },
        getOuterView: function () {
            return new cc.Month({
                start: new Date(this._startDate.getFullYear(), this._startDate.getMonth(), 1),
                zoom: 1
            });
        }
    });

    cc.Month = cc.PeriodState.extend({
        init: function (options) {
            options = $.extend({
                name: "Month",
                start: new Date(),
                zoom: 12,
                minZoom: 1,
                maxZoom: 12
            }, options);
            this._super(options);
        },
        shift: function (amount) {
            this._startDate.setMonth(this._startDate.getMonth() + amount);
        },
        zoomTo: function (to) {
            return new cc.Day({ start: new Date(to.getFullYear(), to.getMonth(), 1), zoom: 30 });
        },
        _setEnd: function (date) {
            date.setMonth(date.getMonth() + this._zoomLevel);
        },
        _increaseViewDate: function (date) {
            date.setMonth(date.getMonth() + 1);
        },
        _createStartHeader: function () {
            return this._startDate.getFullYear();
        },
        _createViewPart: function (date, daysInPeriod) {
            var daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

            return {
                Header: date.getMonth() == 0 ? date.getFullYear() : null,
                Label: cc.MonthNames[date.getMonth()],
                Value: date.getMonth(),
                Subheader: date.getMonth() % 3 == 0,
                Active: new Date().getMonth() == date.getMonth() && new Date().getFullYear() == date.getFullYear(),
                Proportion: daysInMonth / daysInPeriod,
                DaysInMonth: daysInMonth,
                Date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                DateStart: new Date(date.getFullYear(), date.getMonth(), 1),
                DateEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0),
                Units : daysInMonth
            };
        },
        getViewStart: function () {
            var date = this._cloneStart();
            date.setMonth(date.getMonth() - 1);
            return date;
        },
        getInnerView: function () {
            return new canvascontrols.Day({ start: this.getStart(), zoom: 30 });
        },
        getOuterView: function () {
            return new canvascontrols.Quarter({ start: new Date(this.getStart().getFullYear(), parseInt(this.getStart().getMonth() / 3) * 3, 1) });
        }
    });

    cc.Quarter = cc.PeriodState.extend({
        init: function (options) {
            options = $.extend({
                name: "Quarter",
                start: new Date(),
                zoom: 4,
                minZoom: 4,
                maxZoom: 8
            }, options);
            this._super(options);
        },
        shift: function (amount) {
            this._startDate.setMonth(this._startDate.getMonth() + amount * 3);
        },
        zoomTo: function (to) {
            var date = this._cloneStart();
            if (to instanceof Date) {
                date.setMonth(to.getMonth());
                date.setFullYear(to.getFullYear());
            } else {
                date.setMonth(to * 3);
            }
            return new canvascontrols.Month({ start: date, zoom: 3 });
        },
        _setEnd: function (date) {
            date.setMonth(date.getMonth() + this.getZoomLevel() * 3);
        },
        _increaseViewDate: function (date) {
            date.setMonth(date.getMonth() + 3);
        },
        _createStartHeader: function () {
            return this._startDate.getFullYear();
        },
        _createViewPart: function (date, daysInPeriod) {

            var qEnd = this._cloneStart();
            qEnd.setMonth(qEnd.getMonth() + 3);
            qEnd.setMilliseconds(-1);

            var daysInQuarter = Math.abs((this.getStart().getTime() - qEnd.getTime()) / cc.MillisecondsInDay);

            return {
                Header: date.getMonth() == 0 ? date.getFullYear() : null,
                Label: cc.QuarterNames[parseInt(date.getMonth() / 3)],
                Value: parseInt(date.getMonth() / 3),
                Subheader: false,
                Active: parseInt(new Date().getMonth() / 3) == parseInt(date.getMonth() / 3) && new Date().getFullYear() == date.getFullYear(),
                Proportion: daysInQuarter / daysInPeriod,
                Date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                DateStart: new Date(date.getFullYear(), date.getMonth(), 1),
                DateEnd: new Date(date.getFullYear(), date.getMonth() + 4, 0),
                Units: 4
            };
        },
        getViewStart: function () {
            var date = this._cloneStart();
            date.setMonth(date.getMonth() - 3);
            return date;
        },
        getInnerView: function () {
            return new canvascontrols.Month({ start: this.getStart(), zoom: 12 });
        },
        getOuterView: function () {
            var date = this._cloneStart();
            date.setMonth(0);
            return new canvascontrols.Year({ start: date, zoom: 2 });
        }
    });

    cc.Year = cc.PeriodState.extend({
        init: function (options) {
            options = $.extend({
                name: "Year",
                start: new Date(new Date().getFullYear(), 0, 1),
                zoom: 2,
                minZoom: 2,
                maxZoom: 10
            }, options);
            this._super(options);
        },
        shift: function (amount) {
            this._startDate.setFullYear(this._startDate.getFullYear() + amount);
        },
        zoomTo: function (to) {
            var q;
            if (to instanceof Date) {
                q = new canvascontrols.Quarter({ start: new Date(to.getFullYear(), 0, 1), zoom: 4 });
            } else {
                q = new canvascontrols.Quarter({ start: new Date(to, 0, 1), zoom: 4 });
            }
            return q;
        },
        _setEnd: function (date) {
            date.setFullYear(date.getFullYear() + this.getZoomLevel());
        },
        _increaseViewDate: function (date) {
            date.setFullYear(date.getFullYear() + 1);
        },
        _createStartHeader: function () {
            return this._startDate.getFullYear();
        },
        _createViewPart: function (date) {
            return {
                Header: null,
                Label: date.getFullYear().toString(),
                Value: date.getFullYear(),
                Subheader: false,
                Active: new Date().getFullYear() == date.getFullYear(), //new Date().toDateString() == date.toDateString(),
                Proportion: 1 / this.getZoomLevel(),
                Date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                DateStart: new Date(date.getFullYear(), date.getMonth(), 1),
                DateEnd : new Date(date.getFullYear(), 11, 31),
                Units : 12
            };
        },
        getViewStart: function () {
            var start = this._cloneStart();
            start.setFullYear(start.getFullYear() - 1);
            return start;
        },
        getInnerView: function () {
            return new canvascontrols.Quarter({ start: this.getStart(), zoom: 8 });
        },
        getOuterView: function () {
            return this;
        }
    });
})(canvascontrols);
