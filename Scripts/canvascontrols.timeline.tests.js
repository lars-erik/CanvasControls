﻿/// <reference path="jquery-1.7.1.js" />
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.timeline.js"/>

var fakeView;

module("canvascontrols.timeline", {
	setup: function () {
		fakeView = new (function () {
			this.cleared = false;
			this.drawSteps = [];
			this.drawnHeaders = [];
			this.drawnLabels = [];
			this.clear = function () { 
				this.cleared = true;
				this.drawSteps = [];
				this.drawnHeaders = [];
				this.drawnLabels = [];
			};
			this.drawLine = function (x1, y1, x2, y2) { this.drawSteps.push({ x1: x1, y1: y1, x2: x2, y2: y2 }); };
			this.drawHeader = function (text, x, y) { this.drawnHeaders.push({ text: text, x: x, y: y }); };
			this.drawLabel = function (text, x, y, maxWidth) { this.drawnLabels.push({ text: text, x: x, y: y, maxWidth: maxWidth }); };
			this.getWidth = function () { return 600; };
			this.getHeight = function () { return 50; };
		})();
	},
	teardown: function () {
		fakeView = null;
	}
});

test("initializer calls clear", function () {
	canvascontrols.TimelineController(fakeView);
	ok(fakeView.cleared);
});

test("calculates step from view zoomLevel and draws long lines for headers including a bit long lines for subheaders", function () {
	canvascontrols.TimelineController(fakeView);
	var drawSteps = fakeView.drawSteps;
	equal(drawSteps.length, 13);
	equal(drawSteps[0].x1, -49.5);
	equal(drawSteps[0].y1, 0);
	equal(drawSteps[0].x2, -49.5);
	equal(drawSteps[0].y2, 45);
	equal(drawSteps[1].x1, .5);
	equal(drawSteps[1].y1, 20);
	equal(drawSteps[1].x2, .5);
	equal(drawSteps[1].y2, 45);
	equal(drawSteps[4].x1, 150.5);
	equal(drawSteps[4].y1, 20);
	equal(drawSteps[4].x2, 150.5);
	equal(drawSteps[4].y2, 45);
});

test("calls drawheader for startheader and headers", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period($.extend(canvascontrols.Month(), { start: new Date(2011, 9, 1) })));
	var headers = fakeView.drawnHeaders;
	equal(headers.length, 2);
	equal(headers[0].x, 5.5);
	equal(headers[0].y, 17);
	equal(headers[0].text, "2011");
	equal(headers[1].x, 155.5);
	equal(headers[1].y, 17);
	equal(headers[1].text, "2012");
});

test("does not draw startheader if first item has header", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period($.extend(canvascontrols.Month())));
	var headers = fakeView.drawnHeaders;
	equal(headers.length, 2);
	equal(headers[0].x, -44.5);
	equal(headers[0].y, 17);
	equal(headers[0].text, "2012");
	// TODO: Has been rewritten without testing, this test is false.
});

test("does not draw startheader if second item has header", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period($.extend(canvascontrols.Month(), { start: new Date(2012, 1, 1)})));
	var headers = fakeView.drawnHeaders;
	equal(headers.length, 2);
	equal(headers[0].x, -44.5);
	equal(headers[0].y, 17);
	equal(headers[0].text, "2012");
	// TODO: Has been rewritten without testing, this test is false.
});

test("calls drawlabel for each step", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period($.extend(canvascontrols.Month(), { start: new Date(2011, 11, 1) })));
	var labels = fakeView.drawnLabels;
	equal(labels.length, 13);
	equal(labels[0].x, -49.5);
	equal(labels[0].y, 38);
	equal(labels[0].text, "Nov");
	equal(labels[0].maxWidth, 50);
	equal(labels[12].x, 550.5);
	equal(labels[12].y, 38);
	equal(labels[12].text, "Nov");
	equal(labels[12].maxWidth, 50);
});

test("attaches eventhandlers", function() {
	canvascontrols.TimelineController(fakeView);
	equal(typeof(fakeView.dragStarted), "function");
	equal(typeof(fakeView.dragging), "function");
	equal(typeof(fakeView.dragStopped), "function");
	equal(typeof(fakeView.scrolled), "function");
	equal(typeof(fakeView.doubleClicked), "function");
});

