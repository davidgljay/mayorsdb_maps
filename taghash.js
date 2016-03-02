'use strict';

var Taghash = function() {
	this.maps = {
		all:[]
	};
};

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

Taghash.prototype.parsetags = function(tags) {
	var self = this;
	//Get maximum tag count
	var max_num_tags=0;
	for (var i=0; i<tags.length; i++) {
		if (tags[i].releases.SS.length > max) {
			max_num_tags = tags[i].releases.SS.length;
		}
	}

	for (var i = tags.length - 1; i >= 0; i--) {
		var tag = tags[i],
		tagname = tag.tag.S.replace(/[^a-z,0-9]/ig,'_');

		self.maps.all.push({
			tag:tagname,
			count:tag.releases.SS.length,
			med_date:med_date(parse_array(tag.releases.SS))
		});

		self.maps['tags/'+tagname] = {
			tag:tagname,
			cities:[]
		};

		for (var key in tag) {
			if (key.slice(0,13)=="city_releases") {
				var city = key.slice(13),
				city_name=tag['city_name'+city].S;
				city = city.toLowerCase();
				if (!self.maps.hasOwnProperty('cities/'+city)) {
					self.maps['cities/'+city] = {
						city:city_name,
						tags:[]
					};
				}
				var parsed_releases = parse_array(tag[key].SS);
				self.maps['cities/'+city].tags.push({
					tag:tagname,
					count:tag[key].SS.length,
					med_date:med_date(parsed_releases),
					releases:parse_array(parsed_releases)
				});
				self.maps['tags/'+tagname].cities.push({
					city:city_name,
					count:tag[key].SS.length,
					med_date:med_date(parsed_releases),
					releases:parsed_releases
				});

				//TODO: Add people
				//TODO: Add crosstags by city
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
} 

var med_date = Taghash.prototype.med_date = function(releases) {
	if (releases.length === 1) {
		return releases[0].date;
	}

	//Sort the array of releases by date
	releases = releases.sort(function(a,b) {
		return Date.parse(a.date)-Date.parse(b.date);
	});
	//If an odd number of releases
	var halfway = releases.length/2;
	if (releases.length%2===1) {
		return releases[halfway-0.5].date;
	} else {
	//If an even number of releases
		return new Date((Date.parse(releases[halfway].date) + Date.parse(releases[halfway-1].date))/2).toISOString();
	}
};

module.exports=Taghash;