
var mgr = require('../lib/ReportMgr');

describe("The report manager", function () {
	it("can construct", function () {
		var Mgr = new mgr({ domains: ['testdomain'], reports:[{name:'testreport', reportEngine:'testreport', storageEngine:'memory'}]});
		expect(typeof Mgr.map).toBe('function');
	} );
} );

