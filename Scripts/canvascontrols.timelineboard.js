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
			this._dragging = false;
			this._isMouseDown = false;
			this._selectedChild = null;
		},

		_onMouseMove: function (sender, data) {

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
			this._height = 100;
			this._marker = new cc.TimeMarker();
			this._selected = null;
			this._tracker = null;
			//$(window).mousemove($.proxy(this._onMouseMoveExt, this));
			//this.on("keydown", this, this._onKeyPress);
			//this.on("mousemove", this, this._onMouseMove);
			//this.on("mousemove", this, this._onMouseMove);
			$(window).keydown($.proxy(this._onKeyPress, this));
			this.on("mousedown", this, this._onMouseDown);

			this.on("mouseup", this, this._onMouseUp);

		},
		setActionTracker: function (t) {
			this._tracker = t;
		},
		setLampsOn: function (b) {
			for (var i = 0; i < this.getShapeCount(); i++) {
				this.getShapes()[i]._lampsOn = b;
			}
		},
		setLabelsOn: function (b) {
			for (var i = 0; i < this.getShapeCount(); i++) {
				this.getShapes()[i]._labelsOn = b;
			}
		},
		setSnapToAbove: function (b) {
			for (var i = 0; i < this.getShapeCount(); i++) {
				this.getShapes()[i]._snapToAbove = b;
			}
		},
		getPeriod: function () {
			return this._period; //
		},
		add: function (node) {
			node._parent = this;
			//node._calculateDimensions();
			var top = this.findTopBoardNode(node);
			if (top != null) {
				node.top = top;
				top.addRelated(node);
			}
			this._super(node);
			this._raise("nodeAdded.cc", { parent: this, child: node });
			node.on("dblclick", this, function (sender, data) {
				this._raise("nodeDblClicked.cc", { parent: this, child: node });
			});
			node.on("dragged.cc", this, function (sender, data) {
				if (this._tracker != null) {
					if ((node.bork == undefined || node.bork == false) && node._selected) {
						this._tracker.doAction(1, { 'node': node });
					}
					node.bork = false;
				}
				this._raise("dragged.cc", { parent: this, child: node });
			});
			node.on("resized.cc", this, function (sender, data) {
				if (this._tracker != null) {
					if ((node.bork == undefined || node.bork == false) && node._selected)
						this._tracker.doAction(4, { 'node': node });
					node.bork = false;
				}
				this._raise("resized.cc", { parent: this, child: node });
			});
		},
		remove: function (node) {
			if (node.top != undefined) {
				var idx = node.top._related.indexOf(node);
				if (idx != -1) {
					node.top._related.splice(idx, 1);
				}
			}
			this._super(node);
			this._raise("nodeRemoved.cc", { parent: this, child: node });
		},
		findNodeToSnapIn: function (node) {
			var nodesAbove = this.findNodesAbove(node);
			if (nodesAbove != null) {
				var node_left = node._x;
				var node_right = node._x + node._width;

				for (var i = 0; i < nodesAbove.length; i++) {
					var above_left = this.findPositionAtDate(nodesAbove[i]._start);
					var above_right = this.findPositionAtDate(nodesAbove[i]._end);

					if ((node_left < above_left && node_right > above_left) && (node_right - above_left) > node._width / 2) {
						return { snapDir: 'right', pos: above_left, node: nodesAbove[i] };
					} else if ((node_right > above_right && node_left < above_right) && (node_right - above_right) < node._width / 2) {
						return { snapDir: 'left', pos: above_right, node: nodesAbove[i] };
					}
				}
			}

			return null;
		},
		findNodesAbove: function (node) {
			var arr = []
			if (node.treeNode != undefined && node.treeNode != null) {
				if (node.treeNode._parent instanceof canvascontrols.TimelineTreeNode) {
					var tnode_to_look_for = node.treeNode._parent;
					for (var i = 0; i < this.getShapeCount(); i++) {
						var candidate = this.getShapes()[i];
						if (candidate.treeNode === tnode_to_look_for) {
							arr.push(candidate);
						}
					}
				}
			}
			return arr;
		},
		findTopBoardNode: function (node) {
			if (node.treeNode != undefined && node.treeNode != null) {
				if (node.treeNode._parent instanceof canvascontrols.TimelineTreeNode) {
					var tnode_to_look_for = node.treeNode._parent;
					for (var i = 0; i < this.getShapeCount(); i++) {
						var candidate = this.getShapes()[i];
						if (candidate.treeNode === tnode_to_look_for) {
							if (node._start.getTime() >= candidate._start.getTime() &&
								node._end.getTime() <= candidate._end.getTime()) {

								return candidate;

							}
						}
					}
				}
			}
			return null;
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
		findPositionAtDate: function (d) {
			var views = this._period.getView();
			var len = 0;
			var currentX = this._offset - (this._width * views[0].Proportion);
			for (var i = 0; i < views.length; i++) {
				var view = views[i];
				var stepWidth = this._width * view.Proportion;

				if (view.DateStart.getTime() < d.getTime() && view.DateEnd.getTime() < d.getTime()) {
					currentX += stepWidth;
				} else if (view.DateStart.getTime() <= d.getTime() && view.DateEnd.getTime() >= d.getTime()) {
					var span = view.DateEnd.getTime() - view.DateStart.getTime();
					var startOffset = Math.max(d.getTime() - view.DateStart.getTime(), 0);
					var frac = startOffset / span;
					var x = frac * stepWidth;

					currentX += x;
				} else {
					//currentX = -100;
				}
			}

			return currentX;
		},
		findViewAtDate: function (d) {
			for (var i = 0; i < this._period.getView().length; i++) {
				var view = this._period.getView()[i];
				if (view.DateStart.getTime() <= d.getTime() && view.DateEnd.getTime() >= d.getTime()) {
					return view;
				}
			}
			return null;
		},
		paint: function (context) {
			this._width = context.canvas.width;

			if (this._highlight != undefined && this._highlight != null) {
				this._paintRect(context, 0, this._highlight.y, this._width, this._highlight.height);
			}
			this._paintChildren(context);

			var views = this._period.getView();
			var x = this._offset - (context.canvas.width * views[0].Proportion);
			for (var i = 0; i < this._period.getView().length; i++) {
				var view = views[i];
				var sw = context.canvas.width * view.Proportion;
				this._paintLine(context, x, 0, x, this._height);
				x += sw;
				//if (view.Label == "Aug")
				//	console.log(x);
			}
		},

		clear: function () {
			for (var i = 0; i < this.getShapeCount(); i++) {
				this.remove(this.getShapes()[i]);
			}
			this._shapes = [];
		},
		setOffset: function (offset, length) {
			this._offset = offset;

			for (var i = 0; i < this.getShapeCount(); i++) {
				var child = this.getShapes()[i];
				child._x += length;
			}

		},
		setPeriod: function (period) {
			this._period = period;
		},
		_moveRelated: function (parent, dragLength) {
			for (var i = 0; i < parent._related.length; i++) {
				var sub = parent._related[i];
				this._moveRelated(sub, dragLength);

				var sub_start = sub._start.getTime() - parent._start.getTime();
				sub.nosave = true;
				sub._dragHandler(this.findDateAtCoord(sub._x + dragLength), sub._end.getTime() - sub._start.getTime());
			}
		},
		_onMouseMoveExt: function (s, e) {
			var c = this._getChild(e);
			if (c != null) {
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
			var c = this._getChild(e);

			if (c != null) {
				if (this._tracker != null) {
					this._tracker.beginAction(c);
				}
				for (var i = 0; i < this.getShapeCount(); i++) {
					this.getShapes()[i]._selected = false;
				}
				c._selected = true;
			}
		},
		_onMouseUp: function (s, e) {
			this._super(s, e);

			for (var i = 0; i < this.getShapeCount(); i++) {
				var c = this.getShapes()[i];
				if (c._isMouseDown) {
					c._raise("mouseup");
				}
			}
		},
		_paintRect: function (context, x, y, width, height) {
			context.beginPath();
			context.rect(x, y, width, height);
			context.fillStyle = "#FFE17F";
			context.fill();
		},
		_onKeyPress: function (e) {
			if (e.ctrlKey != undefined && e.ctrlKey) {
				switch (e.which) {
					case 90: // ctrl + z

						var a = this._tracker.revertAction();

						if (a != undefined && a != null) {

							if (a.type == 1 || a.type == 4) {
								//a.node._start = a.old_start;
								//a.node._end = a.old_end;
								//a.node.invalidate(true);
								//a.node.overrideHandlerSelection = true;
								//a.node.bork = true;
								//a.node._onMouseDown(this, { offsetX: a.node._width / 2 });
								//a.node._dragHandler(a.old_start, a.node._end.getTime() - a.node._start.getTime());
								//a.node._move(a.old_start, null, null, true);
								//a.node._onMouseUp(this, { offsetX: a.node._width / 2 });
								//a.node.invalidate();
								//a.callback();

								var distanceInPixels = this.findPositionAtDate(a.old_start) - this.findPositionAtDate(a.node._start);
								//console.log(distanceInPixels);
								a.node._movePixels(distanceInPixels);

							} else if (a.type == 2) {
								a.node.tellDataSource = true;
								this.remove(a.node);
								this.invalidate();
							} else if (a.type == 3) {

							}
						}
						break;
					case 88: // ctrl + x
						break;
					case 67: // ctrl + c
						for (var i = 0; i < this.getShapeCount(); i++) {
							if (this.getShapes()[i]._selected)
								this._selected = this.getShapes()[i];
						}
						break;
					case 86: // ctrl + v
						var newNode = new cc.TimelineBoardNode({
							start: new Date(this._selected._end.getTime() + 1),
							end: new Date(this._selected._end.getTime() + (this._selected._end.getTime() - this._selected._start.getTime())),
							y: this._selected.treeNode.globalY(),
							height: this._selected.treeNode._boxHeight,
							valid: false
						});
						newNode.treeNode = this._selected.treeNode;
						this.add(newNode);
						this._tracker.doAction(2, { node: newNode });
						break;
					default:
						break;
				}
			}

		}
	});
	cc.TimelineBoardNode = cc.TimelineBoardBase.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				start: null,
				end: null,
				y: 0,
				x: 0,
				width: 20,
				height: 20,
				normalColor: "#FFD073",
				invalidFillColor: "#FF0000",
				strokeColor: "#000",
				valid: true,
				textLabel: "Empty label"
			}, options);
			this._start = settings.start;
			this._end = settings.end;
			this._y = settings.y;
			this._x = settings.x;
			this._height = settings.height;
			this._width = settings.width;
			this._normalFillColor = settings.normalColor;
			this._invalidFillColor = settings.invalidFillColor;
			this._strokeColor = settings.strokeColor;
			this._valid = settings.valid;
			this._related = [];
			this._textLabel = settings.textLabel;
			this._isMouseDown = false;
			this._dragStartX = 0;
			this._top = null;
			this._lampsOn = true;
			this._labelsOn = true;
			this._snapToAbove = false;
			this._lamp = new cc.Image();
			this._lamp.addImage("green", "img/Green16.png");
			this._lamp.addImage("yellow", "img/Yellow16.png");
			this._lamp.addImage("red", "img/Red16.png");
			this._moveMarker = new cc.MoveMarker();
			this._expandLeftMarker = new cc.ExpandWidthMarker({ direction: "left" });
			this._expandRightMarker = new cc.ExpandWidthMarker({ direction: "right" });
			this._resizeHandleLimit = 5;
			this._dragHandleLimit = 10;
			this._snapForce = 0;
			this._selected = false;
			this._ignoreOffset = false;
			this.frzn = false;
			this.on("mouseover", this, this._onMouseOver);
			this.on("mousedown", this, this._onMouseDown);
			this.on("mouseup", this, this._onMouseUp);
			this.on("mouseout", this, this._onMouseOut);
			$(window).mousemove($.proxy(this._onMouseMoveExt, this));
		},
		paint: function (context) {
			context.save();
			context.translate(this._x, this._y);
			this._paintRect(context, 0, 2, this._width, this._height);
			if (this._labelsOn)
				this._paintLabel(context);

			this._expandLeftMarker.setCoords(5, this._height / 2);
			this._expandRightMarker.setCoords(this._width - 5, this._height / 2);
			this._moveMarker.setCoords(this._width / 2, +this._height / 2);

			this._lamp._x = this._width - 20;
			this._lamp._y = 5;
			if (this._width >= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
				this._expandLeftMarker.paint(context);
				this._expandRightMarker.paint(context);
				if (this._lampsOn && this._lamp._loaded)
					this._lamp.paint(context);
			}
			this._moveMarker.paint(context);
			context.restore();
		},
		addRelated: function (node) {
			for (var i = 0; i < this._related.length; i++) {
				if (this._related[i] === node)
					return false;
			}
			this._related.push(node);
			return true;
		},
		setLampColor: function (c) {
			switch (c) {
				case "green":
					this._lamp.setSelected("green");
					break;
				case "yellow":
					this._lamp.setSelected("yellow");
					break;
				default:
					this._lamp.setSelected("red");
					break;
			}
		},
		setValid: function (b) {
			this._valid = b;
		},
		_paintRect: function (context, x, y, width, height) {
			context.beginPath();
			context.rect(x, y, width, height);
			context.fillStyle = this._getFillColor();
			context.fill();

			if (this._isHovered) {
				context.strokeStyle = this._strokeColor;
				context.stroke();
			}
		},
		_paintLabel: function (context) {

			if ((this._x + this._width) > 0) {
				var metric = context.measureText(this._textLabel);
				var label = this._textLabel;
				while (metric.width > this._width && this._textLabel.length >= 0) {
					label = label.substring(0, label.length - 1);
					metric = context.measureText(label);
				}
				context.fillStyle = "#000000";
				context.fillText(label, (this._width - metric.width) / 2, 2 + (this._height / 2) + 5);
			}
		},
		_getFillColor: function () {
			return this._valid ? this._normalFillColor : this._invalidFillColor;
		},
		_setMarkers: function (visible) {
			this._expandLeftMarker.setVisible(visible);
			this._expandRightMarker.setVisible(visible);
			this._moveMarker.setVisible(visible);
		},
		_onMouseOver: function (s, e) {
			this._setMarkers(true);
		},
		_onMouseOut: function (s, e) {
			this._setMarkers(false);
		},
		_onMouseUp: function (s, e) {

			this._ignoreOffset = false;
			this._start = this._parent.findDateAtCoord(this._x);
			this._end = this._parent.findDateAtCoord(this._x + this._width);
			this._isMouseDown = false;
			this._handleRelations();

			if (this._dragHandler == this._drag)
				this._raise("dragged.cc");

			else if (this._dragHandler == this._resizeLeft || this._dragHandler == this._resizeRight)
				this._raise("resized.cc");
			this._dragHandler = null;
			this._setMouseUpOnRelated();

		},
		_onMouseDown: function (s, e) {
			this._ignoreOffset = true;
			this._isMouseDown = true;
			this._setHandlers(e.offsetX);
			this._raise("nodeClicked.cc");

			if (this._dragHandler === this._drag)
				this._setMouseDownOnRelated();
		},
		_setMouseDownOnRelated: function () {
			for (var i = 0; i < this._related.length; i++) {
				var sub = this._related[i];
				sub.overrideHandlerSelection = true;
				sub._onMouseDown(this, { offsetX: sub._width / 2 });
			}
		},
		_setMouseUpOnRelated: function () {
			for (var i = 0; i < this._related.length; i++) {
				var sub = this._related[i];
				sub.overrideHandlerSelection = false;
				sub._onMouseUp(this, { offsetX: sub._width / 2 });
			}
		},
		_onMouseMoveExt: function (e) {
			$.extend(e, {
				offsetX: e.offsetX - this._x,
				offsetY: e.offsetY - this._y
			});
			var skipSnap = false;
			var dragLength = e.pageX - this._dragStartX;
			if (Math.abs(dragLength) > 0) {
				this._dragStartX = e.pageX;
			}
			if (this._isMouseDown) {
				if (this.top == null || (this.top != null && (this.top._dragHandler == this.top._drag || !this.top._isMouseDown))) {
					if (this.top == null && this._snapToAbove) {

						var p = this._parent.findNodeToSnapIn(this);
						if (p != null && (this.hasSnapped == undefined || !this.hasSnapped)) {

							dragLength = p.snapDir == "right" ? p.pos - this._x : (p.node._x + p.node._width) - (this._x + (this._x + this._width - this._x));
							skipSnap = true;
							this._snapForce = 40;
							this.hasSnapped = true;
							this._handleRelations();
						} else if (p == null) {
							this.hasSnapped = false;
							this._handleRelations();
						}
					}

					this._dragHandler(dragLength, skipSnap);
				}
			}
		},
		_getLength: function () {
			return (this._x + this._width) - this._x;
		},
		_setHandlers: function (x) {
			if ((this.overrideHandlerSelection != undefined &&
			 this.overrideHandlerSelection == true) || this._width <= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
				this._dragHandler = this._drag;
				return;
			}

			if (x > 0 && x <= 10) {
				this._dragHandler = this._dragHandler != this._resizeRight ? this._resizeLeft : this._resizeRight;
			} else if (x <= this._width && x > this._width - 10) {
				this._dragHandler = this._dragHandler != this._resizeLeft ? this._resizeRight : this._resizeLeft;
			} else {
				this._dragHandler = this._drag;
			}

		},
		_resizeLeft: function (l) {
			if (this._isMouseDown) {
				this._x += l
				this._width += -l;
			}

			if (this._width <= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
				this._dragHandler = this._drag;
			}
		},
		_resizeRight: function (l) {
			if (this._isMouseDown) {
				this._width += l;
			}

			if (this._width <= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
				this._dragHandler = this._drag;
			}
		},
		_drag: function (l, skip) {
			if (this._isMouseDown) {

				if (!skip) {
					if (this._snapForce > 0) {
						this._snapForce -= Math.abs(l);
						return;
					}
				}
				this._x += l;
			}
		},
		_null: function () {

		},
		_handleRelations: function () {
			var top = this._parent.findTopBoardNode(this);
			if (top != null) {
				this.top = top;
				top.addRelated(this);

			} else {
				if (this.top != undefined || this.top != null) {
					var idx = this.top._related.indexOf(this);
					if (idx != -1) {
						this.top._related.splice(idx, 1);
					}

					this.top = null;
				}
			}
		}
	});
	cc.TimelineBoardNodeOld = cc.TimelineBoardBase.extend({
		init: function (options) {
			this._super(options);
			var settings = $.extend({
				start: new Date(2012, 0, 5),
				end: new Date(2012, 6, 31, 23, 59, 59),
				boxX: 0,
				boxWidth: 100,
				y: 0,
				x: 0,
				height: 20,
				normalColor: "#FFD073",
				invalidFillColor: "#FF0000",
				strokeColor: "#000",
				valid: true,
				textLabel: "Empty label"
			}, options);
			this._start = settings.start;
			this._end = settings.end;
			this._boxX = settings.boxX;
			this._boxWidth = settings.boxWidth;
			this._hasChildren = this.getShapeCount() > 0;
			this._y = settings.y;
			this._x = settings.x;
			this._height = settings.height;
			this._textLabel = settings.textLabel;
			this._normalFillColor = settings.normalColor;
			this._invalidFillColor = settings.invalidFillColor;
			this._strokeColor = settings.strokeColor;
			this._valid = settings.valid;
			this._moveMarker = new cc.MoveMarker();
			this._expandLeftMarker = new cc.ExpandWidthMarker({ direction: "left" });
			this._expandRightMarker = new cc.ExpandWidthMarker({ direction: "right" });
			this._related = [];
			this._lampsOn = true;
			this._labelsOn = true;
			this._snapToAbove = false;
			this._lamp = new cc.Image();
			this._lamp.addImage("green", "Content/img/Green16.png");
			this._lamp.addImage("yellow", "Content/img/Yellow16.png");
			this._lamp.addImage("red", "Content/img/Red16.png");
			this._resizeHandleLimit = 5;
			this._dragHandleLimit = 10;
			this._snapForce = 0;
			this._selected = false;
			this.frzn = false;
			this.on("mouseover", this, this._onMouseOver);
			this.on("mousedown", this, this._onMouseDown);
			this.on("mouseup", this, this._onMouseUp);
			this.on("mouseout", this, this._onMouseOut);
			$(window).mousemove($.proxy(this._onMouseMoveExt, this));

			//this.on("mousemove", this, this._onMouseMove);
		},
		setLampColor: function (c) {
			switch (c) {
				case "green":
					this._lamp.setSelected("green");
					break;
				case "yellow":
					this._lamp.setSelected("yellow");
					break;
				default:
					this._lamp.setSelected("red");
					break;
			}
		},
		setValid: function (b) {
			this._valid = b;
		},
		addRelated: function (node) {
			for (var i = 0; i < this._related.length; i++) {
				if (this._related[i] === node)
					return false;
			}
			this._related.push(node);
			return true;
		},
		findStartMax: function () {
			if (this._related.length > 0) {
				var max = this._related[0]._start.getTime();
				for (var i = 0; i < this._related.length; i++) {
					if (this._related[i]._start.getTime() < max) {
						max = this._related[i]._start.getTime();
					}
				}
				return max;
			}
			return -1;
		},
		findEndMin: function () {
			if (this._related.length > 0) {
				var min = this._related[0]._end.getTime();
				for (var i = 0; i < this._related.length; i++) {
					if (this._related[i]._end.getTime() > min) {
						min = this._related[i]._end.getTime();
					}
				}
				return min;
			}
			return -1;
		},
		_calculateDimensions: function () {
			var views = this._parent.getPeriod().getView();
			//var canvasWidth = context.canvas.width;
			var canvasWidth = $("#board").width();
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
					width += pieceWidth;
					x = x == 0 ? pieceX + offset - viewWidth : x;
				}
			}
			//this._x = x + this._parent._offset;

			this._width = width;

		},
		paint: function (context) {
			this._enableShadow(context);
			//this._calculateDimensions();

			context.save();
			context.translate(this._x + this._parent._offset, this._y);
			this._paintRect(context, 0, 2, this._width, this._height);
			context.restore();
			/*var views = this._parent.getPeriod().getView();
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

			this._paintRect(context, 0, y, pieceWidth, this._height);
			context.restore();
			width += pieceWidth;
			x = x == 0 ? pieceX + offset - viewWidth : x;
			}
			}

			this._disableShadow(context);
			this._boxX = x + this._parent._offset;
			this._x = this._boxX;

			this._width = width;
			this._boxWidth = width;
			*/
			this._expandLeftMarker.setCoords(this._x + 5, this._y + this._height / 2);
			this._expandRightMarker.setCoords(this._x + this._width - 5, this._y + this._height / 2);
			this._moveMarker.setCoords(this._x + this._width / 2, this._y + this._height / 2);

			if ((this._x + this._width) > 0) {
				if (this._width >= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
					this._expandLeftMarker.paint(context);
					this._expandRightMarker.paint(context);

					if (this._labelsOn)
						this._paintLabel(context);

					this._lamp._x = this._x + this._width - 20;
					this._lamp._y = this._y + 5;

					if (this._lampsOn && this._lamp._loaded)
						this._lamp.paint(context);
				}
				this._paintAlignHelpers(context);
			}
			this._moveMarker.paint(context);
		},
		_enableShadow: function (context) {
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
			context.shadowBlur = 6;
			context.shadowColor = 'rgba(20, 20, 20, 0.9)';
		},
		_disableShadow: function (context) {
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
			context.shadowBlur = 0;
			context.shadowColor = 'rgba(50, 50, 50, 0.5)';
		},
		_paintAlignHelpers: function (context) {
			var p = this._parent.findNodeToSnapIn(this);
			if (p != null) {
				context.beginPath();
				context.moveTo(this._x, p.snapDir == "right" ? this._y : this._y + this._height);
				context.lineTo(p.node._x, p.node._y + p.node._height);
				context.moveTo(this._x + this._width, p.snapDir == "left" ? this._y : this._y + this._height);
				context.lineTo(p.node._x + p.node._width, p.node._y + p.node._height);
				context.stroke();
			}
		},
		_getFillColor: function () {
			return this._valid ? this._normalFillColor : this._invalidFillColor;
		},
		_paintLabel: function (context) {

			if ((this._x + this._width) > 0) {
				var metric = context.measureText(this._textLabel);
				var label = this._textLabel;
				while (metric.width > this._width && this._textLabel.length >= 0) {
					label = label.substring(0, label.length - 1);
					metric = context.measureText(label);
				}
				context.fillStyle = "#000000";
				context.fillText(label, this._x + ((this._width - metric.width) / 2), this._y + (this._height / 2) + 5);
			}
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
		_onMouseMoveExt: function (e) {
			$.extend(e, {
				offsetX: e.offsetX - this._x,
				offsetY: e.offsetY - this._y
			});

			var dragLength = e.pageX - this._dragStartX;
			if (Math.abs(dragLength) > 0) {
				this._dragStartX = e.pageX;
			}

			//var velocity = dragLength > 0 ? Math.min(dragLength, 20) : Math.max(dragLength, -20);
			this._textLabel = this._snapForce;
			this._move(null, dragLength, dragLength, false);

		},
		_move: function (dd, length, dragLength, skipSnap) {
			//onsole.log(this);
			if (this._isMouseDown) {
				if (this.top == null || (this.top != null && (this.top._dragHandler == this.top._drag || !this.top._isMouseDown))) {

					if (this._isTopFrozen())
						return;
					//var skipSnap = false;
					var dist = this._end.getTime() - this._start.getTime();
					var d = dd == null ? this._parent.findDateAtCoord(this._x + length) : dd;

					if (d == null || d.getTime() >= this._end.getTime()) {
						return;
					}

					if (this._x < 0) {
						this.frzn = true;
						if (length < 0) {
							this._x = 0;
							return;
						}
					} else if ((this._x + this._width) > this._parent._width) {
						this.frzn = true;
						if (length > 0) {
							this._x = this._parent._width - this._width;
							return;
						}
					} else {
						this.frzn = false;
					}

					if (this.top == null && this._snapToAbove) {

						var p = this._parent.findNodeToSnapIn(this);
						if (p != null && (this.hasSnapped == undefined || !this.hasSnapped)) {
							d = new Date(p.snapDir == "right" ? p.node._start.getTime() : p.node._end.getTime() - dist);
							skipSnap = true;
							this._snapForce = 40;
							this.hasSnapped = true;
							this._handleRelations();
						} else if (p == null) {
							this.hasSnapped = false;
							this._handleRelations();
						}
					}
					this._dragHandler(d, dist, dragLength, skipSnap);
				}
				this.invalidate(true);
			}
		},
		_isTopFrozen: function () {
			//console.log(top);
			//console.log(this);
			if (this.top == undefined)
				return false;
			var f = this.top.frzn == undefined ? false : this.top.frzn;

			if (!f) {
				//console.log("Check top");
				//console.log(top);
				if (this.top instanceof cc.Shape) {
					//console.log("top is node");
					f = this.top._isTopFrozen();
				}
			}
			console.log(f);
			return f;
		},
		_movePixels: function (distance) {
			var newPos = this._x + distance;
			//console.log(newPos);

			var newDate = this._parent.findDateAtCoord(newPos);
			//console.log(newDate);

			this._dragHandler = this._drag;

			var nodeLength = this._end.getTime() - this._start.getTime();
			this._isMouseDown = true;
			//d, dist, dragLength, skip
			this._dragHandler(newDate, nodeLength, null, true);
			this._isMouseDown = false;
			this.invalidate(true);
			for (var i = 0; i < this._related.length; i++) {
				this._related[i]._movePixels(distance);
			}
		},
		_onMouseMove: function (sender, data) {

		},
		_onMouseOver: function (sender, data) {
			this._setMarkers(true);
		},
		_onMouseOut: function (sender, data) {
			this._setMarkers(false);
			this._super(sender, data);
		},
		_onMouseUp: function (sender, data) {

			this._handleRelations();

			if (this._dragHandler == this._drag)
				this._raise("dragged.cc");

			else if (this._dragHandler == this._resizeLeft || this._dragHandler == this._resizeRight)
				this._raise("resized.cc");

			this._isMouseDown = false;
			this._dragHandler = null;

			this._setMouseUpOnRelated();
		},
		_onMouseDown: function (sender, data) {

			this._isMouseDown = true;
			this._setHandlers(data.offsetX);
			this._raise("nodeClicked.cc");

			if (this._dragHandler === this._drag)
				this._setMouseDownOnRelated();
		},
		_setMouseDownOnRelated: function () {
			for (var i = 0; i < this._related.length; i++) {
				var sub = this._related[i];
				sub.overrideHandlerSelection = true;
				sub._onMouseDown(this, { offsetX: sub._width / 2 });
			}
		},
		_setMouseUpOnRelated: function () {
			for (var i = 0; i < this._related.length; i++) {
				var sub = this._related[i];
				sub.overrideHandlerSelection = false;
				sub._onMouseUp(this, { offsetX: sub._width / 2 });
			}
		},
		_setMarkers: function (visible) {
			this._expandLeftMarker.setVisible(visible);
			this._expandRightMarker.setVisible(visible);
			this._moveMarker.setVisible(visible);
		},
		_setHandlers: function (x) {
			if ((this.overrideHandlerSelection != undefined &&
			 this.overrideHandlerSelection == true) || this._width <= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
				this._dragHandler = this._drag;
				return;
			}

			if (x > 0 && x <= 10) {
				this._dragHandler = this._dragHandler != this._resizeRight ? this._resizeLeft : this._resizeRight;
			} else if (x <= this._width && x > this._width - 10) {
				this._dragHandler = this._dragHandler != this._resizeLeft ? this._resizeRight : this._resizeLeft;
			} else {
				this._dragHandler = this._drag;
			}
		},
		_resizeLeft: function (d) {
			if (this._isMouseDown)
				this._start = new Date(d.getTime());

			if (this._width <= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
				this._dragHandler = this._drag;
			}
		},
		_resizeRight: function (d, dist) {
			if (this._isMouseDown)
				this._end = new Date(d.getTime() + dist);

			if (this._width <= (this._resizeHandleLimit * 2) + this._dragHandleLimit) {
				this._dragHandler = this._drag;
			}
		},
		_drag: function (d, dist, dragLength, skip) {
			if (this._isMouseDown) {
				if (!skip) {
					if (this._snapForce > 0 && dragLength < 40) {
						this._snapForce -= Math.abs(dragLength);
						return;
					}
				}
				this._start = new Date(d.getTime());
				this._end = new Date(d.getTime() + dist);
			}
		},
		_null: function () {

		},
		_handleRelations: function () {
			var top = this._parent.findTopBoardNode(this);
			if (top != null) {
				this.top = top;
				top.addRelated(this);
				//console.log(this.top._related);
			} else {
				if (this.top != undefined || this.top != null) {
					var idx = this.top._related.indexOf(this);
					if (idx != -1) {
						this.top._related.splice(idx, 1);
					}
					//console.log(this.top._related);
					this.top = null;
				}
			}
		}
	});
})(canvascontrols);