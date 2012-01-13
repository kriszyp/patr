// Based on http://wiki.commonjs.org/wiki/Unit_Testing/1.0#Assert with
// modifications to handle promises
(function(define){
define(["promised-io/promise"],function(promise){
var assert;
try{
	assert = require("assert");
}catch(e){
	assert = {
		equal: function(a, b, message){
			console.assert(a == b, message);
		},
		deepEqual: function(a, b, message){
			if(a && typeof a == "object" && b && typeof b == "object"){
				for(var i in a){
					assert.deepEqual(a[i], b[i], message);
				}
				for(var i in b){
					if(!(i in a)){
						assert.equal(a[i], b[i], message);
					}
				}
			}else{
				console.assert(a == b, message);	
			}			
		},
	}
}
var exports = {};
var when = promise.when;
exports.assert = {};
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
	var failed = false;
	try{
		return when(block(), function(){
			failed = true;
			throw new Error(message || ("Error" || error.name) + " was expected to be thrown and was not");
		}, function(e){
			if(error && !(e instanceof error)){
				throw e;
			}
		});
	}catch(e){
		if((error && !(e instanceof error)) || failed){
			throw e;
		}
	}
};
return exports;
});
})(typeof define!="undefined"?define:function(deps, factory){module.exports = factory.apply(this, deps.map(require));});
