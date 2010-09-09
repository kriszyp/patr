// Based on http://wiki.commonjs.org/wiki/Unit_Testing/1.0#Assert with
// modifications to handle promises
var when = require("promised-io/promise").when;
exports.assert = {};
var assert = require("assert");
for(var key in assert){
	exports[key] = assert[key];
}
exports.equal = function(actual, expected, message) {
	if (typeof message === "undefined") {
		message = "got " + actual + ", expected " + expected;
	}
	return assert.equal(actual, expected, message);
};

exports["throws"] = function(block, error, message){
	try{
		return when(block(), function(){
			throw new Error(message || ("Error" || error.name) + " was expected to be thrown and was not");
		}, function(e){
			if(error && !(e instanceof error)){
				throw e;
			}
		});
	}catch(e){
		if(error && !(e instanceof error)){
			throw e;
		}
	}
};