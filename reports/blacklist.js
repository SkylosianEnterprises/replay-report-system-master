
// template for a class that processes events and modifies a report

var MemoryStorage = require('../lib/MemoryStorage.js');
var ReportBase = require('../reports/Base');
var util = require('util');

function Blacklist (store) {
	this.engine = 'EmailBlacklist';
	this.name = 'EmailBlacklist';
	this.codeVersion = 1;
	Blacklist.super_.call(this, store);
}
util.inherits(Blacklist, ReportBase);

// in the most efficient way possible, 
Blacklist.prototype.match = function (event, cb) {
	cb(null, event.eventType == 'SubscriptionActivity' && event.sourceIdentity.type == 'email');
};

Blacklist.prototype.keyValueSet = function (event, cb) {
	console.log('blacklist key value set');
	cb( null, [
		[ event.sourceIdentity.id
		, { time: event.effectiveTimestamp || event.eventTimestamp
			, type: event.payload.subscription.list
			, action: event.payload.action
			}
		] ] );
};

Blacklist.prototype.compare = function (a, b) {
	if (a.type > b.type) return 1;
	if (a.type < b.type) return -1;
	if (a.time > b.time) return 1;
	return a.time < b.time ? -1 : 0;
};


// reduce the event list to a list of only the opted out lists
// input list looks something like:
// [ { time: 1111, type: 'inviter', action: 'delete' }
// , { time: 1112, type: 'inviter', action: 'add' }
// , { time: 1113, type: 'newsletter', action: 'add' }
// , { time: 1114, type: 'newsletter', action: 'delete' }
// , { time: 1115, type: 'marketing', action: 'delete' }
// , { time: 1116, type: 'marketing', action: 'add' }
// , { time: 1117, type: 'marketing', action: 'delete' }
// ]
// reduction looks like:
// [ { time: 1114, type: 'newsletter', action: 'delete' }
// , { time: 1117, type: 'marketing', action: 'delete' }
// ]
Blacklist.prototype.reduce = function (key, list, cb) {
	// make a lookup table
	var finalOfType = {};
	var outlist = [];
	list.sort(this.compare).forEach( function (l) {
		finalOfType[l.type] = l;
	} );
	for (var typeIndex in finalOfType) {
		if (finalOfType[typeIndex].action == 'delete') {
			outlist.push(finalOfType[typeIndex]);
		}
	}
console.log("SENDING BACK LIST", outlist);
	cb(null, outlist );
};

// returns a list encompassing all the email lists like this:
// [ { email: 'user@a.com', time: 1114, type: 'newsletter', action: 'optout' }
// , { email: 'user@b.com', time: 1117, type: 'marketing', action: 'optout' }
// ]
Blacklist.prototype.deliver = function (window, version, cb) {
	this.store.window(window).version(version).getAll( function (err, docs) {
		if (err) cb(err);
console.log("DOCS RETRIEVED", docs);
		var outdocs = [];
		for (var i in docs) {
			var ele = docs[i];
			ele.forEach(function(item) {
				item.email = ele.key;
				outdocs.push(item);
			} );
		}
		cb(null, outdocs);
	} );
};

module.exports = Blacklist;

