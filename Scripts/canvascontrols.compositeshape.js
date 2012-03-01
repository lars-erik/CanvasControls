(function (cc) {

	cc.CompositeShape = cc.Shape.extend({
		init: function (options) {
			this._super(options);
			this._shapes = [];

			this.on("mousemove", this, this._onMouseMove);
		},
		add: function (shape) {
			if (!(shape instanceof cc.Shape))
				throw new Error("Cannot add instances not derived from canvascontrols.Shape");
			this._shapes.push(shape);
			shape._parent = this;
		},
		width: function () {
			var child, candidate, max = this._width;
			for (var i = 0; i < this._shapes.length; i++) {
				child = this._shapes[i];
				candidate = child.x() + child.width();
				max = Math.max(max, candidate);
			}
			return max;
		},
		height: function () {
			var child, candidate, max = this._height;
			for (var i = 0; i < this._shapes.length; i++) {
				child = this._shapes[i];
				candidate = child.y() + child.height();
				max = Math.max(max, candidate);
			}
			return max;
		},
		getShapes: function () {
			return this._shapes;
		},
		getShapeCount: function () {
			return this._shapes.length;
		},
		paint: function (context) {
			for (var i = 0; i < this._shapes.length; i++) {
				context.save();
				context.translate(this._shapes[i].x(), this._shapes[i].y());
				this._shapes[i].paint(context);
				context.restore();
			}
		},
		findShapeAt: function (coords) {
			if (this.isInBounds(coords)) {
				for (var i = 0; i < this._shapes.length; i++) {
					var child = this._shapes[i];
					var childCoords = this._getChildCoords(coords, child);
					if (child.isInBounds(childCoords)) {
						var candidate;
						if (child instanceof cc.CompositeShape) {
							candidate = child.findShapeAt(childCoords);
						} else {
							candidate = child;
						}
						if (candidate != null)
							return candidate;
					}
				}
				return this;
			}
			return null;
		},
		_getChildCoords: function (coords, child) {
			return {
				offsetX: coords.offsetX - child.x(),
				offsetY: coords.offsetY - child.y()
			};
		},
		_onMouseMove: function (s, e) {
			for (var i = 0; i < this._shapes.length; i++) {
				var child = this._shapes[i];
				var childCoords = this._getChildCoords(e, child);
				if (child.isInBounds(childCoords)) {
					if (child.__isHovered == undefined || child.__isHovered == false) {
						child.__isHovered = true;
						child._raise("mouseover", childCoords);
					}
					child._raise(e.type, $.extend(e, $.extend(e, childCoords)));
				} else if (child.__isHovered) {
					child.__isHovered = false;
					child._raise("mouseout", childCoords);
				}
			}
		}
	});

})(canvascontrols);