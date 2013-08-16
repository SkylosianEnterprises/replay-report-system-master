// API of a store:
//
// domain(domainname) - returns object with state within Domain
// report(reportname) - returns object with state within Report
// list(key, cb) - calls callback with a list of data from the store for the
// indicated key
//


var Q = require('q');
var mongoose = require('mongoose');
var ReportSchema = mongoose.Schema();
var ReportModel = mongoose.model( 'Reports', ReportSchema, 'ReportSystem' );
mongoose.connect('mongodb://ecnext81.ecnext.com/Reports');
var mongoDefer = Q.defer();
var beConnected = mongoDefer.promise;
mongoose.connection.db.command({'ping':1}, function (err, result) { mongoDefer.resolve(mongoose.connection); console.log('MONGOOSE', err, result) } );

function List (data) {
	this.total = data.length;
	this.offset = 0;
	this.list = data;
}

List.prototype.skip = function (offset) {
	this.offset = offset;
};

List.prototype.list = function (length) {
	return this.list.slice(this.offset || 0, length)
};

function Domain (name) {
	this.name = name;
	this.prototype = List;
};

Domain.domain = function (domainName) {
	return new Domain(domainName);
};

Domain.prototype.report = function (reportName) {
	return new Report(this.name, reportName);
};

Domain.prototype.reports = function () {
	return ['blacklist'];
};

function Report (domain, name) {
	this.domain = domain;
	this.name = name;
	console.log("report", this);
	this.model = ReportModel;
};

Report.prototype.List = function (key, cb) {
	return new List;
};

module.exports = Domain;
