// this script's job is to subscribe to an event stream, and map it through the
// configured reports.

var os = require('os');
var EventSystem = require('manta-rabbit-node-lib');
var Manager = require('lib/reportMgr');

var reporters = new Manager(
		{ domains: ['testdomain']
		, reports:
			[ {name:'testreport', reportEngine:'base', storageEngine:'memory'} ]
		}
	);
var domain = master; // TODO: configuration for this daemon

var replayexchangename = 'reducer-+process.env('NODE_ENV')+'-replay';
var internalexchangename = 'reducer-+process.env('NODE_ENV')+'-internal';
var originexchangename = 'MantaEventPersist'
var originqueuename = 'queue-for-mapreducer-'+process.env('NODE_ENV')+'-origin';
var internalqueuename = 'queue-for-mapreducer-'+process.env('NODE_ENV')+'-internal';

var rabbit = new EventConnection.Rabbit(
		{ connection: { url: "amqp://localhost:5672//" } 
		, exchanges:
			[ { name: exchangename
				, type: 'direct'
				, passive: false
				, durable: false
				, autoDelete: true
				, auto_delete: true
				}
			, { name: internalexchangename
				, type: 'topic'
				, passive: false
				, durable: true
				, autoDelete: false
				, auto_delete: false
				}
			, { name: originexchangename
				, type: 'topic'
				, passive: false
				, durable: true
				, autoDelete: false
				, auto_delete: false
				}
			]
		, queues:
			[ { "name": internalqueuename
				, "bindings":
					[ { "routingKey": '#'
						, "exchange": internalexchangename
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
			, { "name": originqueuename
				, "bindings":
					[ { "routingKey": 'persist.#'
						, "exchange": originexchangename
						}
					, { "routingKey": 'reducer.'+process.env('NODE_ENV')+'.#'
						, "exchange": replayexchangename
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


rabbit.on( originqueuename, function (message, headers, deliveryInfo, queue) {
	for (var reporter in reporters) {
		reporters.map(message);
	}
} );

// this call
// this.emitter.emit(this.name, this.codeversion, this.domain, this.report, window, key, data);
// activates this function
rabbit.on( internalqueuename, function (message, headers, deliveryInfo, queue) {
	var domain = headers.domain;
	var report = headers.report;
	if (!reportermap[report]) return console.log("report "+headers.report+" not loaded"); // no operation if we have no report
	var window = headers.window;
	var codeversion = headers.codeVersion;
	var key = deliveryInfo.routingKey;
	var data = message;

	reportermap[report].doReduce(sorted);

} );

rabbit.on( 'Rabbit_QueueReady', function (queue) {
	console.log("Queue ready - " + queue);
} );

rabbit.on( 'Rabbit_ExchangeReady', function (exchange) {
	console.log("Exchange ready - " + exchange);
} );

