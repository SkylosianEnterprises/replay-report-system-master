// --------LIST----------
var EventEmitter = require('events').EventEmitter;
var util = require('util');
function List(key, data, sortfunc) {
	EventEmitter.call(this);
	this.key = key;
	this.__data = data || [];
	this.length = this.__data.length;
	this.sortfunc = sortfunc;
	this.start = 0;
}
util.inherits(List, EventEmitter);

//MUTATIONS
List.prototype.insert = function (value, cb) {
console.log("INSERTING ", value);
	if (this.sortfunc && this.__data.length > 0) {
		var point = 0;
		var lastcheck;
		// TODO: Replace this with a binary search
		while ((lastcheck = this.sortfunc(value, this.__data[point])) < 0) {
			point = point + 1;
		}
		if (point == 0 && lastcheck > 0) {
			this.__data.unshift(value);
		} else if (point == this.__data.length) {
			this.__data.push(value);
		} else if (lastcheck > 0) {
			this.__data = [].concat(this.__data.slice(0, point), [value], this.__data.slice(point));
		} else {
			this.__data = [].concat(this.__data.slice(0, point+1), [value], this.__data.slice(point+1));
		}
	} else {
		this.__data.push(value);
	}
	this.length = this.__data.length;
	console.log("LIST EMITTING INSERT", this.key);
	this.emit('insert', this.key);
	if (cb) return cb();
};
List.prototype.set = function (newlist, cb) {
	this.__data = newlist;
	this.length = this.__data.length;
	this.emit('set', this.key);
	if (cb) return cb(null, this.__data);
};

// CONVENIENCE
List.prototype.map = function (mapfunc) {
	return this.__data.map(mapfunc);
};
List.prototype.forEach = function (cb) {
	this.__data.forEach(cb);
};
List.prototype.filter = function (evaluator, cb) {
	cb(this.__data.filter(evaluator));
};
List.prototype.concat = function (value, cb) {
	value.forEach(function(item) {
		this.insert(item);
	} );
	this.length = this.__data.length;
	if (cb) return cb();
};
List.prototype.clear = function (cb) {
	this.__data = [];
	this.length = this.__data.length;
	if (cb) return cb();
};
List.prototype.sort = function (comparator) {
	return this.__data.sort(comparator);
};
List.prototype.raw = function (cb) {
	cb(null, this.__data );
};
List.prototype.skip = function (skip) {
	var l = new ListWithSkip(this, skip);
	util.extend(l, this);
	return l;
}
List.prototype.list = function (num, cb) {
	console.log("GETTING LIST OF", this.__data, "FROM", start, "FOR", num);
	cb(null, this.__data.slice(start, num));
}

function ListWithSkip (list, skip) {
	List.call(this);
	this.start = skip || 0;
}

module.exports = List;

