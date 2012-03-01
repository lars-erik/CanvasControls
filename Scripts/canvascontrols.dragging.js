(function (cc) {

	cc.DragView = cc.CanvasView.extend({
		init: function (options) {
			this._super(options);
			this._jq.css("display", "none");
			this.on("mousemove", this, this.mouseMoved);
			this.on("mouseup", this, this.mouseReleased);
		},
		startDrag: function (shape, x, y) {
			this.draggedShape = shape;
			this.add(shape);
			shape._x = x;
			shape._y = y;
			this._jq.css("display", "block");
			this.paint();
		},
		mouseMoved: function (s, e) {
			if (this.draggedShape == null) return;
			this._moveShape(e);
			this.paint();
			this._raise("dragged.cc", { pageX: e.pageX, pageY: e.pageY, offsetX: e.offsetX, offsetY: e.offsetY });
		},
		mouseReleased: function (s, e) {
			if (this.draggedShape == null) return;
			this._moveShape(e);
			this.remove(this.draggedShape);
			this.draggedShape = null;
			this._raise("dragStopped.cc", { pageX: e.pageX, pageY: e.pageY, offsetX: e.offsetX, offsetY: e.offsetY });
			this.context.clearRect(0, 0, this.width(), this.height());
			this._jq.css("display", "none");
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

	cc.DragShape = cc.Shape.extend({
		init: function (options, imageData) {
			this._super(options);
			this._imageData = imageData;
			this.width = options.width;
			this.height = options.height;
		},
		paint: function (ctx) {
			ctx.putImageData(this._imageData, this.x(), this.y(), 0, 0, this.width, this.height);
		}
	});

	cc.DragShape.create = function (ctx, x, y, w, h) {
		var image = ctx.getImageData(x, y, w, h);
		fade();
		return new cc.DragShape({ width: w, height: h }, image);

		function fade() {
			var centerX = 0, centerY = 0, alpha;
			for (var i = 0; i < image.data.length; i += 4) {
				x = i / 4 % w;
				y = i / 4 / h;
				var fraction = (Math.pow(x - centerX, 2) / Math.pow(w / 2, 2)) +
							   (Math.pow(y - centerY, 2) / Math.pow(h / 2, 2));
				if (fraction < 0.5) {
					alpha = 1;
				} else if (fraction > 4) {
					alpha = 0;
				} else {
					fraction -= 0.5;
					fraction /= 3.5;
					alpha = 1 - fraction;
				}
				alpha = alpha + 0.5 > 1 ? 1 : alpha + 0.5;
				if (image.data[i + 3] != 0)
					image.data[i + 3] = Math.round(alpha * 0xFF);
			}

		}
	};

})(canvascontrols);