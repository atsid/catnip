var superagent = require('superagent');

var telerikUrl = '';

exports.getJunk = function(callback){
  // superagent
  //   .get(telerikUrl)
  //   .end(callback);

  callback(null, { fake: 'data' });
};
