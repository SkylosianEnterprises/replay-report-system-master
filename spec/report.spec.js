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


describe("Reports work this way", function () {

	it("a list of domains", function (done) {
		expect(function(){
			request(app)
				.get('/report/all')
				.set('Accept', 'application/json')
				.expect('Content-Type', /json/)
				.end(function (err, res) {
					if (err) { 
						done();
						return expect(err).toBeNull();
					}
					expect(res.header['content-type']).toMatch(/json/);
					console.log("BODY IS", res.body);
					expect(res.body.domains).toContain('meta');
					expect(res.body.reports).toContain({"name":"domains","reportEngine":"__domainreports","storageEngine":"memory"});
					done();
				} )
				.redirects(1)
		} ).not.toThrow();
	} );

	it("a list of reports in a domain", function (done) {
		expect(function(){
			request(app)
				.get('/report/meta/all')
				.set('Accept', 'application/json')
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function (err, res) {
					expect(err).toBeNull();
					expect( function () {
						expect(typeof res.body).toEqual('object');
						expect(res.body[0].config.name).toEqual('domains');
						done();
					} ).not.toThrow();
				} )
				.redirects(1);
		} ).not.toThrow();
	} );

	it("a list of windows in a report", function (done) {
		expect(function() {
			request(app)
			.get('/report/meta/domains/all')
			.set('Accept', 'application/json')
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function (err, res) {
				expect(err).toBeNull();
				expect( function () {
					expect(typeof res.body).toEqual('object');
					expect(res.body).toContain('alltime');
					done();
				} ).not.toThrow();
			} );
		} ).not.toThrow();
	} );
	it("a list of versions in a window", function (done) {
		expect(function() {
			request(app)
			.get('/report/meta/domains/alltime/all')
			.set('Accept', 'application/json')
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function (err, res) {
				expect(err).toBeNull();
				expect( function () {
					expect(typeof res.body).toEqual('object');
					expect(res.body).toContain(0);
					done();
				} ).not.toThrow();
			} );
		} ).not.toThrow();
	} );
	it("gets the latest version", function (done) {
		expect(function() {
			request(app)
			.get('/report/meta/domains/alltime')
			.set('Accept', 'application/json')
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function (err, res) {
				expect(err).toBeNull();
				expect( function () {
					expect(typeof res.body).toEqual('object');
					expect(res.body).toEqual({ domains : [ 'meta' ], reports : [ { name : 'domains', reportEngine : '__domainreports', storageEngine : 'memory' } ] });
					done();
				} ).not.toThrow();
			} )
			.redirects(1);
		} ).not.toThrow();
	} );
	it("is able to freeze", function (done) {
		expect(function() {
			request(app)
			.post('/report/meta/domains/alltime/0/freeze')
			.set('Accept', 'application/json')
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function (err, res) {
				expect(err).toBeNull();
				expect( function () {
					expect(typeof res.body).toEqual('object');
					expect(res.body).toEqual({savedVersion: 0});
					done();
				} ).not.toThrow();
			} )
			.redirects(2);
		} ).not.toThrow();
	} );

} );

