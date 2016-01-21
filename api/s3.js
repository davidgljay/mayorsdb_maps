var AWS = require('aws-sdk');
Promise = require('promise');

// AWS.config.update({
// 	accessKeyId: process.env.AWS_KEY, 
// 	secretAccessKey: process.env.AWS_SECRET, 
// 	region: process.env.AWS_REGION
// })

var s3 = this.s3 = new AWS.S3({apiVersion: '2006-03-01'});

var post = module.exports.post = function(data, path) {
	var params = 
		{
			Bucket: 'mayors.buzz',
			ACL: 'public-read', 
			Key: 'maps/'+path+'.json', 
			Body: new Buffer(JSON.stringify(data)),
			ContentLanguage:'english'
		};
		return new Promise(function(resolve, reject) {
			s3.upload(params, function(err, data) {
				if (err) reject(err);
				else resolve(data);
			});
		})
};

module.exports.batch_post = function(items) {
	console.log("Batch posting " + items.length + " to s3.");
	var promise_array = [];
	for (var i = items.length - 1; i >= 0; i--) {
		promise_array.push(post(items[i].data, items[i].path));
	}
	return Promise.all(promise_array);
}

