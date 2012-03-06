(function (cc) {

    cc.MonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Des"];
    cc.QuarterNames = ["Q1", "Q2", "Q3", "Q4"];
    cc.MouseButton = { "Left": 0, "Middle": 1, "Right": 2 };

    cc.TimelineBase = cc.Shape.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                children: []
            }, options);
            this._children = settings.children;
            this._isMouseDown = false;
            this._currentX = 0;
            this._previousX = 0;
            this._offset = 0.5;
            this.on("click", this, this._onClick);
            this.on("dblclick", this, this._onDblClick);
            this.on("mousewheel", this, this._onScroll);
            this.on("mousedown", this, this._onMouseDown);
            this.on("mouseup mouseout", this, this._onMouseUp);
            this.on("mousemove", this, this._onMouseMove);
            this.on("periodChanged.cc", this, this._onPeriodChange);

        },
        add: function (node) {
            node._parent = this;
            this._children.push(node);
            this._raise("nodeAdded.cc", { parent: this, child: node });
        },
        clear: function () {
            this._children = [];
        },
        isInBounds: function (coords) {
            return this._findChildAtCoords(coords) != null;
        },
        _clearPaint: function () {
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                child._selected = false;
            }
        },
        _paintChildren: function (context) {

            var x = this._offset;
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                var sw = context.canvas.width * child.getProportion();
                
                context.save();
                context.translate(x, 0);
                child._width = sw;
                child._x = x;
                child.paint(context);

                context.restore();
                x += sw;
            }

        },
        _onMouseDown: function (sender, data) {
            if (data.button == cc.MouseButton.Left) {
                this._isMouseDown = true;
                this._currentX = data.pageX;
            }
        },
        _moveByDragLength: function (length, data) {
            var child = this._getChild(data);
            var steps = 0;

            if (this._offset + length <= 0) {
                steps = parseInt(Math.abs(length) / child._width) + ((length % child._width) == 0 ? 0 : 1);
                this._offset += length + child._width * steps;
                this.getPeriod().shift(steps);
                this._raise("periodChanged.cc", { parent: this, child: null });
            } else if (this._offset + length >= child._width) {
                steps = parseInt((this._offset + length) / child._width);
                this._offset = (this._offset + length) % child._width;
                this.getPeriod().shift(steps * -1);
                this._raise("periodChanged.cc", { parent: this, child: null });
            } else {
                this._offset += length;
            }
        },
        _onMouseMove: function (sender, data) {

            if (this._isMouseDown) {
                var length = data.pageX - this._currentX;
                this._currentX = data.pageX;
                this._moveByDragLength(length, data);
                this._raise("demandRedraw.cc", { parent: this, child: null });
            }
        },
        _onMouseUp: function (sender, data) {
            this._isMouseDown = false;
        },
        _onClick: function (sender, data) {

            var child = this._getChild(data);

            if (child != null) {
                child._onClick(this, $.extend(data, this._getChildOffset(data, child)));
            }
            
        },
        
        _onDblClick: function (sender, data) {
            var child = this._getChild(data);
            console.debug(child);
            this.getPeriod().zoomTo(child._date);
            this._raise("periodChanged.cc", { parent: this, child: sender });
        },
        _onScroll: function (sender, data) {
            
            data.deltaY / Math.abs(data.deltaY) > 0 ? this.getPeriod().zoomIn() : this.getPeriod().zoomOut();
            this._raise("periodChanged.cc", { parent: this, child: sender });
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
        _onPeriodChange: function (sender, data) {
            //console.debug("plop");
            this.clear();
            this.createNodes();
        }
    });

    cc.Timeline = cc.TimelineBase.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                period: new cc.Period(new cc.Month())
            }, options);
            this._period = settings.period;
            this.createNodes();
            this._hasChildren = this._children.length > 0;

        },
        paint: function (context) {
            this._paintChildren(context);
        },
        getPeriod: function () {
            return this._period;
        },
        createNodes: function () {
            var view = this._period.getView();
            for (var i = 0; i < view.length; i++) {
                var n = new cc.TimelineNode(view[i]);
                n.on("nodeClicked.cc", this, this._onNodeClick);
                this.add(n);
            }
        },
        _onNodeClick: function (sender, data) {
            this._clearPaint();
            sender._selected = true;
            this._raise("nodeClicked.cc", { parent: this, child: sender });
        },
        _onPeriodChange: function (sender, data) {

            this.clear();
            this.createNodes();
        }
    });

    cc.TimelineNode = cc.TimelineBase.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                Active: false,
                Header: null,
                Label: "",
                Value: null,
                Subheader: false,
                hasChildren: false,
                Proportion: 0.1,
                width: 100,
                height: 50,
                Date: null
            }, options);
            this._date = settings.Date;
            this._active = settings.Active;
            this._header = settings.Header;
            this._label = settings.Label;
            this._value = settings.Value;
            this._subheader = settings.Subheader;
            this._hasChildren = settings.hasChildren;
            this._proportion = settings.Proportion;
            this._width = settings.width;
            this._height = settings.height;
            this._context = null;
            this._selected = false;

        },
        getProportion: function () {
            return this._proportion;
        },
        _paintHeader: function (context) {
            context.fillText(this._header, 0 + 5, this._y + 10);
        },
        _paintActive: function (context) {
            context.fillStyle = "#CCCCFF";
            context.fillRect(0, 20, this._width, 25);
            context.fillStyle = "#000000";
        },
        _paintCurrentSelection: function (context) {

            if (context != null) {
                context.fillStyle = "#EEEEEE";
                context.fillRect(0, 20, this._width, 25);
                context.fillStyle = "#000000";
            }
        },
        _paintMeasuredLabel: function (context) {
            var metric = context.measureText(this._label);
            while (metric.width > this._width && this._label.length >= 0) {
                this._label = this._label.substring(0, this._label.length - 1);
                metric = context.measureText(this._label);
            }

            context.fillText(this._label, (this._width - metric.width) / 2, this._y + 38);
        },
        _paintLine: function (context, x1, y1, x2, y2) {
            context.beginPath();
            context.moveTo(0, y1);
            context.lineTo(0, y2);
            context.stroke();


        },
        _onClick: function (sender, data) {

            this._raise("nodeClicked.cc", { parent: this, child: null });
        },
        paint: function (context) {
            this._context = context;
            if (this._header != null)
                this._paintHeader(context);

            if (this._active)
                this._paintActive(context);

            if (this._selected)
                this._paintCurrentSelection(context);

            this._paintMeasuredLabel(context);

            var height = this._header != null ? 45 : (this._subheader ? 35 : 25);
            var y = this._header != null ? 0 : this._subheader ? 10 : 20;
            this._paintLine(context, this._x, y, this._x, y + height);
        },
        isInBounds: function (coords) {
            if (this._isInOwnOffset(coords))
                return true;
            return this._super(coords);
        },
        _getChildOffset: function (coords, child) {
            console.debug(child);
            return {
                offsetX: coords.offsetX - child.x() - this._width,
                offsetY: coords.offsetY - child.y()
            };
        }

    });


    // OLD
    cc.TimelineController = function (view, period, drawnEventHandler) {

        if (period == null)
            period = new cc.Period(cc.Month());

        var stepWidth;
        var offset = 0.5;

        var isDown;
        var dragLength;
        var prevLength;
        var setPrev;
        var prevX;
        var slowAmount;
        var slowFactor = 30;
        var slowFps = 20;

        drawTimeLine();

        view.dragStarted = dragStarted;
        view.dragging = dragging;
        view.dragStopped = dragStopped;
        view.scrolled = scrolled;
        view.doubleClicked = doubleClicked;
        view.resized = resized;

        function resized() {
            drawTimeLine();
        }

        function drawTimeLine() {
            var periodView = period.getView();
            calculateStepWidth();
            view.clear();
            if (periodView[1].Header == null && periodView[0].Header == null && periodView.StartHeader != null)
                drawHeader(.5, periodView.StartHeader);
            for (
				var x = offset - stepWidth, p = 0;
				x < view.getWidth(), p < periodView.length;
				x += stepWidth, p++
			) {
                drawSeparator(x, periodView[p]);
                drawLabel(x, periodView[p]);
                if (periodView[p].Header != null)
                    drawHeader(x, periodView[p].Header);
            }
            if (drawnEventHandler)
                drawnEventHandler({ offset: offset, stepWidth: stepWidth, period: period });
        }

        function calculateStepWidth() {
            stepWidth = view.getWidth() / period.getZoomLevel();
        }

        function drawSeparator(x, periodStep) {
            var height = periodStep.Header != null ? 45 : (periodStep.Subheader ? 35 : 25);
            var y = periodStep.Header != null ? 0 : periodStep.Subheader ? 10 : 20;
            view.drawLine(x, y, x, y + height, periodStep.Active, stepWidth);
        }

        function drawLabel(x, periodStep) {
            view.drawLabel(periodStep.Label, x, 38, stepWidth);
        }

        function drawHeader(x, text) {
            view.drawHeader(text, x + 5, 17);
        }

        function moveByDragLength() {
            var steps;
            if (offset + dragLength <= 0) {
                steps = parseInt(Math.abs(dragLength) / stepWidth) + ((dragLength % stepWidth) == 0 ? 0 : 1);
                offset += dragLength + stepWidth * steps;
                period.shift(steps);
            }
            else if (offset + dragLength >= stepWidth) {
                steps = parseInt((offset + dragLength) / stepWidth);
                offset = (offset + dragLength) % stepWidth;
                period.shift(steps * -1);
            }
            else {
                offset += dragLength;
            }
        }

        function dragStarted(x) {
            isDown = true;
            setPrev = true;
            prevX = x;
        }

        function dragging(x) {
            if (isDown) {
                dragLength = x - prevX;
                prevX = x;
                if (setPrev) prevLength = dragLength;
                moveByDragLength();
                drawTimeLine();
            }
        }

        function dragStopped(x) {
            if (isDown) {
                setPrev = false;
                dragging(x);
                isDown = false;
                slowAmount = prevLength / slowFactor;
                window.setTimeout(slowdown, slowFps);
            }
        }

        function slowdown() {
            prevLength = prevLength - slowAmount;
            dragLength = prevLength;
            if (isNaN(dragLength)) return;
            moveByDragLength();
            drawTimeLine();
            if (Math.abs(prevLength) > 5 && !isDown)
                window.setTimeout(slowdown, slowFps);
        }

        function scrolled(e, delta) {
            var prevZoom = period.getZoomLevel();
            var direction = delta / Math.abs(delta);
            if (direction > 0)
                period.zoomIn();
            else
                period.zoomOut();
            if (prevZoom != period.getZoomLevel()) {
                calculateStepWidth();
                dragLength = stepWidth * (e.x / view.getWidth()) * direction * -1;
                moveByDragLength();
                drawTimeLine();
            }
        }

        function doubleClicked(e) {
            var element = parseInt((e.x - offset) / view.getWidth() * period.getZoomLevel());
            period.zoomTo(element);
            offset = .5;
            drawTimeLine();
        }
    };

    cc.CanvasTimelineView = function (canvasId) {

        var defaultFill = "#000000";
        var activeFill = "#CCCCFF";

        var jqCanvas = $(canvasId);
        var canvas = jqCanvas[0];
        if (!canvas.getContext)
            throw new Error("Canvas not supported");
        var ctx = canvas.getContext("2d");
        var self = this;

        initialize();

        function initialize() {
            jqCanvas.mousedown(function (e) { self.onDragStarted(e); });
            jqCanvas.dblclick(function (e) { self.onDoubleClicked(e); });
            jqCanvas.mousewheel(function (e, delta) { self.onScroll(e, delta); });
            $(document).mousemove(function (e) { self.onDragging(e); });
            $(document).mouseup(function (e) { self.onDragStopped(e); });
            $(window).resize(function (e) { self.onResized(e); });

            initializeLayout();
        }

        function initializeLayout() {
            jqCanvas.attr("width", jqCanvas.width());
            jqCanvas.attr("height", jqCanvas.height());

            ctx.fillStyle = defaultFill;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.font = "10pt Segoe UI";
        }

        this.getWidth = function () { return jqCanvas.width(); };
        this.getHeight = function () { return jqCanvas.height(); };

        this.clear = function () {
            ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
        };

        this.drawLine = function (x1, y1, x2, y2, active, width) {
            if (active) {
                ctx.fillStyle = activeFill;
                ctx.fillRect(x1, 20, width, 25);
                ctx.fillStyle = defaultFill;
            }

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.stroke();
        };

        this.drawHeader = function (text, x, y) {
            ctx.fillText(text, x, y);
        };

        this.drawLabel = function (text, x, y, maxWidth) {
            var metric = ctx.measureText(text);
            while (metric.width > maxWidth && text.length >= 0) {
                text = text.substring(0, text.length - 1);
                metric = ctx.measureText(text);
            }
            if (text.length > 0)
                ctx.fillText(text, x + (maxWidth - metric.width) / 2, y);
        };

        this.onResized = function (e) {
            initializeLayout();
            this.resized(e);
        };

        this.onDragStarted = function (e) {
            this.dragStarted(e.pageX);
        };

        this.onDragging = function (e) {
            this.dragging(e.pageX);
        };

        this.onDragStopped = function (e) {
            this.dragStopped(e.pageX);
        };

        this.onScroll = function (e, delta) {
            this.scrolled(getPositionInCanvas(e), delta);
        };

        this.onDoubleClicked = function (e) {
            this.doubleClicked(getPositionInCanvas(e));
        };

        function getPositionInCanvas(e) {
            return {
                x: e.pageX - $(canvas).offset().left,
                y: e.pageY - $(canvas).offset().top
            };
        }
    };
    /*
    cc.Period = function (options) {
    var settings = {
    name: "uninitialized",
    start: new Date(),
    minZoom: 1,
    maxZoom: 2,
    zoomLevel: 0,
    outerView: null
    };

    $.extend(settings, options);

    this.getName = function () {
    return settings.name;
    };

    this.getZoomLevel = function () {
    return settings.zoomLevel;
    };

    this.getStart = function () {
    return settings.start;
    };

    this.getEnd = function () {
    return settings.getEnd(settings);
    };

    this.shift = function (value) {
    settings.shift(settings.start, value);
    };

    this.getView = function () {
    return settings.getView(settings);
    };

    this.getViewStart = function () {
    return settings.getViewStart(settings);
    };

    this.zoomIn = function () {
    if (settings.zoomLevel > settings.minZoom)
    settings.zoomLevel--;
    else if (settings.innerView != null)
    settings = settings.innerView(settings.start);
    };

    this.zoomOut = function () {
    if (settings.zoomLevel < settings.maxZoom)
    settings.zoomLevel++;
    else if (settings.outerView != null)
    settings = settings.outerView(settings.start);
    };

    this.zoomTo = function (element) {
    settings = settings.zoomTo(settings, element);
    };
    };

    cc.Day = function () {
    return {
    name: "Day",
    start: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
    zoomLevel: 30,
    minZoom: 1,
    maxZoom: 30,
    getEnd: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setDate(date.getDate() + settings.zoomLevel);
    date.setMilliseconds(-1);
    return date;
    },
    outerView: function (currentStart) {
    return $.extend(cc.Month(), {
    start: new Date(currentStart.getFullYear(), currentStart.getMonth(), 1),
    zoomLevel: 1
    });
    },
    shift: function (start, value) {
    start.setDate(start.getDate() + value);
    },
    getViewStart: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setDate(date.getDate() - 1);
    return date;
    },
    getView: function (settings) {
    var view = [];
    view.StartHeader = cc.MonthNames[settings.start.getMonth()] + " " + settings.start.getFullYear();
    var date = settings.getViewStart(settings);
    for (var i = 0; i < settings.zoomLevel + 1; i++) {
    view[i] = {
    Header: date.getDate() == 1 ? cc.MonthNames[date.getMonth()] + " " + date.getFullYear() : null,
    Label: date.getDate().toString(),
    Subheader: date.getDay() == 1,
    Active: new Date().toDateString() == date.toDateString()
    };
    date.setDate(date.getDate() + 1);
    }
    return view;
    },
    zoomTo: function (settings, element) {
    settings.start.setDate(settings.start.getDate() + element);
    settings.zoomLevel = 1;
    return settings;
    }
    };
    };

    cc.Month = function () {
    return {
    name: "Month",
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    zoomLevel: 12,
    minZoom: 1,
    maxZoom: 12,
    getEnd: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), 1);
    date.setMonth(date.getMonth() + settings.zoomLevel);
    date.setMilliseconds(-1);
    return date;
    },
    innerView: function (currentStart) {
    return $.extend(cc.Day(), {
    start: currentStart
    });
    },
    outerView: function (currentStart) {
    return $.extend(cc.Quarter(), {
    start: new Date(
    currentStart.getFullYear(),
    parseInt(currentStart.getMonth() / 3) * 3,
    1)
    });
    },
    shift: function (start, value) {
    start.setMonth(start.getMonth() + value);
    },
    getViewStart: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setMonth(date.getMonth() - 1);
    return date;
    },
    getView: function (settings) {
    var view = [];
    view.StartHeader = settings.start.getFullYear().toString();
    var date = settings.getViewStart(settings);
    for (var i = 0; i < settings.zoomLevel + 1; i++) {
    view[i] = {
    Header: date.getMonth() == 0 ? date.getFullYear().toString() : null,
    Label: cc.MonthNames[date.getMonth()],
    Subheader: date.getMonth() % 3 == 0,
    Active: new Date().getFullYear() == date.getFullYear() && new Date().getMonth() == date.getMonth()
    };
    date.setMonth(date.getMonth() + 1);
    }
    return view;
    },
    zoomTo: function (settings, element) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setMonth(date.getMonth() + element);
    return settings.innerView(date);
    }
    };
    };

    cc.Quarter = function () {
    return {
    name: "Quarter",
    zoomLevel: 4,
    minZoom: 4,
    maxZoom: 8,
    start: new Date(new Date().getFullYear(), new Date().getMonth() / 4, 1),
    getEnd: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setMonth(date.getMonth() + 3 * settings.zoomLevel);
    date.setMilliseconds(-1);
    return date;
    },
    innerView: function (currentStart) {
    return $.extend(cc.Month(), { start: currentStart });
    },
    outerView: function (currentStart) {
    return $.extend(cc.Year(), { start: new Date(currentStart.getFullYear(), 0, 1), zoomLevel: 2 });
    },
    shift: function (start, value) {
    start.setMonth(start.getMonth() + value * 3);
    },
    getViewStart: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setMonth(date.getMonth() - 3);
    return date;
    },
    getView: function (settings) {
    var view = [];
    view.StartHeader = settings.start.getFullYear().toString();
    var date = settings.getViewStart(settings);
    for (var i = 0; i < settings.zoomLevel + 1; i++) {
    view[i] = {
    Header: date.getMonth() == 0 ? date.getFullYear() : null,
    Label: cc.QuarterNames[parseInt(date.getMonth() / 3)],
    Subheader: false,
    Active: new Date().getFullYear() == date.getFullYear() && parseInt(new Date().getMonth() / 3) == parseInt(date.getMonth() / 3)
    };
    date.setMonth(date.getMonth() + 3);
    }
    return view;
    },
    zoomTo: function (settings, element) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setMonth(date.getMonth() + element * 3);
    return $.extend(settings.innerView(date), { zoomLevel: 3 });
    }
    };
    };

    cc.Year = function () {
    return {
    name: "Year",
    zoomLevel: 2,
    minZoom: 2,
    maxZoom: 10,
    start: new Date(new Date().getFullYear(), 0, 1),
    getEnd: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setFullYear(date.getFullYear() + settings.zoomLevel);
    date.setMilliseconds(-1);
    return date;
    },
    innerView: function (currentStart) {
    return $.extend(cc.Quarter(), { start: currentStart, zoomLevel: 8 });
    },
    shift: function (start, value) {
    start.setFullYear(start.getFullYear() + value);
    },
    getViewStart: function (settings) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setFullYear(date.getFullYear() - 1);
    return date;
    },
    getView: function (settings) {
    var view = [];
    view.StartHeader = null;
    var date = settings.getViewStart(settings);
    for (var i = 0; i < settings.zoomLevel + 1; i++) {
    view[i] = {
    Header: null,
    Label: date.getFullYear().toString(),
    Subheader: false,
    Active: new Date().getFullYear() == date.getFullYear()
    };
    date.setFullYear(date.getFullYear() + 1);
    }
    return view;
    },
    zoomTo: function (settings, element) {
    var date = new Date(settings.start.getFullYear(), settings.start.getMonth(), settings.start.getDate());
    date.setFullYear(date.getFullYear() + element);
    return $.extend(settings.innerView(date), { zoomLevel: 4 });
    }
    };
    };*/

})(canvascontrols);