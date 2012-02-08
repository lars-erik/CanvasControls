(function (cc) {

	cc.CanvasView = Class.extend({
		init: function (selector) {
			this.selector = selector;
			this._initializeJq(selector);
			this._initializeCanvas();
			this._initializeMembers();
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
		add: function (shape) {
			if (!(shape instanceof cc.Shape))
				throw new Error("Cannot add instances not derived from canvascontrols.Shape");
			this._shapes.push(shape);
		},
		getShapeCount: function () {
			return this._shapes.length;
		},
		getShape: function (index) {
			return this._shapes[index];
		},
		paint: function () {
			this._beforePaint();
			for (var i = 0; i < this.getShapeCount(); i++) {
				this._paintShape(i);
			}
			this._afterPaint();
		},
		_initializeJq: function (id) {
			this._jq = $(id);
			if (this._jq.length != 1)
				throw new Error("Selector " + id + " does not return one unique element");
		},
		_initializeCanvas: function () {
			var self = this;
			this._canvas = this._jq[0];
			if (!this._canvas.getContext)
				throw new Error("Canvas not supported, or " + this.selector + " isn't a canvas");

			this._jq.attr("width", this._width = this._jq.width());
			this._jq.attr("height", this._height = this._jq.height());

			this._jq.click(function (e) {
				self._canvasClicked.apply(self, [e]);
			});

			this.context = this._canvas.getContext("2d");
		},
		_initializeMembers: function () {
			this._shapes = [];
		},
		_beforePaint: function () {
			this.context.clearRect(0, 0, this.width(), this.height());
			this.context.save();
			this.context.translate(0.5, 0.5);
		},
		_afterPaint: function () {
			this.context.restore();
		},
		_paintShape: function (index) {
			var shape = this.getShape(index);
			this.context.save();
			this.context.translate(shape.x(), shape.y());
			shape.paint(this.context);
			this.context.restore();
		},
		_canvasClicked: function (e) {
			var shape;
			for (var i = 0; i < this.getShapeCount(); i++) {
				shape = this.getShape(i);
				var shapeOffset = {
					x: e.offsetX - shape.x(),
					y: e.offsetY - shape.y()
				};
				if (shape.isInBounds(shapeOffset)) {
					shape.clicked(shapeOffset);
					break;
				}
			}
		}
	});
})(canvascontrols);