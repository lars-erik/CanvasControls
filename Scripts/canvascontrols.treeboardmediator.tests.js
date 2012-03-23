/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="Mock.js"/>
/// <reference path="MockContext.js"/>
/// <reference path="mockjax.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.observable.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.compositeshape.js"/>
/// <reference path="canvascontrols.canvasview.js"/>
/// <reference path="canvascontrols.markers.js"/>
/// <reference path="canvascontrols.period.js"/>
/// <reference path="canvascontrols.timeline.js"/>
/// <reference path="canvascontrols.timeline.tree.js"/>
/// <reference path="canvascontrols.timelineboard.js"/>
/// <reference path="canvascontrols.treecontroller.js"/>
/// <reference path="canvascontrols.treeboardmediator.js"/>

module("Tree / Board Mediator", {
	setup: function () {
		tree = new canvascontrols.TimelineTree();
		board = new canvascontrols.TimelineBoard();
		dataSrc = new MockDataSource();
		ctrl = new canvascontrols.TreeController(tree, dataSrc);
	}
});

var tree, board, ctrl, dataSrc;
var now = new Date();

var MockDataSource = Class.extend({
	init: function () {
		this.data = null;
		this.passedParentModel = Number.NaN;
	},
	load: function (parentModel, callback) {
		this.passedParentModel = parentModel;
		this.passedCallback = callback;
		callback(this.data);
	}
});

function createMediator() {
	return new canvascontrols.TreeBoardMediator(tree, board, ctrl);
}

function createNodeData(date, id, treeNodeId) {
	var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
	return { start: date, end: nextDate, model: { start: date, end: nextDate, id: id, treeNode: treeNodeId} };
}

test("can create", function () {
	var mediator = createMediator();
	ok(mediator.tree === tree);
	ok(mediator.board === board);
	
});

test("Board node has reference to treeNode", function () {
	var mediator = createMediator();
	var node1 = new canvascontrols.TimelineTreeNode();
	node1.model = { id: 1, boardNodes: [createNodeData(now, 1), createNodeData(now, 2)] };
	tree.add(node1);

	ok(board.getShapes()[0].treeNode === node1);
	ok(board.getShapes()[1].treeNode === node1);
});

test("nodeAdded adds nodes to board", function () {

	/*dataSrc.data = [
	{ label: "abc", model: { Id: 1, Name: "abc", boardNodes: [createNodeData(now, 1), createNodeData(now, 2)]} },
	{ label: "bcd", model: { Id: 2, Name: "bcd", boardNodes: [createNodeData(now, 3), createNodeData(now, 4)]} }
	];
	var c = new canvascontrols.TreeController(tree, dataSrc);
	*/
	//var m = new canvascontrols.TreeBoardMediator(tree, board, ctrl);

	var mediator = createMediator();
	var node1 = new canvascontrols.TimelineTreeNode();
	node1.model = { id: 1, boardNodes: [createNodeData(now, 1), createNodeData(now, 2)] };

	var node2 = new canvascontrols.TimelineTreeNode();
	node2.model = { id: 2, boardNodes: [createNodeData(now, 3), createNodeData(now, 4)] };
	
	tree.add(node1);	
	tree.add(node2);
	
	equal(board.getShapes().length, 4);
	equal(board.getShapes()[0].model.id, 1);
	equal(board.getShapes()[1].model.id, 2);

	equal(board.getShapes()[0].y(), 0);
	equal(board.getShapes()[1].y(), 0);

	equal(board.getShapes()[2].y(), 25);
	equal(board.getShapes()[3].y(), 25);
});

test("on tree toggle, mediator loads and adds children of toggled node and board nodes", function () {

	var mediator = createMediator();

	var node1 = new canvascontrols.TimelineTreeNode();
	node1.model = { id: 1, boardNodes: [createNodeData(now, 1), createNodeData(now, 2)] };
	tree.add(node1);

	equal(tree.getShapeCount(), 1);
	equal(node1.getShapeCount(), 0);
	equal(board.getShapeCount(), 2);

	dataSrc.data = [
		{ label: "abc", model: { Id: 3, Name: "abc", boardNodes: [createNodeData(now, 5), createNodeData(now, 6)]} }
	];
	node1._hasChildren = true;
	node1.toggle();

	equal(tree.getShapeCount(), 1);
	equal(node1.getShapeCount(), 1);
	equal(board.getShapeCount(), 4);
});

