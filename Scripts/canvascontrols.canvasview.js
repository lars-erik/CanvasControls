(function (cc) {

	cc.CanvasView = cc.CompositeShape.extend({
		init: function (selector) {
			this.selector = selector;
			this._initializeJq(selector);
			this._initializeCanvas();
			this._super({
				width: this.width(),
				height: this.height()
			});
		},
		mockContext: function (mock) {
			this.context = mock;
		},
		width: function () {
			return this._width;
		},
		height: function () {
			return this._height;
		},
		// todo: add test for remove, move it to compositeshape
		remove: function (shape) {
			for (var i = 0; i < this._shapes.length && this._shapes[i] != shape; i++) { }
			if (i < this._shapes.length)
				this._shapes.splice(i, 1);
		},
		getShape: function (index) {
			return this._shapes[index];
		},
		paint: function () {
			this.context.clearRect(0, 0, this.width(), this.height());
			this.context.save();
			this.context.translate(0.5, 0.5);
			this._super(this.context);
			this.context.restore();
		},
		on: function (event, owner, handler) {
			this._on(event.indexOf(".") > -1 ? $(this) : this._jq, event, owner, handler);
		},
		_initializeJq: function (id) {
			this._jq = $(id);
			if (this._jq.length != 1)
				throw new Error("Selector " + id + " does not return one unique element");
		},
		_initializeCanvas: function () {
			this._canvas = this._jq[0];
			if (!this._canvas.getContext)
				throw new Error("Canvas not supported, or " + this.selector + " isn't a canvas");

			this._jq.attr("width", this._width = this._jq.width());
			this._jq.attr("height", this._height = this._jq.height());

			//			this.on("mousedown mouseup mousemove click contextmenu", this, this._onMouseEvent);

			this.context = this._canvas.getContext("2d");
		} //,
		//		_getShapeOffset: function (shape, coords) {
		//			return {
		//				originalX: coords.offsetX,
		//				originalY: coords.offsetY,
		//				offsetX: coords.offsetX - shape.x(),
		//				offsetY: coords.offsetY - shape.y()
		//			};
		//		},
		// todo: re-add onMouseEvent
		//		_onMouseEvent: function (s, e) {
		//			$.extend(e, {
		//				offsetX: e.pageX - this._jq.offset().left,
		//				offsetY: e.pageY - this._jq.offset().top
		//			});
		//			var shape = this.findShapeAt(e);
		//			if (shape != null) {
		//				var shapeOffset = this._getShapeOffset(shape, e);
		//				shape._raise(e.type, $.extend(e, shapeOffset));
		//			}
		//		}
	});
})(canvascontrols);