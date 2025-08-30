module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  },

  redirectIfLoggedIn: function (req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/chat');
    next();
  },
  redirectIfNotAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.redirect('/login'); 
}
};