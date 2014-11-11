var twitter = require('./twitter');
var facebook = require('./facebook');

var passport = require('passport');

passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(user, done){
  done(null, user);
});

module.exports = function auth(app){
  app.use(passport.initialize());

  twitter(app, passport);
  facebook(app, passport);

  app.post('/logout', function(req, res, done){
    req.logout();
    res.redirect('/');
  });
}
