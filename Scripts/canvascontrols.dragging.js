(function (cc) {

	cc.DragView = cc.CanvasView.extend({
		init: function (options) {
			var _this = this;
			this._super(options);
			this._jq.css("display", "none");
			this._jq.mousemove(function (e) { _this.mouseMoved.apply(_this, [e]); });
			this._jq.mouseup(function (e) { _this.mouseReleased.apply(_this, [e]); });
		},
		startDrag: function (shape, x, y) {
			this.draggedShape = shape;
			shape._x = x;
			shape._y = y;
			this._jq.css("display", "block");
		},
		mouseMoved: function (e) {
			if (this.draggedShape == null) return;
			this._moveShape(e);
			this._notifyListeners("dragged", { pageX: e.pageX, pageY: e.pageY });
		},
		mouseReleased: function (e) {
			if (this.draggedShape == null) return;
			this._moveShape(e);
			this.draggedShape = null;
			this._notifyListeners("dragStopped", { pageX: e.pageX, pageY: e.pageY });
		},
		_moveShape: function (e) {
			var pos = this._getOffset(e);
			this.draggedShape._x = pos.x;
			this.draggedShape._y = pos.y;
		},
		_getOffset: function (e) {
			return {
				x: e.pageX - this._jq.offset().left,
				y: e.pageY - this._jq.offset().top
			};
		}
	});

})(canvascontrols);