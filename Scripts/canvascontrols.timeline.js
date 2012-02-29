(function (cc) {

    cc.MonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Des"];
    cc.QuarterNames = ["Q1", "Q2", "Q3", "Q4"];

    cc.TimelineBase = cc.Shape.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                children: []
            }, options);
            this._children = settings.children;
            this.on("click", this, this._evaluateClick);
            this.on("mousewheel", this, this._evaluateScroll);
        },
        add: function (node) {
            node.on("toggled.cc nodeAdded.cc nodeRemoved.cc", this, this._childEvent);
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
        _paintChildren: function (context) {
            var x = 0;
            for (var i = 0; i < this._children.length; i++) {
                var sw = context.canvas.width * this._children[i]._proportion;
                //console.debug(this._children.length + " " + sw);
                context.save();
                context.translate(x, 0);
                this._children[i]._width = sw;
                this._children[i].paint(context);
                this._children[i]._x = x;
                context.restore();
                x += sw;
            }
        },
        _evaluateClick: function (sender, data) {

            if (!data.originalX) {
                data.originalX = data.offsetX;
                data.originalY = data.offsetY;
            }
            var child = this._findChildAtCoords(data);

            if (child != null) {
                child._evaluateClick(this, $.extend(data, this._getChildOffset(data, child)));
            }
        },
        _evaluateScroll: function (sender, data) {
            console.debug(data);
            //console.debug(data.delta > 0 ? "zoomin" : "zoomout");
            if (!data.originalX) {
                data.originalX = data.offsetX;
                data.originalY = data.offsetY;
            }
            var child = this._findChildAtCoords(data);

            if (child != null) {
                child._evaluateScroll(this, $.extend(data, this._getChildOffset(data, child)));
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
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                var offset = this._getChildOffset(coords, child);
                if (child.isInBounds(offset))
                    return child;
            };
            return null;
        }
    });

    cc.Timeline = cc.TimelineBase.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                period: new cc.Period(new cc.Month())
            }, options);
            //this.setPeriod(settings.period);
            this._period = settings.period;
        },
        paint: function (context) {
            this.clear();
            this.setPeriod(this._period);
            this._paintChildren(context);
        },
        getPeriod: function () {
            return this._period;
        },
        setPeriod: function (period) {
            //this._period = period;
            var view = this._period.getView();
            for (var i = 0; i < view.length; i++) {
                this.add(new cc.TimelineNode(view[i]));
            }
        }
    });

    cc.TimelineNode = cc.TimelineBase.extend({
        init: function (options) {
            //console.debug(options);
            this._super(options);
            var settings = $.extend({
                Active: false,
                Header: null,
                Label: "",
                Subheader: false,
                hasChildren: false,
                Proportion: 0.1,
                width: 100,
                height: 20
            }, options);
            this._active = settings.Active;
            this._header = settings.Header;
            this._label = settings.Label;
            this._subheader = settings.Subheader;
            this._hasChildren = settings.hasChildren;
            this._proportion = settings.Proportion;
            this._width = settings.width;
            this._height = settings.height;
        },
        paint: function (context) {
            context.fillText(this._label, this._x + 40, this._y + 10);
            context.beginPath();
            context.moveTo(this._x, 0);
            context.lineTo(this._x, 20);
            context.stroke();
        },
        isInBounds: function (coords) {
            if (this._isInOwnOffset(coords))
                return true;
            return this._super(coords);
        },
        _evaluateClick: function (sender, data) {
            console.debug(this._label + " " + this._width);
            //this._parent.getPeriod().zoomIn();

        },
        _evaluateScroll: function (sender, data) {
            
            data.delta > 0 ? this._parent.getPeriod().zoomOut() : this._parent.getPeriod().zoomIn();
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