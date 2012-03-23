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
/// <reference path="canvascontrols.timeline.js"/>
/// <reference path="canvascontrols.timeline.tree.js"/>

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
	ok(node != null);
	ok(node instanceof canvascontrols.Shape);
	ok(node instanceof canvascontrols.TimelineTreeNode);
	equal(node.width(), 120);
	equal(node.height(), 25);
	equal(node._boxX, 20);
	equal(node._label, "");
	equal(node._hasChildren, false);
	equal(node._expanded, false);
	equal(node.getShapeCount(), 0);
});

test("can add subnode and fires event", function () {
	var node = new canvascontrols.TimelineTreeNode();
	var child = new canvascontrols.TimelineTreeNode();
	var firedEvent, eventName;
	node.on("nodeAdded.cc", {}, function (sender, params) {
		firedEvent = true;
		eventName = params.type;
		ok(node === sender);
		ok(node === params.parent);
		ok(child === params.child);
	});
	node.add(child);
	ok(firedEvent);
	equal(eventName, "nodeAdded");
	ok(node._hasChildren);
	equal(node.getShapeCount(), 1);
	ok(node.getShapes()[0] === child);
	ok(child._parent === node);
});

test("can remove subnodes and adjust other children's y", function () {
	var node = new canvascontrols.TimelineTreeNode();
	var child = new canvascontrols.TimelineTreeNode();
	var child2 = new canvascontrols.TimelineTreeNode();
	node.add(child);
	node.add(child2);

	var gotSender, gotEvent, eventName;
	node.on("nodeRemoved.cc", {}, function (sender, event) {
		gotSender = sender;
		gotEvent = event;
		eventName = event.type;
	});

	node.remove(child);
	ok(node === gotSender);
	ok(child === gotEvent.child);
	equal(node.getShapes().length, 1);
	ok(node.getShapes()[0] === child2);
	equal(eventName, "nodeRemoved");
	equal(node.getShapes()[0].y(), 25);
	node.remove(child2);
	ok(node === gotSender);
	ok(child2 === gotEvent.child);
	equal(node.getShapes().length, 0);
	equal(node._hasChildren, false);
});

test("toggle changes expanded and bubble notifies listeners", function () {
	var node = createParentNode();
	var child = new canvascontrols.TimelineTreeNode();
	node.add(child);
	node._expanded = false;

	var obj = {};
	var status, eventName;
	node.on("toggled.cc", obj, function (sender, event) {
		eventName = event.type;
		status = event.expanded;
	});
	node.toggle();
	equal(eventName, "toggled");
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
		boxWidth: 110,
		boxHeight: 25,
		label: "Boks"
	});
	mock.logged = ["fillRect", "strokeRect","fillText"];
	node.paint(mock);
	equal(mock.logCalls, 3);
	notEqual(mock.calls.length, 0);
	equal(mock.calls[0].args.x, 20);
	equal(mock.calls[0].args.y, 0);
	equal(mock.calls[0].args.w, 110);
	equal(mock.calls[0].args.h, 25);
	equal(mock.calls[1].args.x, 20);
	equal(mock.calls[1].args.y, 0);
	equal(mock.calls[1].args.w, 110);
	equal(mock.calls[1].args.h, 25);
	equal(mock.calls[2].args.text, "Boks");
	equal(mock.calls[2].args.x, 25);
	equal(mock.calls[2].args.y, 16);
});

test("collapsed parent treenode draws triangle", function () {
	var node = createParentNode();
	node._expanded = false;
	mock.logged = ["save", "restore", "translate", "beginPath", "closePath", "stroke", "moveTo", "lineTo"];
	node.paint(mock);
	equal(mock.logCalls, 12);
	notEqual(mock.calls.length, 0);
	equal(mock.calls[0].name, "save");
	equal(mock.calls[1].name, "translate");
	equal(mock.calls[1].args.x, 10);
	equal(mock.calls[1].args.y, 10);
	equal(mock.calls[2].name, "beginPath");
	equal(mock.calls[3].args.x, -5);
	equal(mock.calls[3].args.y, -5);
	equal(mock.calls[4].args.x, 5);
	equal(mock.calls[4].args.y, 0);
	equal(mock.calls[5].args.x, -5);
	equal(mock.calls[5].args.y, 5);
	equal(mock.calls[6].name, "closePath");
	equal(mock.calls[7].name, "stroke");
	equal(mock.calls[8].name, "restore");
});

test("expanded parent treenode rotates before drawing triangle", function () {
	var node = createParentNode();
	mock.logged = ["translate", "rotate", "beginPath"];
	node.paint(mock);
	equal(mock.logCalls, 16);
	notEqual(mock.calls.length, 0);
	equal(mock.calls[0].name, "translate");
	equal(mock.calls[1].name, "rotate");
	equal(mock.calls[1].args.angle, Math.PI * 2 / 4);
	equal(mock.calls[2].name, "beginPath");
});

test("calculates height recursively and stops at collapsed nodes", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode({
		boxHeight: 25,
		hasChildren: true
	});
	var grandChildNode = new canvascontrols.TimelineTreeNode({
		boxHeight: 25
	});
	node.add(childNode);
	childNode.add(grandChildNode);
	equal(node.height(), 55);
	childNode._expanded = true;
	equal(node.height(), 85);
});

