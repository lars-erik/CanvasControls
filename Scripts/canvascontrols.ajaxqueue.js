(function (cc) {

	cc.AjaxQueue = Class.extend({
		init: function () {
			this._queue = [];
		},
		count: function () {
			return this._queue.length;
		},
		add: function (url, settings, extra) {
			this._queue.push({
				url: url,
				settings: settings,
				extra: extra
			});
			this._attemptCall();
		},
		peek: function () {
			return this._queue[0];
		},
		pop: function () {
			var item = this._queue[0];
			this._queue = this._queue.slice(1, this._queue.length);
			return item;
		},
		_attemptCall: function () {
			if (this._isInCall) return;
			var next = this.peek();
			if (next == null) return;
			next.extra = $.extend(next.extra, {
				callback: next.settings.success
			});
			next.settings.success = $.proxy(this._queueCallback, this);
			this._isInCall = true;
			$.ajax(next.url, next.settings);
		},
		_queueCallback: function (data, textStatus, jqXHR) {
			var called = this.pop();
			called.extra.callback($.extend(data, { extra: called.extra }), textStatus, jqXHR);
			this._isInCall = false;
			this._attemptCall();
		}
	});

})(canvascontrols);