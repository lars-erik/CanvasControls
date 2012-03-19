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

module("composite shapes", {
	setup: function () {
		mock.reset();
		root = new canvascontrols.CompositeShape({ x: 5, y: 10 });
		child = new canvascontrols.CompositeShape({ x: 25, y: 35 });
		grandChild = new canvascontrols.CompositeShape({ x: 5, y: 15 });
		simpleChild = new canvascontrols.Shape({ x: 10, y: 20 });
	
		child.add(grandChild);
		root.add(child);
		root.add(simpleChild);
	},
	teardown: function () {
		delete root;
		delete child;
		delete grandChild;
		delete simpleChild;
	}
});

var mock = new MockContext();
var canvas, root, child, grandChild, simpleChild;

test("can create composite shape", function () {
	ok(root instanceof canvascontrols.CompositeShape);
	ok(root instanceof canvascontrols.Shape);
});

test("can add shape to composite", function () {
	equal(root.getShapes().length, 2);
	ok(root.getShapes()[0] === child);
});

test("fails if adding an object not derived from shape", function () {
	throwsError(function () {
		root.add({});
	}, "did not throw error for added non-shape");
});

test("sets self as parent when children are added", function () {
	ok(child.parent() === root);
});

test("paint translates and restores recursively", function () {
	mock.logged = ["save", "translate", "restore"];

	root.paint(mock);

	equal(mock.calls.length, 9);
	var expectedOrder = ["save", "translate", "save", "translate", "restore", "restore", "save", "translate", "restore"];
	for (var i = 0; i < expectedOrder.length; i++)
		equal(mock.calls[i].name, expectedOrder[i]);

	equal(mock.calls[1].args.x, 25);
	equal(mock.calls[1].args.y, 35);
	equal(mock.calls[3].args.x, 5);
	equal(mock.calls[3].args.y, 15);
	equal(mock.calls[7].args.x, 10);
	equal(mock.calls[7].args.y, 20);
});

test("extends width and height to enclose children", function () {
	equal(root.width(), child.x() + child.width());
});

test("findShapeAt returns null if no child at coords", function () {
	equal(root.findShapeAt({ offsetX: 1, offsetY: 2 }), null);
});

test("can find shapes at coords recursively", function () {
	ok(root.findShapeAt({ offsetX: 30, offsetY: 50 }) === grandChild);
	ok(root.findShapeAt({ offsetX: 10, offsetY: 20 }) === simpleChild);
});

test("detects mousemove and forwards event with adjusted offset to children", function () {
	var grandChildTriggered;
	grandChild.on("mousemove", {}, function () {
		grandChildTriggered = true;
	});

	root._raise("mousemove", { offsetX: 30, offsetY: 50 });
	ok(grandChildTriggered);
});

test("when mouse is over a child it wasn't over, child is given mouseover event once and same for out", function () {
	var overcount = 0, outcount = 0;
	child.on("mouseover", {}, function () {
		overcount++;
	});
	child.on("mouseout", {}, function () {
		outcount++;
	});

	testCount(24, 34 , 0, 0);
	testCount(26, 37 , 1, 0);
	testCount(27, 37 , 1, 0);
	testCount(31, 37 , 1, 1);
	testCount(32, 37 , 1, 1);

	function testCount(offsetX, offsetY, expectedOverCount, expectedOutCount) {
		root._raise("mousemove", { offsetX: offsetX, offsetY: offsetY });
		equal(overcount, expectedOverCount);
		equal(outcount, expectedOutCount);
	}
});

test("when mouseout is raised, sets isHovered to false recursively in case children are positioned at edge", function () {
	root._raise("mousemove", {offsetX:30, offsetY:50});
	ok(child.__isHovered);
	ok(grandChild.__isHovered);
	root._raise("mousemove", { offsetX: 31, offsetY: 51 });
	ok(!grandChild.__isHovered);
});

test("mouse events are sent to inner child, then parents recursively", function () {
	var events = [];
	var pushEvent = function (s, e) {
		var eCopy = $.extend(true, {}, e);
		events.push([s, eCopy]);
	};
	root.on("click", {}, pushEvent);
	child.on("click", {}, pushEvent);
	grandChild.on("click", {}, pushEvent);

	root._raise("click", { offsetX: 30, offsetY: 50 });
	equal(events.length, 3);
	ok(events[0][0] === grandChild);
	ok(events[1][0] === child);
	ok(events[2][0] === root);
	equal(events[0][1].offsetX, 0);
	equal(events[0][1].offsetY, 0);
	equal(events[0][1].handlers.length, 1);
	equal(events[1][1].offsetX, 5);
	equal(events[1][1].offsetY, 15);
	equal(events[1][1].handlers.length, 2);
	equal(events[2][1].offsetX, 30);
	equal(events[2][1].offsetY, 50);
	equal(events[2][1].handlers.length, 3);
	ok(events[2][1].handlers[0] === grandChild);
	ok(events[2][1].handlers[1] === child);
	ok(events[2][1].handlers[2] === root);
});

test("can find global x and y", function () {
	equal(grandChild.globalX(), 35);
	equal(grandChild.globalY(), 60);
});