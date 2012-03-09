/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.period.js"/>
	
var period;

module("canvascontrols.period", {
	setup: function() {
		period = new canvascontrols.Period();
	},
	teardown: function() {
		period = null;
	}
});

test("has initial values", function () {
	equal(period.getZoomLevel(), 0);
	equal(period.getStart().toDateString(), new Date().toDateString());
});

test("can initialize with options", function () {
	var expectedDate = new Date(2012, 1, 1);
	period = new canvascontrols.Period(new canvascontrols.PeriodState({ start: expectedDate }));
	equal(period.getStart(), expectedDate);
});

test("model has name", function () {
    period = new canvascontrols.Period();
    equal("Undefined", period.getName());

    period = new canvascontrols.Period(new canvascontrols.Day());
    equal("Day", period.getName());

    period = new canvascontrols.Period(new canvascontrols.Month());
    equal("Month", period.getName());

    period = new canvascontrols.Period(new canvascontrols.Quarter());
    equal("Quarter", period.getName());

    period = new canvascontrols.Period(new canvascontrols.Year());
    equal("Year", period.getName());
});

test("can initialize as month", function () {
	period = new canvascontrols.Period(new canvascontrols.Month());
	
	equal(period.getZoomLevel(), 12);
	equal(period.getStart().toDateString(), new Date(
	    new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toDateString());
});

test("can initialize as day", function () {
	period = new canvascontrols.Period(new canvascontrols.Day());

	equal(period.getZoomLevel(), 30);
	equal(period.getStart().toDateString(), new Date(
	    new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toDateString());
});

test("shifting day left subtracts one day", function () {
	period = new canvascontrols.Period(new canvascontrols.Day());
	period.shift(-1);
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	equal(period.getStart().getDate(), yesterday.getDate());
});

test("shifting day right adds one day", function () {
	period = new canvascontrols.Period(new canvascontrols.Day());
	period.shift(1);
	var tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	equal(period.getStart().getDate(), tomorrow.getDate());
});

test("zooming in day from 1 does nothing", function () {
    period = new canvascontrols.Period(new canvascontrols.Day({ zoom: 1 }));
    equal(period.getZoomLevel(), 1);
    period.zoomIn();
    equal(period.getZoomLevel(), 1);
});

test("zooming out day from 1 changes to 2", function() {
    period = new canvascontrols.Period(new canvascontrols.Day({ zoom: 1 }));
    period.zoomOut();
	equal(period.getZoomLevel(), 2);
});

test("zooming in day from 30 changes to 29", function () {
    period = new canvascontrols.Period(new canvascontrols.Day({ zoom: 30 }));
	period.zoomIn();
	equal(period.getZoomLevel(), 29);
});

test("zooming out day from 29 changes to 30", function () {
	period = new canvascontrols.Period(new canvascontrols.Day({ zoom: 29 }));
	period.zoomOut();
	equal(period.getZoomLevel(), 30);
});

test("fills view array with days and sets header on first and first of month including subheader on weeks", function () {
    period = new canvascontrols.Period(new canvascontrols.Day({ start: new Date(2012, 0, 15)}));
    var view = period.getView();
    equal(view.length, 31);
    equal(view.StartHeader, "Jan 2012");
    equal(view[1].Header, null);
    equal(view[1].Label, 15);
    equal(view[1].Subheader, false);
    equal(parseInt(view[1].Proportion*1000)/1000, 0.033);
    equal(view[2].Header, null);
    equal(view[2].Label, 16);
    equal(view[2].Subheader, true);
    equal(view[3].Subheader, false);
    equal(view[9].Subheader, true);
    equal(view[17].Header, null);
    equal(view[17].Label, 31);
    equal(view[18].Header, "Feb 2012");
    equal(view[18].Label, 1);
});

test("fills view array with days and sets header on first and first of month including subheader on weeks", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ start: new Date(2012, 0, 15), zoom : 12 }));
	var view = period.getView();
	equal(view.length, 13);
	equal(view.StartHeader, "2012");
	equal(view[1].Header, 2012);
	equal(view[1].Label, "Jan");
	equal(view[1].Subheader, true);
	equal(parseInt(view[1].Proportion * 1000) / 1000, 0.084);
	equal(view[2].Header, null);
	equal(view[2].Label, "Feb");
	equal(view[2].Subheader, false);
	equal(view[2].DaysInMonth, 29);
	equal(parseInt(view[2].Proportion * 1000) / 1000, 0.079);
	equal(view[4].Label, "Apr");
	equal(view[4].Subheader, true);
	equal(view[10].Header, null);
	equal(view[10].Label, "Okt");
	equal(view[10].Subheader, true);
	equal(view[10].DaysInMonth, 31);
	equal(parseInt(view[10].Proportion * 1000) / 1000, 0.084);
	
});

test("fills view array with days and sets header on first and first of month including subheader on weeks", function () {
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: new Date(2012, 0, 1), zoom:8 }));
	var view = period.getView();
	equal(view.length, 9);
	equal(parseInt(view[1].Proportion*1000)/1000, 0.124);

});

