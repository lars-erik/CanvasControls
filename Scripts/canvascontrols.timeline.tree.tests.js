﻿/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.canvasview.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.timeline.js"/>
/// <reference path="canvascontrols.timeline.tree.js"/>

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

test("can add subnode", function () {
	var node = new canvascontrols.TimelineTreeNode();
	var child = new canvascontrols.TimelineTreeNode();
	node.add(child);
	ok(node._hasChildren);
	equal(node._children.length, 1);
	ok(node._children[0] === child);
});

test("toggle changes expanded and bubble notifies listeners", function () {
	var node = createParentNode();
	var child = new canvascontrols.TimelineTreeNode();
	node.add(child);
	node._expanded = false;

	var obj = new Object();
	var status, eventName;
	node.addListener(obj, function (sender, event, newStatus) {
		eventName = event;
		status = newStatus;
	});
	node.toggle();
	equal(eventName, "toggle");
	equal(status, true);
	equal(node._expanded, true);
	node.toggle();
	equal(status, false);
	equal(node._expanded, false);
	child.toggle();
	equal(status, true);
});

test("childless treenode only draws box and label", function () {
	var node = new canvascontrols.TimelineTreeNode({
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
		hasChildren: true
	});
	var grandChildNode = new canvascontrols.TimelineTreeNode({
		height: 25
	});
	node.add(childNode);
	childNode.add(grandChildNode);
	equal(node.getHeight(), 55);
	childNode._expanded = true;
	equal(node.getHeight(), 85);
});

test("adjusts y of following children when one child is expanded", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	var childNode2 = new canvascontrols.TimelineTreeNode();
	var grandChildNode = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	node.add(childNode2);
	childNode.add(grandChildNode);
	equal(childNode2.y(), 25);
	childNode.toggle();
	equal(childNode2.y(), 50);
});

test("expanded parent treenode adjusts and draws children", function () {
	var node = createParentNode();
	node._height = 20;
	var childNode = new canvascontrols.TimelineTreeNode();
	var childNode2 = new canvascontrols.TimelineTreeNode();
	mock.logged = ["translate"];
	node.add(childNode);
	node.add(childNode2);
	node.paint(mock);

	equal(childNode.y(), 0);
	equal(childNode2.y(), 25);

	equal(mock.params.length, 4);
	equal(mock.logCalls, 21);

	equal(mock.params[1][1][0], 20);
	equal(mock.params[1][1][1], 25);
	equal(mock.params[3][1][0], 0);
	equal(mock.params[3][1][1], 25);
	equal(node.getHeight(), 70);
});

test("collapsed parent treenode does not draw children", function () {
	var node = createParentNode();
	node._expanded = false;
	var childNode = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	node.paint(mock);
	equal(mock.logCalls, 11);
});

test("childs triangle is in bounds", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	ok(node.isInBounds({ x: 30, y: 45 }));
});

test("can find click on triangles", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	var grandChildNode = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	childNode.add(grandChildNode);
	node.clicked({ x: 30, y: 37 });
	ok(childNode._expanded);
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
	},
	teardown: function () {
		fakeView = null;
	}
});

test("can create tree", function () {
	var tree = new canvascontrols.TimelineTree();
	notEqual(tree, null);
	ok(tree instanceof canvascontrols.TimelineTreeBase);
});

test("can add nodes to tree", function () {
	var tree = new canvascontrols.TimelineTree();
	tree.add(new canvascontrols.TimelineTreeNode());
	ok(tree._hasChildren);
	equal(tree._children.length, 1);
});

test("detects and expands child on click", function () {
	var tree = new canvascontrols.TimelineTree();
	var child1 = new canvascontrols.TimelineTreeNode();
	var child2 = new canvascontrols.TimelineTreeNode();
	var grandChild = new canvascontrols.TimelineTreeNode();
	tree.add(child1);
	tree.add(child2);
	child1.add(grandChild);
	equal(child2.y(), 25);
	tree.clicked({ x: 10, y: 15 });
	ok(child1._expanded);
	equal(child2.y(), 50);
});

/*
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