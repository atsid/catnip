var telerik = require('./telerik');
var jibari = require('./jibari');
var david = require('./david');

module.exports = function(callback){

  telerik.getJunk(function(error, result){
      if(error){
        return callback(error);
      }

      var stepOne = jTransform(result);
      var stepTwo = dTransform(stepOne);
      var finalResult = finalTransform(stepTwo);

      callback(null, finalResult);
    });

};

function jTransform(data){
  return jibari(data);
}

function dTransform(data){
  return david(data);
}

function finalTransform(data){
  return data;
}
