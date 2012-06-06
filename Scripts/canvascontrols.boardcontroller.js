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
		addBoardNodeWithTree: function (x, tnode) {
			var d = board.findDateAtCoord(x);
			var view = this.board.findViewAtDate(d);

			if (view != null) {
				var nodeX = this.board.findPositionAtDate(new Date(view.DateStart.getTime()));
				var nodeWidth = this.board.findPositionAtDate(new Date(view.DateEnd.getTime())) - nodeX;	

				var newNode = new canvascontrols.TimelineBoardNode({
					start: new Date(view.DateStart.getTime()),
					end: new Date(view.DateEnd.getTime()),
					y: tnode.globalY(),
					x: nodeX,
					width: nodeWidth,
					height: tnode._boxHeight,
					valid: false
				});
				newNode.treeNode = tnode;
				this.board.add(newNode);
			}
		},
		saveNode: function (node) {
			this._saveBoardNode(node);
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
			var callback = $.proxy(this._onUpdateDone, this);
			this.datasource.update(node.model, node, callback);
		},

		_removeNode: function (node) {

			if (node.tellDataSource != undefined && node.tellDataSource == true) {
				// Should happend only when manually removing nodes from board
				var callback = $.proxy(this._onRemoveDone, this);
				this.datasource.remove(node.model, callback);
			} else {
				this.board._raise("demandRedraw");
			}
		},

		_onLoadDone: function (data, treeNode) {
			if (data.length == 0) {
				this.board._raise("demandRedraw");
			}
			for (var i = 0; i < data.length; i++) {
				var nodeX = this.board.findPositionAtDate(new Date(parseInt(data[i].start)));
				var nodeWidth = this.board.findPositionAtDate(new Date(parseInt(data[i].end))) - nodeX;
				var boardNode = new cc.TimelineBoardNode({
					start: new Date(parseInt(data[i].start)),
					end: new Date(parseInt(data[i].end)),
					y: treeNode.globalY(),
					x: nodeX,
					width : nodeWidth,
					height: treeNode._boxHeight,
					valid: data[i].valid,
					textLabel: data[i].profit
				});
				/*var boardNode = new cc.TimelineBoardNode({
					start: new Date(parseInt(data[i].start)),
					end: new Date(parseInt(data[i].end)),
					y: treeNode.globalY(),
					height: treeNode._boxHeight,
					valid: data[i].valid,
					textLabel: data[i].profit
				});*/

				var kpis = $.map(data[i].kpis, function (e) {
					return { id: e.Id, type: e.Type, value: e.Value };
				});
				data[i].kpis = kpis;
				boardNode.model = data[i];
				boardNode.model.treeId = treeNode.model.Id;
				boardNode.treeNode = treeNode;
				boardNode.addedByTree = false;
				this.board.add(boardNode);

				boardNode.invalidate(true);
			}
		},
		_onSaveDone: function (data) {
			this._valid = data.Valid;
			this.model.id = data.Id;
			this.model.kpis = [];
			this.invalidate(true);
		},
		_onUpdateDone: function (data, node) {
			console.log(node);
			node._valid = data.Valid;
			node.model.id = data.Id;
			var p = parseInt(data.Profit);
			//console.log("Profit = " + p);
			node._textLabel = data.Profit;
			if (p < 0) {
				node.setLampColor("red");
			} else if (p >= 0 && p < 1000) {
				node.setLampColor("yellow");
			} else {
				node.setLampColor("green");
			}
			this.board.invalidate();
			//node.invalidate(true);

		},

		_onRemoveDone: function (data) {

			this.board.invalidate();
			this.board._raise("demandRedraw");
		},

		_onDrag: function (s, e) {
			if (e.child.nosave == undefined) {
				this._saveBoardNode(e.child);
			} else {
				delete e.child.nosave;
			}
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