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
					this.width ? this.width : this._image.width,
					this.height ? this.height : this._image.height
				);
		},
		getSize: function () {
			return {
				width: this.width ? this.width : this._image.width,
				height: this.height ? this.height : this._image.height
			};
		},
		setSize: function (width, height) {
			this.width = width;
			this.height = height;
		},
		resetSize: function () {
			this.width = null;
			this.height = null;
		},
		isInBounds: function (offset) {
			var size = this.getSize();
			return offset.offsetX >= 0 && offset.offsetX <= size.width &&
				   offset.offsetY >= 0 && offset.offsetY <= size.height;
		},
		evaluateClick: function (offset) {
			this._notifyListeners("clicked", offset);
		},
		_loaded: function () {
			return this._image.complete;
		}
	});

})(canvascontrols)