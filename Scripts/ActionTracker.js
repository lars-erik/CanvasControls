(function (cc) {

	cc.ActionTypes = {
		'Move': 1,
		'Create': 2,
		'Delete': 3,
		'resize': 4
	};

	cc.ActionTracker = Class.extend({
		init: function () {
			this.actionCountLimit = 5;
			this.currentAction = null;
			this.actions = [];
		},
		revertAction: function () {
			var pop = this.actions.pop();
			console.log(this.actions);
			return pop;
		},
		beginAction: function (node) {
			
			this.currentAction = { 'start': node._start, 'end': node._end, 'treeNode': node.tnode };
		},
		doAction: function (t, data, callback) {
			switch (t) {
				case cc.ActionTypes.Create:
					this.addCreateAction(data, callback);
					break;
				case cc.ActionTypes.Delete:
					this.addDeleteAction(data, callback);
					break;
				case cc.ActionTypes.Move:
					this.addMoveAction(data, callback);
					break;
				case cc.ActionTypes.resize:
					this.addResizeAction(data, callback);
					break;
				default:
					break;
			}
			console.log(this.actions);
		},
		addCreateAction: function (data, callback) {
			var action = {
				'type': cc.ActionTypes.Create,
				'node': data.node,
				'callback': callback
			};
			this._pushAction(action);
		},
		addDeleteAction: function (data, callback) {
			var action = {
				'type': cc.ActionTypes.Delete,
				'node': data.node,
				'callback': callback
			};
			this._pushAction(action);
		},
		addMoveAction: function (data, callback) {
			var action = {
				'type': cc.ActionTypes.Move,
				'old_start': new Date(this.currentAction.start.getTime()),
				'old_end': new Date(this.currentAction.end.getTime()),
				'treeNode': this.currentAction.treeNode,
				'node': data.node,
				'callback': callback
			};
			this._pushAction(action);
		},
		addResizeAction: function (data, callback) {
			var action = {
				'type': cc.ActionTypes.Resize,
				'old_start': new Date(this.currentAction.start.getTime()),
				'old_end': new Date(this.currentAction.end.getTime()),
				'treeNode': this.currentAction.treeNode,
				'node': data.node,
				'callback': callback
			};
			this._pushAction(action);
		},
		_pushAction: function (action) {
			this.actions.push(action);
			while (this.actions.length > this.actionCountLimit) {
				this.actions.shift();
			}
		}
	});

})(canvascontrols);