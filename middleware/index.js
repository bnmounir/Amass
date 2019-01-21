const Subject = require('../models/subject');
const Comment = require('../models/comment');

let middlewareObj = {};

middlewareObj.isSubjectOwner = function(req, res, next) {
  if (req.isAuthenticated()) {
    Subject.findById(req.params.id, (err, foundSubject) => {
      if (err || !foundSubject) {
        req.flash('error', 'Subject not found!');
        res.redirect('back');
      } else {
        if (foundSubject.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash('error', 'not permitted!');
          res.redirect('back');
        }
      }
    });
  } else {
    res.redirect('back');
  }
};

middlewareObj.isCommentOwner = function(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, (err, foundComment) => {
      if (err || !foundComment) {
        req.flash('error', 'comment not found');
        res.redirect('back');
      } else {
        if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash('error', 'not permitted!');
          res.redirect('back');
        }
      }
    });
  } else {
    req.flash('error', 'please log-in first!');
    res.redirect('/login');
  }
};

middlewareObj.isLogged = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please login first!');
  res.redirect('/login');
};

module.exports = middlewareObj;
