// template for a class that processes events and modifies a report
var async = require('async');

function ReportProcessor (store) {
	if (!store) throw "store required";
	this.store = store;
	store.setComparator(this.compare);
	this.engine = 'DefaultReportProcessor';
	this.eventDomain = store.eventDomain;
	if (!this.eventDomain) console.warn("store is ", store);
	if (!this.eventDomain) throw "eventDomain property required on storage object";
	this.report = store.report
	if (!this.report) throw "report property required on storage object";
	this.collection = this.getCollection();
}

// CATEGORY - inherent - windows list, collection name

// implimentation - retrieve the list of seen report windows
ReportProcessor.prototype.windows = function (cb) {
	console.warn("default windows - just alltime");
	cb(null, ['alltime'] );
};

// implimentation - name the collection in which our data is stored
ReportProcessor.prototype.getCollection = function () {
	console.warn("default collection - concatenate");
	return ['report', this.eventDomain, this.report].join('/');
};

// CATEGORY - derivable from event
// match (determine if this event is relevant to our reports)
// keyValueSet (extract key/value tuples to emit from an event)
// forEachKeyValue (helper for processing a set)
// map (process an event completely)
// window (what window is the event in)

// abstract for simple boolean match
ReportProcessor.prototype.match = function (event, cb) {
	console.warn("default match - always matches");
	cb(null, true);
};

// abstract for key generation from an event.  Will be called once with an
// event, may call callback multiple times or none at all!
ReportProcessor.prototype.keyValueSet = function (event, cb) {
	console.log("default keyValueSet - key '-' value orig event", this);
	cb(null, [['-', event]]);
}

ReportProcessor.prototype.forEachKeyValue = function (event, cb) {
	var self = this;
	this.keyValueSet(event, function(err, set) {
		if (err) return cb(err);
		console.log("GOT KEYVALUESET OF", set);
		set.forEach( function (l) { cb.apply(self,l); } ); } );
};

// implimentation of using match keys and item to do a map.  Can be overridden!
ReportProcessor.prototype.map = function (event) {
	var self = this;
	console.warn("default map - adds each value to list under the key");
	var window = self.window(event);
	this.match(event, function (err, doEmit) {
		if(err) throw err;
		if (doEmit)
			self.forEachKeyValue(event, function (key, value) {
				self.emit(window, key, value);
			} );
	} );
};

// abstract - given an event, how do you determine what the window is?
// this month?  This week?  this hour?
ReportProcessor.prototype.window = function (event, cb) {
	console.warn("default window choice - just alltime");
	if (cb) return cb(null, 'alltime');
	return 'alltime';
};

// CATEGORY - DATA ELEMENTS
// compare - a sort routine that compares entries of the data type for this report
// reduce - take a key and list and reduce it if possible

// abstract - compare two items to sort them so that they are adjacent in the
// list when being reduced
ReportProcessor.prototype.compare = function (a, b) {
	console.warn("default compare - assumes they are the same");
	return 0;
};

// abstract - how do we make this list smaller, if we can?
ReportProcessor.prototype.reduce = function (key, list, cb) {
	console.warn("default reduce - no change");
	if (cb) return cb(null, list);
	return list;
};

// CATEGORY - requires window context
// version (what is the current active version within this window)
// freeze (action - if its versioned, increment the version number)
// versions (what are the available versions in this window?)
// latest (what is the active version in this window?)

// implimentation of get the current version of the report
// report versions only increment when there is a freeze.
// TODO: This needs some kind of metadata tracking per domain-report-window
ReportProcessor.prototype.version = function (window, cb) {
	return cb(null, 0);
};

// implimentation - freeze the current report by incrementing the version
ReportProcessor.prototype.freeze = function (window, cb) {
	console.warn("default freeze - no action");
	cb( );
};

// implimentation - retrieve the list of available report versions
ReportProcessor.prototype.versions = function (window, cb) {
	console.warn("default versions - just 0");
	cb(null, [0]);
};

// implimentation - indicate the current version of the report
// this number increments when there is a freeze
ReportProcessor.prototype.latest = function (window, cb) {
	console.warn("default latest - 0");
	cb(null,  0 );
};

// CATEGORY - mutation operations, act on the latest version within a window
// doReduce - fetch the keys, fetch each list, reduce them.
//
// implimentation of the operation of doing a reduce
/*ReportProcessor.prototype.doReduce = function (window, version, cb) {
	var self = this;
	// TODO: may want to spread this over workers?  Maybe emit 'reduce this key' events?
	self.store.window(window).version(version).keys( function (err, keys ) {
		if (err) throw err;
		async.map(keys, function(key, mapcb) {
			self.doReduceKey(window, version, key, mapcb);
		}, cb);
	} );
};
*/
ReportProcessor.prototype.doReduce = function (window, version, key, cb) {
	var self = this;
	// retrieve the list (TODO: can this work with a portion of the list?)
	self.store.window(window).version(version).list(key).raw(function(err, data) {
		if (err) return cb(err);
		// reduce the sorted list to its smallest form
		self.reduce(key, data, function (err, reduced) {
			if (err) return cb(err);
			// store that back in the storage
			self.store.window(window).version(version).list(key).set(reduced, cb);
		} );
	} );
};

// implimentation of local emit - push the entry onto the list of events.
// TODO: should we make this more asynchronous by dispatching it as a rabbit event?
// TODO: should the sorting be happening here?
ReportProcessor.prototype.emit = function (window, key, data, cb) {
	var self = this;
	console.warn("default emit - insert entry with key ",key);
	this.latest( window, function (err, version) {
		if (err) return cb(err);
		console.log("DOING INSERT OF", data);
		self.store.window(window).version(version).list(key).insert(data, cb);
	} );
};

// abstract - do what is necessary to deliver the indicated window/version to
// report to the requester
// default implimentation is all entries from all keys within the collection
// which is a particular window/version each augmented with '"key' set to the
// _id of the record
// TODO: *** is deliver what freeze uses to save the state? ***
ReportProcessor.prototype.deliver = function (window, version, cb) {
	var self = this;
	console.warn("default deliver - call the relevant formatter with an array of all the lists");
	this.store.window(window).version(version).getAll( function (err, docs) {
		if (err) return cb(err);
		self.format(docs, cb);
	} );
};
// so you don't have to wrory about window and version retrieves.
ReportProcessor.prototype.format = function (docs, cb) {
	console.warn("default format - augment items with key and return flat list")
	var outdocs = [];
	docs.forEach( function (ele) {
		ele.forEach( function (item) {
			item.key = ele.key;
			outdocs.push(item);
		} );
	} );
	cb(null, outdocs);
};

// implimentation - retrieve a record for a particular key
ReportProcessor.prototype.propfind = function (window, version, key, cb) {
	console.warn("default propfind - return the list for the key");
	this.store.window(window).version(version).list(key).raw(cb);
};

module.exports = ReportProcessor;

