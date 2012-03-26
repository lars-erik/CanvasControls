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
		board = new canvascontrols.TimelineBoard();
		datasource = new MockDataSource();
		controller = createController();
	},
	teardown: function () {
		$("input[type='text']").remove();
	}
});

var tree, board, datasource, controller;

var MockDataSource = Class.extend({
	init: function () {
		this.data = null;
		this.addModel = null;
		this.passedParentModel = Number.NaN;
		this.addCalled = false;
	},
	load: function (parentModel, callback) {
		this.passedParentModel = parentModel;
		this.passedCallback = callback;
		callback(this.data);
	},
	addTo: function (parentModel, callback) {
		this.passedParentModel = parentModel;
		this.addCalled = true;
		callback(this.addModel);
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

test("can create", function () {
	ok(controller.board === board);
	ok(controller.datasource === datasource);
});