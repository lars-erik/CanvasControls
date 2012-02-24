(function (cc) {

	cc.Shape = cc.Observable.extend({
		init: function (options) {
			var settings = $.extend({
				x: 0,
				y: 0
			}, options);
			this._x = settings.x;
			this._y = settings.y;
		},
		x: function () {
			return this._x;
		},
		y: function () {
			return this._y;
		},
		paint: function () {
		},
		isInBounds: function () {
			return false;
		}
	});

})(canvascontrols);
