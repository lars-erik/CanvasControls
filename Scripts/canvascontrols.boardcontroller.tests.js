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
/// <reference path="canvascontrols.treeboardcontroller.js"/>
/// <reference path="canvascontrols.treecontroller.js"/>
/// <reference path="canvascontrols.boardcontroller.js"/>

module("Board Controller", {
	setup: function () {
		mock.reset();
		board = new canvascontrols.TimelineBoard();
		datasource = new MockDataSource();
		controller = createController();
	},
	teardown: function () {
		$("input[type='text']").remove();
	}
});
var mock = new MockContext();
var tree, board, datasource, controller;

var MockDataSource = Class.extend({
	init: function () {
		this.data = null;
		this.addModel = null;
		this.passedModel = Number.NaN;
		this.passedParentModel = Number.NaN;
		this.loadCalled = false;
		this.addCalled = false;
		this.removeCalled = false;
		this.updateCalled = 0;
	},
	load: function (parentModel, callback) {
		this.passedParentModel = parentModel;
		this.passedCallback = callback;
		this.loadCalled = true;
		callback(this.data);
	},
	addTo: function (parentModel, callback) {
		this.passedParentModel = parentModel;
		this.addCalled = true;
		callback(this.addModel);
	},
	update: function (model, callback) {
		this.passedModel = model;
		this.updateCalled++;
		if (callback != null) callback();
	},
	remove: function (model, callback) {
		this.passedModel = model;
		this.removeCalled = true;
		callback();
	}
});

function createController() {
	return new canvascontrols.BoardController(board, datasource);
}

function createData() {
	return [
		{ label: "abc", hasChildren: true, model: { someId: "1", someName: "abc", boardNodes : []} },
		{ label: "bcd", hasChildren: false, model: { someId: "2", someName: "bcd"} }
	];
}
function createNodeData(date, id, treeNodeId) {
	var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
	return { start: date, end: nextDate, model: { start: date, end: nextDate, id: id, treeNode: treeNodeId} };
}

function createNode() {
	return new canvascontrols.TimelineBoardNode({ start: new Date(2012, 1, 1), end: new Date(2012, 5, 1) });
}
test("Can create", function () {
	ok(controller.board === board);
	ok(controller.datasource === datasource);
});

test("Catches drag event and calls update", function () {
	var initialStart = new Date(2012, 2, 1);
	var initialEnd = new Date(2012, 2, 31);
	var n1 = new canvascontrols.TimelineBoardNode(
		{
			start: initialStart,
			end: initialEnd
		});
	n1.model = { start: initialStart, end: initialEnd};
	
	controller.addBoardNode(n1);
	board.paint(mock);
	ok(datasource.updateCalled == 0);
	board._raise("mousedown", { offsetX: 10, offsetY: 10, pageX: 10 });
	board._raise("mousemove", { offsetX: 11, offsetY: 10, pageX: 11 });
	board._raise("mouseup", { offsetX: 11, offsetY: 10 });
	notEqual(initialStart, datasource.passedModel.start);
	ok(datasource.updateCalled > 0);
});

test("Catches resize event calls update", function () {
	var initialStart1 = new Date(2012, 2, 1);
	var initialEnd1 = new Date(2012, 2, 31);
	var initialStart2 = new Date(2012, 3, 1);
	var initialEnd2 = new Date(2012, 3, 30);
	var n1 = new canvascontrols.TimelineBoardNode(
		{
			start: initialStart1,
			end: initialEnd1
		});
		n1.model = { start: initialStart1, end: initialEnd1 };
	var n2 = new canvascontrols.TimelineBoardNode(
		{
			start: initialStart2,
			end: initialEnd2
		});
		n2.model = { start: initialStart2, end: initialEnd2 };

	controller.addBoardNode(n1);
	controller.addBoardNode(n2);


	board.paint(mock);
	ok(datasource.updateCalled == 0);
	board._raise("mousedown", { offsetX: 4, offsetY: 0, pageX: 4 });
	board._raise("mousemove", { offsetX: 6, offsetY: 0, pageX: 6 });
	board._raise("mouseup", { offsetX: 6, offsetY: 0 });
	ok(datasource.updateCalled > 0);
	notEqual(initialStart1, datasource.passedModel.start);
	console.log(board.getShapes());
});



test("Catches removeNode event and calls remove on datasource", function () {
	var node = new canvascontrols.TimelineBoardNode();
	controller.addBoardNode(node);	

	equal(datasource.removeCalled, false);
	ok(board.getShapes()[0] === node);

	controller.removeBoardNode(node);
	equal(datasource.removeCalled, true);
	ok(board.getShapeCount() == 0);

	datasource.removeCalled = false;
	controller.addBoardNode(node);	
	
	board.clear();
	equal(datasource.removeCalled, true);
});