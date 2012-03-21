(function (cc) {
	cc.TreeController = Class.extend({
		init: function (tree, src) {
			this.tree = tree;
			this.datasource = src;

			tree.on("toggled.cc", this, this._onToggle);
		},

		load: function (node) {
			this.target = node == null ? this.tree : node;
			var model = node == null ? null : node.model;
			this.datasource.load(model, $.proxy(this.loadDone, this));
		},
		loadDone: function (data) {
			for (var i = 0; i < data.length; i++) {
				this._addTreeNode(data[i]);
			}
		},

		_addTreeNode: function (treeData) {
			var newNode = new cc.TimelineTreeNode({ label: treeData.label });
			newNode.model = treeData.model;
			this.target.add(newNode);
			return newNode;
		},
		_onToggle: function (s, e) {
			this.load(e.target);
		}
	});
})(canvascontrols);