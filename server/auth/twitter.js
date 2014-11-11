var TwitterStrategy = require('passport-twitter');

var twitterKey = 'gKD58PcA9StOvtgpmblYK5KEi';
var twitterSecret = 'XtHM7hrnbdmXDkVosT4jhGVsjhw6qOZzPoMuu8TcKljrJfyEDl';

module.exports = function(app, passport){

  // setup strategy
  var strategy = new TwitterStrategy({
    consumerKey: twitterKey,
    consumerSecret: twitterSecret,
    callbackURL: 'http://localhost:1234/auth/twitter/callback'
  }, authCallback);

  function authCallback(token, tokenSecret, profile, done){
    done(null, {
      id: profile.id,
      name: profile.displayName
    });
  }

  passport.use(strategy);

  // routes
  app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));
}
