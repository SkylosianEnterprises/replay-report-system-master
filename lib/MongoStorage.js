
// =======MODEL========
// -------STORE--------
function store(domain, report) {
	this.domain = domain;
	this.report = report;
	this.windowmap = {};
	console.log("NEW MEMORY STORAGE", this);
};
store.prototype.window = function (window) {
	if (window in this.windowmap) return this.windowmap[window];
	this.windowmap[window] = new storewindow(this.domain, this.report, window);
	return this.windowmap[window];
};
// -------WINDOW-------
function storewindow(domain, report, window) {
	this.domain = domain;
	this.report = report;
	this.window = window;
	this.versionmap = {};
};
storewindow.prototype.version = function (version) {
	if (version in this.versionmap) return this.versionmap[version];
	this.versionmap[version] = new storeversion(this.domain, this.report, this.window, version);
	return this.versionmap[version];
};
// -------VERSION-------
function storeversion(domain, report, window, version) {
	this.domain = domain;
	this.report = report;
	this.window = window;
	this.version = version;
	this.lists = {};
};
storeversion.prototype.query = function () {
	console.warn("query", this);
};
storeversion.prototype.list = function (key) {
	if (key in this.lists) return this.lists[key];
	this.lists[key] = new list(key, []);
	return this.lists[key];
};
storeversion.prototype.getAll = function (cb) {
	var out = [];
	for (var key in this.lists) {
		out.push(this.lists[key]);
	}
	cb(null, out);
};
storeversion.prototype.concat = function (key, arry, cb) {
	console.warn("list concat", this);
	this.list(key, function (err, list) {
		if (err) return cb(err);
		list.concat(arry, cb);
	} );
};
storeversion.prototype.set = function (key, arry, cb) {
	this.list(key, function (err, list) {
		if (err) return cb(err);
		list.set(arry, cb);
	} );
};
// --------LIST----------
function list(key, data) {
	this.key = key;
	this.__data = data || [];
	this.length = this.__data.length;
}
list.prototype.push = function (value, cb) {
	this.__data.push(value);
	this.length = this.__data.length;
	if (cb) return cb();
};
list.prototype.forEach = function (cb) {
	this.__data.forEach(cb);
};
list.prototype.concat = function (value, cb) {
	this.__data.concat(value);
	this.length = this.__data.length;
	if (cb) return cb();
};
list.prototype.clear = function (cb) {
	this.__data = [];
	this.length = this.__data.length;
	if (cb) return cb();
};
list.prototype.set = function (newlist, cb) {
	this.__data = newlist;
	this.length = this.__data.length;
	if (cb) return cb(null, this.__data);
};
list.prototype.sort = function (comparator) {
	return this.__data.sort(comparator);
};
list.prototype.raw = function (cb) {
	cb(null, this.__data );
};

module.exports = store;

