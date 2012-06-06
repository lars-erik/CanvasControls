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
	add: function (model, callback) {
		this.addModel = model;
		this.addModel.valid = Math.random() > 0.5;
		this.addCalled = true;
		if (callback != null) callback(this.addModel);
	},
	update: function (model, node, callback) {
		this.passedModel = model;
		this.passedModel.Valid = Math.random() > 0.5;
		this.passedModel.Id = 1;
		this.updateCalled++;
		if (callback != null) callback(this.passedModel,node);
	},
	remove: function (model, callback) {
		this.passedModel = model;
		this.removeCalled = true;
		if (callback != null) callback();
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

test("Board add updates datasource", function () {
	var node = new canvascontrols.TimelineBoardNode({
		start: new Date(),
		end: new Date()
	});
	var mockTreeNode = {
		model: {

		},
		_boxHeight: 10,
		globalY: function () { return 10; }
	};
	node.treeNode = mockTreeNode;
	ok(!datasource.addCalled);
	board.add(node);
	ok(datasource.addCalled);
});
test("Board remove updates datasource", function () {
	var node = new canvascontrols.TimelineBoardNode({
		start: new Date(),
		end: new Date()
	});
	node.tellDataSource = true;
	var mockTreeNode = {
		model: {

		}
	};
	node.treeNode = mockTreeNode;
	ok(!datasource.addCalled);
	board.add(node);
	ok(datasource.addCalled);
	ok(!datasource.removeCalled);
	board.remove(node);
	ok(datasource.removeCalled);
});
test("BoardNode drag event updates datasource", function () {
	var initialStart = new Date(2012, 4, 1);
	var initialEnd = new Date(2012, 4, 31);
	var n1 = new canvascontrols.TimelineBoardNode(
		{
			start: new Date(initialStart.getTime()),
			end: new Date(initialEnd.getTime())
		});
	n1.model = { start: initialStart, end: initialEnd, id:1 };
	n1.treeNode = { model: {} };


	ok(!datasource.addCalled);
	board.add(n1);
	ok(datasource.addCalled);
	ok(datasource.updateCalled == 0);
	board.paint(mock);
	
	board._raise("mousedown", { offsetX: n1.x() + 20, offsetY: 10, pageX: 0 });
	board._raise("mousemove", { offsetX: n1.x() + 30, offsetY: 10, pageX: 15 });
	board._raise("mouseup", { offsetX: n1.x() + 30, offsetY: 10 });
	ok(!n1._wasResized);
	ok(datasource.updateCalled > 0);
	notEqual(initialStart, datasource.passedModel.start);

});

test("BoardNode resize updates datasource", function () {
	var initialStart1 = new Date(2012, 4, 1);
	var initialEnd1 = new Date(2012, 4, 31);
	var n1 = new canvascontrols.TimelineBoardNode(
		{
			start: new Date(initialStart1.getTime()),
			end: new Date(initialEnd1.getTime())
		});
	n1.model = { start: initialStart1, end: initialEnd1 };
	n1.treeNode = { model: {} };

	board.add(n1);
	board.paint(mock);

	ok(datasource.updateCalled == 0);
	board._raise("mousedown", { offsetX: n1.x() + 5, offsetY: 0, pageX: 0 });
	board._raise("mousemove", { offsetX: n1.x() - 10, offsetY: 0, pageX: -15 });
	board._raise("mouseup", { offsetX: n1.x() - 10, offsetY: 0 });

	//ok(n1._wasResized);
	ok(datasource.updateCalled > 0);
	
	notEqual(initialStart1, datasource.passedModel.start);

});

