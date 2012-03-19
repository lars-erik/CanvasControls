/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="Mock.js"/>
/// <reference path="MockContext.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.observable.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.compositeshape.js"/>
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
	ok(dragView.draggedShape === shape);
	ok(dragView._shapes[0] === shape);
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
	dragView.on("dragged.cc", {}, function (s, e) {
		event = e.type;
		x = e.pageX;
		y = e.pageY;
	});
	dragView.startDrag(new canvascontrols.Shape(), 10, 10);
	triggerMouseMove(100, 100);
	equal(event, "dragged");
	equal(x, 100);
	equal(y, 100);
});

test("stops dragging and hides when mouse released", function () {
	var shape = new canvascontrols.Shape();
	dragView.startDrag(shape, canvasX + 10, canvasY + 10);
	updatePosition();
	triggerMouseUp(canvasX + 50, canvasY + 60);
	triggerMouseMove(canvasX + 100, canvasY + 100);
	equal($("canvas").css("display"), "none");
	equal(dragView.draggedShape, null);
	equal(dragView._shapes.length, 0);
	equal(shape.x(), 50);
	equal(shape.y(), 60);
});

test("notifies listeners when drag stopped", function () {
	var event, x, y;
	dragView.on("dragStopped.cc", {}, function (s, e) {
		event = e.type;
		x = e.pageX;
		y = e.pageY;
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

test("can create dragshape as copy of canvas data", function () {
	drawBlackBox();

	var ctx = $("canvas")[0].getContext("2d");
	var shape = canvascontrols.DragShape.create(ctx, 0, 0, 5, 5);
	ok(shape instanceof canvascontrols.Shape);
	ok(shape instanceof canvascontrols.DragShape);
	equal(shape._imageData.data.length, 5 * 5 * 4);
	equal(shape._imageData.data[0], 0x0);
	equal(shape._imageData.data[1], 0x0);
	equal(shape._imageData.data[2], 0x0);
	equal(shape._imageData.data[3], 0xFF);
});

test("dragshape imagedata is faded", function () {
	drawBlackBox();

	var ctx = $("canvas")[0].getContext("2d");
	var shape = canvascontrols.DragShape.create(ctx, 0, 0, 5, 5);
	var data = shape._imageData.data;

	equal(data[data.length - 1], 128);
	equal(data[ 5 * 4 - 1], 225);
	equal(data[10 * 4 - 1], 195);
	equal(data[15 * 4 - 1], 141);
	equal(data[20 * 4 - 1], 128);
	equal(data[21 * 4 - 1], 232);
	equal(data[22 * 4 - 1], 202);
	equal(data[23 * 4 - 1], 147);
	equal(data[24 * 4 - 1], 128);
	equal(data[25 * 4 - 1], 128);
});

test("dragshape paint puts imagedata on coords", function () {
	drawBlackBox();

	var ctx = $("canvas")[0].getContext("2d");
	var shape = canvascontrols.DragShape.create(ctx, 0, 0, 5, 5);

	mock.logged = ["putImageData"];
	shape._x = 15;
	shape._y = 20;
	shape.paint(mock);

	equal(mock.calls.length, 1);
	equal(mock.calls[0].name, "putImageData");
	equal(mock.calls[0].args.image, shape._imageData);
	equal(mock.calls[0].args.x, 15);
	equal(mock.calls[0].args.y, 20);
	equal(mock.calls[0].args.dirtyWidth, 5);
	equal(mock.calls[0].args.dirtyHeight, 5);

});

function drawBlackBox() {
	$("canvas").css("display", "block");
	var ctx = $("canvas")[0].getContext("2d");
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, 10, 10);
}