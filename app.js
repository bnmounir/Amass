var express       = require("express"),
    app           = express(),
    bodyParser    = require("body-parser"),
    mongoose      = require("mongoose"),
    session       = require("express-session"),
    flash         = require('connect-flash'),
    passport      = require('passport'),
    LocalStrategy = require('passport-local'),
    methodOverride= require('method-override'),
    User          = require('./models/user');
    require("dotenv").config();

var indexRoutes      = require("./routes/index"),    
    campgroundRoutes = require("./routes/campgrounds"),   
    commentRoutes    = require("./routes/comments");    
    //for local work "mongodb://localhost:27017/yelp_camp_v13" || 
var url = process.env.DATABASEURL;

mongoose.connect(url, { useNewUrlParser: true }); 

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");


//passport config
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);

app.listen(process.env.PORT, process.env.IP, () => {
    console.log("Server Started: Yelpcamp website ON!");
});


