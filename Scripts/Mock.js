var Mock = Class.extend({
	logged: [],
	calls: [],
	logCalls: 0,
	reset: function () {
		this.logCalls = 0;
		this.logged = [];
		this.calls = [];
	},
	log: function (name, args) {
		this.logCalls++;
		if (this.shouldLog(name))
			this.calls.push({ name: name, args: this.getCallInfo(args) });
	},
	shouldLog: function (name) {
		return this.logged.indexOf(name) > -1;
	},
	getCallInfo: function (args) {
		var calleeStr = args.callee.toString();
		var paramStr = calleeStr.substring(calleeStr.indexOf("(") + 1, calleeStr.indexOf(")"));
		var params = paramStr.split(",");
		var obj = {};
		for (var i = 0; i < params.length; i++) {
			obj[params[i].trim()] = args[i];
		}
		return obj;
	}
});
