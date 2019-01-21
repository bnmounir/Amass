const express = require('express');
const router = express.Router({ mergeParams: true });
const Subject = require('../models/subject');
const Comment = require('../models/comment');
const middleware = require('../middleware');

//comments new
router.get('/new', middleware.isLogged, function(req, res) {
  Subject.findById(req.params.id, function(err, subject) {
    if (err) {
      console.log(err);
    } else {
      res.render('comments/new', { subject: subject });
    }
  });
});

router.post('/', (req, res) => {
  Subject.findById(req.params.id, (err, subject) => {
    if (err) {
      console.log(err);
      res.redirect('/subjects');
    } else {
      Comment.create(req.body.comment, function(err, comment) {
        if (err) {
          req.flash('error', 'something went wrong!');
          console.log(err);
        } else {
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          comment.save();
          subject.comments.push(comment);
          subject.save();
          req.flash('success', 'comment successfully added!');
          res.redirect('/subjects/' + subject._id);
        }
      });
    }
  });
});

//edit
router.get('/:comment_id/edit', middleware.isCommentOwner, (req, res) => {
  Subject.findById(req.params.id, (err, foundSubject) => {
    if (err || !foundSubject) {
      res.flash('error', 'not valid');
      return res.redirect('back');
    }
    Comment.findById(req.params.comment_id, (err, commentFound) => {
      if (err || !commentFound) {
        res.redirect('back');
      } else {
        res.render('comments/edit', {
          subject_id: req.params.id,
          comment: commentFound
        });
      }
    });
  });
});

//update
router.put('/:comment_id', middleware.isCommentOwner, (req, res) => {
  Comment.findByIdAndUpdate(
    req.params.comment_id,
    req.body.comment,
    (err, updatedComment) => {
      if (err) {
        res.redirect('back');
      } else {
        res.redirect('/subjects/' + req.params.id);
      }
    }
  );
});

//Destroy
router.delete('/:comment_id', middleware.isCommentOwner, (req, res) => {
  Comment.findByIdAndRemove(req.params.comment_id, err => {
    if (err) {
      res.redirect('back');
    } else {
      req.flash('success', 'Comment deleted!');
      res.redirect('/subjects/' + req.params.id);
    }
  });
});

module.exports = router;
