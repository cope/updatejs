const _ = require("lodash");
const expect = require("chai").expect;

const updatejs = require("../lib/updatejs");

describe("updatejs tests", function () {
	it("updatejs should exist", function () {
		expect(updatejs).to.exist;
	});

	it("updatejs.update should exist", function () {
		expect(updatejs.update).to.exist;
	});

});
