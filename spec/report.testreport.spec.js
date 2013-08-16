var request = require('supertest');

var app = require('../app.js');

describe("health", function () {
	it("is success to check health", function (done) {
		request(app)
			.get('/health-check')
			.expect(200)
			.end(function (res) {
				expect(res.status).toBe(200);
				done();
			} );
	} );

} );

describe("the Test Report works this way", function () {

/*
	it("a particular report", function (done) {
		expect(function() {
			request(app)
			.get('/report/'+'testdomain'+'/'+'testreport'+'/'+'alltime'+'/'+0)
			.set('Accept', 'application/json')
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function (err, res) {
				console.log('ERR/RES:',err, res.body);
				expect(err).toBeNull();
				expect(res.body.list).toContain('user@dog');
				done();
			} );
		} ).not.toThrow();
	} );
*/

} );