test("when tree has two items with board nodes, and a subnode is added to the first, " +
	 "the second boardnode is pushed down", function () {
	var mediator = createMediator();
	dataSrc.data = [
		{ label: "abc", model: { someId: 1, someName: "abc", boardNodes: [createNodeData(now, 1, 1)]} },
		{ label: "bcd", model: { someId: 2, someName: "bcd", boardNodes: [createNodeData(now, 2, 2)]} }
	];
	ctrl.load();

	equal(tree.getShapeCount(), 2);
	equal(board.getShapeCount(), 2);

	equal(board.getShapes()[0].y(), 0);
	equal(board.getShapes()[1].y(), 25);

	dataSrc.data = [
	 	{ label: "dingsebomse", model: { someId: 3, someName: "dingsebomse", boardNodes: [createNodeData(now, 3, 3)]} }
	];

	var node1 = tree.getShapes()[0];
	node1._hasChildren = true;
	node1.toggle();

	equal(tree.getShapeCount(), 2);
	equal(node1.getShapeCount(), 1);
	equal(board.getShapeCount(), 3);

	equal(board.getShapes()[0].y(), 0);
	equal(board.getShapes()[1].y(), 50);
});

test("removing a treenode removes nodes from board", function () {
	var mediator = createMediator();
	dataSrc.data = [
		{ label: "abc", model: { someId: 1, someName: "abc", boardNodes: [createNodeData(now, 1, 1)]} },
		{ label: "bcd", model: { someId: 2, someName: "bcd", boardNodes: [createNodeData(now, 2, 2)]} }
	];
	ctrl.load();

	equal(tree.getShapeCount(), 2);
	equal(board.getShapeCount(), 2);	

	 	
	tree.remove(tree.getShapes()[0]);

	equal(tree.getShapeCount(), 1);
	equal(board.getShapeCount(), 1);
});

test("removing a treenode removes child nodes from tree and board nodes", function () {
	var mediator = createMediator();
	dataSrc.data = [
		{ label: "abc", hasChildren : true, model: { someId: 1, someName: "abc", boardNodes: [createNodeData(now, 1, 1)]} },
		{ label: "bcd", model: { someId: 2, someName: "bcd", boardNodes: [createNodeData(now, 2, 2)]} }
	];
	ctrl.load();

	equal(tree.getShapeCount(), 2);
	equal(board.getShapeCount(), 2);

	dataSrc.data = [
	 	{ label: "dingsebomse", model: { someId: 3, someName: "dingsebomse", boardNodes: [createNodeData(now, 3, 3)]} }
	];

	var node1 = tree.getShapes()[0];
	 	
	node1.toggle();

	equal(tree.getShapeCount(), 2);
	equal(node1.getShapeCount(), 1);
	equal(board.getShapeCount(), 3);

	tree.remove(node1);

	equal(tree.getShapeCount(), 1);
	equal(node1.getShapeCount(), 0);
	equal(board.getShapeCount(), 1);
});

test("Toggling a treenode removes and adds boarnodes even when " +
	"treenode is loaded already", function() {
	var mediator = createMediator();
	dataSrc.data = [
		{ label: "abc", hasChildren: true, model: { someId: 1, someName: "abc", boardNodes: [createNodeData(now, 1, 1)]} },
		{ label: "bcd", model: { someId: 2, someName: "bcd", boardNodes: [createNodeData(now, 2, 2)]} }
	];
	ctrl.load();

	equal(tree.getShapeCount(), 2);
	equal(board.getShapeCount(), 2);

	dataSrc.data = [
		{ label: "dingsebomse", model: { someId: 3, someName: "dingsebomse", boardNodes: [createNodeData(now, 3, 3)]} }
	];

	var node1 = tree.getShapes()[0];

	node1.toggle();

	equal(tree.getShapeCount(), 2);
	equal(node1.getShapeCount(), 1);
	equal(board.getShapeCount(), 3);

	tree.remove(node1);

	equal(tree.getShapeCount(), 1);
	equal(node1.getShapeCount(), 0);
	equal(board.getShapeCount(), 1);
});