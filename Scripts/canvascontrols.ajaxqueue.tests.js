///<reference path="class.js"/>
///<reference path="mockjax.js"/>
///<reference path="canvascontrols.js"/>
///<reference path="canvascontrols.ajaxqueue.js"/>

module("canvascontrols ajaxqueue", {
	setup: function () {
		queue = new canvascontrols.AjaxQueue();
		callbackArgs = null;
		$.mockjaxClear();
	}
});

var queue;
var callbackArgs;

function addSimple() {
	queue.add("Hello", {
		data: { name: "Lars" },
		success: callback
	}, {
		hello: "hi"
	});
}

function callback(data, textStatus, jqXHR, extra) {
	callbackArgs = {
		data: data,
		textStatus: textStatus,
		jqXHR: jqXHR,
		extra: extra
	};
}

test("can create queue", function() {
	ok(queue instanceof canvascontrols.AjaxQueue);
	equal(queue.count(), 0);
});

test("can add call", function () {
	addSimple();
	equal(queue.count(), 1);
});

test("can peek call", function () {
	addSimple();
	var peeked = queue.peek();
	equal(peeked.url, "Hello");
	equal(peeked.settings.data.name, "Lars");
	equal(peeked.extra.hello, "hi");
	equal(queue.count(), 1);
});

test("can pop call", function () {
	addSimple();
	var popped = queue.pop();
	equal(popped.url, "Hello");
	equal(popped.settings.data.name, "Lars");
	equal(queue.count(), 0);
});

test("peek empty returns null", function() {
	var peeked = queue.peek();
	ok(peeked == null);
	equal(queue.count(), 0);
});

test("pop empty returns null", function () {
	ok(queue.pop() == null);
	ok(queue.pop() == null);
	equal(queue.count(), 0);
});

test("push and pop two items keeps queue", function () {
	addSimple();
	addSimple();
	queue._queue[1].settings.data.name = "Erik";
	equal(queue.count(), 2);
	var popped1 = queue.pop();
	equal(queue.count(), 1);
	var popped2 = queue.pop();
	equal(queue.count(), 0);
	equal(popped1.settings.data.name, "Lars");
	equal(popped2.settings.data.name, "Erik");
});

asyncTest("add calls ajax, pops when done and calls callback", function () {
	$.mockjax({
		url: "Hello",
		responseTime: 10
	});
	addSimple();
	setTimeout(function () {
		ok(callbackArgs != null);
		equal(queue.count(), 0);
		start();
	}, 15);
});

asyncTest("add twice does calls consecutively", function () {
	$.mockjax({
		url: "Hello",
		responseTime: 10
	});
	addSimple();
	addSimple();
	setTimeout(function () {
		ok(callbackArgs != null);
		equal(queue.count(), 1, "one to go");
		callbackArgs = null;
		setTimeout(function () {
			ok(callbackArgs != null);
			equal(queue.count(), 0, "all done");
			callbackArgs = null;
			setTimeout(function() {
				ok(callbackArgs == null, "didn't call again");
				equal(queue.count(), 0, "still empty");
				start();
			}, 11);
		}, 11);
	}, 11);
});

asyncTest("sends extra data to callback if defined", function () {
	$.mockjax({
		url: "Hello",
		responseTime: 1
	});
	addSimple();
	setTimeout(function () {
		ok(callbackArgs.data.extra == undefined);
		equal(callbackArgs.extra.hello, "hi");
		start();
	}, 5);
});

asyncTest("ignores callback if not defined", function () {
	$.mockjax({ url: "Hello", responseTime: 1 });
	queue.add("Hello");
	equal(queue.count(), 1);
	setTimeout(function () {
		equal(queue.count(), 0);
		start();
	}, 5);
});