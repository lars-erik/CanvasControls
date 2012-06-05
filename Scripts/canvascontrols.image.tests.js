/// <reference path="jquery-1.7.1.js" />
/// <reference path="class.js"/>
/// <reference path="qunit.extensions.js"/>
/// <reference path="Mock.js"/>
/// <reference path="MockContext.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.observable.js"/>
/// <reference path="canvascontrols.shape.js"/>
/// <reference path="canvascontrols.image.js"/>

var mock = new MockContext();

module("image control", {
	setup: function () {
		mock.reset();
	},
	teardown: function () {
	}
});

test("can create", function () {
	var img = new canvascontrols.Image("img/Green16.png");
	ok(img instanceof canvascontrols.Shape);
	ok(img instanceof canvascontrols.Image);
	ok(img._getSelected() instanceof Image);
	ok(img._getSelected().src.indexOf("img/Green16.png") > -1);
});

test("paint does nothing if image not loaded", function () {
	var img = new canvascontrols.Image("img/Green16.png");
	mock.logged = ["drawImage"];
	img.paint(mock);
	equal(mock.calls.length, 0);
});

test("puts image data if image is loaded", function () {
	var img = new canvascontrols.Image("img/Green16.png");
	img.on("loaded.cc", this, function (s, e) {
		img.paint(mock);
		equal(mock.calls.length, 1);
		equal(mock.calls[0].name, "drawImage");
		equal(mock.calls[0].args.x, 0);
		equal(mock.calls[0].args.y, 0);
		equal(mock.calls[0].args.width, 0);
		equal(mock.calls[0].args.height, 0);
	});

	mock.logged = ["drawImage"];
	img.paint(mock);
	equal(mock.calls.length, 0);
});

test("can set width and/or height", function () {
	var img = new canvascontrols.Image("img/Green16.png");
	img.setSize(100, 50);
	mock.logged = ["drawImage"];
	img.on("loaded.cc", this, function(s, e) {
		img.paint(mock);
		equal(mock.calls.length, 1);
		equal(mock.calls[0].name, "drawImage");
		equal(mock.calls[0].args.x, 0);
		equal(mock.calls[0].args.y, 0);
		equal(mock.calls[0].args.width, 100);
		equal(mock.calls[0].args.height, 50);
	});
});

test("notifies listeners when image is loaded", function () {
	var img = new canvascontrols.Image("img/Green16.png");
	var event;
	img.on("loaded.cc", {}, function (s, e) {
		event = e.type;
		equal(event, "loaded.cc");
	});
	
	
});