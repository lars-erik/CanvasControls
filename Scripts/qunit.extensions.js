function throwsError(delegate, message) {
	try {
		delegate();
		ok(false, message);
	}
	catch(e) {
		ok(true, e.message + " was thrown");
	}
}
