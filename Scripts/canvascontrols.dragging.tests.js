/// <reference path="jquery-1.7.1.js" />
/// <reference path="canvascontrols.js"/>

var fakeView;

module("canvascontrols.dragging", {
	setup: function () {
		fakeView = new (function () {
		})();
	},
	teardown: function () {
		fakeView = null;
	}
});