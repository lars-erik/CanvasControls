(function (cc) {

    cc.Observable = Class.extend({
        init: function () {
        },
        on: function (event, owner, handler) {      
            this._on($(this), event, owner, handler);
        },
        off: function (event, owner) {
            this._off($(this), event, owner);
        },
        _on: function (subject, event, owner, handler) {
            subject.on(event, owner,
				$.proxy(function () {
				    handler.apply(owner, [this].concat(Array.prototype.slice.call(arguments)));
				}, this)
			);
        },
        _off: function (subject, event, owner) {
            subject.off(event, owner);
        },
        _raise: function (event, parameters) {
            $(this).trigger($.Event(event, parameters));
        }
    });

})(canvascontrols);