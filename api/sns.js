var AWS = require('aws-sdk');
var sns = new AWS.SNS();

module.exports = function(message, topic) {
	return new Promise(function(resolve, reject) {
		sns.publish({
			Message:message,
			TopicArn:topic
		}, function(err, data) {
			if (err) reject(err);
			else resolve(data);
		})
	})
}