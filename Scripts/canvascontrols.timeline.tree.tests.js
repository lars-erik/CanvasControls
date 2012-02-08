/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.canvasview.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.timeline.js"/>
/// <reference path="canvascontrols.timeline.tree.js"/>

var fakeView;

var MockContext = Class.extend({
	logged: [],
	params: [],
	logCalls: 0,
	reset: function () {
		this.logCalls = 0;
		this.logged = [];
		this.params = [];
	},
	log: function (name, args) {
		this.logCalls++;
		for (var i = 0; i < this.logged.length; i++) {
			if (this.logged[i] == name)
				this.params.push([name, args]);
		}
	},
	save: function () { this.log("save", arguments); },
	restore: function () { this.log("restore", arguments); },
	strokeRect: function () { this.log("strokeRect", arguments); },
	beginPath: function () { this.log("beginPath", arguments); },
	closePath: function () { this.log("closePath", arguments); },
	stroke: function () { this.log("stroke", arguments); },
	moveTo: function () { this.log("moveTo", arguments); },
	lineTo: function () { this.log("lineTo", arguments); },
	translate: function () { this.log("translate", arguments); },
	rotate: function () { this.log("rotate", arguments); },
	fillText: function () { this.log("fillText", arguments); }
});
var mock = new MockContext();

module("canvascontrols.timeline.treenode", {
	setup: function () {
		mock.reset();
	},
	teardown: function () {
	}
});

test("can create treenode", function () {
	var node = new canvascontrols.TimelineTreeNode();
	notEqual(node, null);
	ok(node instanceof canvascontrols.Shape);
	ok(node instanceof canvascontrols.TimelineTreeNode);
	equal(node._width, 100);
	equal(node._height, 20);
	equal(node._boxX, 20);
	equal(node._label, "");
	equal(node._hasChildren, false);
	equal(node._expanded, false);
	equal(node._children.length, 0);
	equal(node._listeners.length, 0);
});

test("toggle changes expanded and fires event", function () {
	var node = createParentNode();
	var child = createParentNode();
	node.add(child);
	node._expanded = false;
	child._expanded = false;
	child._hasChildren = false;

	var obj = new Object();
	var status;
	node.addListener(obj, function (newStatus) { status = newStatus; });
	node.toggle();
	equal(status, true);
	equal(node._expanded, true);
	node.toggle();
	equal(status, false);
	equal(node._expanded, false);
});

test("childless treenode only draws box and label", function () {
	var node = new canvascontrols.TimelineTreeNode({
		x: 10,
		y: 10,
		width: 110,
		height: 25,
		label: "Boks"
	});
	mock.logged = ["strokeRect","fillText"];
	node.paint(mock);
	equal(mock.logCalls, 2);
	notEqual(mock.params.length, 0);
	equal(mock.params[0][1][0], 20);
	equal(mock.params[0][1][1], 0);
	equal(mock.params[0][1][2], 110);
	equal(mock.params[0][1][3], 25);
	equal(mock.params[1][1][0], "Boks");
	equal(mock.params[1][1][1], 25);
	equal(mock.params[1][1][2], 16);
});

test("collapsed parent treenode draws triangle", function () {
	var node = createParentNode();
	node._expanded = false;
	mock.logged = ["save", "restore", "translate", "beginPath", "closePath", "stroke", "moveTo", "lineTo"];
	node.paint(mock);
	equal(mock.logCalls, 11);
	notEqual(mock.params.length, 0);
	equal(mock.params[0][0], "save");
	equal(mock.params[1][0], "translate");
	equal(mock.params[1][1][0], 10);
	equal(mock.params[1][1][1], 13);
	equal(mock.params[2][0], "beginPath");
	equal(mock.params[3][1][0], -5);
	equal(mock.params[3][1][1], -5);
	equal(mock.params[4][1][0], 5);
	equal(mock.params[4][1][1], 0);
	equal(mock.params[5][1][0], -5);
	equal(mock.params[5][1][1], 5);
	equal(mock.params[6][0], "closePath");
	equal(mock.params[7][0], "stroke");
	equal(mock.params[8][0], "restore");
});

test("expanded parent treenode rotates before drawing triangle", function () {
	var node = createParentNode();
	mock.logged = ["translate", "rotate", "beginPath"];
	node.paint(mock);
	equal(mock.logCalls, 15);
	notEqual(mock.params.length, 0);
	equal(mock.params[0][0], "translate");
	equal(mock.params[1][0], "rotate");
	equal(mock.params[1][1][0], Math.PI * 2 / 4);
	equal(mock.params[2][0], "beginPath");
});

test("calculates height recursively and stops at collapsed nodes", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode({
		height: 25,
		label: "Boks 2",
		hasChildren: true,
		expanded: false
	});
	var grandChildNode = new canvascontrols.TimelineTreeNode({
		height: 25,
		label: "Boks 2",
		hasChildren: true,
		expanded: false
	});
	node.add(childNode);
	childNode.add(grandChildNode);
	equal(node.getHeight(), 55);
	childNode._expanded = true;
	equal(node.getHeight(), 85);
});

