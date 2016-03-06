var TagHash = require('../taghash');

describe("TagHash", function() {
 describe("med_date function", function() {

 var releases, taghash;

    beforeEach(function() {
      releases = [];
      taghash = new TagHash();
    });

    // it("should identify the median date from a set of date strings in ISO format", function() {
    //   for (i = 10; i >= 2; i--) {
    //     releases.push({date:{S:new Date("1/"+i+"/2016").toISOString()}});
    //   }
    //   expect(taghash.med_date(releases)).toEqual({S:new Date("1/6/2016").toISOString()});
    // });

    // it ("should take the average of two central dates when there is an even number of dates", function() {
    //   for ( i = 10; i >= 1; i--) {
    //     releases.push({date:{S:new Date("1/"+i+"/2016").toISOString()}});
    //   }
    //   expect(taghash.med_date(releases)).toEqual({S:new Date("2016-01-05T17:00:00.000Z").toISOString()});
    // });
  });

  describe("parsetags function", function() {
    var tags, taghash, releases, expected_dates;

    beforeEach(function() {
      releases = [];
      taghash = new TagHash(),
      expected_dates = [];
      for (i = 3 - 1; i >= 1; i--) {
        var date = {S:new Date("1/"+i+"/2016").toISOString()};
        releases.push(JSON.stringify({
          title:{S:"An Article"},
          date: date,
          tags:['stuff', 'things'],
          city:'New York City'
        }));
        expected_dates.push(date);
      }

      tags=[{
        tag:{S:"tag"},
        releases:{SS:releases}
      },
      {
        tag:{S:"tag2"},
        releases:{SS:releases}
      }
      ];
      taghash.parsetags(tags);
    });

    it("should add tags in the proper format to the overall map", function() {
      expect(taghash.maps.all.tags['tag']).toEqual({ 
        dates : expected_dates, 
        cities : { 
          nyc : {
            dates : expected_dates
          } 
        }, 
        tags : { 
          stuff : { 
            dates : expected_dates
          }, 
          things : { 
            dates : expected_dates 
          } 
        } 
      });
    });

    it("Should add tags of the proper format to lists of cities", function() {
      expect(taghash.maps["cities/nyc"].tags['tag']).toEqual({ 
        dates : expected_dates, 
        tags : { 
          stuff : { 
            dates : expected_dates
          }, 
          things : { 
            dates : expected_dates 
          } 
        } 
      });
    });

    it ("Should add cities of the proper format to list of tags", function() {
      expect(taghash.maps.all.tags["tag2"].cities['nyc']).toEqual({
        dates:expected_dates
      });
    });
  });

  describe("post_prep function", function() {
    it("should format for posting to s3", function() {
      var taghash = new TagHash();
      taghash.maps = {
        all:{
          stuff: "things",
          things: "stuff"
        },
        stuff:{
          stuff: "things"
        }
      };
      expect(taghash.post_prep()[0]).toEqual(
      {
        path:"all",
        data:{
            stuff: "things",
            things: "stuff"
        }
      });
      expect(taghash.post_prep()[1]).toEqual(
      {
        path:"stuff",
        data: {
          stuff: "things"
        }
      });
    });
  });
});