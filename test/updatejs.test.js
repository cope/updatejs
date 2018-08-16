var _ = require("lodash");
var expect = require("chai").expect;

var updatejs = require("../lib/updatejs");

describe("updatejs tests", function () {
	it("updatejs should exist", function () {
		expect(updatejs).to.exist;
	});

	it("updatejs.update should exist", function () {
		expect(updatejs.update).to.exist;
	});

});
