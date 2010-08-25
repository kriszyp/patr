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
			return when(test.test(), function(){
				if(!done){
					print(prefix + test.name + ": passed");
					return doTest(index);
				}
			}, testFailed);
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
		if(typeof tests[i] == "function"){
			listOfTests.push({
				name: i,
				test: tests[i]
			});
		}
		if(typeof tests[i] == "object"){
			listOfTests.push({
				name: i,
				children: compileTests(tests[i])
			});
		}
	}
	return listOfTests;
}

if(typeof process !== "undefined"){
	process.addListener("uncaughtException", function(e){
		if(onError){
			onError(e);
		}
	});
}
