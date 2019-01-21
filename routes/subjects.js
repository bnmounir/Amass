const express = require('express');
const router = express.Router();
const Subject = require('../models/subject');
const middleware = require('../middleware');
const NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

const geocoder = NodeGeocoder(options);

// subjects

router.get('/', (req, res) => {
  let noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    //get all subs if no search
    Subject.find({ name: regex }, (err, subjects) => {
      if (err) {
        console.log(err);
      } else {
        if (subjects !== null) {
          noMatch = 'No subjects found, please try something else!';
        }
        res.render('subjects/index', {
          subjects: subjects,
          noMatch: noMatch,
          currentUser: req.user,
          page: 'subjects'
        });
      }
    });
  } else {
    Subject.find({}, (err, subjects) => {
      if (err) {
        console.log(err);
      } else {
        res.render('subjects/index', {
          subjects: subjects,
          noMatch: noMatch,
          currentUser: req.user,
          page: 'subjects'
        });
      }
    });
  }
});

//create route
router.post('/', middleware.isLogged, (req, res) => {
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  };
  geocoder.geocode(req.body.location, (err, data) => {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newSubject = {
      name: name,
      image: image,
      description: desc,
      author: author,
      location: location,
      lat: lat,
      lng: lng
    };
    //create and save to db
    Subject.create(newSubject, (err, newlyCreated) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/subjects');
      }
    });
  });
});

//new route
router.get('/new', middleware.isLogged, (req, res) => {
  res.render('subjects/new');
});

//show route
router.get('/:id', (req, res) => {
  Subject.findById(req.params.id)
    .populate('comments')
    .exec((err, foundSubject) => {
      if (err || !foundSubject) {
        req.flash('error', 'Subject not found!');
        res.redirect('back');
      } else {
        res.render('subjects/show', { subjects: foundSubject });
      }
    });
});

//Edit
router.get('/:id/edit', middleware.isSubjectOwner, (req, res) => {
  Subject.findById(req.params.id, (err, foundSubject) => {
    if (err || !foundSubject) {
      req.flash('error', 'subject not found');
    }
    res.render('subjects/edit', { subject: foundSubject });
  });
});

//Update
router.put('/:id', middleware.isSubjectOwner, function(req, res) {
  geocoder.geocode(req.body.location, (err, data) => {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.subject.lat = data[0].latitude;
    req.body.subject.lng = data[0].longitude;
    req.body.subject.location = data[0].formattedAddress;

    Subject.findByIdAndUpdate(req.params.id, req.body.subject, function(
      err,
      subject
    ) {
      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        req.flash('success', 'Successfully Updated!');
        res.redirect('/subjects/' + subject._id);
      }
    });
  });
});

//Destroy Route
router.delete('/:id', middleware.isSubjectOwner, (req, res) => {
  Subject.findByIdAndRemove(req.params.id, err => {
    if (err) {
      res.redirect('/subjects');
    } else {
      req.flash('success', 'subject deleted!');
      res.redirect('/subjects');
    }
  });
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = router;
