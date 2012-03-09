(function (cc) {

    cc.TimelineBoardBase = cc.CompositeShape.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                children: []
            }, options);
            this._children = settings.children;
            this._offset = 0.5;
            this.on("dblclick", this, this._onDblClick);
            this.on("mousedown", this, this._onMouseDown);
            this.on("mouseup", this, this._onMouseUp);
            this.on("mousemove", this, this._onMouseMove);
            this.on("periodChanged.cc", this, this._onPeriodChange);
            this.on("drag.cc", this, this._onDrag);
            this.on("keyup keydown", this, this._onKey);
            this.on("mouseover", this, this._onMouseOver);
        },
        add: function (node) {
            node._parent = this;
            //this._children.push(node);
            this._super(node);
            this._raise("nodeAdded.cc", { parent: this, child: node });
        },
        clear: function () {
            this._children = [];
        },
        isInBounds: function (coords) {
            return this._findChildAtCoords(coords) != null;
        },
        setOffset: function (offset) {
            this._offset = offset;
        },
        _paintChildren: function (context) {
            
            for (var i = 0; i < this.getShapeCount(); i++) {
                var child = this.getShapes()[i];
                child.paint(context);
            }
        },
        _onDblClick: function (sender, data) {
            console.debug("_onDblClick");
        },
        _onMouseDown: function (sender, data) {
            console.debug("_onMouseDown");
        },
        _onMouseUp: function (sender, data) {
            console.debug("_onMouseUp");
        },
        _onMouseMove: function (sender, data) {
            console.debug("_onMouseMove");
        },
        _onMouseOver: function (sender, data) {
            console.debug("mouseover");
        },
        _onPeriodChange: function (sender, data) {
            console.debug("_onPeriodChange");
        },
        _onKey: function (sender, data) {

        },
        _onDrag: function (sender, data) {
            this._offset += data.dragLength;
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
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
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
            this._hasChildren = this._children.length > 0;
        },
        getPeriod: function () {
            return this._period;
        },
        paint: function (context) {
            this._paintChildren(context);
            var views = this._period.getView();
            var x = this._offset - (context.canvas.width * views[0].Proportion);
            for (var i = 0; i < this._period.getView().length; i++) {
                var view = views[i];
                var sw = context.canvas.width * view.Proportion;
                this._paintLine(context, x, 0, x, 50);
                x += sw;
            }

        },
        setPeriod: function (period) {
            this._period = period;
        }

    });

    cc.TimelineBoardNode = cc.TimelineBoardBase.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                start: new Date(2012, 0, 5),
                end: new Date(2012, 6, 31, 23, 59, 59)
            }, options);
            this._start = settings.start;
            this._end = settings.end;
            this._hasChildren = this._children.length > 0;
        },
        paint: function (context) {
            var period = this._parent.getPeriod();
            var views = period.getView();
            var canvasWidth = context.canvas.width;
            var x = 0, width = 0, y = 30;
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
                    x = startFraction * viewWidth;

                    var endOffset = this._end.getTime() - view.DateStart.getTime();
                    var endFraction = Math.min(endOffset / span, 1);
                    width = (endFraction - startFraction) * viewWidth;

                    this._paintRect(context, x + offset - viewWidth, y, width, 20);
                }
            }
        },
        _paintRect: function (context, x, y, width, height) {
            context.fillStyle = "#FF0000";
            context.fillRect(x + this._parent._offset, y, width, height);
            context.fillStyle = "#000000";
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