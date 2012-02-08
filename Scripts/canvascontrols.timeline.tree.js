(function (cc) {

	//	cc.TimelineTreeController = function (view) {
	//	};

	cc.TimelineTreeBase = cc.Shape.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				children: []
			}, options);
			this._children = settings.children;

		},
		add: function (node) {
			node._y = this._getChildHeight();
			node.addListener(this, this._childToggled);
			this._children.push(node);
		},
		_getChildHeight: function () {
			var height = 0;
			for (var i = 0; i < this._children.length; i++) {
				height += this._children[i].getHeight() + 5;
			}
			return height;
		},
		_childToggled: function (sender) {
			var self = this;
			if (this instanceof Array)
				self = this[0];
			var i, currentY = 0, startAt = -1;
			for (i = 0; i < self._children.length; i++) {
				if (self._children[i] === sender) {
					startAt = i;
					break;
				}
			}
			if (startAt == -1) return;
			for (i = 0; i <= startAt; i++) {
				currentY += self._children[i].getHeight() + 5;
			}
			for (; i < self._children.length; i++) {
				self._children[i]._y = currentY;
				currentY += self._children[i].getHeight() + 5;
			}
		}
	});

	cc.TimelineTreeNode = cc.TimelineTreeBase.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				width: 100,
				height: 20,
				boxX: 20,
				label: "",
				expanded: false,
				hasChildren: false,
				children: []
			}, options);
			this._width = settings.width;
			this._height = settings.height;
			this._boxX = settings.boxX;
			this._label = settings.label;
			this._expanded = settings.expanded;
			this._hasChildren = settings.hasChildren;
			this._listeners = [];
		},
		getHeight: function () {
			var height = this._height;
			if (this._hasChildren && this._expanded) {
				height += this._getChildHeight();
			}
			return height;
		},
		paint: function (context) {
			this._centerY = Math.round(this._height / 2);
			context.strokeRect(this._boxX, 0, this._width, this._height);
			context.fillText(this._label, this._boxX + 5, this._centerY + 3);
			if (this._hasChildren) {
				this._drawExpandButton(context);
				if (this._expanded) {
					context.save();
					context.translate(this._boxX, this._height + 5);
					for (var i = 0; i < this._children.length; i++) {
						context.translate(0, this._children[i].y());
						this._children[i].paint(context);
					}
					context.restore();
				}
			}
		},
		addListener: function (instance, handler) {
			this._listeners.push([instance, handler]);
		},
		toggle: function () {
			this._expanded = !this._expanded;
			for (var i = 0; i < this._listeners.length; i++) {
				this._listeners[i][1](this, this._expanded);
			}
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
		}

	});

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
			$(jqCanvas).click(function (e) { self.onClicked(e); });
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