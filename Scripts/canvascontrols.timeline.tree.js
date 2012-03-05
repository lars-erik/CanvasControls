(function (cc) {

	cc.TimelineTreeBase = cc.CompositeShape.extend({
		init: function (options) {
			this._super(options);
		},
		add: function (node) {
			node.setPosition(this._childXPadding(), this._childYPadding() + this._getChildHeight());
			node.on("toggled.cc nodeAdded.cc nodeRemoved.cc", this, this._childEvent);
			node._parent = this;
			node._state = "new";
			this._hasChildren = true;
			this._super(node);
			this._raise("nodeAdded.cc", { parent: this, child: node });
		},
		remove: function (node) {
			throw ("not working until remove implemented on compositeshape");
			var index = this._findChild(node);
			if (index == -1) return;
			this._children = this._children.slice(0, index).concat(this._children.slice(index + 1));
			this._hasChildren = this._children.length > 0;
			this._updateBounds(index - 1);
			this._raise("nodeRemoved.cc");
		},
		//		isInBounds: function (coords) {
		//			return this.findShapeAt(coords) != null || this._super(coords);
		//		},
		//		_evaluateClick: function (sender, coords) {
		//			if (!coords.originalX) {
		//				coords.originalX = coords.offsetX;
		//				coords.originalY = coords.offsetY;
		//			}
		//			var child = this.findShapeAt(coords);
		//			if (child != null) {
		//				child._evaluateClick(this, $.extend(coords, this._getChildCoords(coords, child)));
		//			}
		//		},
		_paintChildren: function (context) {
			for (var i = 0; i < this.getShapeCount(); i++) {
				context.save();
				context.translate(0, this.getShapes()[i].y());
				this.getShapes()[i].paint(context);
				context.restore();
			}
		},
		_getChildHeight: function () {
			var height = 0;
			for (var i = 0; i < this.getShapeCount(); i++) {
				height += this.getShapes()[i].height();
			}
			return height;
		},
		_childEvent: function (sender, e) {
			this._childBoundsChanged(sender, event);
			this._raise(e.type + "." + e.namespace, e);
		},
		_childBoundsChanged: function (sender) {
			var childIndex = this._findChild(sender);
			if (childIndex == -1) return;
			this._updateBounds(childIndex);
		},
		_findChild: function (child) {
			for (var i = 0; i < this.getShapeCount(); i++) {
				if (this.getShapes()[i] === child) {
					return i;
				}
			}
			return -1;
		},
		_updateBounds: function (startAt) {
			var i, currentY = this._childYPadding();
			for (i = 0; i <= startAt; i++) {
				currentY += this.getShapes()[i].height();
			}
			for (; i < this.getShapeCount(); i++) {
				this.getShapes()[i]._y = currentY;
				currentY += this.getShapes()[i].height();
			}
		},
		//		_findChildAtCoords: function (coords) {
		//			for (var i = 0; i < this._children.length; i++) {
		//				var child = this._children[i];
		//				var offset = this._getChildOffset(coords, child);
		//				if (child.isInBounds(offset))
		//					return child;
		//			};
		//			return null;
		//		},
		_childXPadding: function () {
			return 0;
		},
		_childYPadding: function () {
			return 0;
		}
	});

	cc.TimelineTree = cc.TimelineTreeBase.extend({
		init: function (options) {
			this._super(options);
		},
		paint: function (context) {
			this._paintChildren(context);
		}
	});

	cc.TimelineTreeNode = cc.TimelineTreeBase.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				boxX: 20,
				boxWidth: 100,
				boxHeight: 20,
				yPad: 5,
				label: "",
				expanded: false,
				hasChildren: false
			}, options);
			this._width = settings.boxX + settings.boxWidth;
			this._height = settings.yPad + settings.boxHeight;
			this._boxX = settings.boxX;
			this._yPad = settings.yPad;
			this._boxWidth = settings.boxWidth;
			this._boxHeight = settings.boxHeight;
			this._label = settings.label;
			this._expanded = settings.expanded;
			this._hasChildren = settings.hasChildren;
			this._background = "#FFFFFF";

			this.on("mousedown click contextmenu", this, this._mouseEvent);
		},
		//		globalX: function () {
		//			if (this._parent != null && !(this._parent instanceof cc.TimelineTree)) {
		//				return this._parent.globalX() + this._parent._boxX + this._x;
		//			} else {
		//				return this._x;
		//			}
		//		},
		//		globalY: function () {
		//			if (this._parent != null && !(this._parent instanceof cc.TimelineTree)) {
		//				return this._parent.globalY() + this._y;
		//			} else {
		//				return this._y;
		//			}
		//		},
		height: function () {
			if (this._expanded)
				return this._super();
			return this._height;
		},
		//		getHeight: function () {
		//			var height = this._boxHeight;
		//			if (this._hasChildren && this._expanded) {
		//				height += this._getChildHeight();
		//			}
		//			return height;
		//		},
		paint: function (context) {
			this._centerY = Math.round(this._boxHeight / 2);
			context.fillStyle = this._background;
			context.fillRect(this._boxX, 0, this._boxWidth, this._boxHeight);
			context.fillStyle = "#000000";
			context.strokeRect(this._boxX, 0, this._boxWidth, this._boxHeight);
			context.fillText(this._label, this._boxX + 5, this._centerY + 3);
			if (this._hasChildren) {
				this._drawExpandButton(context);
				if (this._expanded) {
					context.save();
					context.translate(this._boxX, 0);
					this._paintChildren(context);
					context.restore();
				}
			}
		},
		toggle: function () {
			this._expanded = !this._expanded;
			this._raise("toggled.cc", { expanded: this._expanded });
		},
		//		isInBounds: function (coords) {
		//			if (this._isInOwnOffset(coords))
		//				return true;
		//			return this._super(coords);
		//		},
		_isInOwnOffset: function (coords) {
			return coords.offsetX >= 0 && coords.offsetX <= this._boxX + this._boxWidth &&
				coords.offsetY >= 0 && coords.offsetY <= this._boxHeight;
		},
		_mouseEvent: function (sender, event) {
			if (this._isInOwnOffset(event)) {
				if (event.type == "click" && this._isTriangleClick(event)) {
					this.toggle();
				}
				//				event.child = this;
			}
			//			if (this.parent() != null)
			//				this.parent()._raise(event.type, event);
			//			else {
			//				this._super(sender, event);
			//			}
		},
		_isTriangleClick: function (coords) {
			var centerY = this._boxHeight / 2;
			return coords.offsetX >= 5 && coords.offsetX <= 15 &&
				   coords.offsetY >= centerY - 5 && coords.offsetY <= centerY + 5;
		},
		_isBoxClick: function (coords) {
			return coords.offsetX >= this._boxX && coords.offsetX < this._boxX + this._boxWidth &&
				   coords.offsetY >= 0 && coords.offsetY <= this._boxHeight;
		},
		//		_getChildOffset: function (coords, child) {
		//			return {
		//				offsetX: coords.offsetX - child.x() - this._boxX,
		//				offsetY: coords.offsetY - child.y()
		//			};
		//		},
		_findChildAtCoords: function (coords) {
			if (!this._expanded) return null;
			return this._super(coords);
		},
		_drawExpandButton: function (context) {
			context.save();
			context.translate(this._boxX - 10, this._centerY);
			if (this._expanded)
				context.rotate(Math.PI * 2 / 4);
			context.beginPath();
			context.moveTo(-5, -5);
			context.lineTo(5, 0);
			context.lineTo(-5, 5);
			context.closePath();
			context.stroke();
			context.restore();
		},
		_childXPadding: function () {
			return this._boxX;
		},
		_childYPadding: function () {
			return this._boxHeight + this._yPad;
		}
	});

	// obsolete
	cc.TimelineTreeController = function (view) {

		var yStart = 5.5;
		var boxX = 20.5;
		var arrowX = 5;
		var arrowYOffset = 4;
		var arrowSize = 11;
		var rightPad = 4.5;
		var boxHeight = 20;
		var yPad = 5;
		var indent = 20;

		var model = null;

		initialize();

		this.setModel = function (viewModel) {
			model = viewModel;
		};

		this.redraw = function () {
			view.clear();
			if (model == null) return;
			var y = yStart;
			for (var i = 0; i < model.length; i++) {
				var x = boxX + indent * model[i].parents.length;
				view.drawBox(x, y, view.getWidth() - x - rightPad, boxHeight);
				view.drawLabel(x + 5, y + 14, model[i].label);

				drawArrow(i, x, y);

				y += boxHeight + yPad;
			}
		};

		function initialize() {
			view.clear();

			view.clicked = clicked;
			view.mouseDown = mouseDown;
		}

		function drawArrow(i, x, y) {
			if (model[i].hasChildren) {
				if (model[i].expanded) {
					drawDownArrow(x - indent, y);
				}
				else {
					drawSideArrow(x - indent, y);
				}
			}
		}

		function drawSideArrow(x, y) {
			var points = [
	{ x: x + arrowX, y: y + arrowYOffset },
	{ x: x + arrowX + arrowSize, y: y + arrowYOffset + arrowSize / 2 },
	{ x: x + arrowX, y: y + arrowYOffset + arrowSize }
	];
			view.drawShape(points);
		}

		function drawDownArrow(x, y) {
			var points = [
	{ x: x + arrowX, y: y + arrowYOffset },
	{ x: x + arrowX + arrowSize, y: y + arrowYOffset },
	{ x: x + arrowX + arrowSize / 2, y: y + arrowYOffset + arrowSize }
	];
			view.drawShape(points);
		}

		function clicked(e) {
			if (model == null) return;
			arrowClicked(e);
		}

		function arrowClicked(e) {
			var element = findElementForArrowAt(e);
			if (element == null) return;
			if (view.expandToggled != null)
				view.expandToggled(element);
		}

		function findElementForArrowAt(e) {
			var y = yStart;
			for (var i = 0; i < model.length; i++) {
				if (e.y >= y + arrowYOffset && e.y <= y + arrowYOffset + arrowSize) {
					var x = arrowX + indent * model[i].parents.length;
					// todo: test fallthrough cases
					if (e.x >= x && e.x <= x + arrowSize)
						return model[i];
				}
				y += boxHeight + yPad;
			}
			return null;
		}

		function mouseDown(e) {
			if (model == null) return;
			elementClicked(e);
		}

		function elementClicked(e) {
			var elementAndPosition = findElementAndPositionForBoxAt(e);
			if (elementAndPosition == null) return;
			if (view.dragStarted != null)
				view.dragStarted(e, elementAndPosition);
		}

		function findElementAndPositionForBoxAt(e) {
			var y = yStart;
			for (var i = 0; i < model.length; i++) {
				if (e.y >= y && e.y <= y + boxHeight) {
					var x = boxX + indent * model[i].parents.length;
					// todo: test fallthrough cases
					if (e.x >= x && e.x <= view.getWidth() - rightPad)
						return {
							element: model[i],
							label: model[i].label,
							width: view.getWidth() - rightPad - x,
							height: boxHeight,
							offsetX: x - e.x,
							offsetY: y - e.y
						};
				}
				y += boxHeight + yPad;
			}
			return null;
		}
	};

	// obsolete
	cc.CanvasTimelineTreeView = function (canvasId) {
		var jqCanvas = $(canvasId);
		var canvas = jqCanvas[0];
		if (!canvas.getContext)
			throw new Error("Canvas not supported");
		var ctx = canvas.getContext("2d");
		var self = this;

		initialize();

		function initialize() {
			$(window).resize(function (e) { self.onResized(e); });
			$(jqCanvas).evaluateClick(function (e) { self.onClicked(e); });
			$(jqCanvas).mousedown(function (e) { self.onMouseDown(e); });

			initializeLayout();
		}

		function initializeLayout() {
			jqCanvas.attr("width", jqCanvas.width());
			jqCanvas.attr("height", jqCanvas.height());

			ctx.lineWidth = 1;
			ctx.font = "10pt Segoe UI";
		}

		this.getWidth = function () { return jqCanvas.width(); };
		this.getHeight = function () { return jqCanvas.height(); };

		this.clear = function () {
			ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
		};

		this.drawBox = function (x, y, width, height) {
			ctx.strokeRect(x, y, width, height);
		};

		this.drawLabel = function (x, y, label) {
			ctx.fillText(label, x, y);
		};

		this.drawShape = function (points) {
			ctx.beginPath();
			ctx.moveTo(points[0].x, points[0].y);
			for (var p = 1; p < points.length; p++) {
				ctx.lineTo(points[p].x, points[p].y);
			}
			ctx.closePath();
			ctx.stroke();
		};

		this.onResized = function (e) {

		};

		this.onClicked = function (e) {
			this.clicked({
				x: e.pageX - $(jqCanvas).offset().left,
				y: e.pageY - $(jqCanvas).offset().top
			});
		};

		this.onMouseDown = function (e) {
			this.mouseDown({
				globalX: e.pageX,
				globalY: e.pageY,
				x: e.pageX - $(jqCanvas).offset().left,
				y: e.pageY - $(jqCanvas).offset().top
			});
		};
	};


})(canvascontrols);