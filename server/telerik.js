var superagent = require('superagent');

var telerikUrl = '';

exports.getJunk = function(callback){
  // superagent
  //   .get(telerikUrl)
  //   .end(callback);

  callback(null, {
        "me": 0,
        "happiness": 0,
        "groups": {
            "0": {
                "restaurant": "Pasara",
                "time": "10:30",
                "group": ["Craig"]
            },
            "1": {
                "restaurant": "Pasara",
                "time": "13:00",
                "group": ["David", "Jabari", "Gary"]
            },
            "2": {
                "restaurant": "Chinese",
                "time": "13:00",
                "group": ["Kurt", "Ken", "Cary", "Jeff"]
            },
            "3": {
                "restaurant": "Deliahs",
                "time": "14:30",
                "group": ["Josiah", "Tonio", "Kris", "Yoshi"]
            }
        }
    });
};
