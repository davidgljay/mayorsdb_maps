var TagHash = require('../taghash');

describe("TagHash", function() {
	describe("med_date function", function() {

		var releases, taghash;

		beforeEach(function() {
			releases = [];
			taghash = new TagHash();
		});

		it("should identify the median date from a set of date strings in ISO format", function() {
			for (var i = 10; i >= 2; i--) {
				releases.push({date:{S:new Date("1/"+i+"/2016").toISOString()}});	
			}
			expect(taghash.med_date(releases)).toEqual({S:new Date("1/6/2016").toISOString()});
		});

		it ("should take the average of two central dates when there is an even number of dates", function() {
			for (var i = 10; i >= 1; i--) {
				releases.push({date:{S:new Date("1/"+i+"/2016").toISOString()}});	
			}
			expect(taghash.med_date(releases)).toEqual({S:new Date("2016-01-05T17:00:00.000Z").toISOString()});
		});
	});

	describe("parsetags function", function() {
		var tags, taghash, releases;

		beforeEach(function() {
			releases = [],
			taghash = new TagHash();
			for (var i = 20 - 1; i >= 1; i--) {
				releases.push({
					title:{S:"An Article"},
					date:{S:new Date("1/"+i+"/2016").toISOString()}
				});
			}

			tags=[{
				tag:{S:"tag"},
				releases:{SS:releases},
				city_nameNewYorkCity:{S:"New York City"},
				city_releasesNewYorkCity:{SS:releases},
				person_releasesBillDeblasio:{SS:releases}
			},
			{
				tag:{S:"tag2"},
				releases:{SS:releases},
				city_nameNewYorkCity:{S:"New York City"},
				city_releasesNewYorkCity:{SS:releases},
				person_releasesBillDeblasio:{SS:releases},
				city_nameLosAngeles:{S:"Los Angeles"},
				city_releasesLosAngeles:{SS:releases}
			}
			];
			taghash.parsetags(tags);
		});

		it("should add tags in the proper format to the overall map", function() {
			expect(taghash.maps.all[1]).toEqual({
				tag:'tag',
				count:19,
				med_date:{S:new Date("Sun Jan 10 2016 00:00:00 GMT-0500 (EST)").toISOString()}
			});
		});

		it("Should add tags of the proper format to lists of cities", function() {
			expect(taghash.maps["cities/newyorkcity"].city).toEqual("New York City");
			expect(taghash.maps["cities/newyorkcity"].tags[1]).toEqual({
				tag:"tag",
				count:19,
				med_date:{S:new Date("Sun Jan 10 2016 00:00:00 GMT-0500 (EST)").toISOString()},
				releases:releases
			});
		});

		it ("Should add cities of the proper format to list of tags", function() {
			expect(taghash.maps["tags/tag2"].tag).toEqual("tag2");
			expect(taghash.maps["tags/tag2"].cities[0]).toEqual({
				city:"New York City",
				count:19,
				med_date:{S:new Date("Sun Jan 10 2016 00:00:00 GMT-0500 (EST)").toISOString()},
				releases:releases
			});
			expect(taghash.maps["tags/tag2"].cities[1]).toEqual({
				city:"Los Angeles",
				count:19,
				med_date:{S:new Date("Sun Jan 10 2016 00:00:00 GMT-0500 (EST)").toISOString()},
				releases:releases
			});
		});

		it ("Should create person-level maps of the proper format", function() {
			//TODO, I think this may require a different structure.
		})
	});

describe("post_prep function", function() {
	it("format for posting to s3", function() {
		var taghash = new TagHash();
		taghash.maps = {
			all:{
				stuff:"things",
				things:"stuff"
			},
			stuff:{
				stuff:"things"
			}
		};
		expect(taghash.post_prep()[0]).toEqual(
		{ 
			path:"all",
			data:{
					stuff:"things",
					things:"stuff"
			}
		});
		expect(taghash.post_prep()[1]).toEqual(
		{ 
			path:"stuff",
			data: {
				stuff:"things"
			}
		});
	})
})
});