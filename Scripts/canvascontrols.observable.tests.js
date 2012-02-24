/// <reference path="class.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.observable.js"/>

var subject;

module("observable base class", {
	setup: function () {
		subject = new canvascontrols.Observable();
	},
	teardown: function () {
		delete subject;
	}
});

test("can add listener", function () {
	var notify = function () {
	};
	subject.addListener(this, notify);
	equal(subject._listeners.length, 1);
	equal(subject._listeners[0][0], this);
	equal(subject._listeners[0][1], notify);
});

test("notifies all listeners applying notify handler to observer", function () {
	var observer = [];
	var notify = function () {
		observer.push(this);
	};
	var observers = [{ notify: notify }, { notify: notify}];
	subject.addListener(observers[0], observers[0].notify);
	subject.addListener(observers[1], observers[1].notify);
	subject._notifyListeners("hey guys", 1, 2, 3);
	equal(observer[0], observers[0]);
	equal(observer[1], observers[1]);
});

test("passes self, event and arguments to notify handler", function() {
	var params;
	subject.addListener(this, function() {
		params = arguments;
	});
	subject._notifyListeners("hey guys", 1, 2);
	equal(params[0], subject);
	equal(params[1], "hey guys");
	equal(params[2], 1);
	equal(params[3], 2);
});

test("can unsubscribe", function () {
	var observers = [{}, {}];
	subject.addListener(observers[0], function () { });
	subject.addListener(observers[1], function () { });
	subject.removeListener(observers[0]);
	equal(subject._listeners.length, 1);
	equal(subject._listeners[0][0], observers[1]);
});
