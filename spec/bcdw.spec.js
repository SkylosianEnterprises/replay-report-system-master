
var EventConnection = require('rabbit-node-lib');

var BCDW = require('../bcdw.js');

var ReportMgr = require('../lib/ReportMgr');

var schemaMgr = new EventConnection.SchemaMgr(
	{ "schemaSchema": "/home/skylos/rabbitmq-lib/schemata/JsonSchema.schema"
	, "schemaDirectories": [ "/home/skylos/rabbitmq-lib/schemata" ]
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

describe("map happens appropriately", function () {
	it("puts it in the report when you emit it", function (done) {
			;
		var senddelete = function () {
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
		};
		var sendadd = function () {
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
		};
		bcdw.on('ready', senddelete);
		bcdw.on('ready', sendadd); 
		setTimeout(function () {
			report.deliver('alltime', 0, function (err, docs) {
				if (err) throw err;
				console.log("RETURNED REPORT", docs);
				expect(docs.length).toBe(2);
				done();
			} );
		}, 2000 );
	} );
} );

