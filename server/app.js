var express = require('express');

var app = express();

var session = require('express-session');

app.use(session({ secret: 'ats is the best'}));

require('./auth')(app);

app.set('view engine', 'ejs');

app.get('/', function(req, res, done){
  var user = req._passport.session.user;

  var data = {
    title: 'Catnip'
  }

  if(user){
    data.user = {
      name: user.name,
      id: user.id
    };
  }

  res.render('index', data);
});

app.listen(1234, function(){
  console.log('listening on 1234');
})
