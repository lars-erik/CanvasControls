(function (cc) {

	cc.TreeBoardMediator = Class.extend({
		init: function (tree, board, treeCtrl, boardCtrl) {
			this.tree = tree;
			this.board = board;
			this.treeController = treeCtrl;
			this.boardController = boardCtrl;

			tree.on("nodeAdded.cc", this, this._onTreeNodeAdded);
			tree.on("nodeRemoved.cc", this, this._onTreeNodeRemoved);
			tree.on("toggled.cc", this, this._onTreeNodeToggled);
		},

		_addBoardNode: function (treeNode, boardData) {
			var boardNode = new cc.TimelineBoardNode({
				start: boardData.start,
				end: boardData.end,
				y: treeNode.globalY(),
				height : treeNode._boxHeight,
				valid: boardData.valid
			});
			boardNode.model = boardData.model;
			boardNode.treeNode = treeNode;
			this.boardController.addBoardNode(boardNode);	
		},
		_removeBoardNodes: function (nodes) {
			for (var i = 0; i < nodes.length; i++) {
				this._removeBoardNode(nodes[i]);
			}
		},
		_removeBoardNode: function (n) {
			this.boardController.removeBoardNode(n);
		},
		_onTreeNodeAdded: function (s, e) {
			var boardData = e.child.model.boardNodes;
			for (var i = 0; i < boardData.length; i++) {
				this._addBoardNode(e.child, boardData[i]);
			}
			this._updateY();
		},
		_onTreeNodeRemoved: function (s, e) {
			

			for (var i = 0; i < this.board.getShapeCount(); i++) {
				var bnode = this.board.getShapes()[i];
				if (bnode.treeNode === e.child)
					this._removeBoardNode(bnode);
			}
			this._updateY();
		},
		_onTreeNodeToggled: function (s, e) {
			var tnode;

			if (!e.target._expanded) {
				for (var i = 0; i < e.target.getShapeCount(); i++) {
					tnode = e.target.getShapes()[i];
					this._removeBoardNodes(this._getBoardNodes(tnode));
				}
			} else if (e.target._hasChildren && e.target._isLoaded) {
				for (var j = 0; j < e.target.getShapeCount(); j++) {
					tnode = e.target.getShapes()[j];
					if (this._getBoardNodes(tnode).length == 0) {
						for (var k = 0; k < tnode.model.boardNodes.length; k++) {
							this._addBoardNode(tnode, tnode.model.boardNodes[k]);
						}
					}
				}
			}
			this._updateY();
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