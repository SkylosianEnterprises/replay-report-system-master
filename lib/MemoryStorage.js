var EventEmitter = require('events').EventEmitter;
var List = require('../lib/List');
var util = require('util');

// =======MODEL========
// -------STORE--------
function store(eventDomain, report) {
	EventEmitter.call(this);
	this.eventDomain = eventDomain;
	this.report = report;
	this.windowmap = {};
	console.log("NEW MEMORY STORAGE", this);
};
util.inherits(store, EventEmitter);
store.prototype.setComparator = function (comparator) {
	this.comparator = comparator;
};
store.prototype.window = function (window) {
	var self = this;
	if (window in this.windowmap) return this.windowmap[window];
	this.windowmap[window] = new storewindow(this.eventDomain, this.report, window, this.comparator);
	this.windowmap[window].on('insert', function ( event ) { 
		console.log("FOUND INSERT FROM WINDOW"); } );
	this.windowmap[window].on('insert', function ( event ) { self.emit('insert', event); } );
	return this.windowmap[window];
};
// -------WINDOW-------
function storewindow(eventDomain, report, window, comparator) {
	EventEmitter.call(this);
	this.eventDomain = eventDomain;
	this.report = report;
	this.comparator = comparator;
	this.window = window;
	if (!window) console.trace( "Falsey is not a valid window");
	this.versionmap = {};
};
util.inherits(storewindow, EventEmitter);
storewindow.prototype.version = function (version) {
	var self = this;
	if (version in this.versionmap) return this.versionmap[version];
	this.versionmap[version] = new storeversion(this.eventDomain, this.report, this.window, version, this.comparator);
	this.versionmap[version].on('insert', function ( event ) { 
		console.log("FOUND INSERT FROM VERSION"); } );
	this.versionmap[version].on('insert', function ( event ) { self.emit('insert', event); } );
	return this.versionmap[version];
};
// -------VERSION-------
function storeversion(eventDomain, report, window, version, comparator) {
	EventEmitter.call(this);
	this.eventDomain = eventDomain;
	this.report = report;
	this.window = window;
	this.version = version;
	this.comparator = comparator;
	this.lists = {};
	console.log("NEW STOREVERSION", this);
};
storeversion.prototype.query = function () {
	console.warn("query", this);
};
util.inherits(storeversion, EventEmitter);
storeversion.prototype.list = function (key) {
	var self = this;
	if (key in this.lists) return this.lists[key];
	if (!this.comparator) throw "Cannot create new list without comparator";
	this.lists[key] = new List(key, [], this.comparator);
	this.lists[key].on('insert', function ( event ) {
		console.log("FOUND INSERT FROM LIST"); } );
	this.lists[key].on('insert', function (key) {
		self.emit('insert', 
			{ domain: self.eventDomain
			, report: self.report
			, window: self.window
			, version: self.version
			, key: key
			} );
	} );
	return this.lists[key];
};
storeversion.prototype.getAll = function (cb) {
	var self = this;
	cb( null, Object.keys(this.lists).map( function (key) { return self.list(key) } ) );
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
storeversion.prototype.keys = function (cb) {
	var out = new List;
	for (var key in this.lists) {
		out.push(key);
	}
	cb(null, out);
};

module.exports = store;
