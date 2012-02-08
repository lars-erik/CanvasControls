(function (cc) {

	cc.Shape = Class.extend({
		init: function (options) {
			this._options = $.extend({
				x: 0,
				y: 0
			}, options);
		},
		x: function () {
			return this._options.x;
		},
		y: function () {
			return this._options.y;
		},
		paint: function () {
		}
	});

})(canvascontrols);
