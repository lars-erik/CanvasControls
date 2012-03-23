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
		$("input[type='text']").remove();
		tree = new canvascontrols.TimelineTree();
		datasource = new MockDataSource();
		controller = createController();
	},
	teardown: function () {
		$("input[type='text']").remove();
	}
});

var tree, datasource, controller;
var now = new Date();

var MockDataSource = Class.extend({
	init: function () {
		this.data = null;
		this.addModel = null;
		this.passedModel = Number.NaN;
		this.passedParentModel = Number.NaN;
		this.loadCalled = false;
		this.addCalled = false;
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
	}
});

function createController() {
	return new canvascontrols.TreeController(tree, datasource);
}

function createData() {
	return [
		{ label: "abc", hasChildren: true, model: { someId: "1", someName: "abc" } },
		{ label: "bcd", hasChildren: false, model: { someId: "2", someName: "bcd"} }
	];
}

function createAndAddRootNode() {
	var node = tree.add(new canvascontrols.TimelineTreeNode({
		hasChildren: true
	}));
	node.model = { Id: "3" };
	return node;
}

test("can create", function () {
	ok(controller.tree === tree);
	ok(controller.datasource === datasource);
});

test("load calls datasource with parentModel(!!) null and callback", function () {
	datasource.data = createData();
	controller.load();
	ok(datasource.passedParentModel == null);
});

test("loadDone adds nodes to tree", function () {
	var data = createData();
	controller.target = tree;
	controller.loadDone(data);
	equal(tree.getShapes().length, 2);
	equal(tree.getShapes()[1]._label, data[1].label);
	equal(tree.getShapes()[1]._hasChildren, data[1].hasChildren);
	equal(tree.getShapes()[1].model, data[1].model);
	
});

test("on tree toggle, controller loads and adds children of toggled node", function () {
	datasource.data = createData();

	var node = createAndAddRootNode();
	node.toggle();

	equal(datasource.passedParentModel, node.model);
	equal(node.getShapes().length, 2);
});

test("does not load children if already loaded", function () {
	datasource.data = createData();

	var node = createAndAddRootNode();
	node.toggle();

	equal(node.getShapes().length, 2);

	node.toggle();
	node.toggle();

	equal(node.getShapes().length, 2);
});

test("does not toggle if the tree is being loaded", function () {
	datasource.data = createData();
	controller.load();
	equal(tree.getShapes().length, 2);
});

test("controller add toggles treenode if collapsed, " +
	 "waits for load done, " +
	 "adds new node, " +
	 "then calls datasource add", 
function () {
	datasource.data = [{ Id: "1.1", Name: "abc"}];
	var node = createAndAddRootNode();
	equal(node._expanded, false);
	ok(node._isLoaded == undefined);
	controller.addTo(node);
	equal(datasource.passedParentModel.Id, "3");
	equal(node._expanded, true);
	equal(node._isLoaded, true);
	equal(node.getShapes().length, 2);
	ok(datasource.addCalled);
});

test("controller add just adds if node already toggled", function () {
	datasource.data = [{ Id: "1.1", Name: "abc"}];
	var node = createAndAddRootNode();
	node.toggle();
	equal(node._expanded, true);
	equal(node._isLoaded, true);
	datasource.init();
	controller.addTo(node);
	ok(!datasource.loadCalled);
	equal(node.getShapes().length, 2);
	ok(datasource.addCalled);
});

test("controller add passes callback to datasource and sets model when done, then calls node.edit", function () {
	var node = createAndAddRootNode();
	node._isLoaded = true;
	datasource.addModel = { Id: "1" };
	equal($("input[type='text']").length, 0);
	controller.addTo(node);
	ok(node.getShapes()[0].model === datasource.addModel);
	equal($("input[type='text']").length, 1);
});

test("calls update on datasource when node is renamed", function () {
	var node = createAndAddRootNode();
	var child = node.add(new canvascontrols.TimelineTreeNode());
	child.model = { Id: 1 };
	// what's done inside edit->update:
	child._raise("renamed.cc", { child: child });
	equal(datasource.updateCalled, 1);
	ok(datasource.passedModel === child.model);
});

test("calls remove on datasource when node is removed", function () {
	var node = createAndAddRootNode();
	var child = node.add(new canvascontrols.TimelineTreeNode());
	child.model = { Id: 1 };
	node.remove(child);
	equal(datasource.removeCalled, 1);
	ok(datasource.passedModel === child.model);
});