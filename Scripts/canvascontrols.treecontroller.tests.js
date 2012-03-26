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

module("Tree Controller", {
	setup: function () {
		$("input[type='text']").remove();
		tree = new canvascontrols.TimelineTree();
		datasrc = new Mockdatasrc();
		controller = createController();
	},
	teardown: function () {
		$("input[type='text']").remove();
	}
});

var tree, datasrc, controller;
var now = new Date();

var Mockdatasrc = Class.extend({
	init: function () {
		this.data = null;
		this.addModel = null;
		this.passedModel = Number.NaN;
		this.passedParentModel = Number.NaN;
		this.loadCalled = false;
		this.addCalled = false;
		this.updateCalled = 0;
		this.removeCalled = 0;
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
		this.removeCalled++;
		if (callback != null) callback();
	}
});

function createController() {
	return new canvascontrols.TreeController(tree, datasrc);
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
	node.model = { Id: "3", label: "test" };
	return node;
}

test("can create", function () {
	ok(controller.tree === tree);
	ok(controller.datasource === datasrc);
});

test("load calls datasrc with parentModel(!!) null and callback", function () {
	datasrc.data = createData();
	controller.load();
	ok(datasrc.passedParentModel == null);
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
	datasrc.data = createData();

	var node = createAndAddRootNode();
	node.toggle();

	equal(datasrc.passedParentModel, node.model);
	equal(node.getShapes().length, 2);
});

test("does not load children if already loaded", function () {
	datasrc.data = createData();

	var node = createAndAddRootNode();
	node.toggle();

	equal(node.getShapes().length, 2);

	node.toggle();
	node.toggle();

	equal(node.getShapes().length, 2);
});

test("does not toggle if the tree is being loaded", function () {
	datasrc.data = createData();
	controller.load();
	equal(tree.getShapes().length, 2);
});

test("controller add toggles treenode if collapsed, " +
	 "waits for load done, " +
	 "adds new node, " +
	 "then calls datasrc add", 
function () {
	datasrc.data = [{ Id: "1.1", Name: "abc"}];
	var node = createAndAddRootNode();
	equal(node._expanded, false);
	ok(node._isLoaded == undefined);
	controller.addTo(node);
	equal(datasrc.passedParentModel.Id, "3");
	equal(node._expanded, true);
	equal(node._isLoaded, true);
	equal(node.getShapes().length, 2);
	ok(datasrc.addCalled);
});

test("controller add just adds if node already toggled", function () {
	datasrc.data = [{ Id: "1.1", Name: "abc"}];
	var node = createAndAddRootNode();
	node.toggle();
	equal(node._expanded, true);
	equal(node._isLoaded, true);
	datasrc.init();
	controller.addTo(node);
	ok(!datasrc.loadCalled);
	equal(node.getShapes().length, 2);
	ok(datasrc.addCalled);
});

test("controller add passes callback to datasrc and sets model and _isLoaded when done, then calls node.edit", function () {
	var node = createAndAddRootNode();
	node._isLoaded = true;
	datasrc.addModel = { Id: "1" };
	equal($("input[type='text']").length, 0);
	controller.addTo(node);
	ok(node.getShapes()[0].model === datasrc.addModel);
	ok(node.getShapes()[0]._isLoaded == true);
	equal($("input[type='text']").length, 1);
});

test("calls update on datasrc when node is renamed", function () {
	var node = createAndAddRootNode();
	var child = node.add(new canvascontrols.TimelineTreeNode());
	child.model = { Id: 1 };
	// what's done inside edit->update:
	child._label = "Hei hei";
	child._raise("renamed.cc", { child: child });
	equal(child.model.label, "Hei hei");
	equal(datasrc.updateCalled, 1);
	ok(datasrc.passedModel === child.model);
});

test("calls remove on datasrc when node is removed", function () {
	var node = createAndAddRootNode();
	var child = node.add(new canvascontrols.TimelineTreeNode());
	child.model = { Id: 1 };
	node.remove(child);
	equal(datasrc.removeCalled, 1);
	ok(datasrc.passedModel === child.model);
});

test("if node does not have children and is not loaded, onToggle just calls callback", function () {
	var node = createAndAddRootNode();
	node._hasChildren = false;
	controller.addTo(node);
	equal(node.getShapes().length, 1);
})