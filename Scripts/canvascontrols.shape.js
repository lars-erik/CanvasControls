(function (cc) {

    cc.Shape = cc.Observable.extend({
        init: function (options) {
            this._super();
            var settings = $.extend({
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                parent: null
            }, options);
            this._x = settings.x;
            this._y = settings.y;
            this._width = settings.width;
            this._height = settings.height;
        },
        x: function () {
            return this._x;
        },
        y: function () {
            return this._y;
        },
        globalX: function () {
			if (this.parent() == null) return this.x();
			return this.parent().globalX() + this.x();
        },
        globalY: function () {
			if (this.parent() == null) return this.y();
			return this.parent().globalY() + this.y();
        },
        width: function () {
            return this._width;
        },
        height: function () {
            return this._height;
        },
        parent: function () {
            return this._parent;
        },
        setPosition: function (x, y) {
            this._x = x;
            this._y = y;
        },
        setSize: function (width, height) {
            this._width = width;
            this._height = height;
        },
        paint: function () {
        },
        isInBounds: function (coords) {
            //console.debug(this.width() + " " + this.height());
            return coords.offsetX >= 0 && coords.offsetX <= this.width() &&
				   coords.offsetY >= 0 && coords.offsetY <= this.height();
        }
    });

})(canvascontrols);
