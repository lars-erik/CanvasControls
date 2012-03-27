(function (cc) {

	cc.TimelineBoardBase = cc.CompositeShape.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				children: []
			}, options);
			this._children = settings.children;
			this._offset = 0.5;
			this._isMouseDown = false;
			this._dragging = false;
			this._dragStartX = 0;
			this._moveMarker = new cc.MoveMarker();
			this._expandMarker = new cc.ExpandWidthMarker();
			this._isHovered = false;
			this._selectedChild = null;
			this.on("dblclick", this, this._onDblClick);
			//			this.on("mousedown", this, this._onMouseDown);
			this.on("mouseup", this, this._onMouseUp);
			this.on("mousemove", this, this._onMouseMove);
			this.on("periodChanged.c    c", this, this._onPeriodChange);
			this.on("keyup keydown", this, this._onKey);
			this.on("mouseout", this, this._onMouseOut);
			this.on("mouseover", this, this._onMouseOver);
		},

		_paintChildren: function (context) {

			for (var i = 0; i < this.getShapeCount(); i++) {
				var child = this.getShapes()[i];
				child.paint(context);
			}
			this._expandMarker.paint(context);
			this._moveMarker.paint(context);
		},
		_onDblClick: function (sender, data) {
		},
		_onMouseDown: function (sender, data) {
			//this._isMouseDown = true;
			//console.log("test" + " " + this._selectedChild + " " + this._isMouseDown);
			//			this._dragStartX = data.pageX;

			//			var child = this._getChild(data);
			//			if (child != null) {
			//				this._selectedChild = child;
			//				this._raise("nodeClicked.cc", { parent: this, child: child });
			//			}
		},
		_onMouseUp: function (sender, data) {

			if (this._selectedChild != null) {
				console.log(this._selectedChild);
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

				if (child._dragHandler == child._resizeLeft) {
					this._setResizeMarker(true, "left", data.offsetX, child._y + child._height / 2);
					child._start.setTime(d.getTime());
					child._wasResized = true;
				} else if (child._dragHandler == child._resizeRight) {
					this._setResizeMarker(true, "right", data.offsetX, child._y + child._height / 2);
					child._end = new Date(d.getTime() + dist);
					child._wasResized = true;
				} else {
					this._setMoveMarker(true, data.offsetX, child._y + child._height / 2);
					child._start.setTime(d.getTime());
					child._end = new Date(d.getTime() + dist);
					child._wasResized = false;
					this._dragging = true;
				}

				this._raise("demandRedraw.cc", { parent: this, child: child });
			}

		},
		_onMouseOver: function (sender, data) {
			var child = this._getChild(data);
			if (child != null)
				child._onMouseOver(sender, data);
			this._isHovered = true;
		},
		_onMouseOut: function (sender, data) {
			this._expandMarker.setVisible(false);
			this._moveMarker.setVisible(false);
			this._isHovered = false;
			this._raise("demandRedraw.cc", { parent: this, child: null });
		},
		_onPeriodChange: function (sender, data) {

		},
		_onKey: function (sender, data) {

		},
		_setResizeMarker: function (visible, direction, x, y) {
			this._expandMarker.setVisible(visible);
			if (visible) {
				this._moveMarker.setVisible(!visible);
				this._expandMarker.setDirection(direction);
				this._expandMarker.setCoords(x, y);
			}
		},
		_setMoveMarker: function (visible, x, y) {
			this._moveMarker.setVisible(visible);
			if (visible) {
				this._expandMarker.setVisible(!visible);
				this._moveMarker.setCoords(x, y);
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
				period: new cc.Period(new cc.Month()),
				lines: {}
			}, options);
			this._period = settings.period;
			this._hasChildren = this._children.length > 0;
			this._mouseCoords = null;
			this._height = 400;
			this._marker = new cc.TimeMarker();
			this._lines = settings.lines;
			this.on("mousemove", this, this._onMouseMove);
			this.on("mousedown", this, this._onMouseDown);
		},
		getPeriod: function () {
			return this._period;
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
		add: function (node) {
			node._parent = this;
			this._super(node);
			this._raise("nodeAdded.cc", { parent: this, child: node });
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
		moveNode: function (node) {

		},
		_onMouseMove: function (s, e) {
			//this._mouseCoords = { x: e.offsetX, y: e.offsetY };
			this._super(s, e);
		},
		_onMouseOver: function (s, e) {
			this._super(s, e);
		},
		_onMouseOut: function (s, e) {
			this._super(s, e);
		},
		_onMouseDown: function (s, e) {
			this._raise("boardClicked.cc");
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
			this._hasChildren = this._children.length > 0;
			this._y = settings.y;
			this._isHovered = false;
			this._normalFillColor = settings.normalColor;
			this._invalidFillColor = settings.invalidFillColor;
			this._strokeColor = settings.strokeColor;
			this._valid = settings.valid;
			this._mode = null;
			this.on("mouseover", this, this._onMouseOver);
			this.on("mousedown", this, this._onMouseDown);
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
		_isBoxClick: function (coords) {
			return coords.offsetX >= this._boxX && coords.offsetX < this._boxX + this._boxWidth &&
				   coords.offsetY >= 0 && coords.offsetY <= this._height;
		},
		_onMouseOver: function (sender, data) {
			this._super(sender, data);
		},
		_onMouseOut: function (sender, data) {
			this._isMouseDown = false;
		},
		_onMouseUp: function (sender, data) {
			this._isMouseDown = false;
			this._dragHandler = null;
		},
		_onMouseDown: function (sender, data) {
			this._isMouseDown = true;
			if (data.offsetX > 0 && data.offsetX <= 10) {
				this._dragHandler = this._resizeLeft;
			} else if (data.offsetX <= this._width && data.offsetX > this._width - 10) {
				this._dragHandler = this._resizeRight;
			} else {
				this._dragHandler = this._drag;
			}
			this._raise("nodeClicked.cc");
		},
		_onMouseMove: function (s, e) {
			//this._dragHandler(e);
			this._super(s, e);
		},
		_resizeLeft: function () { // dunno params yet
			console.log("resizing left");
		},
		_resizeRight: function () {
			console.log("resize right");
		},
		_drag: function () {
			console.log("drag");
		}
	});


	// Old
	cc.TimelineBoardController = function (view) {
		view.resized = resized;

		initialize();

		var prevE = null;

		this.redraw = function (e) {
			if (e == null) {
				if (prevE == null) return;
				e = prevE;
			}
			else {
				prevE = e;
			}
			view.clear();
			for (var x = e.offset - e.stepWidth, p = 0;
				p < e.period.getZoomLevel() + 1;
				x += e.stepWidth, p++) {
				view.drawLine(x, 0, x, view.getHeight());
			}
			if (this.model != null) {
				for (var line = 0; line < this.model.length; line++) {
					for (var itemIndex = 0; itemIndex < this.model[line].length; itemIndex++) {
						var item = this.model[line][itemIndex];
						drawItem(e, line, item);
					}
				}
			}
		};

		this.setModel = function (model) {
			this.model = model;
		};

		function initialize() {
			view.clear();
		}

		function drawItem(e, line, item) {
			var x, y, width;
			y = line * 25 + 5;
			var period = e.period;
			if (dateBetween(item.start, period.getViewStart(), period.getEnd()) ||
				dateBetween(item.end, period.getViewStart(), period.getEnd()) ||
				(item.start < period.getViewStart() && item.end > period.getEnd())
				) {
				var span = period.getEnd().getTime() - period.getViewStart().getTime();
				var startOffset = Math.max(item.start.getTime() - period.getViewStart().getTime(), 0);
				var startFraction = startOffset / span;
				var endOffset = item.end.getTime() - period.getViewStart().getTime();
				var endFraction = Math.min(endOffset / span, 1);
				x = startFraction * (view.getWidth() + e.stepWidth);
				width = (endFraction - startFraction) * (view.getWidth() + e.stepWidth);
				view.drawBox(e.offset + x - e.stepWidth, y, width, 20, item.label);
			}
		}

		function dateBetween(date, start, end) {
			return date >= start && date <= end;
		}

		function resized(e) {
		}
	};

	cc.CanvasTimelineBoard = function (canvasId) {
		//		var defaultStroke = "#000000";
		var lineStroke = "#CCCCCC";

		var jqCanvas = $(canvasId);
		var canvas = jqCanvas[0];
		if (!canvas.getContext)
			throw new Error("Canvas not supported");
		var ctx = canvas.getContext("2d");
		var self = this;

		initialize();

		function initialize() {
			$(window).resize(function (e) { self.onResized(e); });

			initializeLayout();
		}

		function initializeLayout() {
			jqCanvas.attr("width", jqCanvas.width());
			jqCanvas.attr("height", jqCanvas.height());

			ctx.strokeStyle = lineStroke;
			ctx.fillStyle = "#FF0000";
			ctx.lineWidth = 1;
		}

		this.getWidth = function () { return jqCanvas.width(); };
		this.getHeight = function () { return jqCanvas.height(); };

		this.clear = function () {
			ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
		};

		this.drawLine = function (x1, y1, x2, y2) {
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.closePath();
			ctx.stroke();
		};

		this.drawBox = function (x, y, width, height, label) {
			ctx.fillRect(x, y, width, height);
		};

		this.onResized = function (e) {
			initializeLayout();
		};
	};

})(canvascontrols);