(function (cc) {
	cc.BoardController = Class.extend({
		init: function (board, dataSrc) {
			this.board = board;
			this.datasource = dataSrc;

			board.on("dragged.cc", this, this._onDrag);
			board.on("nodeRemoved.cc", this, this._onRemove);
		},
		_addBoardNode: function (node) {
			this.board.add(node);
		},
		_saveBoardNodes: function (nodes) {
			for (var i = 0; i < nodes.length; i++) {
				this._saveBoardNode(nodes[i]);
			}
		},
		_saveBoardNode: function (node) {
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
			this._saveBoardNodes(e.target.getShapes());
		},
		_onRemove: function (s, e) {
			this._removeNode(e.child);
		}
	});
})(canvascontrols);