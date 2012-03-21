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

function createNodeData(date, id) {
	var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
	return { start: date, end: nextDate, model: { start: date, end: nextDate, id: id} };
}

test("can create", function () {
	var mediator = createMediator();
	ok(mediator.tree === tree);
	ok(mediator.board === board);
	
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

	equal(tree.getShapes().length, 1);
	equal(board.getShapes().length, 2);

	dataSrc.data = [
	{ label: "abc", model: { Id: 3, Name: "abc", boardNodes: [createNodeData(now, 5), createNodeData(now, 6)]} }
	
	];
	console.log("wtf");
	node1.toggle();

	
	equal(tree.getShapes().length, 3);
	
});
/*
test("when tree has two items with board nodes, and a subnode is added to the first, " +
	 "the second boardnode is pushed down", function () {
	 	datasource.data = [
			{ label: "abc", boardNodes: [createNodeData(now, 1)], model: { someId: 1, someName: "abc"} },
			{ label: "bcd", boardNodes: [createNodeData(now, 2)], model: { someId: 2, someName: "bcd"} }
		];
	 	var mediator = createMediator();
	 	mediator.load();

	 	equal(board.getShapes()[0].y(), 0);
	 	equal(board.getShapes()[1].y(), 25);

	 	datasource.data = [
	 		{ label: "dingsebomse", boardNodes: [createNodeData(now, 3)], model: { someId: 3, someName: "dingsebomse"} }
		];

	 	var node1 = tree.getShapes()[0];
	 	node1.toggle();

	 	equal(board.getShapes()[0].y(), 0);
	 	equal(board.getShapes()[2].y(), 50);

	 	console.log(tree.getShapes());
	 	console.log(board.getShapes());
	 });*/