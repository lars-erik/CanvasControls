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

test("initializes x and y to 0 if not set", function() {
	var s;
	s = createShape();
	equal(s.x(), 0);
	equal(s.y(), 0);
});

test("initializes x and y from ctor args", function () {
	var s = createShape({ x: 10 });
	equal(s.x(), 10);
	equal(s.y(), 0);
	s = createShape({ y: 10 });
	equal(s.x(), 0);
	equal(s.y(), 10);
	s = createShape({ x:20, y: 10 });
	equal(s.x(), 20);
	equal(s.y(), 10);
});

test("can set position using setPosition", function () {
	var s = createShape();
	s.setPosition(15, 25);
	equal(s.x(), 15);
	equal(s.y(), 25);
});

test("initializes width and height to 0 if not set", function () {
	var s = createShape();
	equal(s.width(), 0);
	equal(s.height(), 0);
});

test("initializes width and height from ctor args", function() {
	s = createShape({ width: 35, height: 25 });
	equal(s.width(), 35);
	equal(s.height(), 25);
});

test("can set width and height using setSize", function() {
	var s = createShape();
	s.setSize(50, 30);
	equal(s.width(), 50);
	equal(s.height(), 30);
});

test("is in bounds if coords are larger than 0 and less that width/height respectively", function () {
	var s = createShape({width:5, height:5});
	equal(s.isInBounds({ offsetX: -1, offsetY: -1 }), false);
	equal(s.isInBounds({ offsetX: 0, offsetY: 0 }), true);
	equal(s.isInBounds({ offsetX: 3, offsetY: 3 }), true);
	equal(s.isInBounds({ offsetX: 5, offsetY: 5 }), true);
	equal(s.isInBounds({ offsetX: 6, offsetY: 6 }), false);
});

test("exposes _parent in parent()", function() {
	var s = createShape();
	var o = { };
	equal(s.parent(), null);
	s._parent = o;
	equal(s.parent(), o);
});

test("invalidate raises invalidated event with affectsParents bit", function () {
	var shape = createShape();
	var sender, eventArg;
	shape.on("invalidated.cc", {}, function (s, e) {
		sender = s;
		eventArg = e;
	});
	shape.invalidate();
	ok(sender === shape);
	equal(eventArg.type, "invalidated");
	equal(eventArg.affectsParents, false);
	shape.invalidate(true);
	equal(eventArg.affectsParents, true);
});