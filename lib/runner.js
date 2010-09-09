var when = require("promised-io/promise").when,
	print = require("promised-io/process").print,
	onError;
exports.run = function(tests){
	print("Running tests");
	doTests(compileTests(tests));
};

function doTests(tests, prefix){
	prefix = prefix || "";
	function doTest(index){
		var done;
		try{
			var test = tests[index++];
			if(!test){
				onError = false;
				return {failed: 0, total: tests.length};
			}
			if(test.children){
				print(prefix + "Group: " + test.name);
				return when(doTests(test.children, prefix + "  "), function(childrenResults){
					return when(doTest(index), function(results){
						results.failed += childrenResults.failed;
						results.total += childrenResults.total - 1;
						return results;
					});
				});
			}
			onError = function(e){
				print("onError");
				testFailed(e);
				done = true;
			}
			var start = new Date().getTime();
			var iterationsLeft = test.iterations || 1;
			function runIteration(){
				iterationsLeft--
				var result = when(test.test(), testCompleted, testFailed);
				if(iterationsLeft > 0){
					return when(result, runIteration);
				}
				return result;
			}
			return runIteration(); 
			function testCompleted(){
				if(!done){
					if(iterationsLeft <= 0){
						var duration = new Date().getTime() - start;
						print(prefix + test.name + ": passed" + (test.iterations || duration > 200 ? " in " + (duration / (test.iterations || 1)) + "ms per iteration" : ""));
						return doTest(index);
					}
				}
			}
		}catch(e){
			return testFailed(e);
		}
		function testFailed(e){
			if(!done){
				print(prefix + test.name + ": failed");
				print(e.stack || e);
				return when(doTest(index), function(results){ results.failed++; return results;});
			}
		}
		
	}
	return when(doTest(0), function(results){
		print(prefix + "passed: " + (results.total - results.failed) + "/" + results.total);
		return results;
	});
}

function compileTests(tests){
	var listOfTests = [];
	for(var i in tests){
		var test = tests[i];
		if(typeof test == "function"){
			listOfTests.push({
				name: i,
				test: test
			});
		}
		if(typeof test == "object"){
			if(typeof test.runTest == "function"){
				test.test = test.runTest;
				test.name = test.name || i;
				listOfTests.push(test);
			}else{
				listOfTests.push({
					name: i,
					children: compileTests(test)
				});
			}
		}
	}
	return listOfTests;
}

if(typeof process !== "undefined"){
	process.addListener("uncaughtException", function(e){
		if(onError){
			onError(e);
		}else{
			print("Error thrown outside of test, unable to associate with a test. Ensure that a promise returned from a test is not fulfilled until the test is completed. Error: " + e.stack)
		}
	});
}


exports.assert = {};
var assert = require("assert");
for (var key in assert) exports.assert[key] = assert[key]
exports.assert.equal = function(actual, expected, message) {
	if (typeof message === "undefined") {
		message = "got " + actual + ", expected " + expected;
	}
	return assert.equal(actual, expected, message);
};
