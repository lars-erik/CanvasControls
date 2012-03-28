(function (cc) {
    cc.Marker = cc.CompositeShape.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                shape: null,
                visible: false
            }, options);
            this._shape = settings.shape;
            this._visible = settings.visible;
        },
        paint: function (context) {
            this._paint(context);
        },
        setVisible: function (b) {
            this._visible = b;
        },
        setX: function (x) {
            this._x = x;
        },
        setY: function (y) {
            this._y = y;
        },
        setCoords: function (x, y) {
            this._x = x;
            this._y = y;
        }
    });
    cc.ExpandWidthMarker = cc.Marker.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
            	shape: "Expand",
            	direction : "left"
            }, options);
            this._direction = settings.direction;
        },
        setDirection: function (dir) {
            this._direction = dir;
        },
        _paint: function (context) {
            if (this._visible) {
                context.fillStyle = '#000';
                context.beginPath();
                context.moveTo(this._x, this._y - 10);
                if (this._direction == "left") {
                    context.lineTo(this._x - 10, this._y);
                } else {
                    context.lineTo(this._x + 10, this._y);
                }
                context.lineTo(this._x, this._y + 10);
                context.fill();
            }
        }
    });
    cc.MoveMarker = cc.Marker.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                shape: "Move"
            }, options);
        },
        _paint: function (context) {

            if (this._visible) {

                context.fillStyle = '#000';
                context.beginPath();
                context.moveTo(this._x - 10, this._y);
                context.lineTo(this._x + 10, this._y);
                context.moveTo(this._x, this._y - 10);
                context.lineTo(this._x, this._y + 10);
                context.stroke();
            }
        }
    });
    cc.TimeMarker = cc.Marker.extend({
        init: function (options) {
            this._super(options);
            var settings = $.extend({
                shape: "Time",
                str: new Date(),
                padding: 5
            }, options);
            this._str = settings.str;
            this._font = null;
            this._padding = settings.padding;
        },
        setStr: function (str) {
            this._str = str;
        },
        setFont: function (f) {
            this._font = f;
        },
        _paint: function (context) {
            if (this._visible) {
                var px = context.measureText(this._str).width;
                context.fillStyle = '#eedfcc';
                context.beginPath();
                context.moveTo(this._x, this._y - 20);
                context.lineTo(this._x - (px / 2) - this._padding, this._y - 20);
                context.lineTo(this._x - (px / 2) - this._padding, this._y - 5);
                context.lineTo(this._x - (px / 8), this._y - 5);
                context.lineTo(this._x, this._y + 15);
                context.lineTo(this._x + (px / 8), this._y - 5);
                context.lineTo(this._x + (px / 2) + this._padding, this._y - 5);
                context.lineTo(this._x + (px / 2) + this._padding, this._y - 20);
                context.lineTo(this._x, this._y - 20);
                context.fill();
                context.stroke();

                context.fillStyle = '#000';
                if (this._font != null)
                    context.font = this._font;
                context.fillText(this._str, this._x - (px / 2), this._y - 10, context.measureText(this._str).width);
            }
        }
    });

})(canvascontrols);