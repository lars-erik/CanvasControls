///<reference path="jquery-1.7.1.min.js"/>
///<reference path="qunit.extensions.js"/>
///<reference path="class.js"/>
///<reference path="Mock.js"/>
///<reference path="MockContext.js"/>
///<reference path="canvascontrols.js"/>
///<reference path="canvascontrols.observable.js"/>
///<reference path="canvascontrols.canvasview.js"/>
///<reference path="canvascontrols.shape.js"/>

var mock = new MockContext();

var MockShape = canvascontrols.Shape.extend({
	init: function () { this._super.apply(this, arguments); },
	paint: function () {
		this.lastArgs = arguments;
	},
	isInBounds: function (coords) {
		return coords.x >= 0 && coords.x <= 10 &&
			coords.y >= 0 && coords.y <= 10;
	}
});

module("canvascontrols canvasview", {
	setup: function () {
		mock.reset();
	},
	teardown: function () {
		$("div", document.body).remove();
		$("canvas", document.body).remove();
	}
});

function createView(selector) {
	return new canvascontrols.CanvasView(selector);
}

function createCanvas() {
	$(document.body).append("<canvas></canvas>");
}

test("can create view for canvas", function () {
	$(document.body).append("<canvas></canvas>");
	var view = createView("canvas");
	ok(view instanceof canvascontrols.Observable);
	ok(view instanceof canvascontrols.CanvasView);
});

test("fails when given non existing id", function () {
	throwsError(function () {
		createView("#nada");
	}, "no exception for non existing id");
});

test("fails when given selector matching multiple elements", function () {
	$(document.body).append($("<div>a</div><div>b</div>"));

	throwsError(function () {
		createView("div");
	},"no exception for multiple elements");
});

test("fails when element isn't a canvas", function () {
	$(document.body).append($("<div></div>"));
	throwsError(function () {
		createView("div");
	}, "no exception for non canvas");
});

test("adds width and height attributes to canvas and exposes them", function () {
	$(document.body).append("<canvas style=\"width:200px;height:100px\"></canvas>");
	var v = createView("canvas");
	equal($("canvas").attr("width"), "200");
	equal($("canvas").attr("height"), "100");
	equal(v.width(), 200);
	equal(v.height(), 100);
});

test("can add a shape", function () {
	createCanvas();
	var v = createView("canvas");
	var shape = new canvascontrols.Shape();
	v.add(shape);
	equal(v.getShapeCount(), 1);
	equal(v.getShape(0), shape);
});

test("fails if adding an object not derived from shape", function() {
	createCanvas();
	var v = createView("canvas");
	throwsError(function() {
		v.add({ });
	}, "did not throw error for added non-shape");
});

test("paint clears entire canvas and translates to 0.5,0.5", function () {
	createCanvas();
	var v = createView("canvas");
	mock.logged = ["clearRect", "save", "translate", "restore"];
	v.mockContext(mock);
	v.paint();

	equal(mock.calls.length, 4);
	equal(mock.calls[0].name, "clearRect");
	equal(mock.calls[0].args.x, 0);
	equal(mock.calls[0].args.y, 0);
	equal(mock.calls[0].args.w, 300);
	equal(mock.calls[0].args.h, 150);
	equal(mock.calls[1].name, "save");
	equal(mock.calls[2].name, "translate");
	equal(mock.calls[2].args.x, 0.5);
	equal(mock.calls[2].args.y, 0.5);
	equal(mock.calls[3].name, "restore");
});

test("paint calls paint on each shape", function () {
	createCanvas();
	var v = createView("canvas");
	var shape1 = new MockShape();
	var shape2 = new MockShape();

	v.mockContext(mock);
	v.add(shape1);
	v.add(shape2);
	v.paint();

	equal(shape1.lastArgs[0], mock);
	equal(shape1.lastArgs[0], mock);
});

test("paint saves, translates to shape x,y then restores for each shape", function () {
	createCanvas();
	var v = createView("canvas");
	var shape1 = new MockShape({ x: 10, y: 20 });
	var shape2 = new MockShape({ x: 30, y: 25 });

	mock.logged = ["save", "translate", "restore"];

	v.mockContext(mock);
	v.add(shape1);
	v.add(shape2);
	v.paint();

	equal(mock.calls.length, 9);
	equal(mock.calls[3].args.x, 10);
	equal(mock.calls[3].args.y, 20);
	equal(mock.calls[6].args.x, 30);
	equal(mock.calls[6].args.y, 25);
});

