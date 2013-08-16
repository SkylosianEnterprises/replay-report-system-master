var List = require('../lib/List');
describe("list object", function () {
	it("emits the event", function (done) {
		var list = new List('-', [], function (a, b) { return b-a });
		list.on('insert', function (key) {
			expect(key).toEqual('-');
			done();
		} );
		list.insert(1);
	} );
	it("inserts in a 0 entry list", function (done) {
		var list = new List('-', [], function (a, b) { return b-a });
		list.insert(1);
		list.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([1]);
			done();
		} );
	} );
	it("inserts in a 1 entry list", function (done) {
		var list = new List('-', [1], function (a, b) { return b-a });
		list.insert(1);
		list.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([1,1]);
			done();
		} );
		var list = new List('-', [ 2 ], function (a, b) { return b-a });
		list.insert(1);
		list.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([1,2]);
			done();
		} );
		var listb = new List('-', [ 2 ], function (a, b) { return b-a });
		listb.insert(3);
		listb.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,3]);
			done();
		} );
	} );
	it("inserts in a 2 entry list", function (done) {
		var list = new List('-', [ 2, 4 ], function (a, b) { return b-a });
		list.insert(1);
		list.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([1,2,4]);
			done();
		} );
		var listb = new List('-', [ 2, 4 ], function (a, b) { return b-a });
		listb.insert(3);
		listb.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,3,4]);
			done();
		} );
		var listc = new List('-', [ 2, 4 ], function (a, b) { return b-a });
		listc.insert(5);
		listc.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,4,5]);
			done();
		} );
		var listd = new List('-', [ 2, 4 ], function (a, b) { return b-a });
		listd.insert(2);
		listd.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,2,4]);
			done();
		} );
		var liste = new List('-', [ 2, 4 ], function (a, b) { return b-a });
		liste.insert(4);
		liste.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,4,4]);
			done();
		} );
	} );
	it("inserts in a 3 entry list", function (done) {
		var list = new List('-', [ 2, 4, 6 ], function (a, b) { return b-a });
		list.insert(1);
		list.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([1,2,4,6]);
			done();
		} );
		var lista = new List('-', [ 2, 4, 6 ], function (a, b) { return b-a });
		lista.insert(2);
		lista.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,2,4,6]);
			done();
		} );
		var listb = new List('-', [ 2, 4, 6 ], function (a, b) { return b-a });
		listb.insert(5);
		listb.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,4,5,6]);
			done();
		} );
		var listc = new List('-', [ 2, 4, 6 ], function (a, b) { return b-a });
		listc.insert(4);
		listc.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,4,4,6]);
			done();
		} );
		var listd = new List('-', [ 2, 4, 6 ], function (a, b) { return b-a });
		listd.insert(6);
		listd.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,4,6,6]);
			done();
		} );
		var liste = new List('-', [ 2, 4, 6 ], function (a, b) { return b-a });
		liste.insert(7);
		liste.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,4,6,7]);
			done();
		} );
		var listf = new List('-', [ 2, 4, 6 ], function (a, b) { return b-a });
		listf.insert(3);
		listf.raw(function (err, list) {
			if (err) throw err;
			expect(list).toEqual([2,3,4,6]);
			done();
		} );
	} );
} );
