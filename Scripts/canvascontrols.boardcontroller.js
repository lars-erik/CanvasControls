(function (cc) {
	cc.BoardController = Class.extend({
		init: function (board, dataSrc) {
			this.board = board;
			this.datasource = dataSrc;

			board.on("dragged.cc", this, this._onDrag);
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
			this.datasource.save(node, this._onSaveDone);
		},
		_onSaveDone: function (data) {
			console.log(data);
		},
		_onDrag: function (s, e) {
			console.log(e.target);
			this._saveBoardNodes(e.target.getShapes());
		}
	});
})(canvascontrols);