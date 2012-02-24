/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="Mock.js"/>
/// <reference path="MockContext.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.observable.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.canvasview.js"/>
/// <reference path="canvascontrols.dragging.js"/>

var mock = new MockContext();
var dragView;
var canvasX;
var canvasY;

module("canvascontrols.dragging", {
	setup: function () {
		mock.reset();
		createCanvas();
		dragView = createView("canvas");
	},
	teardown: function () {
		delete dragView;
		$("canvas", document.body).remove();
	}
});

function createView(selector) {
	return new canvascontrols.DragView(selector);
}

function createCanvas() {
	$(document.body).append("<canvas></canvas>");
}

function updatePosition() {
	canvasX = $("canvas").offset().left;
	canvasY = $("canvas").offset().top;
}

function triggerMouseMove(x, y) {
	$("canvas").trigger($.Event("mousemove", { pageX: x, pageY: y }));
}

function triggerMouseUp(x, y) {
	$("canvas").trigger($.Event("mouseup", { pageX: x, pageY: y }));
}

test("dragview is a canvasview", function () {
	ok(dragView instanceof canvascontrols.CanvasView);
});

test("hides canvas when initialized", function () {
	ok($("canvas").css("display"), "none");
});

test("sets state when startDrag is called, then displays canvas", function () {
	equal(dragView.draggedShape, undefined);
	var shape = new canvascontrols.Shape();
	dragView.startDrag(shape, 10, 10);
	equal(dragView.draggedShape, shape);
	equal(shape.x(), 10);
	equal(shape.y(), 10);
	equal($("canvas").css("display"), "block");
});

test("adjusts shape x and y when mouse is moved on canvas", function () {
	var shape = new canvascontrols.Shape();
	dragView.startDrag(shape, 10, 10);
	updatePosition();
	triggerMouseMove(canvasX + 15, canvasY + 15);
	equal(shape.x(), 15);
	equal(shape.y(), 15);
});

test("notifies listeners when shape is moved", function () {
	var event, x, y;
	dragView.addListener({}, function () {
		event = arguments[1];
		x = arguments[2].pageX;
		y = arguments[2].pageY;
	});
	dragView.startDrag(new canvascontrols.Shape(), 10, 10);
	triggerMouseMove(100, 100);
	equal(event, "dragged");
	equal(x, 100);
	equal(y, 100);
});

test("stops dragging when mouse released", function () {
	var shape = new canvascontrols.Shape();
	dragView.startDrag(shape, canvasX + 10, canvasY + 10);
	updatePosition();
	triggerMouseUp(canvasX + 50, canvasY + 60);
	triggerMouseMove(canvasX + 100, canvasY + 100);
	equal(dragView.draggedShape, null);
	equal(shape.x(), 50);
	equal(shape.y(), 60);
});

test("notifies listeners when drag stopped", function() {
	var event, x, y;
	dragView.addListener({}, function () {
		event = arguments[1];
		x = arguments[2].pageX;
		y = arguments[2].pageY;
	});
	dragView.startDrag(new canvascontrols.Shape(), 10, 10);
	updatePosition();
	var stoppedAtX = canvasX + 50;
	var stoppedAtY = canvasY + 60;
	triggerMouseUp(stoppedAtX, stoppedAtY);
	equal(event, "dragStopped");
	equal(x, stoppedAtX);
	equal(y, stoppedAtY);
});