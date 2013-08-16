// template for a class that processes events and modifies a report
var reportBase = require('../reports/Base');
var util = require('util');

function ReportMetaReport (store) {
	if (!store) throw "store required";
	this.name = 'ReportMetaReport';
	ReportMetaReport.super_.call(this, store);
}
util.inherits(ReportMetaReport, reportBase);

/* EVENT LOOKS LIKE:
 * { domain: 'domainname'
 * , config: 
 *   { name : 'testreport'
 *   , reportEngine : 'Base'
 *   , storageEngine : 'memory' 
 *   }
 * };
 */
ReportMetaReport.prototype.match = function (event, cb) {
	cb(null, event.eventType == 'reportConfig');
}

ReportMetaReport.prototype.keyValueSet = function (event, cb) {
	cb(null, [[event.domain, event]]);
}

ReportMetaReport.prototype.compare = function (a, b) {
	if (a.domain > b.domain) return 1;
	if (a.domain < b.domain) return -1;
	if (a.report > b.report) return 1;
	if (a.report < b.report) return -1;
	return 0;
};

// retain one of each report name configuration
ReportMetaReport.prototype.reduce = function (key, list, cb) {
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

module.exports = ReportMetaReport;

