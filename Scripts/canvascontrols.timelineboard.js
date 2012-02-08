(function (cc) {

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