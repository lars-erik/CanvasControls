///<reference path="jquery-1.7.1.min.js"/>
///<reference path="qunit.extensions.js"/>
///<reference path="class.js"/>
///<reference path="canvascontrols.js"/>
///<reference path="canvascontrols.canvasview.js"/>
///<reference path="canvascontrols.shape.js"/>

module("canvascontrols canvasview", {
	setup: function () {
		params = [];
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

var params = [];
var MockShape = canvascontrols.Shape.extend({
	init: function () { this._super.apply(this, arguments); },
	paint: function () {
		params.push(arguments);
	}
});

test("can create view for canvas", function () {
	$(document.body).append("<canvas></canvas>");
	createView("canvas");
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
	var mock = {
		clearRect: function () { params.push({ n: "clear", a: arguments }); },
		save: function () { params.push({ n: "save", a: arguments }); },
		restore: function () { params.push({ n: "restore", a: arguments }); },
		translate: function () { params.push({ n: "translate", a: arguments }); }
	};
	v.mockContext(mock);
	v.paint();

	equal(params.length, 4);
	equal(params[0].n, "clear");
	equal(params[0].a[0], 0);
	equal(params[0].a[1], 0);
	equal(params[0].a[2], 300);
	equal(params[0].a[3], 150);
	equal(params[1].n, "save");
	equal(params[2].n, "translate");
	equal(params[2].a[0], 0.5);
	equal(params[2].a[1], 0.5);
	equal(params[3].n, "restore");
});

test("paint calls paint on each shape", function () {
	createCanvas();
	var v = createView("canvas");
	var mock = {
		clearRect: function () { },
		save: function () { },
		restore: function () { },
		translate: function () { },
		paint: function () { params.push(arguments); }
	};
	var shape1 = new MockShape();
	var shape2 = new MockShape();

	v.mockContext(mock);
	v.add(shape1);
	v.add(shape2);
	v.paint();

	equal(params.length, 2);
	equal(params[0][0], mock);
	equal(params[1][0], mock);
});

test("paint saves, translates to shape x,y then restores for each shape", function () {
	createCanvas();
	var v = createView("canvas");
	var params = [];
	var mock = {
		clearRect: function () { },
		translate: function () { params.push(arguments); },
		save: function () { params.push(arguments); },
		restore: function () { params.push(arguments); }
	};

	var shape1 = new MockShape({ x: 10, y: 20 });
	var shape2 = new MockShape({ x: 30, y: 25 });

	v.mockContext(mock);
	v.add(shape1);
	v.add(shape2);
	v.paint();

	equal(params.length, 9);
	equal(params[3][0], 10);
	equal(params[3][1], 20);
	equal(params[6][0], 30);
	equal(params[6][1], 25);
});