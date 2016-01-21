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
	all_tags:[
		{
			tag:'tag',
			count:'count',
			med_date:date		
		}		
		...
	],
	tag:[
		{
			//Same, but with article info included
		}
	],
	city: [
		{
			//Tags by city
		}
	],

 }

*/

Taghash.prototype.parsetags = function(tags) {
	var self = this;
	for (var i = tags.length - 1; i >= 0; i--) {
		var tag = tags[i],
		tagname = tag.tag.S.replace(/[^a-z,0-9]/ig,'_');

		self.maps.all.push({
			tag:tagname,
			count:tag.releases.SS.length,
			med_date:med_date(tag.releases.SS)
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
				self.maps['cities/'+city].tags.push({
					tag:tagname,
					count:tag[key].SS.length,
					med_date:med_date(tag[key].SS),
					releases:tag[key].SS
				});
				self.maps['tags/'+tagname].cities.push({
					city:city_name,
					count:tag[key].SS.length,
					med_date:med_date(tag[key].SS),
					releases:tag[key].SS
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

var med_date = Taghash.prototype.med_date = function(releases) {
	if (releases.length === 1) {
		return releases[0].date;
	}

	//Sort the array of releases by date
	releases = releases.sort(function(a,b) {
		return Date.parse(a.date.S)-Date.parse(b.date.S);
	});
	//If an odd number of releases
	var halfway = releases.length/2;
	if (releases.length%2===1) {
		return releases[halfway-0.5].date;
	} else {
	//If an even number of releases
		return {S:new Date((Date.parse(releases[halfway].date.S) + Date.parse(releases[halfway-1].date.S))/2).toISOString()};
	}
};

module.exports=Taghash;