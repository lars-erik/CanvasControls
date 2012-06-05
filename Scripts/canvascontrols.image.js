(function (cc) {

	cc.Image = cc.Shape.extend({
		init: function (path) {
			this._super();
			this._imageArray = [];
			this.addImage("img", path);
		},
		addImage : function(name, path) {
			if (path != undefined && path.length > 0)
				this._imageArray.push(this._createArrayEntry(name, path));
		},
		setSelected : function(name) {
			if (this._contains(name)) {
				for (var i = 0; i < this._imageArray.length; i++) {
					this._imageArray[i].selected = this._imageArray[i].name === name ? true : false;
				}
			}
		},
		paint: function (ctx) {
			/*if (this._loaded())
				ctx.drawImage(this._image, this._x, this._y,
					this.width(),
					this.height()
				);*/
			var img = this._getSelected();
			if (img != null && img.complete) {
				ctx.drawImage(img, this._x, this._y,
					this.width(),
					this.height()
				);
			}
		},
		width: function () {
			//return this._width ? this._width : this._image.width;
			return this._width ? this._width : this._getSelected().width;
		},
		height: function () {
			//return this._height ? this._height : this._image.height;
			return this._height ? this._height : this._getSelected().height;
		},
		_loaded: function () {
			return this._image.complete;
		},
		_getSelected : function() {
			var r = null;
			for (var i = 0; i < this._imageArray.length; i++) {
				if (this._imageArray[i].selected == true)
					r = this._imageArray[i].img;
			}
			return r;
		},
		_createArrayEntry : function(name, path) {
			var image = new Image();
			image.src = path;
			this._on($(image), "load", this, function () {
				this._raise("loaded.cc");
			});
			return { name : name, img : image, selected : this._imageArray.length == 0 ? true : false };
		},
		_contains : function(name) {
			var r = false;
			for (var i = 0; i < this._imageArray.length; i++) {
				if (this._imageArray[i].name === name)
					r = true;
			}
			return r;
		}
	});

})(canvascontrols)