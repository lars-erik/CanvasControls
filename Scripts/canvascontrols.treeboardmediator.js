(function (cc) {

	cc.TreeBoardMediator = Class.extend({
		init: function (tree, board, treeCtrl) {
			this.tree = tree;
			this.board = board;
			this.treeController = treeCtrl;

			tree.on("nodeAdded.cc", this, this._onNodeAdded);
			tree.on("nodeRemoved.cc", this, this._onNodeRemoved);
		},

		_addBoardNode: function (treeNode, boardData) {
			var boardNode = new cc.TimelineBoardNode({
				start: boardData.start,
				end: boardData.end,
				y: treeNode.globalY(),
				valid: boardData.valid
			});
			boardNode.model = boardData.model;
			boardNode.treeNode = treeNode;
			this.board.add(boardNode);
		},
		_removeBoardNode: function (n) {
			board.remove(n);
		},
		_onNodeAdded: function (s, e) {
			var boardData = e.child.model.boardNodes;
			for (var i = 0; i < boardData.length; i++) {
				this._addBoardNode(e.child, boardData[i]);
			}
			this._updateY();
		},
		_onNodeRemoved: function (s, e) {
			console.debug(e.node);
			
			for (var i = 0; i < board.getShapeCount(); i++) {
				var bnode = board.getShapes()[i];
				if (bnode.treeNode === e.node)
					this._removeBoardNode(bnode);
			}
			this._updateY();
		},
		_updateY: function () {
			for (var i = 0; i < board.getShapeCount(); i++) {
				var node = board.getShapes()[i];
				node._y = node.treeNode.globalY();
			}
		}
	});

})(canvascontrols);