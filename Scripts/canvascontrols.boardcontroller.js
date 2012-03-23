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
		_onDrag: function (s, e) {

		}
	});
})(canvascontrols);