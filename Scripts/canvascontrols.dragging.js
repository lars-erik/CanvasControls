(function (cc) {

	cc.DragView = cc.CanvasView.extend({
		init: function (options) {
			var _this = this;
			this._super(options);
			this._jq.css("display", "none");
			this._jq.mousemove(function (e) { _this.mouseMoved.apply(_this, [e]); });
		},
		startDrag: function (shape, x, y) {
			this.draggedShape = shape;
			shape._x = x;
			shape._y = y;
			this._jq.css("display", "block");
		},
		mouseMoved: function (e) {
			if (this.draggedShape == null) return;
			var x = e.pageX - this._jq.offset().left;
			var y = e.pageY - this._jq.offset().top;
			this.draggedShape._x = x;
			this.draggedShape._y = y;
		}
	});

})(canvascontrols);