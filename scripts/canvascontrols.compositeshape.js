(function (cc) {

	cc.CompositeShape = cc.Shape.extend({
		init: function (options) {
			this._super(options);
			this._shapes = [];

			this.on("mousedown mouseup dblclick click contextmenu", this, this._onMouseEvent);
			this.on("mousemove", this, this._onMouseMove);
			this.on("mouseout", this, this._onMouseOut);
		},
		add: function (shape) {
			if (!(shape instanceof cc.Shape))
				throw new Error("Cannot add instances not derived from canvascontrols.Shape");
			this._shapes.push(shape);
			shape._parent = this;
			shape.on("invalidated.cc", this, this._childInvalidated);
		},
		remove: function (shape) {
			var shapeIndex = -1;
			for (var i = 0; i < this._shapes.length; i++) {
				if (this._shapes[i] === shape) {
					shapeIndex = i;
					break;
				}
			}
			if (shapeIndex > -1) {
				this._shapes =
					this._shapes.slice(0, shapeIndex).concat(
					this._shapes.slice(shapeIndex + 1, this._shapes.length)
					);
			}
		},
		width: function () {
			var child, candidate, max = this._width;
			for (var i = 0; i < this._shapes.length; i++) {
				child = this._shapes[i];
				candidate = child.x() + child.width();
				max = Math.max(max, candidate);
			}
			return isNaN(max) ? this._super() : max;
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
			for (var i = 0; i < this._shapes.length; i++) {
				var child = this._shapes[i];
				var childCoords = this._getChildCoords(coords, child);
				if (child.isInBounds(childCoords)) {
					var candidate;
					if (child instanceof cc.CompositeShape)
						candidate = child.findShapeAt(childCoords);
					if (candidate == null)
						candidate = child;
					return candidate;
				}
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
					child._raise(e.type, $.extend(e, childCoords));
				} else if (child.__isHovered) {
					this._raiseChildMouseOut(child, childCoords);
				}
			}
		},
		_onMouseOut: function (s, e) {
			for (var i = 0; i < this._shapes.length; i++) {
				var child = this._shapes[i];
				if (child.__isHovered) {
					var childCoords = this._getChildCoords(e, child);
					this._raiseChildMouseOut(child, childCoords);
				}
			}
		},
		_raiseChildMouseOut: function (child, childCoords) {
			child.__isHovered = false;
			child._raise("mouseout", childCoords);
		},
		_onMouseEvent: function (s, e) {
			if (e.handlers == undefined)
				e.handlers = [];
			for (var i = 0; i < this._shapes.length; i++) {
				var child = this._shapes[i];

				var childCoords = this._getChildCoords(e, child);
				if (child.isInBounds(childCoords)) {
					var originalOffset = { offsetX: e.offsetX, offsetY: e.offsetY };
					$.extend(e, childCoords);
					child._raise(e.type, e);
					$.extend(e, originalOffset);
				}
			}
			e.handlers.push(this);
		},
		_childInvalidated: function (s, e) {
			this._raise("invalidated.cc", {
				affectsParents: e.affectsParents,
				original: e
			});
		}
	});

})(canvascontrols);