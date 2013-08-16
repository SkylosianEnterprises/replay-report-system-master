var base = require('../reports/Base');
var MemoryStorage = require('../lib/MemoryStorage.js');

var testingstore = new MemoryStorage('testdomain', 'testreport');
var report = new base(testingstore);

describe('the report base api', function () {
	it("matches", function (done) {
		report.match( {event:"something"}, function (err, yes) {if(err){throw err}; expect(yes).toBe(true); done() } )
	} );
	it("window", function (done) {
		report.window(5, function (err, window) {if(err){throw err}; expect(window).toBe('alltime');done(); } );
	} );
	it("compare", function () {
		expect(report.compare(5, 6)).toBe(0);
	} );
	it("reduce", function (done) {
		report.reduce('dog', [5,6,7,8,9,10], function (err, out) {if(err){throw err};
			expect(out).toEqual([5,6,7,8,9,10]);
			done(); 
		} );
	} );
	it("deliver", function (done) {
		// input data
		report.emit('alltime', 'a', {a:'b'}, function (err) {
			report.emit('alltime', 'b', {c:'d'}, function (err) {
				// get data and compare
				report.deliver('alltime', 0, function(err, report) { if(err){throw err};
					expect(report).toEqual([{key:'a', 'a':'b'},{key:'b', 'c':'d'}]);
					done();
				} );
			} );
		} );
	} );
	it("keyValueSet", function (done) {
		report.keyValueSet({dog:'woof'}, function(err, set) {
			if (err) throw(err);
			expect(set).toEqual([['-', {dog:'woof'}]]);
			done();
		} );
	} );
	it("map", function () {
		// if match passes then use keys to the the list of keys which will emit
		// the passed value
		spyOn(report, 'emit').andCallThrough();
		report.map({event:"something"})
		expect(report.emit).toHaveBeenCalledWith('alltime', '-', {'event':"something"})
	} );
	it("emit", function (done) {
		// (window, key, data, cb) {
		// add the data using key to the latest version of window
		report.emit('alltime', '-', {event:"something"}, function ( err ) {
			if (err) throw err;
			report.deliver('alltime', 0, function (err, report){
				if (err) throw err;
				expect(report).toContain({ event : 'something', key : '-' });
				done ();
			} );
		} );
	} );
	it("version", function (done) {
		// return the current version
		report.version(report.window(), function (err, v){if(err){throw err}; expect(v).toBe(0); done(); } );
	} );
	it("doReduce", function (done) {
		// reduce the current list of data to its canonical form
		// insert the data first
		report.emit('alltime', 'dog', {'event':"something"}, function (err) {
			if (err) throw err;
			report.emit('alltime', 'dog', {'event':"else"}, function (err) {
				if (err) throw err;
				report.doReduce('alltime', 'dog', function (err, report) {
					if (err) throw err;
					expect(report).toEqual([{ event : 'something' }, { event : 'else' }]);
					done();
				} );
			} );
		} );
	} );
	it("versions", function () {
		// for a particular window, list the available versions
		report.versions(report.window(), function(err, vs){
			if (err) throw(err);
			expect(vs).toEqual([0])
			});
	} );
	it("window via direct", function () {
		// translate an event into a window name
		expect(report.window()).toBe('alltime');
	} );
	it("window via callback", function (done) {
		report.window(null, function(err, w){if(err){throw err};expect(w).toBe('alltime');done();});
	} );
	it("windows", function (done) {
		report.windows(function(err, ws){if(err){throw err};expect(ws).toEqual(['alltime']); done();});
	} );
	it("latest", function (done) {
		// the most recent version of the report for the specified window
		report.latest(report.window(), function (err, v){if(err){throw err}; expect(v).toBe(0); done();});
	} );
	it("propfind", function () {
		// retrieve a particular key of the report
		report.propfind('alltime', 0, '-', function (err, list) { expect(list).toEqual([{ event : 'something', key : '-' }, { event : 'something', key : '-' }]); } );
	} );
	it("freeze", function (done) {
		// make a checkpoint of the reports
		report.latest(report.window(), function(err, oldversion) {if(err){throw err};
			report.freeze(report.window(), function(err) {
				if(err) throw err;
				report.latest(report.window(), function (err, newversion){
					if(err) throw err; 
					expect(newversion).toBe(oldversion); 
					done();
				} ); // no change because default imp
			} );
		} );
	} );
	it("collection", function (done) {
		report.latest(report.window(), function(err, version) {
			if(err) throw err;
			expect(report.collection).toBe('report/testdomain/testreport'); 
			done();
		} );
		// no change because default implimentation
	} );
} );
