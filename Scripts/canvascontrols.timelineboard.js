(function (cc) {

	cc.TimelineBoardBase = cc.CompositeShape.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				children: []
			}, options);

			this._offset = 0.5;
			this._isMouseDown = false;
			this._dragging = false;
			this._dragStartX = 0;

			this._isHovered = false;
			this._selectedChild = null;
		},

		_paintChildren: function (context) {
			for (var i = 0; i < this.getShapeCount(); i++) {
				var child = this.getShapes()[i];
				child.paint(context);
			}
		},
		
		_onMouseUp: function (sender, data) {
			if (this._selectedChild != null) {
				if (this._dragging)
					this._raise("dragged.cc", { parent: this, child: this._selectedChild });

				else if (this._selectedChild._wasResized)
					this._raise("resized.cc", { parent: this, child: this._selectedChild });
			}
			this._dragging = false;
			this._isMouseDown = false;
			this._selectedChild = null;
		},

		_onMouseMove: function (sender, data) {
			var dragLength = data.pageX - this._dragStartX;
			if (Math.abs(dragLength) > 0) {
				this._dragStartX = data.pageX;
			}

			var child = null;
			for (var i = 0; i < this.getShapeCount(); i++) {
				var c = this.getShapes()[i];
				if (c._isMouseDown)
					child = c;
			}
			if (child != null) {
				this._selectedChild = child;
				var dist = child._end.getTime() - child._start.getTime();
				var d = this.findDateAtCoord(child._x + dragLength);

				child._dragHandler(d, dist);

				if (child._dragHandler == child._resizeLeft) {
					child._wasResized = true;
				} else if (child._dragHandler == child._resizeRight) {
					child._wasResized = true;
				} else {
					child._wasResized = false;
					this._dragging = true;
				}

				this._raise("demandRedraw.cc", { parent: this, child: child });
			}

		},
		
		_getChildOffset: function (coords, child) {
			return {
				offsetX: coords.offsetX - child.x(),
				offsetY: coords.offsetY - child.y()
			};
		},
		_isInOwnOffset: function (coords) {
			if (this._width == undefined || this._height == undefined)
				throw { name: "NotImplemented", message: "_width or _height" };

			return coords.offsetX >= 0 && coords.offsetX <= this._width &&
				coords.offsetY >= 0 && coords.offsetY <= this._height;
		},
		_findChildAtCoords: function (coords) {
			for (var i = 0; i < this.getShapeCount(); i++) {
				var child = this.getShapes()[i];
				var offset = this._getChildOffset(coords, child);

				if (child.isInBounds(offset)) {
					return child;
				}
			};
			return null;
		},
		_getChild: function (data) {
			if (!data.originalX) {
				data.originalX = data.offsetX;
				data.originalY = data.offsetY;
			}
			return this._findChildAtCoords(data);
		},
		_paintLine: function (context, x1, y1, x2, y2) {
			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);
			context.stroke();
		}
	});

	cc.TimelineBoard = cc.TimelineBoardBase.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				period: new cc.Period(new cc.Month())
			}, options);
			this._period = settings.period;
			this._hasChildren = this.getShapeCount() > 0;
			this._mouseCoords = null;
			this._height = 400;
			this._marker = new cc.TimeMarker();

			this.on("mousemove", this, this._onMouseMove);
			this.on("mousedown", this, this._onMouseDown);
			this.on("mouseup", this, this._onMouseUp);
			
		},
		getPeriod: function () {
			return this._period;
		},
		add: function (node) {
			node._parent = this;
			this._super(node);
			this._raise("nodeAdded.cc", { parent: this, child: node });
		},
		findDateAtCoord: function (x) {
			var views = this._period.getView();
			var currentX = this._offset - (this._width * views[0].Proportion);

			for (var i = 0; i < this._period.getView().length; i++) {
				var view = views[i];
				var span = parseFloat(view.DateEnd.getTime() - view.DateStart.getTime());
				var stepWidth = parseFloat(this._width * view.Proportion);
				var frac = stepWidth / span;

				if (x >= currentX && x <= currentX + stepWidth) {
					return new Date((x - currentX) / frac + view.DateStart.getTime());
				}
				currentX += stepWidth;
			}
			return null;
		},
		paint: function (context) {
			this._width = context.canvas.width;
			this._paintChildren(context);
			var views = this._period.getView();
			var x = this._offset - (context.canvas.width * views[0].Proportion);
			for (var i = 0; i < this._period.getView().length; i++) {
				var view = views[i];
				var sw = context.canvas.width * view.Proportion;
				this._paintLine(context, x, 0, x, this._height);
				x += sw;
			}
		},

		remove: function (node) {
			this._super(node);
			this._raise("nodeRemoved.cc", { parent: this, child: node });
		},
		clear: function () {
			for (var i = 0; i < this.getShapeCount(); i++) {
				this.remove(this.getShapes()[i]);
			}
			this._shapes = [];
		},
		setOffset: function (offset) {
			this._offset = offset;
		},
		setPeriod: function (period) {
			this._period = period;
		},
		_onMouseMove: function (s, e) {
			this._super(s, e);
			var c = this._getChild(e);
			if (c != null) {
				var childCoords = this._getChildCoords(e, c);
				if (c.__isHovered == undefined || c.__isHovered == false) {
					c._raise("mouseover");
					c.__isHovered = true;
				}
			} else {
				for (var i = 0; i < this.getShapeCount(); i++) {
					var child = this.getShapes()[i];
					if (child.__isHovered != undefined && child.__isHovered) {
						child.__isHovered = false;
						child._raise("mouseout");
					}
				}
			}
		},
		
		_onMouseDown: function (s, e) {
			this._raise("boardClicked.cc");
		},
		_onMouseUp: function (s, e) {
			this._super(s, e);
		}
	});

	cc.TimelineBoardNode = cc.TimelineBoardBase.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				start: new Date(2012, 0, 5),
				end: new Date(2012, 6, 31, 23, 59, 59),
				boxX: 0,
				boxWidth: 100,
				y: 0,
				normalColor: "#8ED6FF",
				invalidFillColor: "#FF0000",
				strokeColor: "#000",
				valid: true
			}, options);
			this._start = settings.start;
			this._end = settings.end;
			this._boxX = settings.boxX;
			this._boxWidth = settings.boxWidth;
			this._hasChildren = this.getShapeCount() > 0;
			this._y = settings.y;
			this._isHovered = false;
			this._normalFillColor = settings.normalColor;
			this._invalidFillColor = settings.invalidFillColor;
			this._strokeColor = settings.strokeColor;
			this._valid = settings.valid;
			this._mode = null;
			this._moveMarker = new cc.MoveMarker();
			this._expandLeftMarker = new cc.ExpandWidthMarker({ direction: "left" });
			this._expandRightMarker = new cc.ExpandWidthMarker({ direction: "right" });
			this.on("mouseover", this, this._onMouseOver);
			this.on("mousedown", this, this._onMouseDown);
			this.on("mouseup", this, this._onMouseUp);
			this.on("mouseout", this, this._onMouseOut);
		},
		setValid: function (b) {
			this._valid = b;
		},
		paint: function (context) {
			var views = this._parent.getPeriod().getView();
			var canvasWidth = context.canvas.width;
			var x = 0, width = 0, y = 2;
			var offset = 0 - canvasWidth * views[0].Proportion;

			for (var i = 0; i < views.length; i++) {
				var view = views[i];
				var viewWidth = canvasWidth * view.Proportion;
				var span = view.DateEnd.getTime() - view.DateStart.getTime();
				offset += viewWidth;

				if ((this._start >= view.DateStart && this._start <= view.DateEnd) ||
                    (this._end >= view.DateStart && this._end <= view.DateEnd) ||
                    (this._start < view.DateStart && this._end > view.DateEnd)) {

					var startOffset = Math.max(this._start.getTime() - view.DateStart.getTime(), 0);
					var startFraction = startOffset / span;
					var pieceX = startFraction * viewWidth;

					var endOffset = this._end.getTime() - view.DateStart.getTime();
					var endFraction = Math.min(endOffset / span, 1);
					var pieceWidth = (endFraction - startFraction) * viewWidth;

					context.save();
					context.translate(pieceX + offset - viewWidth, this._y);
					this._paintRect(context, 0, y, pieceWidth, 20);

					context.restore();

					width += pieceWidth;
					x = x == 0 ? pieceX + offset - viewWidth : x;
				}
			}

			this._boxX = x + this._parent._offset;
			this._x = this._boxX;
			this._height = 20;
			this._width = width;
			this._boxWidth = width;

			this._expandLeftMarker.setCoords(this._x + 10, this._y + this._height / 2);
			this._expandRightMarker.setCoords(this._x + this._width - 10, this._y + this._height / 2);
			this._moveMarker.setCoords(this._x + this._width / 2, this._y + this._height / 2);

			this._expandLeftMarker.paint(context);
			this._expandRightMarker.paint(context);
			this._moveMarker.paint(context);
		},
		_getFillColor: function () {
			return this._valid ? this._normalFillColor : this._invalidFillColor;
		},
		_paintRect: function (context, x, y, width, height) {
			context.beginPath();
			context.rect(x + this._parent._offset, y, width, height);
			context.fillStyle = this._getFillColor();
			context.fill();

			if (this._isHovered) {
				context.strokeStyle = this._strokeColor;
				context.stroke();
			}
		},

		_onMouseOver: function (sender, data) {
			this._setMarkers(true);
		},
		_onMouseOut: function (sender, data) {
			this._setMarkers(false);
			this._isMouseDown = false;
			this._dragHandler = null;
			this._super(sender, data);
		},
		_onMouseUp: function (sender, data) {
			this._isMouseDown = false;
			this._dragHandler = null;
		},
		_onMouseDown: function (sender, data) {
			this._isMouseDown = true;
			this._setHandlers(data.offsetX);
			this._raise("nodeClicked.cc");
		},
		_setMarkers: function (visible) {
			this._expandLeftMarker.setVisible(visible);
			this._expandRightMarker.setVisible(visible);
			this._moveMarker.setVisible(visible);
		},
		_setHandlers: function (x) {
			if (x > 0 && x <= 10) {
				this._dragHandler = this._resizeLeft;
			} else if (x <= this._width && x > this._width - 10) {
				this._dragHandler = this._resizeRight;
			} else {
				this._dragHandler = this._drag;
			}
		},
		_resizeLeft: function (d) {
			if (this._isMouseDown)
				this._start = new Date(d.getTime());
		},
		_resizeRight: function (d, dist) {
			if (this._isMouseDown)
				this._end = new Date(d.getTime() + dist);
		},
		_drag: function (d, dist) {
			if (this._isMouseDown) {
				this._start = new Date(d.getTime());
				this._end = new Date(d.getTime() + dist);
			}
		}
	});
})(canvascontrols);