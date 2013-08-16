var EventConnection = require('manta-rabbit-node-lib');

var BCDW = require('../bcdw.js');

var ReportMgr = require('../lib/ReportMgr');

var schemaMgr = new EventConnection.SchemaMgr(
	{ "schemaSchema": "/home/dihnen/rabbitmq-lib/schemata/JsonSchema.schema"
	, "schemaDirectories": [ "/home/dihnen/rabbitmq-lib/schemata" ]
	} );

var bcdw = new BCDW
	( new ReportMgr(
		{ domains: ['testdomain']
		, reports: [ {name:'blacklist', reportEngine:'blacklist', storageEngine:'memory' } ]
		} )
	, 'testing'
	, schemaMgr
	);

bcdw.listenForEvents();

var intsender = new EventConnection.Emitter(
	{ "exchange": 'cartographer-testing-replay'
	, "routingKey": "reducer.testing.something"
	, "rabbit": bcdw.getRabbit()
	, "schemaMgr": schemaMgr
	} );

var report = bcdw.manager.eventDomain('testdomain').report('blacklist');

if (!report) throw "NO REPORT";
/*
describe("map happens appropriately", function () {
	it("puts it in the report when you emit it", function (done) {
			;
		bcdw.on('ready', function () {
			intsender.envelope(
				{ payload: 
					{ subscriptionType: 'blacklist'
					, action: 'delete'
					, subscription: { list:'testemailtype' }
					}
				, eventType: 'SubscriptionActivity'
				, actor:
					{ id:'sl02830320as'
					, type:'guest'
					}
				, sourceIdentity:
					{ id:'test@manta.com'
					, type:'email'
					}
				} ).emit();
		} );
		bcdw.on('ready', function () {
			intsender.envelope(
				{ payload: 
					{ subscriptionType: 'blacklist'
					, action: 'add'
					, subscription: { list:'testemailtype' }
					}
				, eventType: 'SubscriptionActivity'
				, actor:
					{ id:'sl02830320as'
					, type:'guest'
					}
				, sourceIdentity:
					{ id:'test@manta.com'
					, type:'email'
					}
				} ).emit();
		}, 850 );
		setTimeout(function () {
			report.deliver('alltime', 0, function (err, docs) {
				if (err) throw err;
				console.log("RETURNED REPORT", docs);
				expect(1).toBe(1);
				done();
			} );
		}, 1000 );
	} );
} );
*/

var request = require('supertest');
console.log('blacklist');

var app = require('../app.js');

describe("health", function () {
	it("is success to check health", function (done) {
		request(app)
			.get('/health-check')
			.expect(200)
			.end(function (err, res) {
				expect(res.body).toEqual({ ok: 1 });
				done();
			} );
	} );

} );


describe("Blacklists work this way", function () {

	it("is success to add an email", function (done) {
		var now = new Date().getTime();
		bcdw.once('ready', function () {
			console.log("EMITTING BLACKLIST EVENT IN ONE SECOND...");
				console.log("EMITTING BLACKLIST EVENT NOW!");
			var send = function () {
				intsender.envelope(
					{ payload: 
						{ subscriptionType: 'blacklist'
						, action: 'delete'
						, subscription: { list:'testemailtype' }
						}
					, eventType: 'SubscriptionActivity'
					, actor:
						{ id:'sl02830320as'
						, type:'guest'
						}
					, sourceIdentity:
						{ id:'singleblack@manta.com'
						, type:'email'
						}
					, effectiveTimestamp: now
					} ).emit();
			};
			setTimeout(send, 100);
			setTimeout(send, 200);
			setTimeout(send, 300);
			setTimeout(send, 400);
			setTimeout(send, 500);
			setTimeout(function() {
				report.deliver('alltime', 0, function (err, docs) {
					if (err) throw err;
					if (docs) found = docs;
				expect(docs).toContain( [
					{ time: now
					, type: 'testemailtype'
					, action: 'delete'
					, email: 'singleblack@manta.com' 
					} ] );
				done();
				} );
			}, 4000 );
		} );
	} );

	it("is success to re-add an email", function (done) {
		var now = new Date().getTime();
		bcdw.once('ready', function () {
			console.log("EMITTING BLACKLIST EVENT");
			var send = function () {
				intsender.envelope(
					{ payload: 
						{ subscriptionType: 'blacklist'
						, action: 'delete'
						, subscription: { list:'testemailtype' }
						}
					, eventType: 'SubscriptionActivity'
					, actor:
						{ id:'sl02830320as'
						, type:'guest'
						}
					, sourceIdentity:
						{ id:'dualblack@manta.com'
						, type:'email'
						}
					, effectiveTimestamp: now
					} ).emit();
			};
			setTimeout(send, 1000 );
			setTimeout(send, 1100 );
			setTimeout(send, 1200 );
			setTimeout(send, 1300 );
			setTimeout(send, 1400 );
			setTimeout(send, 1500 );
			setTimeout(function() {
				console.log("EXECUTINIG REQUIEST FOR PROPFIND", (['/report','testdomain','blacklist','alltime','0', encodeURIComponent('dualblack@manta.com')].join('/')));
				request(app)
					.propfind(['/report','testdomain','blacklist','alltime','0', encodeURIComponent('dualblack@manta.com')].join('/'))
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function (err, res) {
console.log("RETURNED REPORT", res.body);
						expect(err).toBeNull();
						expect(function(){
							expect(res.body).toEqual(
								[ { time: now
								, type: 'testemailtype'
								, action: 'delete'
								} ] );
								done();
						} ).not.toThrow();
					} );
			},4000 );
		} );
	} );

	/*
	it("is ok when on list", function (done) {
		request(app)
			.get(['/blacklist', encodeURIComponent('user@testy.net')].join('/'))
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.end( function (err, res) {
				expect(err).toBeNull();
				expect(function(){
					expect(res.body).toBe(
						{"email":"user@testy.net"
						,"sendOk":false
						}
					);
					done();
				} ).not.toThrow();
			} );
	} );

	it("is success remove from list", function (done) {
		request(app)
			.del(['/blacklist', encodeURIComponent('user@testy.net')].join('/'))
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.end( function (err, res) {
				expect(err).toBeNull();
				expect(function(){
					expect(res.body).toBe(
						{"email":"user@testy.net"
						,"sendOk":true
						}
					);
					done();
				} ).not.toThrow();
			} );
	} );

	it("is success re-remove from list", function (done) {
		request(app)
			.del(['/blacklist', encodeURIComponent('user@testy.net')].join('/'))
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.end( function (err, res) {
				expect(err).toBeNull();
				expect(function(){
					expect(res.body).toBe(
						{"email":"user@testy.net"
						,"sendOk":true
						}
					);
					done();
				} ).not.toThrow();
			} );
	} );

*/
} );
