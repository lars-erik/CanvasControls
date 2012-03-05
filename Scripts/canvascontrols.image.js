(function (cc) {

	cc.Image = cc.Shape.extend({
		init: function (path) {
			this._super();
			this._image = new Image();
			this._image.src = path;
			this._on($(this._image), "load", this, function () {
				this._raise("loaded.cc");
			});
		},
		paint: function (ctx) {
			if (this._loaded())
				ctx.drawImage(this._image, 0, 0,
					this.width(),
					this.height()
				);
		},
		width: function () {
			return this._width ? this._width : this._image.width;
		},
		height: function () {
			return this._height ? this._height : this._image.height;
		},
		_loaded: function () {
			return this._image.complete;
		}
	});

})(canvascontrols)