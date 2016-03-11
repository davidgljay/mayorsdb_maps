'use strict';

/*
* Creates an object of the structure:
*
  {
	all_tags:{
		max: //Maximum count of any tag 
		tags:[
		{
			tag:'tag',
			count:'count',
			med_date:date		
		}		
		...
	]},
	tag:{
		tag: //Tag name
		max: //Maximum count of any tag in all_tags. This will keep scale consistent.
		releases:[
		{
			//Articles mentioning this tag
		},
		cities:[{
			//Cities mentioning this tag
		}]
		tags:[{
			//tags mentioned in conjunction w/ this tag
		}]
	]},
	city: {
		city: //city name
		max: //Maximum count of any tag in all_tags
		releases: [
			//Press releases from this city
		],
		tags: [{
			tags mentioned in this city
			tag:[{
				//subtags mentioned in this city
			}]
		}]

 }

*/

var Taghash = function() {
	this.maps = {
		all:{
			tags:{}
		}
	};
};

Taghash.prototype.parsetags = function(tags) {
	var self = this;
	//Get maximum tag count
	var max_num_tags=0;
	for (var i=0; i<tags.length; i++) {
		if (tags[i].releases.SS.length > max_num_tags) {
			max_num_tags = tags[i].releases.SS.length;
		}
	}
	self.maps.all.max = max_num_tags;
	for (var i = 0; i<tags.length; i++) {
		var tag = tags[i],
		tagname = tag.tag.S.replace(/[^a-z,0-9]/ig,'_');

		//Add tag to all map
		//Include full date array so that I can visualize.
		//Only for display, so add dates and name.

		//Alternatively I could skip the releases here and handle them through some other API?
		self.maps.all.tags[tagname]={
			dates:[],
			cities:{},
			tags:{}
		};


		for (var j=0; j < tag.releases.SS.length; j++) {

			var release;

			try {
				release = JSON.parse(tag.releases.SS[j]);
			} catch (e) {
				logger.info("Error parsing release JSON\n" + e);
				logger.info(release_text);
				continue
			}

			var city = get_city_code(release.city.toLowerCase());

			//Add dates to tag
			self.maps.all.tags[tagname].dates.push(release.date);

			//Add dates to city in tag
			create_if_absent(
				self.maps.all.tags[tagname].cities,
				city,
				{
					dates:[]
				})
			self.maps.all.tags[tagname].cities[city].dates.push(release.date);

			//Add dates to city map
			create_if_absent(
				self.maps, 
				'cities/'+city, 
				{
					tags:{},
					max:max_num_tags
				});

			create_if_absent(
				self.maps['cities/' + city].tags,
				tagname,
				{
					dates:[],
					tags:{}
				})

			self.maps['cities/' + city].tags[tagname].dates.push(release.date)
			for (var k=0; k<release.tags.length; k++) {
				var crosstag = release.tags[k];
				//Add crosstags
				//These need to be visualized only, so releases are not necessary.
				//Should this just be part of the all map for consistency??
				//Lets add the releases in there in case there's a way to display them. 
				if (crosstag != tagname) {
					//Add crosstags to all map
					create_if_absent(
						self.maps.all.tags[tagname].tags,
						crosstag,
						{
							dates:[]
						});

					self.maps.all.tags[tagname].tags[crosstag].dates.push(release.date);

					//Add crosstags to city map
					create_if_absent(
						self.maps['cities/' + city].tags[tagname].tags,
						crosstag,
						{
							dates:[]
						});

					self.maps['cities/' + city].tags[tagname].tags[crosstag].dates.push(release.date);
				}
			 }
		}
	}
};



Taghash.prototype.post_prep = function() {
	var self=this;
	var items=[];
	for (var key in self.maps) {
		items.push({
			path:key,
			data:self.maps[key]
		});
	}
	return items;
};

var create_if_absent = function (object, item, template) {
	if (!object.hasOwnProperty(item)) {
		object[item]=template;
	}
	return object;
};

var get_city_code = function(city) {
	var result;
	switch (city) {
		case 'new york':
			result='nyc';
			break;
		case 'los angeles':
			result='lax';
			break;
		case 'houston':
			result='hou';
			break;
		case 'philadelphia':
			result='phl';
			break;
		case 'phoenix':
			result='phx';
			break;
		case 'san antonio':
			result='sat';
			break;
		case 'san diego':
			result='san';
			break;
		case 'chicago':
			result='chi';
			break;
		case 'san jose':
			result='sjc';
			break;
		default:
			result=city;
	};
	return result;
};

var parse_array = function(array) {
	var results = [];
	for (var i=0; i<array.length; i++) {
		if (array[i].url) {
			results.push(array[i])
		} else {
			results.push(JSON.parse(array[i]))			
		}		
	}
	return results;
};

// var med_date = Taghash.prototype.med_date = function(releases) {
// 	if (releases.length === 1) {
// 		return releases[0].date;
// 	}

// 	//Sort the array of releases by date
// 	releases = releases.sort(function(a,b) {
// 		return Date.parse(a.date)-Date.parse(b.date);
// 	});
// 	//If an odd number of releases
// 	var halfway = releases.length/2;
// 	if (releases.length%2===1) {
// 		return releases[halfway-0.5].date;
// 	} else {
// 	//If an even number of releases
// 		return new Date((Date.parse(releases[halfway].date) + Date.parse(releases[halfway-1].date))/2).toISOString();
// 	}
// };

module.exports=Taghash;