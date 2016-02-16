"use strict"
//Pulls press relases and generates maps overall and by city.
//This will involve a large word freqency hashmap probably, possibly an array with mergesort.

var dynamo = require('./api/dynamo'),
TagHash = require('./taghash.js'),
s3 = require('./api/s3'),
sns = require('./api/sns'),
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
	var articlesDynamoParams = {
		tablename:"mayorsdb_articles",
		updates:[
			{
				ReadCapacityUnits:1,
				WriteCapcityUnity:1
			},
			{
				index:'city-index'
				ReadCapacityUnits:1,
				WriteCapcityUnity:1
			},
			{
				index:'url-index'
				ReadCapacityUnits:1,
				WriteCapcityUnity:1
			}
		]
	};
	var tagDynoParams = {
		tablename:'mayorsdb_tags',
		updates:[
			{
				ReadCapacityUnits:1,
				WriteCapcityUnity:1
			}
		]
	};
	var updateDyanoTopic = 'arn:aws:sns:us-east-1:663987893806:mayorsdb_updatedyno';
	//Stop the Ec2 instance;
	sns.('','arn:aws:sns:us-east-1:663987893806:mayorsdb_notif');

	//Scale down the dynamo dbs.
	sns(JSON.stringify(articlesDynamoParams), updateDynoTopic);
	sns(JSON.stringify(tagDynoParams), updateDynoTopic);
}, function(err) {
	logger.error(err);
});
