// This is a component used by the storage engines.
// when there is a change detected, it should call 'change' method with the
// domain, report, window, key, and version.
function DeltaSender (engine, emitter) {
	this.emitter = emitter;
	this.engine = engine;
}

DeltaSender.prototype.insert = function (domain, report, window, version, key) {
	if (!domain) throw "domain required for insert event";
	if (!report) throw "report required for insert event";
	if (!window) throw "window required for insert event";
	if (!version) throw "version required for insert event";
	if (!key) throw "key required for insert event";
	this.emitter.envelope(
		{ eventType: 'ReportActivity'
		, payload:
			{ action: 'insert'
			, activityType: 'key'
			, activity:
				{ activityType: 'key'
				, domain: domain
				, report: report
				, window: window
				, version: version
				, key: key
				}
			}
		, actor: { id: this.engine, type: 'engine' }
		} ).emit();
};

DeltaSender.prototype.reduce = function (domain, report, window, version, key) {
	if (!domain) throw "domain required for reduce event";
	if (!report) throw "report required for reduce event";
	if (!window) throw "window required for reduce event";
	if (!version) throw "version required for reduce event";
	if (!key) throw "key required for reduce event";
	this.emitter.envelope(
		{ eventType: 'ReportActivity'
		, payload:
			{ action: 'reduce'
			, activityType: 'key'
			, activity:
				{ activityType: 'key'
				, domain: domain
				, report: report
				, window: window
				, version: version
				, key: key
				}
			}
		, actor: { id: this.engine, type: 'engine' }
		} ).emit();
}

DeltaSender.prototype.freeze = function (domain, report, window) {
	if (!domain) throw "domain required for freeze event";
	if (!report) throw "report required for freeze event";
	if (!window) throw "window required for freeze event";
	this.emitter.envelope(
		{ eventType: 'ReportActivity'
		, payload:
			{ action: 'freeze'
			, activityType: 'window'
			, activity:
				{ activityType: 'window'
				, domain: domain
				, report: report
				, window: window
				}
			}
		, actor: { id: this.engine, type: 'engine' }
		} ).emit();
}