test("can find shape at canvas coordinates", function () {
	createCanvas();
	var v = createView("canvas");

	var shape1 = new MockShape({ x: 10, y: 20 });
	var shape2 = new MockShape({ x: 30, y: 25 });
	v.add(shape1);
	v.add(shape2);

	equal(v.findShapeAt({ offsetX: 15, offsetY: 25 }), shape1);
	equal(v.findShapeAt({ offsetX: 37, offsetY: 35 }), shape2);
});

test("raises mouse events", function () {

	createCanvas();
	var v = createView("canvas");
	var extraParams = { pageX: 10, pageY: 20 };
	var lastE, lastS, lastThis;
	var handler = function (s, e) {
		lastThis = this;
		lastS = s;
		lastE = e;
	};
	var owner = {};
	v.on("mousedown mousemove mouseup click", owner, handler);

	$("canvas").trigger($.Event("mousedown", extraParams));
	equal(lastThis, owner);
	equal(lastS, v);
	equal(lastE.type, "mousedown");
	equal(lastE.pageX, extraParams.pageX);
	equal(lastE.pageY, extraParams.pageY);

	$("canvas").trigger($.Event("mousemove", extraParams));
	equal(lastE.type, "mousemove");

	$("canvas").trigger($.Event("mouseup", extraParams));
	equal(lastE.type, "mouseup");

	$("canvas").trigger($.Event("click", extraParams));
	equal(lastE.type, "click");

	lastE = null;

	$("canvas").trigger($.Event("keyup", extraParams));
	equal(lastE, null);

});

test("does not apply events with . in name to canvas, but can raise", function () {
	createCanvas();
	var v = createView("canvas");
	var lastS, lastE;
	v.on("event.mine", this, function (s, e) {
		lastS = s;
		lastE = e;
	});
	v._raise("event.mine");
	equal(lastS, v);
	equal(lastE.type, "event");
	equal(lastE.namespace, "mine");
	lastS = null;
	$("canvas").trigger("event.mine");
	equal(lastS, null);
});

test("fires own and passes mouse event with offset to controls", function () {
	createCanvas();
	var v = createView("canvas");
	var shape1 = new MockShape({ x: 10, y: 20 });
	var shape2 = new MockShape({ x: 30, y: 25 });
	v.add(shape1);
	v.add(shape2);
	var canvasOffset = {
		x: $("canvas").offset().left,
		y: $("canvas").offset().top
	};
	var params = { pageX: canvasOffset.x + 12, pageY: canvasOffset.y + 23 };
	var notified = [];
	var notify = function (s, e) {
		notified.push([s, e]);
	};
	shape1.on("mousedown", this, notify);
	shape2.on("mousedown", this, notify);
	v.on("mousedown", this, notify);
	$("canvas").trigger($.Event("mousedown", params));
	equal(notified.length, 2);
	equal(notified[1][0], v);
	equal(notified[0][0], shape1);
	equal(notified[0][1].pageX, params.pageX);
	equal(notified[0][1].pageY, params.pageY);
	equal(notified[0][1].offsetX, 12);
	equal(notified[0][1].offsetY, 23);
	equal(notified[0][1].x, 2);
	equal(notified[0][1].y, 3);
	notEqual(notified[0][0], shape2);
});


/*
	var shape1Clicked = false, shape2Clicked = false, offset;
	shape1.evaluateClick = function (e) { offset = e; shape1Clicked = true; };
	shape2.evaluateClick = function (e) { offset = e; shape2Clicked = true; };
	v._canvasClicked({ offsetX: 15, offsetY: 25 });
	equal(shape1Clicked, true);
	equal(shape2Clicked, false);
	equal(offset.x, 5);
	equal(offset.y, 5);

	shape1Clicked = false;
	shape2Clicked = false;
	v._canvasClicked({ offsetX: 33, offsetY: 32 });
	equal(shape1Clicked, false);
	equal(shape2Clicked, true);
	equal(offset.x, 3);
	equal(offset.y, 7);
*/