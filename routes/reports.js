function Reports ( options ) {
	this.manager = options.manager;
	if (!this.manager) throw "manager required to instantiate reports";
}
Reports.prototype.dispatchTo = function ( method ) {
	var self = this;
	if (! method in self) throw "NO SUCH METHOD: " + method;
	return function (req, res, next) {
		try {
			self[method].call(self, req, res, next);
		} catch(e) { 
			console.trace(e);
			console.trace("error in disptacher to method: "+ method+ ": "+JSON.stringify(e)); 
		}
	}
};
module.exports = Reports;

Reports.prototype.enumerateDomains = function (req, res, next) {
	// what domains are available?
	this.manager.domains.skip(req.params.skip).list(100, function (err, list) {
		if (err) return next(err);
		res.json({ total: list.length, list: list } );
		res.end();
	} );
};

// what reports are available in this domain?
Reports.prototype.enumerateReports = function (req, res, next) {
	req.DOMAIN.reports.skip(req.params.skip).list(100, function (err, reports) {
		if (err) return res.status(500).json({ error: err });
		res.json(
			{ total: reports.length
			, list: reports
			, more: (req.params.skip || 0) + 100 < reports.length
			} );
		res.end();
	} );
};

// what windows are available for this report?
//
Reports.prototype.enumerateWindows = function (req, res, next) {
	req.REPORT.then( function (report) {
		report.windows( function (windows) {
			res.json(
				{ total: windows.length
				, list: windows.list.skip(req.params.skip).list(100)
				, more: (req.params.skip || 0) + windows.length < 100
				} );
			res.end();
		} );
	} );
};

// what versions are available for this window?
//
Reports.prototype.enumerateVersions = function (req, res, next) {
	req.REPORT.then( function (report) {
		req.WINDOW.then( function (window) {
			report.versions(window, function (err, versions) {
				if (err) return next(err);
				res.json( versions );
				res.end();
			} );
		} );
	} );
};

// canonical access point for a particular version of a particular report in
// a particular time window
Reports.prototype.fetch = function (req, res, next) {
	var self = this;
	req.REPORT.then(function (report) {
		req.WINDOW.then( function (window) {
			req.VERSION.then(function(version) {
				if (version == 'all') return next();
				report.deliver(window, version, function (err, report) {
					if (err) return next(err);
					res.json(report);
					res.end();
				} );
			} ).done();
		} ).done();
	} ).done();
}

Reports.prototype.propfind = function (req, res, next) {
	req.REPORT.then(function (report) {
		req.WINDOW.then( function (window) {
			req.VERSION.then(function(version) {
				report.propfind(window, version, req.KEY, function (err, list) {
					console.log("ERR/LIST", err, list);
					if (err) return next(err);
					res.json(list);
					res.end();
				} );
			} ).done();
		} ).done();
	} ).done();
};

// tell me about the available windows of this report (and perhaps skip how many for pagination)
Reports.prototype.enumerateWindows = function (req, res, next) {
	req.REPORT.then(function (report) {
		report.windows( function ( err, windows ) {
			if (err) return next(err);
			res.json( windows )
			res.end();
		} );
	} ).done();
};

// access point for the latest version of a particular report
//app.get('/report/:domain/:report', reports.latest); // redirect to version of latest
Reports.prototype.latest = function (req, res, next) {
	req.REPORT.then( function (report) {
		req.WINDOW.then( function (window) {
			report.latest(window, function(err, version) {
				if (err) return next(err);
console.log("LATEST VERSION", version, [ '/report'
					, req.DOMAIN.name
					, report.report
					, window
					, version
					])
				res.location(
					[ '/report'
					, req.DOMAIN.name
					, report.name
					, window
					, version
					].join('/') ).status(307);
				res.end();
			} );
		} ).done();
	} ).done();
};

// action - freeze current report state for later retrieval
//app.post('/report/freeze/:domain/:report/:window/:version', reports.freeze); // report
Reports.prototype.freeze = function (req, res, next) {
	console.log("FREESING");
	req.REPORT.then(function (report) {
	console.log("REPORT IN FREEZE");
		req.WINDOW.then(function (window) {
console.log("WINDOW IN FREEZE");
			req.VERSION.then(function (oldversion) {
console.log("OLDVERSION IN FREEZE", oldversion, req.path);
				report.freeze(window, function (err, newversion) {
console.log("ERR IN FREEZE", err);
					if (err) return next(err);
console.log("NEW VERSION IN FREEZE", newversion);
					res.json({ savedVersion: oldversion }).status(200);
					res.end();
				} );
			} );
		} ).done();
	} ).done();
	Reports.prototype.fetch(req, res, next);
};

// activate the compare engine for two versions of a particular report
//app.get('/diff/:report/:window/:adomain/:aversion/:bdomain/:bversion', reports.difference);
Reports.prototype.difference = function (req, res, next) {
	res.json({ok:0, state: "NOT_IMPLEMENTED"});
	return next();
	var a = AllReports.domain(req.params.adomain)
		.report(req.params.report)
		.window(req.params.window)
		.version(req.params.aversion)
	var b = AllReports.domain(req.params.bdomain)
		.report(req.params.report)
		.window(req.params.window)
		.version(req.params.bversion)
	res.json(getReportProcessor(req.params.report).compareVersions(a, b));
};

