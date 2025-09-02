module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  },

  redirectIfLoggedIn: function (req, res, next) {
    if (req.isAuthenticated()){
     if (req.user.role === 'freelancer') {
        return res.redirect('/service/home');
      } else if (req.user.role === 'client') {
        return res.redirect('/employer/home');
  }

    } 
     next();
 
},
  redirectIfNotAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.redirect('/login'); 
}
};