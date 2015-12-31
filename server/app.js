var express = require('express');

var app = express();

var port = process.env.PORT || 1234;

app.get('/results', function(req, res, done){
  require('./go_time')(function(err, result){
    if(err){
      return res.status(500).end();
    }

    return res.status(200).send(result).end();
  });
});

app.listen(port, function(){
  console.log('listening on %s', port);
});
