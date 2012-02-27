///<reference path="qunit.extensions.js"/>
///<reference path="class.js"/>
///<reference path="jquery-1.7.1.js"/>
///<reference path="canvascontrols.js"/>
///<reference path="canvascontrols.observable.js"/>
///<reference path="canvascontrols.shape.js"/>

module("canvascontrols shape tests", {
	setup: function() {
	},
	teardown: function() {
	}
});

function createShape(options) {
	return new canvascontrols.Shape(options);
}

test("can create shape", function () {
	createShape({ x: 10, y: 10 });
});

test("initializes x and y to 0 if not set", function () {
	var s;
	s = createShape();
	equal(s.x(), 0);
	equal(s.y(), 0);
	s = createShape({ x: 10 });
	equal(s.x(), 10);
	equal(s.y(), 0);
	s = createShape({ y: 10 });
	equal(s.x(), 0);
	equal(s.y(), 10);
	s = createShape({ x:20, y: 10 });
	equal(s.x(), 20);
	equal(s.y(), 10);
});

test("is in bounds defaults to false", function () {
	var s = createShape();
	equal(s.isInBounds({ x: 5, y: 5 }), false);
});