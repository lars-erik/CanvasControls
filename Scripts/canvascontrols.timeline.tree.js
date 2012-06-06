(function (cc) {

	cc.TimelineTreeBase = cc.CompositeShape.extend({
		init: function (options) {
			this._super(options);
		},

		add: function (node) {
			node.setPosition(this._childXPadding(), this._childYPadding() + this._getChildHeight());
			node.on("toggled.cc nodeAdded.cc nodeRemoved.cc", this, this._childEvent);
			node.on("renamed.cc", this, this._childEvent);
			
			node._parent = this;
			node._state = "new";
			this._hasChildren = true;
			this._super(node);
			this._raise("nodeAdded.cc", { parent: this, child: node });
			return node;
		},

		remove: function (node) {
			for (var i = 0; i < node.getShapeCount(); i++) {
				node.remove(node.getShapes()[i]);
			}

			var origChildCount = this.getShapes().length;
			this._super(node);
			if (origChildCount != this.getShapes().length) {
				this._hasChildren = this.getShapes().length > 0;
				this._updateBounds(-1);
				this._raise("nodeRemoved.cc", { child: node });
				this.invalidate(true);
			}
		},

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

		height: function () {
			if (this._expanded)
				return this._super();
			return this._height;
		},

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
		edit: function () {
			var parentRoot = this.parent();
			while (!(parentRoot instanceof cc.CanvasView) && parentRoot != null) {
				parentRoot = parentRoot.parent();
			}
			var canvasOffsetX = 0, canvasOffsetY = 0;
			if (parentRoot != null && parentRoot._jq != undefined) {
				canvasOffsetX = parentRoot._jq.offset().left;
				canvasOffsetY = parentRoot._jq.offset().top;
			}

			var textBox = $("<input type=\"text\"></input>");
			$(document.body).append(textBox);
			textBox.css("position", "absolute");
			textBox.css("width", this._width - this.getCssSizes(textBox, ["border-left-width", "border-right-width", "padding-left", "padding-right"]) - 1 - this._boxX);
			textBox.css("height", this._height - this.getCssSizes(textBox, ["border-top-width", "border-bottom-width", "padding-top", "padding-bottom"]) - 1 - this._yPad);
			textBox.css("left", this.globalX() + 1 + canvasOffsetX + this._boxX);
			textBox.css("top", this.globalY() + 1 + canvasOffsetY);
			var self = this;
			var update = function () {
				self._label = textBox.val();
				textBox.remove();
				if (parentRoot != null)
					parentRoot.paint();
				self._raise("renamed.cc", { child: self });
			};
			textBox.blur(update);
			textBox.keyup(function (e) {
				if (e.which == 13) update();
				if (e.which == 27) $(this).remove();
			});
			textBox.val(this._label);
			textBox.focus();
			textBox.select();
		},
		getCssSizes: function (element, attributes) {
			var total = 0;
			for (var i = 0; i < attributes.length; i++) {
				total += parseInt(element.css(attributes[i]));
			}
			return total;
		},
		_isInOwnOffset: function (coords) {
			return coords.offsetX >= 0 && coords.offsetX <= this._boxX + this._boxWidth &&
				coords.offsetY >= 0 && coords.offsetY <= this._boxHeight;
		},
		_mouseEvent: function (sender, event) {
			if (this._isInOwnOffset(event)) {
				if (event.type == "click" && this._isTriangleClick(event)) {
					this.toggle();
				}
			}
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


})(canvascontrols);