test("zoom out day from 30 changes to month", function () {
	period = new canvascontrols.Period(new canvascontrols.Day({start: new Date(2012, 0, 1), zoom: 30}));
	equal(period.getZoomLevel(), 30);
	period.zoomOut();
	equal(period.getName(), "Month");
	equal(period.getZoomLevel(), 1);
});

test("day zoomTo zooms to selected day", function () {
	period = new canvascontrols.Period(new canvascontrols.Day({start: new Date(2012, 0, 1)}));
	period.zoomTo(new Date(2012, 0, 3));
	equal(period.getName(), "Day");
	equal(period.getZoomLevel(), 1);
	equal(period.getStart().getDate(), 3);
});

test("zoom out day passes year and month", function () {
	var nextMonth = createDayNextMonth();
	period.zoomOut();
	equal(nextMonth.getFullYear(), period.getStart().getFullYear());
	equal(nextMonth.getMonth(), period.getStart().getMonth());
	equal(1, period.getStart().getDate());
});

test("day getend returns ms before midnight last day of period", function () {
	period = new canvascontrols.Period(new canvascontrols.Day({ start: new Date(2012, 0, 1) }));
	equal(period.getEnd().getDate(), 30);
	equal(period.getEnd().getHours(), 23);
	equal(period.getEnd().getMinutes(), 59);
});

test("day getviewstart returns day before start", function () {
	period = new canvascontrols.Period(new canvascontrols.Day({ start: new Date(2012, 0, 1) }));
	equal(period.getViewStart().getMonth(), 11);
	equal(period.getViewStart().getDate(), 31);
});


test("shifting month left subtracts one month", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ start: new Date(2012, 0, 1) }));
	period.shift(-1);
	equal(period.getStart().getFullYear(), 2011);
	equal(period.getStart().getMonth(), 11);
});

test("shifting month view left adds one month", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ start: new Date(2011, 11, 1) }));
	period.shift(1);
	equal(period.getStart().getFullYear(), 2012);
	equal(period.getStart().getMonth(), 0);
});

test("fills view array with months and sets header on first and years including subheader for quarters", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ start: new Date(2012, 3, 1) }));
	var view = period.getView();
	equal(view.length, 13);
	equal(view.StartHeader, "2012");
	equal(view[1].Header, null);
	equal(view[1].Label, "Apr");
	equal(view[1].Subheader, true);
	equal(view[2].Header, null);
	equal(view[2].Label, "Mai");
	equal(view[2].Subheader, false);
	equal(view[4].Label, "Jul");
	equal(view[4].Subheader, true);
	equal(view[10].Header, "2013");
	equal(view[10].Label, "Jan");
	equal(view[10].Subheader, true);
});

test("zooming in month from 1 changes to day view of same month, and then one more day", function () {
	var period = new canvascontrols.Period(new canvascontrols.Month({zoom:1}));
	equal(period.getName(), "Month");
	period.zoomIn();
	equal(period.getName(), "Day");
	equal(period.getZoomLevel(), 30);
});

test("zooming out month from 11 changes to 12", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ zoom: 11 }));
	period.zoomOut();
	equal(period.getName(), "Month");
	equal(period.getZoomLevel(), 12);
});

test("zooming out month from 12 changes to quarter view at lvl 4 from same quarter", function () {
	var may = new Date(2012, 4, 15);
	period = new canvascontrols.Period(new canvascontrols.Month({ start: may }));
	period.zoomOut();
	equal(period.getZoomLevel(), 4);
	equal(period.getName(), "Quarter");
	equal(period.getStart().getFullYear(), 2012);
	equal(period.getStart().getMonth(), 3);
});

test("month zoomTo returns day view for selected month", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ start: new Date(2012, 0, 1) }));
	period.zoomTo(new Date(2012, 2, 1));
	equal(period.getName(), "Day");
	equal(period.getZoomLevel(), 30);
	equal(period.getView().StartHeader, "Mar 2012");
});

test("month getend returns start plus zoomLevel months", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ start: new Date(2012, 0, 1) }));
	equal(period.getEnd().getMonth(), 11);
	equal(period.getEnd().getDate(), 31);
	equal(period.getEnd().getHours(), 23);
	equal(period.getEnd().getMinutes(), 59);
});

test("month getviewstart returns month before start", function () {
	period = new canvascontrols.Period(new canvascontrols.Month({ start: new Date(2012, 0, 1) }));
	equal(period.getViewStart().getMonth(), 11);
});


test("shifting quarter left subtracts 3 months", function() {
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: new Date(2012, 0, 1) }));
	period.shift(-1);
	equal(period.getStart().getFullYear(), 2011);
	equal(period.getStart().getMonth(), 9);
});

test("shifting quarter right adds 3 months", function() {
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: new Date(2011, 9, 1) }));
	period.shift(1);
	equal(period.getStart().getFullYear(), 2012);
	equal(period.getStart().getMonth(), 0);
});

