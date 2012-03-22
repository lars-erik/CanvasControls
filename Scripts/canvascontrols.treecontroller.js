(function (cc) {
	cc.TreeController = Class.extend({
		init: function (tree, src) {
			this.tree = tree;
			this.datasource = src;
			this.callback = null;
			this.newNode = null;

			tree.on("toggled.cc", this, this._onToggle);
		},

		load: function (node) {
			this.target = node == null ? this.tree : node;
			var model = node == null ? null : node.model;
			var callback = $.proxy(this.loadDone, this);
			this.datasource.load(model, callback);
		},

		loadDone: function (data) {
			for (var i = 0; i < data.length; i++) {
				this._addTreeNode(data[i]);
			}
			this.target._isLoaded = true;
			if (this.callback != null)
				this.callback();
		},

		addTo: function (node) {
			this.target = node;
			var wait;
			if (!node._expanded) {
				if (!node._isLoaded) {
					wait = true;
					this.callback = this.addToTarget;
				}
				if (node instanceof cc.TimelineTreeNode)
					node.toggle();
			}
			if (!wait)
				this.addToTarget();
		},

		addToTarget: function () {
			this.callback = null;
			this.newNode = this.target.add(new canvascontrols.TimelineTreeNode());
			var callback = $.proxy(this.addDone, this);
			datasource.addTo(this.target.model, callback);
		},

		addDone: function (data) {
			this.newNode.model = data;
			this.newNode = null;
		},

		_addTreeNode: function (treeData) {
			var newNode = new cc.TimelineTreeNode({ label: treeData.label, hasChildren: treeData.hasChildren });
			newNode.model = treeData.model;
			this.target.add(newNode);
			return newNode;
		},

		_onToggle: function (s, e) {
			if (e.target._hasChildren && !e.target._isLoaded)
				this.load(e.target);
		}
	});
})(canvascontrols);