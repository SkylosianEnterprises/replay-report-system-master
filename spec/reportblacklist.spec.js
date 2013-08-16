var Blacklist = require('../reports/blacklist');
var MemoryStorage = require('../lib/MemoryStorage.js');
var async = require('async');

var testingstore = new MemoryStorage('testdomain', 'testreport');
var report = new Blacklist(testingstore);

describe('the Blacklist api', function () {
	it("matches", function (done) {
		async.parallel([ function (parcb) {
		report.match
			( { eventType:"NotSubscriptionActivity", sourceIdentity: { type: 'email' } }
			, function (err, yes) {
					if(err) throw err; 
					expect(yes).toBe(false); 
					parcb();
				} 
			);
		}, function (parcb) {
		report.match
			( { eventType:"SubscriptionActivity", sourceIdentity: { type: 'notemail' } }
			, function (err, yes) {
					if(err) throw err; 
					expect(yes).toBe(false); 
					parcb();
				} 
			);
		}, function (parcb) {
		report.match
			( { eventType:"SubscriptionActivity", sourceIdentity: { type: 'email' } }
			, function (err, yes) {
					if(err) throw err; 
					expect(yes).toBe(true); 
					parcb();
				} 
			);
		}], done);
	} );
	it("window", function (done) {
		report.window(null, function (err, window) {if(err){throw err}; expect(window).toBe('alltime');done(); } );
	} );
	it("compare", function () {
		expect(report.compare
			( { type: 'a', time: 2 }
			, { type: 'b', time: 1 }
			) ).toBe(-1);
		expect(report.compare
			( { type: 'b', time: 2 }
			, { type: 'a', time: 1 }
			) ).toBe(1);
		expect(report.compare
			( { type: 'a', time: 2 }
			, { type: 'a', time: 1 }
			) ).toBe(1);
		expect(report.compare
			( { type: 'a', time: 1 }
			, { type: 'a', time: 2 }
			) ).toBe(-1);
		expect(report.compare
			( { type: 'a', time: 1 }
			, { type: 'a', time: 1 }
			) ).toBe(0);
	} );

	it("keyValueSet", function (done) {
		report.keyValueSet
			( { eventType: 'SubscriptionActivity'
				, payload:
					{ subscriptionType: "blacklist"
					, action:'delete'
					, subscription: { list: "business_inviter" }
					}
				, sourceIdentity: { type: 'email', id: 'dog@cat.com' }
				, eventTimestamp: 169
				}
			, function(err, set) {
					if (err) throw(err);
					expect(set).toEqual([['dog@cat.com', {time: 169, type: 'business_inviter', action: 'delete'}]]);
					done();
				}
			);
	} );
	it("reduce", function (done) {
		report.reduce('dog@cat.com', 
			[ { time: 1111, type: 'inviter', action: 'delete' }
			, { time: 1112, type: 'inviter', action: 'add' }
			, { time: 1113, type: 'newsletter', action: 'add' }
			, { time: 1114, type: 'newsletter', action: 'delete' }
			, { time: 1115, type: 'marketing', action: 'delete' }
			, { time: 1116, type: 'marketing', action: 'add' }
			, { time: 1117, type: 'marketing', action: 'delete' }
			, { time: 1118, type: 'stamp', action: 'add' }
			, { time: 1119, type: 'stamp', action: 'delete' }
			, { time: 1120, type: 'stamp', action: 'add' }
			]
		, function (err, out) {
				if(err) throw err;
				expect(out).toContain( { time: 1114, type: 'newsletter', action: 'delete' } );
				expect(out).toContain( { time: 1117, type: 'marketing', action: 'delete' } );
				expect(out.length).toBe(2);
				done(); 
			} );
	} );
	it("deliver", function (done) {
		// input data
		report.map(
			{ eventType: 'SubscriptionActivity'
			, payload:
				{ subscriptionType: "blacklist"
				, action:'delete'
				, subscription: { list: "business_inviter" }
				}
			, sourceIdentity: { type: 'email', id: 'dog@cat.com' }
			, eventTimestamp: 169
			} );
		report.map(
			{ eventType: 'SubscriptionActivity'
			, payload:
				{ subscriptionType: "blacklist"
				, action:'delete'
				, subscription: { list: "business_inviter" }
				}
			, sourceIdentity: { type: 'email', id: 'kitty@cat.com' }
			, eventTimestamp: 169
			} );
		// get data and compare
		report.deliver('alltime', 0, function(err, report) { 
			if (err) throw err;
			expect(report).toContain({email:'kitty@cat.com', time:169, type:'business_inviter', action:'delete' });
			expect(report).toContain({email:'dog@cat.com', time:169, type:'business_inviter', action:'delete' });
			expect(report.length).toBe(2);
			done();
		} );
	} );
} );