test("adjusts y of following children when one child is expanded", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode({
		height: 25,
		label: "Boks 2",
		hasChildren: true,
		expanded: false
	});
	var childNode2 = new canvascontrols.TimelineTreeNode({
		height: 25,
		label: "Boks 3",
		hasChildren: true,
		expanded: false
	});
	var grandChildNode = new canvascontrols.TimelineTreeNode({
		height: 25,
		label: "Boks 2.1",
		hasChildren: true,
		expanded: false
	});
	node.add(childNode);
	node.add(childNode2);
	childNode.add(grandChildNode);
	equal(childNode2.y(), 30);
	childNode.toggle();
	equal(childNode2.y(), 60);
	ok(false, "under development");
});

test("expanded parent treenode adjusts and draws children", function () {
	var node = createParentNode();
	node._height = 20;
	var childNode = new canvascontrols.TimelineTreeNode({
		label: "SubBoks 1",
		hasChildren: true,
		expanded: false
	});
	var childNode2 = new canvascontrols.TimelineTreeNode({
		label: "SubBoks 2",
		hasChildren: true,
		expanded: false
	});
	mock.logged = ["translate"];
	node.add(childNode);
	node.add(childNode2);
	node.paint(mock);

	equal(childNode.y(), 0);
	equal(childNode2.y(), 25);

	equal(mock.params.length, 6);
	equal(mock.logCalls, 39);

	equal(mock.params[1][1][0], 20);
	equal(mock.params[1][1][1], 25);
	equal(mock.params[4][1][0], 0);
	equal(mock.params[4][1][1], 25);
	equal(node.getHeight(), 70);
});

test("collapsed parent treenode does not draw children", function () {
	var node = createParentNode();
	node._expanded = false;
	var childNode = new canvascontrols.TimelineTreeNode({
		label: "Boks 2",
		hasChildren: true,
		expanded: false
	});
	node.add(childNode);
	node.paint(mock);
	equal(mock.logCalls, 11);
});

function createParentNode() {
	return new canvascontrols.TimelineTreeNode({
		x: 10,
		y: 10,
		width: 110,
		height: 25,
		label: "Boks",
		hasChildren: true,
		expanded: true
	});
}

module("canvascontrols.timeline.tree", {
	setup: function () {

/*
		fakeView = new (function () {
			this.cleared = false;
			this.drawnBoxes = [];
			this.drawnLabels = [];
			this.drawnShapes = [];
			this.clear = function () {
				this.cleared = true;
				this.drawnBoxes = [];
				this.drawnLabels = [];
				this.drawnShapes = [];
			};
			this.drawBox = function (x, y, width, height) { this.drawnBoxes.push({ x: x, y: y, width: width, height: height }); };
			this.drawLabel = function (x, y, label) { this.drawnLabels.push({ x: x, y: y, label: label }); };
			this.drawShape = function(points) { this.drawnShapes.push({ points: points }); };
			this.getWidth = function () { return 200; };
			this.getHeight = function () { return 500; };
		})();
*/
	},
	teardown: function () {
		fakeView = null;
	}
});

//test("can create instance", function () {
//	var controller = new canvascontrols.TimelineTreeController(fakeView);
//	notEqual(controller, null);
//});



