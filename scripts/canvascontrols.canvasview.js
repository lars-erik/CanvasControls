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
		getShape: function (index) {
			return this._shapes[index];
		},
		paint: function () {
			this._setViewProportions();
			this.context.clearRect(0, 0, this.width(), this.height());
			this.context.save();
			this.context.translate(0.5, 0.5);
			this._super(this.context);
			this.context.restore();
		},
		_paintShape: function (shape) {
			this.context.clearRect(shape.globalX(), shape.globalY(), shape.width(), shape.height());
			this.context.save();
			this.context.translate(0.5, 0.5);
			this.context.translate(shape.globalX(), shape.globalY());
			shape.paint(this.context);
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

			this._setViewProportions();

			this.on("mousewheel", this, this._onMouseWheel);
			this.context = this._canvas.getContext("2d");
		},
		_setViewProportions: function () {
			this._jq.attr("width", this._width = this._jq.width());
			this._jq.attr("height", this._height = this._jq.height());
		},
		_onMouseEvent: function (s, e) {
			if (e.offsetX == undefined) {
				$.extend(e, {
					offsetX: (e.pageX == undefined ? e.originalEvent.pageX : e.pageX) - this._jq.offset().left,
					offsetY: (e.pageY == undefined ? e.originalEvent.pageY : e.pageY) - this._jq.offset().top
				});
			}
			this._super(s, e);
		},
		_onMouseWheel: function (s, e) {
			$.extend(e, {
				offsetX: (e.pageX == undefined ? e.originalEvent.pageX : e.pageX) - this._jq.offset().left,
				offsetY: (e.pageY == undefined ? e.originalEvent.pageY : e.pageY) - this._jq.offset().top
			});
			if (arguments.length == 5) {
				$.extend(e, {
					delta: arguments[2],
					deltaX: arguments[3],
					deltaY: arguments[4]
				});
			}

			var shape = this.findShapeAt(e);
			if (shape != null)
				shape._raise(e.type, e);
		},
		_childInvalidated: function (s, e) {
			this._super(s, e);
			if (e.affectsParents) {
				this._paintShape(e.target);
			} else {
				while (e.original != null) {
					e = e.original;
				}
				var child = e.target;
				this._paintShape(child);
			}
		}
	});
})(canvascontrols);