test("moves offset, shifts right and redraws when dragging left", function () {
	canvascontrols.TimelineController(fakeView);
	fakeView.dragStarted(100);
	fakeView.dragging(90);
	equal(fakeView.drawSteps[0].x1, -9.5);
	equal(fakeView.drawnLabels[0].text, "Feb");
	fakeView.dragging(40);
	equal(fakeView.drawSteps[0].x1, -9.5);
	equal(fakeView.drawnLabels[0].text, "Mar");
	fakeView.dragging(0);
	equal(fakeView.drawSteps[0].x1, -49.5);
	equal(fakeView.drawnLabels[0].text, "Mar");
	fakeView.dragging(-100);
	equal(fakeView.drawSteps[0].x1, -49.5);
	equal(fakeView.drawnLabels[0].text, "May");
});

test("moves offset, shifts left and redraws when dragging right", function () {
	canvascontrols.TimelineController(fakeView);
	fakeView.dragStarted(100);
	fakeView.dragging(110);
	equal(fakeView.drawSteps[0].x1, -39.5);
	equal(fakeView.drawnLabels[0].text, "Jan");
	fakeView.dragging(150);
	equal(fakeView.drawSteps[0].x1, -49.5);
	equal(fakeView.drawnLabels[0].text, "Des");
	fakeView.dragging(205);
	equal(fakeView.drawSteps[0].x1, -44.5);
	equal(fakeView.drawnLabels[0].text, "Nov");
	fakeView.dragging(300);
	equal(fakeView.drawSteps[0].x1, -49.5);
	equal(fakeView.drawnLabels[0].text, "Sep");
});

test("does not move when drag stopped", function () {
	canvascontrols.TimelineController(fakeView);
	fakeView.dragStarted(100);
	fakeView.dragging(110);
	equal(fakeView.drawSteps[0].x1, -39.5);
	fakeView.dragStopped(120);
	equal(fakeView.drawSteps[0].x1, -29.5);
	fakeView.dragging(130);
	equal(fakeView.drawSteps[0].x1, -29.5);
});

test("zooms in on positive scroll", function () {
	canvascontrols.TimelineController(fakeView);
	equal(fakeView.drawSteps.length, 13);
	fakeView.scrolled({ x: 300 }, 120);
	equal(fakeView.drawSteps.length, 12);
	fakeView.scrolled({ x: 300 }, 120);
	equal(fakeView.drawSteps.length, 11);
	fakeView.scrolled({ x: 300 }, -240);
	equal(fakeView.drawSteps.length, 12);
});

test("zooms in from days 30", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period(canvascontrols.Day()));
	equal(fakeView.drawSteps.length, 31);
	fakeView.scrolled({ x: 300 }, 120);
	equal(fakeView.drawSteps.length, 30);
});

test("when zooming in moves left by 50% of new width", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period(canvascontrols.Month()));
	equal(fakeView.drawSteps[0].x1, -49.5);
	fakeView.scrolled({ x: 300 }, 120);
	equal(Math.round(fakeView.drawSteps[0].x1 * 100) / 100, -26.77);
	fakeView.scrolled({ x: 300 }, -120);
	equal(Math.round(fakeView.drawSteps[0].x1 * 100) / 100, -47.23);
	fakeView.scrolled({ x: 300 }, 120);
	equal(Math.round(fakeView.drawSteps[0].x1 * 100) / 100, -24.5);
	// TODO: Fix offset moving on scroll, should go back to -49.5
});

test("when zooming out moves right by 50% of new width", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period($.extend(canvascontrols.Month(), {zoomLevel: 12})));
	equal(fakeView.drawSteps[0].x1, -49.5);
	fakeView.scrolled({ x: 300 }, -120);
	equal(Math.round(fakeView.drawSteps[0].x1 * 100) / 100, -74.5);
	// TODO: Fix offset moving on scroll, should go back to -49.5
});

test("zooms to selected element when doubleclicked", function () {
	canvascontrols.TimelineController(fakeView, new canvascontrols.Period($.extend(canvascontrols.Month(), {start:new Date(2012,0,1)})));
	fakeView.doubleClicked({ x: 325 });
	equal(fakeView.drawSteps[1].x1, .5);
	equal(fakeView.drawnHeaders[0].text, "Jul 2012");
	equal(fakeView.drawnLabels[1].text, "1");
});

test("fires drawn event when drawn", function () {
	var draws = [];
	canvascontrols.TimelineController(
		fakeView,
		new canvascontrols.Period(canvascontrols.Month()),
		function (e) {
			draws.push(e);
		}
	);
	equals(draws.length, 1);
	fakeView.dragStarted(100);
	fakeView.dragging(90);
	fakeView.dragStopped(80);
	equals(draws.length, 3);
	equals(draws[0].offset, .5);
	equals(draws[0].period.getZoomLevel(), 12);
	equals(draws[1].offset, 40.5);
	equals(draws[2].offset, 30.5);
});