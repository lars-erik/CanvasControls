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

		_addBoardNode: function (node) {
			node.model.start = node._start;
			node.model.end = node._end;
			var callback = $.proxy(this._onSaveDone, node);
			this.datasource.add(node.model, callback);
		},
		_saveBoardNode: function (node) {
			node.model.start = node._start;
			node.model.end = node._end;
			var callback = $.proxy(this._onSaveDone, node);
			this.datasource.update(node.model, callback);
		},
		_removeNode: function (node) {
			this.datasource.remove(node.model, this._onRemoveDone);
		},
		
		_onSaveDone: function (data) {
			this._valid = data.valid;
			this._start = data.start;
			this._end = data.end;
		},
		_onRemoveDone: function (data) {
			// What here? O.o
		},

		_onDrag: function (s, e) {
			this._saveBoardNode(e.child);
		},
		_onResize: function (s, e) {
			this._saveBoardNode(e.child);
		},
		_onRemove: function (s, e) {
			this._removeNode(e.child);
		},
		_onAdd: function (s, e) {
			if (e.child.model == undefined) {
				e.child.model = {};
			}
			this._addBoardNode(e.child);
		}
	});
})(canvascontrols);