test("adjusts y of following children when one child is expanded", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	var childNode2 = new canvascontrols.TimelineTreeNode();
	var grandChildNode = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	node.add(childNode2);
	childNode.add(grandChildNode);
	equal(childNode2.y(), 50);
	childNode.toggle();
	equal(childNode2.y(), 75);
});

test("expanded parent treenode adjusts and draws children", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	var childNode2 = new canvascontrols.TimelineTreeNode();
	mock.logged = ["save", "restore", "translate"];
	node.add(childNode);
	node.add(childNode2);
	node.paint(mock);

	equal(childNode.y(), 25);
	equal(childNode2.y(), 50);

	equal(mock.calls.length, 12);
	equal(mock.logCalls, 28);

	equal(mock.calls[3].name, "save");
	equal(mock.calls[4].args.x, 20);
	equal(mock.calls[4].args.y, 0);
	equal(mock.calls[9].args.x, 0);
	equal(mock.calls[9].args.y, 50);
	equal(mock.calls[10].name, "restore");
	equal(mock.calls[11].name, "restore");
	equal(node.height(), 75);
});

test("collapsed parent treenode does not draw children", function () {
	var node = createParentNode();
	node._expanded = false;
	var childNode = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	node.paint(mock);
	equal(mock.logCalls, 12);
});

test("childs triangle is in bounds", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	ok(node.isInBounds({ offsetX: 30, offsetY: 45 }));
});

test("detects click on triangles, calls expand and raises toggled.cc, also adds toggled to click event", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	var grandChildNode = new canvascontrols.TimelineTreeNode();
	var toggled;
	node.add(childNode);
	childNode.add(grandChildNode);
	node.on("toggled.cc", {}, function (s, e) {
		toggled = true;
	});
	childNode._raise("click", { offsetX: 10, offsetY: 10 });
	ok(childNode._expanded);
	ok(toggled);
});

test("adding to a node notifies parent and parent updates bounds", function () {
	var node = createParentNode();
	var childNode = new canvascontrols.TimelineTreeNode();
	var childNode2 = new canvascontrols.TimelineTreeNode();
	node.add(childNode);
	node.add(childNode2);
	equal(childNode.y(), 25);
	equal(childNode2.y(), 50);
	childNode.toggle();
	equal(childNode._expanded, true);
	equal(childNode2.y(), 50);
	childNode.add(new canvascontrols.TimelineTreeNode());
	equal(childNode2.y(), 75);
});

test("node.edit shows textbox on document", function () {
	var node = createParentNode();
	var child = new canvascontrols.TimelineTreeNode();
	var grandChild = new canvascontrols.TimelineTreeNode();
	node.add(child);
	child.add(grandChild);
	node.toggle();
	child.toggle();
	var eventArg;
	node.on("renamed.cc", {}, function (s, e) {
		eventArg = e;
	});
	var textSelector = "input[type=\"text\"]";
	equal($(textSelector).length, 0);
	grandChild.edit();
	equal($(textSelector).length, 1);
	equal($(textSelector).css("left"), (grandChild.globalX() + grandChild._boxX + 1) + "px");
	equal($(textSelector).css("top"), (grandChild.globalY() + 1) + "px");
	equal($(textSelector).val(), grandChild._label);
	$(textSelector).val("test");
	$(textSelector).blur();
	equal(grandChild._label, "test");
	equal($(textSelector).length, 0);
	ok(eventArg.child === grandChild);
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
	ok(tree != null);
	ok(tree instanceof canvascontrols.TimelineTreeBase);
});

test("can add nodes to tree", function () {
	var tree = new canvascontrols.TimelineTree();
	tree.add(new canvascontrols.TimelineTreeNode());
	ok(tree._hasChildren);
	equal(tree.getShapeCount(), 1);
	ok(tree.getShapes()[0]._parent === tree);
	equal(tree.getShapes()[0].x(), 0);
	equal(tree.getShapes()[0].y(), 0);
	tree.add(new canvascontrols.TimelineTreeNode());
	equal(tree.getShapeCount(), 2);
	equal(tree.getShapes()[1].x(), 0);
	equal(tree.getShapes()[1].y(), 25);
});

test("calculates correct height after added node", function () {
	var tree = new canvascontrols.TimelineTree();
	var node = new canvascontrols.TimelineTreeNode();
	tree.add(node);
	tree.add(new canvascontrols.TimelineTreeNode());
	node.add(new canvascontrols.TimelineTreeNode());
	node.getShapes()[0].add(new canvascontrols.TimelineTreeNode());
	node.add(new canvascontrols.TimelineTreeNode());
	node.toggle();
	equal(node.height(), 75);
	node.getShapes()[0].toggle();
	equal(node.height(), 100);
	node.add(new canvascontrols.TimelineTreeNode());
	equal(node.height(), 125);
	equal(node.getShapes()[2].y(), 100);
	equal(tree.getShapes()[1].y(), 125);
});

