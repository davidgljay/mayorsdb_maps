'use strict'

var AWS = require('aws-sdk');
var Promise = require('promise');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY, 
	secretAccessKey: process.env.AWS_SECRET, 
	region: process.env.AWS_REGION
})

var dynamodb = this.dynamodb = new AWS.DynamoDB({apiVersion: '2015-02-02'});


//Updates a single item in DynamoDB. Assumes that integers and arrays are added rather than updated.

module.exports.update = function(item) {
	return new Promise(function(resolve, reject) {
		dynamodb.updateItem({
			TableName:process.env.TABLE_NAME,
			Key:{tag:item.vals[":tag"]},
			ReturnValues:'NONE',
			ReturnItemCollectionMetrics:'NONE',
			ReturnConsumedCapacity: 'NONE',
			ExpressionAttributeValues: item.values,
			UpdateExpression: item.update_expression
		},
		function(err, data) {
			if (err) {
				reject("Error updating DynamoDB:\n" + err);
			} else {
				resolve(data);
			}
		});
	});
};

module.exports.batch_update = function(items) {
	var promise_array = [];
	for (var i = items.length - 1; i >= 0; i--) {
		promise_array.push(items[i]);
	}
	return Promise.all(promise_array);
};
//Post up to 25 items to dynamoDB. 
//TODO: Handle that limitation in this class.

var batch_post = module.exports.batch_post = function(items) {
	return post(items.splice(0,24))
	.then(function() {
		if (items.length===0) {
			return;
		}
		return batch_post(items);
	});
};

var post = module.exports.post = function(items) {
	return new Promise(function(resolve, reject) {
		//TODO: make this a batchputitem for efficiency's sake.
		if (items === null) {
			resolve();
			return;
		}
		var formatted_items = put_params(items);
		if (!formatted_items) {
			resolve();
			return;
		}
		dynamodb.batchWriteItem(formatted_items, function(err, response) {
			if (err) {
				console.error("Error posting item to dynamo:" + err);
				reject(err);
			} else {
				console.info("Item post to dynamo successful\n" + JSON.stringify(response));
				resolve();
			}
		});			
	});
};

var put_params = function(items) {
	var formatted_items = [];
	for (var i = items.length - 1; i >= 0; i--) {
		//Some items will be null, skip them.
		if (items[i] === null) {
			continue;
		}
		formatted_items.push({
			PutRequest: {
				Item:  items[i]
            }
          });
	}

	if (formatted_items.length === 0) {
		//Handle the case where we get a set entirely of null variables. This seems to happen with Houston.
		return false;
	} else {
		var dynamo_output = {
		    "RequestItems": {},
		    ReturnConsumedCapacity: 'NONE'
		};
		dynamo_output.RequestItems[process.env.DYNAMODB_NAME] = formatted_items;
		return dynamo_output;		
	}
};

module.exports.scan = function(table_name, start_key) {
	console.log("scanning " + table_name);
	var params = {
		TableName:table_name,
		ConsistentRead:true,
		// ExclusiveStartKey: start_key,
		Select:'ALL_ATTRIBUTES'
	};
	if (start_key.length > 0) {
		params.ExclusiveStartKey=start_key;
	}
	return new Promise(function(resolve, reject) {
		dynamodb.scan(params, function(err, data) {
			if (err) reject(err);
			else resolve(data);
		});
	})
};