// this script's job is to subscribe to an event stream, and map it through the
// configured reports.

var os = require('os');
var EventSystem = require('manta-rabbit-node-lib');
var EventEmitter = require('events').EventEmitter;
var DeltaSender = require('./lib/DeltaSender');
var Manager = require('./lib/ReportMgr');
var util = require('util');
var Q = require('q');

var superagent = require('superagent');

var managerDefer = Q.defer();
var getManager = managerDefer.promise;

function BCDW (ReportMgr, environment, schemaMgr) {
	var self = this;
	EventEmitter.call(this);
	console.log("CONSTRUCTING BCDW IN ENVIRONMENT", environment);
	this.manager = ReportMgr;

	this.environment = environment;

	this.replayexchangename = 'cartographer-'+environment+'-replay';
	this.internalexchangename = 'cartographer-'+environment+'-internal';
	this.originexchangename = 'MantaEventPersist'
	this.originqueuename = 'queue-for-cartographer-'+environment+'-origin';
	this.internalqueuename = 'queue-for-cartographer-'+environment+'-internal';

	this.deltaEmitter = new EventSystem.Emitter(
		{ "exchange": this.internalexchangename
		, "routingKey": "something"
		, "rabbit": this.getRabbit()
		, "schemaMgr": schemaMgr
		} );
	ReportMgr.on('insert', function ( event ) {
		event.action = 'insert';
		console.log("FOUND INSERT FROM REPORTMGR", event);
		self.deltaEmitter.envelope(
			{ payload: event 
			, eventType: 'StorageDelta'
			, actor:
				{ id:os.hostname() + process.pid
				, type:'bcdw'
				}
			} ).emit();
	} );
	managerDefer.resolve(ReportMgr);

}
util.inherits(BCDW, EventEmitter);
module.exports = BCDW;


var bureaucratBase = 'http://localhost:3004/';
var domainConfig;
var configDefer = Q.defer();

BCDW.prototype.allDone = function () {
	if (this.rabbit) this.rabbit.allDone();
};

BCDW.prototype.getRabbit = function () {

	if (this.rabbit) return this.rabbit;
	this.rabbit = new EventSystem.Rabbit(
		{ connection: { url: "amqp://localhost:5672//" } 
		, exchanges:
			[ { name: 'cartographer-testing-replay'
				, type: 'topic'
				, passive: false
				, durable: false
				, autoDelete: true
				, auto_delete: true
				}
			, { name: this.internalexchangename
				, type: 'topic'
				, passive: false
				, durable: true
				, autoDelete: false
				, auto_delete: false
				}
			, { name: this.originexchangename
				, type: 'topic'
				, passive: false
				, durable: false
				, autoDelete: false
				, auto_delete: false
				}
			]
		, queues:
			[ { "name": this.internalqueuename
				, "bindings":
					[ { "routingKey": '#'
						, "exchange": this.internalexchangename
						}
					]
				, "passive": false
				, "durable": false
				, "exclusive": false
				, "autoDelete": true
				, "noDeclare": false
				, "arguments": { }
				, "closeChannelOnUnsubscribe": false
				, "subscribeOptions":
					{ "ack": false
					, "prefetchCount": 1
					}
				}
			, { "name": this.originqueuename
				, "bindings":
					[ { "routingKey": 'persist.#'
						, "exchange": this.originexchangename
						}
					, { "routingKey": 'reducer.'+this.environment+'.#'
						, "exchange": this.replayexchangename
						}
					]
				, "passive": false
				, "durable": false
				, "exclusive": false
				, "autoDelete": true
				, "noDeclare": false
				, "arguments": { }
				, "closeChannelOnUnsubscribe": false
				, "subscribeOptions":
					{ "ack": false
					, "prefetchCount": 1
					}
				}
			]
		} );
	return this.rabbit;
};

BCDW.prototype.listenForEvents = function () {
	var self = this;
	var rabbit = this.getRabbit();

	setTimeout(function(){self.emit("ready")},1000);
	rabbit.on( this.originqueuename, function (message, headers, deliveryInfo, queue) {
		if (typeof message.payload == 'string') {
			message.payload = JSON.parse(message.payload);
		}
		console.log("RECIEVED ORIGIN MESSAGE ON", queue.name, "TYPE", message.eventType);
		getManager.then( function (m) {
			console.log("GOT MANAGER NOW DOING MAP");
			m.map(message);
		} ).done();
	} );

	// REPORT DELTA SUBSCRIPTION SYSTEM
	// this call
	// this.emitter.emit(this.name, this.codeversion, this.domain, this.report, window, key, data);
	// activates this function
	rabbit.on( this.internalqueuename, function (message, headers, deliveryInfo, queue) {
		console.log("RECIEVED INTERNAL MESSAGE", message);
		var report = self.manager.eventDomain(message.payload.domain).report(message.payload.report);
		if (!report) return console.warn("report "+message.payload.report+" not loaded"); // no operation if we have no report
		var window = message.payload.window;
		var codeversion = message.payload.codeVersion;
		var key = deliveryInfo.routingKey;
		var data = message;
	
		report.doReduce(window, version, key);
	
	} );

	var seen = 0;
	rabbit.on( 'Rabbit_QueueReady', function (queue) {
		console.log("Queue ready - " + queue);
	} );

	rabbit.on( 'Rabbit_ExchangeReady', function (exchange) {
		console.log("Exchange ready - " + exchange);
	} );

};

