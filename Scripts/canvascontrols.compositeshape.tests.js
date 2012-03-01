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
	equal(root.getShapes()[0], child);
});

test("fails if adding an object not derived from shape", function () {
	throwsError(function () {
		root.add({});
	}, "did not throw error for added non-shape");
});

test("sets self as parent when children are added", function () {
	equal(child.parent(), root);
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

test("findShapeAt returns self if no child at coords", function () {
	equal(root.findShapeAt({ offsetX: 1, offsetY: 2 }), root);
});

test("can find shapes at coords recursively", function () {
	equal(root.findShapeAt({ offsetX: 30, offsetY: 50 }), grandChild);
	equal(root.findShapeAt({ offsetX: 10, offsetY: 20 }), simpleChild);
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

	root._raise("mousemove", { offsetX: 24, offsetY: 34 });
	equal(overcount, 0);
	equal(outcount, 0);
	root._raise("mousemove", { offsetX: 26, offsetY: 36 });
	equal(overcount, 1);
	equal(outcount, 0);
	root._raise("mousemove", { offsetX: 27, offsetY: 37 });
	equal(overcount, 1);
	equal(outcount, 0);
	root._raise("mousemove", { offsetX: 31, offsetY: 37 });
	equal(overcount, 1);
	equal(outcount, 1);
	root._raise("mousemove", { offsetX: 32, offsetY: 37 });
	equal(overcount, 1);
	equal(outcount, 1);
});