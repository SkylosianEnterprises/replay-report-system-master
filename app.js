////// BUREAUCRAT //////
// API for report access

/**
 * Module dependencies.
 */

var argv = require('optimist')
	.usage('Start the email web service.\nUsage $0')
	.default('l', '.')
	.default('p', '.')
	.alias('l', 'loggerpath')
	.alias('p', 'pidfiles')
	.alias('v', 'verbose')
	.describe('l', 'Logger path')
	.describe('p', 'Pid files path')
	.describe('v', 'Verbose output')
	.argv;

var express = require('express')
  , routes = require('./routes')
  , Reports = require('./routes/reports')
  , http = require('http')
  , path = require('path')
	, Manager = require('./lib/ReportMgr')
	, EventConnection = require('manta-rabbit-node-lib')
	;

var BCDW = require('./bcdw');

// REPORT LOADING
// TODO: make this dynamic somehow
var blacklist = require('./routes/blacklist')

var ReportMgr = new Manager(
		{ domains: ['testdomain']
		, reports: [ {name:'blacklist', reportEngine:'Base', storageEngine:'memory' } ]
		} );

var schemaMgr = new EventConnection.SchemaMgr(
	{ "schemaSchema": "/home/dihnen/rabbitmq-lib/schemata/JsonSchema.schema"
	, "schemaDirectories": [ "/home/dihnen/rabbitmq-lib/schemata" ]
	} );

var Worker = new BCDW(ReportMgr , 'testing' , schemaMgr);

var reportRoutes = new Reports({ manager: ReportMgr });

var app = express();

app.configure(function(){
//  app.set('port', process.env.NODE_PORT || 3004);
//  app.set('views', __dirname + '/views');
 // app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
	app.use(function(err, req, res, next) {
		console.error("WE GOT AN ERROR", err.stack);
		next(err);
	});
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


// emit blacklistActivity sourceIdentity: { type: email, id: <email> } payload:
// action: add
//app.put('/blacklist/:email', blacklist.add);
// emit blacklistActivity sourceIdentity: { type: email, id: <email> } payload:
// action: delete
//app.del('/blacklist/:email', blacklist.remove);
// GET /report/master/blacklist
app.get('/blacklist', function(req, res, next) {
	req.params.domain = 'master';
	req.params.reportname = 'blacklist'
	reportRoutes.latest(req, res, next);
} );
// get /report/glance/blacklist
app._router.route('propfind', '/blacklist/:email', blacklist.fetch);

// set domain
var Q = require('q');
var domainDefer = Q.defer();
var reportDefer = Q.defer();
var windowDefer = Q.defer();
var versionDefer = Q.defer();
app.param('domain', function(req, res, next, domain){
	req.DOMAIN = ReportMgr.domain(domain);
	domainDefer.resolve(req.DOMAIN);
	next();
} );
app.param('reportname', function(req, res, next, report){
	req.REPORT = reportDefer.promise;
	domainDefer.promise.then( function (domain) {
		reportDefer.resolve(domain.report(report));
	} ).done();
	next();
} );
app.param('window', function(req, res, next, window){
	req.WINDOW = windowDefer.promise;
	windowDefer.resolve(window);
	next();
} );
app.param('version', function(req, res, next, version){
	req.VERSION = versionDefer.promise;
	reportDefer.promise.then( function (report) {
		windowDefer.promise.then( function (window) {
			try {
				versionDefer.resolve(parseInt(version));
			} catch (e) {
				versionDefer.reject(new Error("version was not an integer: "+ version));
			}
		} ).done();
	} ).done();
	next();
} );
app.param('key', function(req, res, next, key){
	req.KEY = key;
	next();
} );

// what domains are available?
app.get('/health-check', function(req, res, next) {
	res.status(200).json({ok:1});
	next(); 
} );

// ****** /report(/*){1}
// What domains are in this system?
// redirect to the meta report
app.get('/report/all', function (req, res, next) {
	res.location('/report/meta/domains/alltime/0').status(307).end();
} );

// ****** /report(/*){2}
// what reports are available in this domain?
// redirect to the meta report
app.get('/report/:domain/all', function (req, res, next) {
	res.location('/report/meta/domains/alltime/0/'+req.params.domain).status(307).end();
} );
// access point for the available windows of a particular report
app.get('/report/:domain/:reportname', reportRoutes.dispatchTo('enumerateWindows')); // redirect to version fetch of window list

// ****** /report(/*){3}
// tell me about the available versions of this report (and perhaps skip how many for pagination)
app.get('/report/:domain/:reportname/all', reportRoutes.dispatchTo('enumerateWindows'));
app.get('/report/:domain/:reportname/:window', reportRoutes.dispatchTo('latest'));

// ****** /report(/*){4}
// enumerate versions available of a report
app.get('/report/:domain/:reportname/:window/all', reportRoutes.dispatchTo('enumerateVersions'));
// canonical access point for a particular version of a particular report in
// a particular time window
app.get('/report/:domain/:reportname/:window/:version', reportRoutes.dispatchTo('fetch'));

// ****** /report(/*){5}
// canonical access point for a particular list referenced by a key in a particular report in
// a particular time window
// action - freeze current report state for later retrieval
app.post('/report/:domain/:reportname/:window/:version/freeze', reportRoutes.dispatchTo('freeze')); // freeze report
app.propfind('/report/:domain/:reportname/:window/:version/:key', reportRoutes.dispatchTo('propfind'));
//app._router.route('propfind', '/report/:domain/:reportname/:window/:version/:key', reportRoutes.dispatchTo('propfind'));

console.log(app._router.map.propfind);

app.get('/report/:domain/:reportname/:window/:version/:key', reportRoutes.dispatchTo('propfind'));


// ****** /diff(/*){6}
// activate the compare engine for two versions of a particular report
app.get('/diff/:reportname/:window/:adomain/:aversion/:bdomain/:bversion', reportRoutes.dispatchTo('difference'));


module.exports = http.createServer(app)
	.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//setTimeout(function() { console.log('timeout');module.exports.close();process.exit(0); }, 10000);
module.exports.on('connection', function(c) {c.on('error', function(e){console.log('error', e)})});

