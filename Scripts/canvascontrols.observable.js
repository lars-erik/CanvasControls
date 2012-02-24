(function (cc) {

	cc.Observable = Class.extend({
		init: function () {
			this._listeners = [];
		},
		addListener: function (instance, handler) {
			this._listeners.push([instance, handler]);
		},
		removeListener: function (instance) {
			for (var i = 0; i < this._listeners.length && this._listeners[i][0] != instance; i++) { }
			if (i < this._listeners.length)
				this._listeners.splice(i, 1);
		},
		_notifyListeners: function (event) {
			var args = [this].concat([event]).concat(
				Array.prototype.slice.apply(arguments, [1, arguments.length])
			);
			for (var i = 0; i < this._listeners.length; i++) {
				this._listeners[i][1].apply(this._listeners[i][0], args);
			}
		}
	});

})(canvascontrols);