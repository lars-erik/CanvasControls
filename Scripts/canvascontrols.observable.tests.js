/// <reference path="class.js"/>
/// <reference path="jquery-1.7.1.js"/>
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

test("notifies all listeners applying notify handler to observer", function () {
	var observer = [];
	var notify = function (s, e) {
		observer.push(this);
	};
	var observers = [{ notify: notify }, { notify: notify}];
	subject.on("heyguys.x", observers[0], observers[0].notify);
	subject.on("heyguys.x", observers[1], observers[1].notify);
	subject._raise("heyguys.x");
	equal(observer[0], observers[0]);
	equal(observer[1], observers[1]);
});

test("passes self, event and arguments to notify handler", function () {
	var params;
	subject.on("evt.x", this, function () {
		params = arguments;
	});
	subject._raise("evt.x", { a: 1, b: 2 });
	equal(params[0], subject);
	equal(params[1].type, "evt");
	equal(params[1].namespace, "x");
	equal(params[1].a, 1);
	equal(params[1].b, 2);
});

test("can unsubscribe", function () {
	ok(false, "Haven't got this to work yet. :(");
	var observers = [{}, {}];
	var calls = [];
	function notify() {
		calls.push({});
	}
	subject.on("evt.x", observers[0], notify);
	subject.on("evt.x", observers[1], notify);
	subject.off("evt.x", observers[0]);
	subject._raise("evt.x");
	equal(calls.length, 1);
});

test("on throws if handler is not a function", function () {
	try {
		subject.on("whatever", function() {
			// forgot owner in the middle
		});
		ok(false);
	} catch (e) {

	}
});