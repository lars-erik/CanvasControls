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

module("Tree Controller", {
	setup: function () {
		tree = new canvascontrols.TimelineTree();
		datasource = new MockDataSource();
	}
});

var tree, datasource;
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

function createController() {
	return new canvascontrols.TreeController(tree, datasource);
}


test("can create", function () {
	var controller = createController();
	ok(controller.tree === tree);
	ok(controller.datasource === datasource);
});

test("load calls datasource with parentModel(!!) null and callback", function () {
	var controller = createController();
	datasource.data = [
		{ label: "abc", model: { someId: 1, someName: "abc"} },
		{ label: "bcd", model: { someId: 2, someName: "bcd"} }
	];
	controller.load();
	ok(datasource.passedParentModel == null);
});

test("loadDone adds nodes to tree", function () {
	var controller = createController();
	var data = [
		{ label: "abc", model: { someId: 1, someName: "abc"} },
		{ label: "bcd", model: { someId: 2, someName: "bcd"} }
	];
	controller.target = tree;
	controller.loadDone(data);
	equal(tree.getShapes().length, 2);
	equal(tree.getShapes()[1]._label, data[1].label);
	equal(tree.getShapes()[1].model, data[1].model);
	
});

test("on tree toggle, controller loads and adds children of toggled node", function () {
	datasource.data = [
		{ label: "abc", model: { someId: 1, someName: "abc"} },
		{ label: "bcd", model: { someId: 2, someName: "bcd"} }
	];

	createController();

	var node = new canvascontrols.TimelineTreeNode();
	node._hasChildren = true;
	node.model = { id: "1" };
	tree.add(node);
	node.toggle();

	equal(datasource.passedParentModel, node.model);
	equal(node.getShapes().length, 2);

	
});