test("fills view array with quarter and sets header on first and years", function () {
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: new Date(2012, 3, 1), zoom: 6 }));
	var view = period.getView();
	equal(view.length, 7);
	equal(view.StartHeader, "2012");
	equal(view[1].Header, null);
	equal(view[1].Label, "Q2");
	equal(view[1].Subheader, false);
	equal(view[2].Header, null);
	equal(view[2].Label, "Q3");
	equal(view[4].Header, "2013");
	equal(view[4].Label, "Q1");
	equal(view[6].Header, null);
	equal(view[6].Label, "Q3");
});

test("zooming in quarter from 4 changes to month view from same quarter", function () {
	var april = new Date(2012, 3, 15);
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: april }));
	period.zoomIn();
	equal(period.getName(), "Month");
	equal(period.getStart().getFullYear(), 2012);
	equal(period.getStart().getMonth(), 3);
});

test("zooming out quarter from 4 changes to 5", function () {
	var april = new Date(2012, 3, 15);
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: april }));
	period.zoomOut();
	equal(period.getName(), "Quarter");
	equal(period.getZoomLevel(), 5);
});

test("zooming out quarter from 8 changes to year view zoom 2 from same year", function () {
	var april = new Date(2012, 3, 15);
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: april, zoom: 8 }));
	period.zoomOut();
	equal(period.getName(), "Year");
	equal(period.getZoomLevel(), 2);
	equal(period.getStart().getFullYear(), 2012);
	equal(period.getStart().getMonth(), 0);
});

test("quarter zoomTo zooms to selected three months", function () {
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: new Date(2012, 0, 1) }));
	period.zoomTo(1);
	equal(period.getName(), "Month");
	equal(period.getZoomLevel(), 3);
	equal(period.getView()[1].Label, "Apr");
});

test("quarter getend returns start plus 3*zoomlevel months minus a ms", function () {
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: new Date(2012, 0, 1) }));
	equal(period.getEnd().getMonth(), 11);
	equal(period.getEnd().getDate(), 31);
});

test("quarter getviewstart returns quarter before start", function () {
	period = new canvascontrols.Period(new canvascontrols.Quarter({ start: new Date(2012, 0, 1) }));
	equal(period.getViewStart().getMonth(), 9);
});


test("shifting year left subtracts one year", function () {
	period = new canvascontrols.Period(new canvascontrols.Year());
	period.shift(-1);
	equal(period.getStart().getFullYear(), new Date().getFullYear() - 1);
});

test("shifting year right adds one year", function () {
	period = new canvascontrols.Period(new canvascontrols.Year());
	period.shift(1);
	equal(period.getStart().getFullYear(), new Date().getFullYear() + 1);
});

test("fills view array with years and no headers", function () {
	period = new canvascontrols.Period(new canvascontrols.Year({ start: new Date(2012, 1, 1), zoom: 5 }));
	var view = period.getView();
	equal(view.length, 6);
	equal(view[1].Header, null);
	equal(view[1].Label, "2012");
	equal(view[1].Subheader, false);
	equal(view[2].Header, null);
	equal(view[2].Label, "2013");
	equal(view[5].Header, null);
	equal(view[5].Label, "2016");
});

test("zooming in year from 2 changes to quarter lvl 8 from same year", function () {
	period = new canvascontrols.Period(new canvascontrols.Year());
	period.zoomIn();
	equal(period.getName(), "Quarter");
	equal(period.getZoomLevel(), 8);
	equal(period.getStart().getFullYear(), new Date().getFullYear());
	equal(period.getStart().getMonth(), 0);
});

test("zooming in year from 3 changes to 2", function () {
	period = new canvascontrols.Period(new canvascontrols.Year({zoom: 3}));
	period.zoomIn();
	equal(period.getZoomLevel(), 2);
});

test("zooming out year from 5 changes to 6", function () {
	period = new canvascontrols.Period(new canvascontrols.Year({zoom: 5}));
	period.zoomOut();
	equal(period.getZoomLevel(), 6);
});

test("year zoomTo zooms to quarter view for selected year", function () {
	period = new canvascontrols.Period(new canvascontrols.Year({ start: new Date(2012, 0, 1), zoom: 4 }));
	period.zoomTo(2013);
	equal(period.getName(), "Quarter");
	equal(period.getView().StartHeader, "2013");
	equal(period.getZoomLevel(), 4);
});

test("year getend returns last day of last year", function () {
	period = new canvascontrols.Period(new canvascontrols.Year({ start: new Date(2012, 0, 1), zoom: 4 }));
	equal(period.getEnd().getFullYear(), 2015);
	equal(period.getEnd().getMonth(), 11);
	equal(period.getEnd().getDate(), 31);
});

test("year getviewstart returns year before start", function() {
	period = new canvascontrols.Period(new canvascontrols.Year({ start: new Date(2012, 0, 1), zoom: 4 }));
	equal(period.getViewStart().getFullYear(), 2011);
	equal(period.getViewStart().getMonth(), 0);
});

function createDayOne() {
	var options = $.extend(canvascontrols.Day(), { zoomLevel: 1 });
	period = new canvascontrols.Period(new canvascontrols.Day(options));
}

function createDayNextMonth(options) {
	var nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1);
	period = new canvascontrols.Period(new canvascontrols.Day($.extend({
		start: nextMonth
	}, options)));
	return nextMonth;
}
