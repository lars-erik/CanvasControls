(function (cc) {

	cc.TreeBoardMediator = Class.extend({
		init: function (tree, board, treeCtrl, boardCtrl) {
			this.tree = tree;
			this.board = board;
			this.treeController = treeCtrl;
			this.boardController = boardCtrl;
			this.lines = [];
			tree.on("nodeAdded.cc", this, this._onTreeNodeAdded);
			tree.on("nodeRemoved.cc", this, this._onTreeNodeRemoved);
			tree.on("toggled.cc", this, this._onTreeNodeToggled);
		},

		/*_addBoardNode: function (treeNode, boardData) {
		var boardNode = new cc.TimelineBoardNode({
		start: new Date(boardData.From),
		end: new Date(boardData.To),
		y: treeNode.globalY(),
		height: treeNode._boxHeight,
		valid: boardData.valid
		});

		boardNode.model = this._createModel(boardData);
		boardNode.model.treeId = treeNode.model.Id;
		boardNode.treeNode = treeNode;

		this.boardController.addBoardNode(boardNode);
		},*/

		/*_createModel: function (boardData) {
		var model = {};
		model.start = new Date(boardData.From);
		model.end = new Date(boardData.To);
		model.id = boardData.Id;
		return model;
		},*/
		_removeBoardNodes: function (nodes, tellDataSource) {
			for (var i = 0; i < nodes.length; i++) {
				nodes[i].tellDataSource = tellDataSource;
				this._removeBoardNode(nodes[i], tellDataSource);
			}
		},
		_removeBoardNode: function (n) {
			this.boardController.removeBoardNode(n);
		},
		_onTreeNodeAdded: function (s, e) {
			if (e.child.model != null && e.child.model.boardNodes != undefined) {

				this.boardController.loadNodesFor(e.child);
				e.child.on("mouseover", this, this._onTreeNodeMouseOver);
				e.child.on("mouseout", this, this._onTreeNodeMouseOver);
			}
			this._updateY();
		},
		_onTreeNodeRemoved: function (s, e) {
			this._removeRecursive(e.child, true);
		},
		_removeRecursive: function (node) {
			this._removeBoardNodes(this._getBoardNodes(node), true);
			for (var i = 0; i < node.getShapeCount(); i++) {
				this._removeRecursive(node.getShapes()[i]);
			}
		},

		_foldRecursive: function (node, notify) {
			for (var i = 0; i < node.getShapeCount(); i++) {
				tnode = node.getShapes()[i];
				this._removeBoardNodes(this._getBoardNodes(tnode), notify);
				this._foldRecursive(tnode, notify);
			}
		},
		_unfoldRecursive: function (node) {
			for (var i = 0; i < node.getShapeCount(); i++) {
				tnode = node.getShapes()[i];
				this.boardController.loadNodesFor(tnode);
				if (tnode._hasChildren && tnode._isLoaded && tnode._expanded)
					this._unfoldRecursive(tnode);
			}
		},
		_onTreeNodeToggled: function (s, e) {
			if (!e.target._expanded)
				this._foldRecursive(e.target, false);
			else if (e.target._hasChildren && e.target._isLoaded)
				this._unfoldRecursive(e.target);
			this.board._raise("demandRedraw.cc");
		},
		_onTreeNodeMouseOver: function (s, e) {

			if (e.target != undefined) {
				switch (e.type) {
					case "mouseover":
						console.log("mouseover");
						this.board._highlight = { y: e.target.globalY(), height: e.target._boxHeight };
						break;
					default:
						//this.board._highlight = null;
						break;
				}
				this.board.invalidate();
			}
		},
		_updateY: function () {
			for (var i = 0; i < board.getShapeCount(); i++) {
				var node = board.getShapes()[i];
				node._y = node.treeNode.globalY();
			}
		},
		_getBoardNodes: function (treeNode) {
			var arr = [];
			for (var i = 0; i < board.getShapeCount(); i++) {
				var bnode = board.getShapes()[i];
				if (bnode.treeNode === treeNode)
					arr.push(bnode);
			}
			return arr;
		}
	});

})(canvascontrols);