/*
test("initializer clears board", function () {
	canvascontrols.TimelineTreeController(fakeView);
	equals(fakeView.cleared, true);
});

test("redraw calls clear", function() {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	fakeView.cleared = false;
	controller.redraw();
	ok(fakeView.cleared);
});

test("does nothing without model", function () {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	controller.redraw();
	ok(fakeView.cleared);
	equals(fakeView.drawnBoxes.length, 0);
});

test("draws boxes and labels for top level", function () {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	var model = [
		{ id: "1", label: "mål 1", parents:[] },
		{ id: "2", label: "mål 2", parents: [] }
	];
	controller.setModel(model);
	controller.redraw();

	equals(fakeView.drawnBoxes.length, 2, "drawn box count");
	equals(fakeView.drawnBoxes[0].x, 20.5, "box 1 x");
	equals(fakeView.drawnBoxes[0].y, 5.5, "box 1 y");
	equals(fakeView.drawnBoxes[0].width, 175, "box 1 width");
	equals(fakeView.drawnBoxes[0].height, 20, "box 1 height");
	equals(fakeView.drawnBoxes[1].x, 20.5, "box 2 x");
	equals(fakeView.drawnBoxes[1].y, 30.5, "box 2 y");
	equals(fakeView.drawnBoxes[1].width, 175, "box 2 width");
	equals(fakeView.drawnBoxes[1].height, 20, "box 2 height");

	equals(fakeView.drawnLabels.length, 2, "drawn label count");
	equals(fakeView.drawnLabels[0].x, 25.5, "label 1 x");
	equals(fakeView.drawnLabels[0].y, 19.5, "label 1 y");
	equals(fakeView.drawnLabels[0].label, "mål 1", "label 1 text");
	equals(fakeView.drawnLabels[1].x, 25.5, "label 2 x");
	equals(fakeView.drawnLabels[1].y, 44.5, "label 2 y");
	equals(fakeView.drawnLabels[1].label, "mål 2", "label 2 text");
});

test("draws sidewise arrow for collapsed element with child", function () {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	var model = [
		{ id: "1", label: "mål 1", hasChildren: true, parents:[] }
	];
	controller.setModel(model);
	controller.redraw();
	equals(fakeView.drawnShapes.length, 1);
	equals(fakeView.drawnShapes[0].points.length, 3);
	equals(fakeView.drawnShapes[0].points[0].x, 5.5, "point 1 x");
	equals(fakeView.drawnShapes[0].points[0].y, 9.5, "point 1 y");
	equals(fakeView.drawnShapes[0].points[1].x, 16.5, "point 2 x");
	equals(fakeView.drawnShapes[0].points[1].y, 15, "point 2 y");
	equals(fakeView.drawnShapes[0].points[2].x, 5.5, "point 3 x");
	equals(fakeView.drawnShapes[0].points[2].y, 20.5, "point 3 y");
});

test("draws down arrow for expanded element with child", function () {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	var model = [
		{ id: "1", label: "mål 1", hasChildren: true, expanded: true, parents: [] }
	];
	controller.setModel(model);
	controller.redraw();
	equals(fakeView.drawnShapes.length, 1);
	equals(fakeView.drawnShapes[0].points.length, 3);
	equals(fakeView.drawnShapes[0].points[0].x, 5.5, "point 1 x");
	equals(fakeView.drawnShapes[0].points[0].y, 9.5, "point 1 y");
	equals(fakeView.drawnShapes[0].points[1].x, 16.5, "point 2 x");
	equals(fakeView.drawnShapes[0].points[1].y, 9.5, "point 2 y");
	equals(fakeView.drawnShapes[0].points[2].x, 11, "point 3 x");
	equals(fakeView.drawnShapes[0].points[2].y, 20.5, "point 3 y");
});

test("can find position of arrow and its model element from coordinates and then fire expand", function () {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	var model = [
		{ id: "1", label: "mål 1", hasChildren: true, expanded: true, parents: [] },
		{ id: "4", label: "mål 1.1", hasChildren: true, expanded: false, parents: ["1"] },
		{ id: "2", label: "mål 2", hasChildren: false, expanded: false, parents: [] },
		{ id: "3", label: "mål 3", hasChildren: true, expanded: false, parents: [] }
	];
	controller.setModel(model);
	var expandedElement = null;
	fakeView.expandToggled = function (modelElement) {
		expandedElement = modelElement;
	};
	fakeView.clicked({ x: 7, y: 90 });
	equals(expandedElement, model[3]);
	fakeView.clicked({ x: 7, y: 90 });
	equals(expandedElement, model[3]);
	fakeView.clicked({ x: 27, y: 35 });
	equals(expandedElement, model[1]);
	fakeView.clicked({ x: 27, y: 35 });
	equals(expandedElement, model[1]);
});

test("draws childs with indents", function () {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	var model = [
		{ id: "1", label: "", hasChildren: true, expanded: true, parents: [] },
		{ id: "2", label: "", hasChildren: true, expanded: true, parents: ["1"] },
		{ id: "3", label: "", hasChildren: false, expanded: false, parents: ["1", "2"] }
	];
	controller.setModel(model);
	controller.redraw();
	equals(3, fakeView.drawnBoxes.length);
	equals(20.5, fakeView.drawnBoxes[0].x);
	equals(40.5, fakeView.drawnBoxes[1].x);
	equals(60.5, fakeView.drawnBoxes[2].x);
	equals(2, fakeView.drawnShapes.length);
	equals(5.5, fakeView.drawnShapes[0].points[0].x);
	equals(25.5, fakeView.drawnShapes[1].points[0].x);
});

test("can start dragging element", function () {
	var controller = new canvascontrols.TimelineTreeController(fakeView);
	var model = [
		{ id: "1", label: "mål 1", hasChildren: true, expanded: true, parents: [] },
		{ id: "4", label: "mål 1.1", hasChildren: true, expanded: false, parents: ["1"] },
		{ id: "2", label: "mål 2", hasChildren: false, expanded: false, parents: [] },
		{ id: "3", label: "mål 3", hasChildren: true, expanded: false, parents: [] }
	];
	controller.setModel(model);

	var draggedElement;
	fakeView.dragStarted = function (element) {
		draggedElement = element;
	};
	fakeView.mouseDown({ x: 25, y: 35 });

	equals(draggedElement.label, "mål 2");
	equals(draggedElement.width, 175);
	equals(draggedElement.height, 20);
	equals(draggedElement.offsetX, -4.5);
	equals(draggedElement.offsetY, -4.5);
});

*/