(function (cc) {
	cc.BoardController = Class.extend({
		init: function (board, dataSrc) {
			this.board = board;
			this.datasource = dataSrc;

			board.on("dragged.cc", this, this._onDrag);
			board.on("resized.cc", this, this._onResize);
			board.on("nodeAdded.cc", this, this._onAdd);
			board.on("nodeRemoved.cc", this, this._onRemove);
		},

		addBoardNode: function (boardNode) {
			this.board.add(boardNode);
		},
		removeBoardNode: function (boardNode) {
			this.board.remove(boardNode);
		},

		_saveBoardNodes: function (nodes) {
			for (var i = 0; i < nodes.length; i++) {
				this._saveBoardNode(nodes[i]);
			}
		},
		_saveBoardNode: function (node) {
			node.model.start = node.start;
			node.model.end = node.end;
			this.datasource.update(node.model, this._onSaveDone);
		},
		_onSaveDone: function (data) {

		},
		_removeNode: function (node) {
			this.datasource.remove(node.model, this._onRemoveDone);
		},
		_onRemoveDone: function (data) {

		},

		_onDrag: function (s, e) {
			console.log("drag");
			this._saveBoardNodes(e.target.getShapes());
		},
		_onResize: function (s, e) {
			console.log("resize");
			console.log(e.child);
			this._saveBoardNode(e.child);
		},
		_onRemove: function (s, e) {
			this._removeNode(e.child);
		},
		_onAdd: function (s, e) {

		}
	});
})(canvascontrols);