var FacebookStrategy = require('passport-facebook');

var facebookID = '1553442304885722';
var facebookSecret = '25fa809049d79683735bf759e4fd0549';

module.exports = function(app, passport){

  // setup strategy
  var strategy = new FacebookStrategy({
    clientID: facebookID,
    clientSecret: facebookSecret,
    callbackURL: 'http://localhost:1234/auth/facebook/callback'
  }, authCallback);

  function authCallback(accessToken, refreshToken, profile, done){
    done(null, {
      id: profile.id,
      name: profile.displayName
    });
  }

  passport.use(strategy);

  // routes
  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));
}
