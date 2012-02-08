/// <reference path="jquery-1.7.1.js" />
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.timeline.js"/>
/// <reference path="canvascontrols.timelineboard.js"/>

var fakeView;

module("canvascontrols.timelineboard", {
	setup: function () {
		fakeView = new (function () {
			this.cleared = false;
			this.drawSteps = [];
			this.drawnBoxes = [];
			this.clear = function () {
				this.cleared = true;
				this.drawSteps = [];
				this.drawnBoxes = [];
			};
			this.drawLine = function (x1, y1, x2, y2) { this.drawSteps.push({ x1: x1, y1: y1, x2: x2, y2: y2 }); };
			this.drawBox = function(x, y, width, height, text) { this.drawnBoxes.push({ x: x, y: y, width: width, height: height, text: text }) };
			this.getWidth = function () { return 600; };
			this.getHeight = function () { return 500; };
		})();
	},
	teardown: function () {
		fakeView = null;
	}
});

test("can hold instance", function () {
	var controller = new canvascontrols.TimelineBoardController(fakeView);
	notEqual(controller, null);
});

test("initializer clears board", function () {
	canvascontrols.TimelineBoardController(fakeView);
	equals(fakeView.cleared, true);
});

test("draws lines when redraw called", function () {
	var controller = new canvascontrols.TimelineBoardController(fakeView);
	controller.redraw({ offset: 10.5, stepWidth: 50, period: new canvascontrols.Period(canvascontrols.Month()) });
	equals(fakeView.drawSteps.length, 13);
	equals(fakeView.drawSteps[0].x1, -39.5);
	equals(fakeView.drawSteps[1].x1, 10.5);
});

test("draws box at line 0 for item in model", function () {
	var model = [
		[{ label: "hei hei", start: new Date(2012, 2, 1), end: new Date(2012, 4, 15)}]
	];
	var stepWidth = 50;

	var controller = new canvascontrols.TimelineBoardController(fakeView);
	controller.setModel(model);

	controller.redraw({ offset: 10.5, stepWidth: stepWidth, period: new canvascontrols.Period($.extend(canvascontrols.Month(), { start: new Date(2012, 0, 1) })) });

	// føkking februar. :)
	equals(fakeView.drawnBoxes.length, 1);
	equals(fakeView.drawnBoxes[0].x, 110.5);
	equals(fakeView.drawnBoxes[0].width, stepWidth * 2.5);
});

test("draws box if item spans more than view", function () {
	var model = [
		[{ label: "hei hei", start: new Date(2012, 2, 1), end: new Date(2012, 4, 15, 23, 59, 59)}]
	];
	var stepWidth = 50;

	var controller = new canvascontrols.TimelineBoardController(fakeView);
	controller.setModel(model);

	controller.redraw({ offset: 10.5, stepWidth: stepWidth, period: 
			new canvascontrols.Period($.extend(canvascontrols.Day(), { start: new Date(2012, 3, 1) })) });

	equals(fakeView.drawnBoxes.length, 1);
	equals(fakeView.drawnBoxes[0].x, -39.5);
	equals(fakeView.drawnBoxes[0].width, 650);
});