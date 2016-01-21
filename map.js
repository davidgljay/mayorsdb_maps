"use strict"
//Pulls press relases and generates maps overall and by city.
//This will involve a large word freqency hashmap probably, possibly an array with mergesort.

var dynamo = require('./api/dynamo'),
TagHash = require('./taghash.js'),
s3 = require('./api/s3'),
logger = require('./utils/logger');

require('./config');

var tag_hash = new TagHash();

//Recursively scan dynamoDB 
var scan_dynamo = function(lastkey) {
	return dynamo.scan(process.env.SCAN_DYNAMO, lastkey)
	 	.then(function(results) {
			tag_hash.parsetags(results.Items);
			if(results.lastKey) {
				return scan_dynamo(lastkey);
			} else {
				return;
			}
		});
};

var post_results = function() {
	return s3.batch_post(tag_hash.post_prep());
};

//Map the tags by scanning dynamo, then posting the results to s3.
scan_dynamo('')
.then(post_results)
.then(function(data) {
	logger.info("Map scanning complete.");
}, function(err) {
	logger.error(err);
});
