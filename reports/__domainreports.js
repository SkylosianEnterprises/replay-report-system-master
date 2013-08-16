// template for a class that processes events and modifies a report
var reportBase = require('../reports/Base');
var util = require('util');

function DomainMetaReport (store) {
	if (!store) throw "store required";
	this.name = 'DomainMetaReport';
	DomainMetaReport.super_.call(this, store);
}
util.inherits(DomainMetaReport, reportBase);

/* EVENT LOOKS LIKE:
 * { eventType: 'reportConfig'
 * , domain: 'domainname'
 * , config: 
 *   { name : 'testreport'
 *   , reportEngine : 'Base'
 *   , storageEngine : 'memory' 
 *   }
 * };
 */
DomainMetaReport.prototype.match = function (event, cb) {
	cb(null, event.eventType == 'reportConfig');
}

DomainMetaReport.prototype.keyValueSet = function (event, cb) {
	cb(null, [[event.domain, event]]);
}

DomainMetaReport.prototype.compare = function (a, b) {
	if (a.report > b.report) return 1;
	if (a.report < b.report) return -1;
	return 0;
};

// retain one of each report name configuration
DomainMetaReport.prototype.reduce = function (key, list, cb) {
	var index = -1;
	var out = [];
	var current = '';
	list.forEach( function (item) {
		if (item.report != current) index = index + 1;
		current = item.report;
		out[index] = item;
	} );
	if (cb) return cb(null, out); 
	return out;
};

DomainMetaReport.prototype.format = function (docs, cb) {
	console.log("DOCS GOTTEN IN FORMAT IS ", JSON.stringify(docs));
	var domains = [];
	var reports = [];
	docs.forEach(function (e) { e.forEach(function(f) { 
	console.log("OBJECT GOTTEN IN FORMATTER OUTPUT:", f)
		domains.push(f.domain);
		reports.push(f.config);
	} ) } );
	console.log("DOMAINS", domains);
	console.log("REPORTS", reports);
	cb(null, { domains: domains, reports: reports });
}

module.exports = DomainMetaReport;

