/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="Mock.js"/>
/// <reference path="MockContext.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.observable.js"/>
/// <reference path="canvascontrols.canvasview.js"/>
/// <reference path="canvascontrols.shape.js"/>
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

	var gotSender, eventName;
	node.on("nodeRemoved.cc", {}, function (sender, event) {
		gotSender = sender;
		eventName = event.type;
	});

	node.remove(child);
	equal(node._children.length, 1);
	ok(node._children[0] === child2);
	equal(eventName, "nodeRemoved");
	equal(node._children[0].y(), 25);
	node.remove(child2);
	equal(node._children.length, 0);
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



// todo: this isn't necessary for now, canvasview fires event on right target
//test("detects click on box and raises clicked event", function () {
//	var node = createParentNode({ label: "root", expanded: true });
//	var childNode = new canvascontrols.TimelineTreeNode({ label: "child", expanded: true });
//	var grandChildNode = new canvascontrols.TimelineTreeNode({ label: "grandchild" });
//	node.add(childNode);
//	childNode.add(grandChildNode);

//	var clickedChild, eventName, clickedButton, sentData;
//	node.on("click", {}, function (sender, event) {
//		eventName = event.type;
//		clickedChild = event.child;
//		clickedButton = event.which;
//		sentData = event;
//	});

//	node._raise("click", { offsetX: 50, offsetY: 27, which: 1 });

//	equal(sentData.offsetX, 30);
//	equal(sentData.offsetY, 2);
//	equal(sentData.originalX, 50);
//	equal(sentData.originalY, 27);
//	equal(eventName, "click");
//	ok(clickedChild === childNode);
//	equal(clickedChild._label, "child");
//	equal(clickedButton, 1);

//	node._raise("click", { offsetX: 70, offsetY: 52, which: 3 });

//	equal(eventName, "click");
//	ok(clickedChild === grandChildNode);
//	equal(clickedChild._label, "grandchild");
//	equal(clickedButton, 3);
//});

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

// todo: do we need this for anything?
//test("can find position relative to root node", function () {
//	var node = new canvascontrols.TimelineTreeNode();
//	node.add(new canvascontrols.TimelineTreeNode());
//	node._children[0].add(new canvascontrols.TimelineTreeNode());
//	node._children[0].add(new canvascontrols.TimelineTreeNode());
//	node.toggle();
//	node._children[0].toggle();
//	equal(node._children[0]._children[0].globalX(), 40);
//	equal(node._children[0]._children[0].globalY(), 50);
//	equal(node._children[0]._children[1].globalY(), 75);
//});

// todo: do we need this for anything?
//test("added node gets new state", function () {
//	var node = createParentNode();
//	node.add(new canvascontrols.TimelineTreeNode());
//	equal(node._children[0]._state, "new");
//});

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

// todo: canvas handles this
//test("detects and expands child on click", function () {
//	var tree = new canvascontrols.TimelineTree();
//	var child1 = new canvascontrols.TimelineTreeNode();
//	var child2 = new canvascontrols.TimelineTreeNode();
//	var grandChild = new canvascontrols.TimelineTreeNode();
//	tree.add(child1);
//	tree.add(child2);
//	child1.add(grandChild);
//	equal(child2.y(), 25);
//	tree._raise("click", { offsetX: 10, offsetY: 15 });
//	ok(child1._expanded);
//	equal(child2.y(), 50);
//});

//test("detects and raises event on child box click", function () {
//	var tree = new canvascontrols.TimelineTree();
//	var child1 = new canvascontrols.TimelineTreeNode({ label: "a" });
//	var child2 = new canvascontrols.TimelineTreeNode({ label: "b" });
//	var grandChild = new canvascontrols.TimelineTreeNode({ label: "a.a" });
//	tree.add(child1);
//	tree.add(child2);
//	child1.add(grandChild);
//	var clickedChild;
//	tree.on("click", {}, function (sender, event) {
//		clickedChild = event.child;
//	});
//	tree._raise("click", { offsetX: 30, offsetY: 35 });
//	ok(clickedChild != null);
//	equal(clickedChild._label, child2._label);
//});

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

// todo: do we need this?
//test("can find position relative to tree", function () {
//	var tree = new canvascontrols.TimelineTree();
//	var node = new canvascontrols.TimelineTreeNode();
//	tree.add(node);
//	node.add(new canvascontrols.TimelineTreeNode());
//	node._children[0].add(new canvascontrols.TimelineTreeNode());
//	node._children[0].children[0].add(new canvascontrols.TimelineTreeNode());
//	node._children[0].add(new canvascontrols.TimelineTreeNode());
//	node.toggle();
//	node._children[0].toggle();
//	equal(node._children[0]._children[0].globalX(), 40);
//	equal(node._children[0]._children[0].globalY(), 50);
//	equal(node._children[0]._children[1].globalY(), 75);
//});

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