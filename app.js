const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    session = require('express-session'),
    flash = require('connect-flash'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    methodOverride = require('method-override'),
    User = require('./models/user');
require('dotenv').config();

const indexRoutes = require('./routes/index'),
    subjectsRoutes = require('./routes/subjects'),
    commentRoutes = require('./routes/comments');
//for local work "mongodb://localhost:27017/local_db" ||
//for deployed app process.env.DATABASEURL
const url = process.env.DATABASEURL;
const port = process.env.PORT || 3000;
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());
app.locals.moment = require('moment');

//passport config
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false
    })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

app.use('/', indexRoutes);
app.use('/subjects', subjectsRoutes);
app.use('/subjects/:id/comments', commentRoutes);

var http = require('http');
setInterval(function() {
    http.get('https://limitless-lake-16790.herokuapp.com');
}, 300000);

app.listen(port, process.env.IP, () => {
    console.log(`Server Started: Amass website on port ${port}!`);
});
