var EventEmitter = require('events').EventEmitter;
var util = require('util');
var List = require('../lib/List');
var storageEngines = {};
storageEngines.memory = require('../lib/MemoryStorage');
storageEngines.mongo = require('../lib/MongoStorage');
storageEngines.files = require('../lib/FileStorage');

//console.warn("STORAGEENGINES:", storageEngines);
/*
 * { domains: [ 'testdomain' ]
 * , reports: [ { name: 'blacklist', storageEngine: 'memory' } ]
 * }
 * 
 *
 */
var domainholder = {};

function Manager (config) {
	EventEmitter.call(this);
	var self = this;
	// our meta report definition - we use ourself to report on ourself!
	var metadomain = 'meta';
	var metaconfig = {name:'domains', reportEngine:'__domainreports', storageEngine:'memory' };
	var event = {eventType: 'reportConfig', domain: metadomain, config: metaconfig};
	self.eventDomain('meta', new ManagedDomain('meta', [metaconfig])).map(event);
	config.domains.forEach( function (domain) {
		if (domain in domainholder) return;
		self.eventDomain(domain, new ManagedDomain(domain, config.reports, function (err, config) {
			var event = {domain: domain, config: config};
			if (err) event.error = err;
			self.eventDomain('meta').map(event);
		} ) );
		self.eventDomain(domain).on('insert', function ( event ) {
console.log("FOUND INSERT FROM DOMAIN SET");
			self.emit('insert', event);
		} );
	} );
	console.log("DONE LOADING CONFIG", config.domains);
}
util.inherits(Manager, EventEmitter);

Manager.prototype.eventDomain = function (domain, set) {
	if (set) domainholder[domain] = set;
	if (!domain in domainholder) throw "No such domain "+ domain;
	if (!domainholder[domain]) throw "No domain in slot: " + domain;
	return domainholder[domain];
};

Manager.prototype.map = function (event) {
	for (var domain in domainholder) {
		domainholder[domain].map(event);
	}
};

function ManagedDomain (domain, reports, statuscallback) {
	EventEmitter.call(this);
	var self = this
	this.name = domain;
	this.lookup = {};
	this.reports = new List('-');
	reports.forEach( function (report) {
		try {
			console.warn("loading"+'../reports/'+report.reportEngine);
			var reportEngine = require('../reports/'+report.reportEngine);
			if (!report.storageEngine in storageEngines) throw "engine "+report.storageEngine+" for report "+reportEngine.name+" is not available";
			var storageEngine = storageEngines[report.storageEngine];
			var storageForInstance = new storageEngine(domain, report.name);
			storageForInstance.on('insert', function ( event ) {
		console.log("FOUND INSERT FROM DOMAIN SPECIFIC");
				self.emit('insert', event);
			} );
			var reportInstance = new reportEngine(storageForInstance)
			self.reports.insert(reportInstance);
			self.lookup[reportInstance.report] = reportInstance;
			if (typeof reportInstance.map != 'function') throw "DUCK TYPE ERROR - NO MAP IN REPORT"
			if (statuscallback) statuscallback( null , report );
		} catch (e) {
			console.log("ERROR", e);
			if (statuscallback) statuscallback( e , report );
			else throw e;
		}
	} );
}
util.inherits(ManagedDomain, EventEmitter);

ManagedDomain.prototype.report = function (name) {
	if (! name in this.lookup || !this.lookup[name]) throw "NO SUCH REPORT "+name+" AVAILABLE: "+JSON.stringify(Object.keys(this.lookup));
	return this.lookup[name];
};

ManagedDomain.prototype.reports = function (event) {
	var out = new List('-');
	this.reports.forEach(function(report) { out.insert(report.report) } );
	return out;
};

ManagedDomain.prototype.list = function () {
	return this.reports.list;
};

ManagedDomain.prototype.map = function (event) {
	var self = this;
	this.reports.forEach( function (report) {
		report.map(event);
	} );
};

module.exports = Manager;
