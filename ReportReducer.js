// this script's job is to subscribe to an event stream, and map it through the
// configured reports.

var os = require('os');
var EventSystem = require('rabbit-node-lib');

function Reducer( options ) {
  this.reporters = options.reportMgr;
  this.rabbit = options.rabbit;
  this.environment = options.environment;
	console.log("CONSTRUCTING REDUCER IN ENVIRONMENT", this.environment);

  this.replayexchangename = 'reducer-'+this.environment+'-replay';
  this.internalexchangename = 'reducer-'+this.environment+'-internal';
  this.originexchangename = 'MantaEventPersist'
  this.originqueuename = 'queue-for-mapreducer-'+this.environment+'-origin';
  this.internalqueuename = 'queue-for-mapreducer-'+this.environment+'-internal';

  this.receiver = this.getReceiver();
}
module.exports = Reducer;

Reducer.prototype.listenForEvents = function () {
  this.getReceiver().on( 'StorageDelta', function () {
    console.log("FOUND A STORAGE DELTA");
  } );

  this.getRabbit().beReady.then( function (rabbit) {
/*

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
*/
    
    rabbit.on( 'Rabbit_QueueReady', function (queue) {
	    console.log("REDUCER Queue ready - " + queue);
    } );
    
    rabbit.on( 'Rabbit_ExchangeReady', function (exchange) {
	    console.log("REDUCER Exchange ready - " + exchange);
    } );
  } );

// this call
// this.emitter.emit(this.name, this.codeversion, this.domain, this.report, window, key, data);
}

Reducer.prototype.getRabbit = function () {
	if (this.rabbit) return this.rabbit;
	return this.rabbit = new EventSystem.Rabbit(
		{ connection: { url: "amqp://localhost:5672//" } }
  );
};


Reducer.prototype.getSchemaMgr = function () {
	if (this.schemaMgr) return this.schemaMgr;
  return this.schemaMgr = new EventSystem.SchemaMgr(
	  { "schemaSchema": "/home/david/rabbitmq-lib/schemata/JsonSchema.schema"
	  , "schemaDirectories": [ "/home/david/rabbitmq-lib/schemata" ]
	  } );
};

Reducer.prototype.getReceiver = function () {
  if (this.reciever) return this.reciever;
  return this.reciever = new EventSystem.Receiver(
		{ rabbit: this.getRabbit()
		, schemaMgr: this.getSchemaMgr()
		, exchanges:
			[ { name: this.replayexchangename
				, type: 'direct'
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
};

