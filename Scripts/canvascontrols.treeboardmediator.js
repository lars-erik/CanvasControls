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
				y: treeNode.globalY()
			});
			boardNode.model = boardData.model;
			this.board.add(boardNode);
		},

		_onNodeAdded: function (s, e) {
			console.log(e.target);
			if (e.target._parent == undefined || (e.target._hasChildren && e.target._expanded)) {
				for (var i = 0; i < e.target._shapes.length; i++) {
					var boardData = e.target._shapes[i].model.boardNodes;
					for (var j = 0; j < boardData.length; j++) {
						this._addBoardNode(e.child, boardData[j]);
					}
				}
			}
			//if (e.target._parent == undefined) {
			//	var boardData = e.child.model.boardNodes;
			//	for (var i = 0; i < boardData.length; i++) {
			//this._addBoardNode(e.child, boardData[i]);
			//	}
			//}
		},
		_onNodeRemoved: function (s, e) {

		}
	});

})(canvascontrols);