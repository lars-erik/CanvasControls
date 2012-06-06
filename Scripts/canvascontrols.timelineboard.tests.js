/// <reference path="jquery-1.7.1.js" />
/// <reference path="jquery-mousewheel-3.0.6/jquery.mousewheel.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="Mock.js"/>
/// <reference path="MockContext.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.period.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.observable.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.compositeshape.js"/>
/// <reference path="canvascontrols.canvasview.js"/>
/// <reference path="canvascontrols.timeline.js"/>
/// <reference path="canvascontrols.timelineboard.js"/>

var mock = new MockContext();

module("canvascontrols.timelineboard", {
    setup: function () {
        mock.reset();
    },
    teardown: function () {
    }
});

test("can create timelineboard", function () {
    var board = new canvascontrols.TimelineBoard();
    ok(board != null);
    ok(board instanceof canvascontrols.Shape);
    ok(board instanceof canvascontrols.TimelineBoard);
});

test("can create TimelineBoardNode", function () {
    var node = new canvascontrols.TimelineBoardNode();
    ok(node != null);
    ok(node instanceof canvascontrols.Shape);
    ok(node instanceof canvascontrols.TimelineBoardNode);
});

test("can add a node to timelineboard", function () {
    var board = new canvascontrols.TimelineBoard();
    var node = new canvascontrols.TimelineBoardNode();
    board.add(node);
    ok(board != null);
    ok(node != null);
    equal(board.getShapeCount(), 1);
    equal(board.getShapes()[0], node);
    ok(board.getShapes()[0] instanceof canvascontrols.TimelineBoardNode);
});

test("can remove a node from board", function () {
	var board = new canvascontrols.TimelineBoard();
	var node = new canvascontrols.TimelineBoardNode();
	board.add(node);
	ok(board != null);
	ok(node != null);
	equal(board.getShapeCount(), 1);
	equal(board.getShapes()[0], node);
	board.remove(node);
	equal(board.getShapeCount(), 0);
});

test("TimelineBoard getPeriod returns period", function() {
    var board = new canvascontrols.TimelineBoard();
    ok(board.getPeriod() != null);
    ok(board.getPeriod() instanceof canvascontrols.Period);
});

test("Adding node to TimelineBoard raises nodeAdded", function () {
    var board = new canvascontrols.TimelineBoard();
    var raised = false;
    board.on("nodeAdded.cc", {}, function () {
        raised = true;
    });
    var node = new canvascontrols.TimelineBoardNode();
    board.add(node);
    ok(raised == true);

});

test("Mousedown on node raises nodeClicked", function () {
	var board = new canvascontrols.TimelineBoard();
	var node = new canvascontrols.TimelineBoardNode({ start: new Date(2012, 2, 1, 0, 0, 0), end: new Date(2012, 2, 31, 23, 59, 59) });
	board.add(node);
	var toggled = false;
	node.on("nodeClicked.cc", {}, function (s, e) {
		toggled = true;
		ok(s === node);
	});
	node._raise("mousedown", { offsetX: 10, offsetY: 10 });

	ok(toggled);
});

test("Mousedown on board raises boardClicked", function () {
    var board = new canvascontrols.TimelineBoard();
    var node = new canvascontrols.TimelineBoardNode({ start: new Date(2012, 2, 1, 0, 0, 0), end: new Date(2012, 2, 31, 23, 59, 59) });
    board.add(node);
    var toggled = false;
    board.on("boardClicked.cc", {}, function (s, e) {
        toggled = true;
        ok(s instanceof canvascontrols.TimelineBoard);
        equal(s, board);
    });
    board._raise("mousedown", { offsetX: 10, offsetY: 10 });

    ok(toggled);

});
test("Mousedown finds correct action", function () {
	var startOfMonth = new Date(2012, 2, 1);
	startOfMonth.setDate(1);
	startOfMonth.setHours(0);
	startOfMonth.setMinutes(1);
	startOfMonth.setSeconds(1);

	var board = new canvascontrols.TimelineBoard({
		period: new canvascontrols.Period(
				new canvascontrols.Month({ start: new Date(2012, 2, 1), zoom: 12 })
			)
	}
	);

	var node1 = new canvascontrols.TimelineBoardNode({
		start: new Date(2012, 2, 1),
		end: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 2, 0, 23, 59, 59),
		x: 10,
		width : 100
	});

	var node2 = new canvascontrols.TimelineBoardNode({
		start: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 2, 1, 0, 0, 0),
		end: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 4, 0, 23, 59, 59),
		x: 200,
		width : 100
	});

	board.add(node1);
	board.add(node2);
	board.paint(mock);
	
	//equal(parseInt(node1.x() * 10) / 10, 85.4, node1.x());
	//equal(parseInt(node2.x() * 10) / 10, 167.6, node2.x() + " " + node2.width());

	board._raise("mousedown", { offsetX: node1.x() + 5, offsetY: 10, pageX: 2 });
	ok(node1._isMouseDown);
	ok(node1._dragHandler === node1._resizeLeft);
	node1._raise("mousemove", {});

	board._raise("mousedown", { offsetX: node2.x() + 20, offsetY: 10, pageX: 2 });
	ok(node2._isMouseDown);
	ok(node2._dragHandler === node2._drag);

	board._raise("mousedown", { offsetX: node2.x() + node2.width() - 5, offsetY: 10, pageX: 22 });
	ok(node2._isMouseDown);
	ok(node2._dragHandler === node2._resizeRight);

	node1._isMouseDown = false;
	node2._isMouseDown = false;

	board._raise("mousedown", { offsetX: 450, offsetY: 10, pageX: 22 });
	ok(!node1._isMouseDown);
	ok(!node2._isMouseDown);
	
});
/*
test("Mousemove raises resized event", function () {
var board = new canvascontrols.TimelineBoard();
var node1 = new canvascontrols.TimelineBoardNode({ start: new Date(2012, 2, 1, 0, 0, 0), end: new Date(2012, 2, 31, 23, 59, 59) });
var node2 = new canvascontrols.TimelineBoardNode({ start: new Date(2012, 3, 1, 0, 0, 0), end: new Date(2012, 4, 30, 23, 59, 59) });
board.add(node1);
board.add(node2);
board.paint(mock);
var resized = false;
board.on("resized.cc", {}, function (s, e) {
resized = true;
ok(node1 === e.child);
});

board._raise("mousedown", { offsetX: 2, offsetY: 10, pageX: 2 });
board._raise("mousemove", { offsetX: 3, offsetY: 10, pageX: 3 });
board._raise("mouseup", { offsetX: 3, offsetY: 10 });

ok(resized);
});

test("Mousemove on board on a node raises mouseover on node", function () {
var board = new canvascontrols.TimelineBoard();
var node = new canvascontrols.TimelineBoardNode({ start: new Date(2012, 2, 1, 0, 0, 0), end: new Date(2012, 2, 31, 23, 59, 59), y: 10 });
board.add(node);
var mouseOver = false;

node.on("mouseover", {}, function (s, e) {
mouseOver = true;
});

board._raise("mousemove", { offsetX: 10, offsetY: 10 });
ok(mouseOver);
});*/
/*
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
*/