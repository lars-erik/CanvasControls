(function (cc) {

	cc.TimelineBoardMediator = Class.extend({
		init: function (timeline, board, timelineCanvas, boardCanvas) {
			this.timeline = timeline;
			this.board = board;
			this.timelineCanvas = timelineCanvas;
			this.boardCanvas = boardCanvas;

			timeline.on("demandRedraw.cc nodeClicked.cc", this, this._onTimelineRedrawDemanded);
			timeline.on("periodChanged.cc", this, this._onPeriodChange);
			timeline.on("drag.cc", this, this._onTimelineDragged);

			board.on("mousemove", this, this._onMouseMove);
			board.on("demandRedraw.cc", this, this._onBoardRedrawDemanded);
			board.on("nodeAdded.cc", this, this._onBoardRedrawDemanded);
			board.on("nodeRemoved.cc", this, this._onBoardRedrawDemanded);
		},
		_onTimelineRedrawDemanded: function (sender, data) {
			this.timelineCanvas.paint();
			this.boardCanvas.paint();
		},
		_onBoardRedrawDemanded: function (sender, data) {
			this._updateY();
			this.boardCanvas.paint();
		},
		_onPeriodChange: function (sender, data) {
			this.timelineCanvas.paint();
			this.board.setPeriod(data.period);
			this.boardCanvas.paint();
		},
		_onMouseMove: function (sender, data) {
			this.timeline._raise("mousemove", data);
		},
		_onTimelineDragged: function (sender, data) {
			this.board.setOffset(data.offset);
			this.boardCanvas.paint();
		},
		_updateY: function () {
			for (var i = 0; i < this.board.getShapeCount(); i++) {
				var node = this.board.getShapes()[i];
				node._y = node.treeNode.globalY();
			}
		}

	});
})(canvascontrols);
