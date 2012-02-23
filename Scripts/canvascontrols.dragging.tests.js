/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="Mock.js"/>
/// <reference path="MockContext.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.canvasview.js"/>
/// <reference path="canvascontrols.dragging.js"/>

var mock = new MockContext();
var dragView;

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
	var canvasX = $("canvas").offset().left;
	var canvasY = $("canvas").offset().top;
	$("canvas").trigger($.Event("mousemove", {pageX:canvasX+15,pageY:canvasY+15}));
	equal(shape.x(), 15);
	equal(shape.y(), 15);
});