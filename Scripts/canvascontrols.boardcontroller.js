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
			boardNode.addedByTree = true;
			this.board.add(boardNode);
		},

		removeBoardNode: function (boardNode) {
			this.board.remove(boardNode);
		},

		loadNodesFor: function (tnode) {
			var callback = $.proxy(this._onLoadDone, this);
			this.datasource.loadAll(tnode.model, tnode, callback);
		},

		_addBoardNode: function (node) {
			node.model.start = node._start;
			node.model.end = node._end;
			node.model.treeId = node.treeNode.model.Id;
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

			if (node.tellDataSource != undefined && node.tellDataSource == true) {
				// Should happend only when manually removing nodes from board
				this.datasource.remove(node.model, this._onRemoveDone);
			} else {
				this.board._raise("demandRedraw");
			}
		},

		_onLoadDone: function (data, treeNode) {
			if (data.length == 0) {
				this.board._raise("demandRedraw");
			}
			for (var i = 0; i < data.length; i++) {
				var boardNode = new cc.TimelineBoardNode({
					start: new Date(data[i].start),
					end: new Date(data[i].end),
					y: treeNode.globalY(),
					height: treeNode._boxHeight,
					valid: data[i].valid
				});

				boardNode.model = data[i];
				boardNode.model.treeId = treeNode.model.Id;
				boardNode.treeNode = treeNode;
				boardNode.addedByTree = false;
				this.board.add(boardNode);
			}
		},

		_onSaveDone: function (data) {
			this._valid = data.Valid;
			this.model.id = data.Id;
		},

		_onRemoveDone: function (data) {
			this.board._raise("demandRedraw");
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

			if (e.child.addedByTree == undefined) {
				this._addBoardNode(e.child);
			} else if (e.child.addedByTree) {
				this._loadBoardNode(e.child);
			}
		}
	});
})(canvascontrols);
/*(function (cc) {
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
*/