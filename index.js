"use strict"
//Pulls press relases and generates maps overall and by city.
//This will involve a large word freqency hashmap probably, possibly an array with mergesort.

var dynamo = require('./api/dynamo'),
TagHash = require('./taghash.js'),
s3 = require('./api/s3'),
sns = require('./api/sns'),
logger = require('./utils/logger');

var tag_hash = new TagHash();

//Recursively scan dynamoDB 
var scan_dynamo = function(lastkey) {
	return dynamo.scan(process.env.TAGS_TABLE, lastkey)
	 	.then(function(results) {
			console.log('Scanning with lastkey: ' + lastkey);
			tag_hash.parsetags(results.Items);
			if(results.lastKey) {
				return scan_dynamo(lastkey);
			} else {
				return;
			}
		});
};

var post_results = function() {
    logger.info('Posting results.');
	return s3.batch_post(tag_hash.post_prep());
};

//Map the tags by scanning dynamo, then posting the results to s3.
scan_dynamo('')
.then(post_results)
.then(function(data) {
	//Scale down AWS resources;
	sns('','arn:aws:sns:us-east-1:663987893806:mayorsdb_notif').then(
		logger.info("Mapping complete"));
}, function(err) {
	logger.error(err);
});
