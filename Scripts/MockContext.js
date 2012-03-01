var MockContext = Mock.extend({
	clearRect: function (x, y, w, h) { this.log("clearRect", arguments); },
	save: function () { this.log("save", arguments); },
	restore: function () { this.log("restore", arguments); },
	strokeRect: function (x, y, w, h) { this.log("strokeRect", arguments); },
	fillRect: function (x, y, w, h) { this.log("fillRect", arguments); },
	beginPath: function () { this.log("beginPath", arguments); },
	closePath: function () { this.log("closePath", arguments); },
	stroke: function () { this.log("stroke", arguments); },
	moveTo: function (x, y) { this.log("moveTo", arguments); },
	lineTo: function (x, y) { this.log("lineTo", arguments); },
	translate: function (x, y) { this.log("translate", arguments); },
	rotate: function (angle) { this.log("rotate", arguments); },
	fillText: function (text, x, y, maxWidth) { this.log("fillText", arguments); },
	putImageData: function (image, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight) { this.log("putImageData", arguments); },
	drawImage: function (image, x, y, width, height) { this.log("drawImage", arguments); }
});
