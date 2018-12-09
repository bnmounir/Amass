var express       = require("express"),
    app           = express(),
    bodyParser    = require("body-parser"),
    mongoose      = require("mongoose"),
    flash         = require('connect-flash'),
    passport      = require('passport'),
    LocalStrategy = require('passport-local'),
    methodOverride= require('method-override'),
    User          = require('./models/user');

var indexRoutes      = require("./routes/index"),    
    campgroundRoutes = require("./routes/campgrounds"),   
    commentRoutes    = require("./routes/comments");    
    
//mongoose.connect("mongodb://localhost:27017/yelp_camp_v12", { useNewUrlParser: true });
mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true });
//mongoose.connect("mongodb://nodelamp:1111lamp@yelpcamp-shard-00-00-mw9wc.mongodb.net:27017,yelpcamp-shard-00-01-mw9wc.mongodb.net:27017,yelpcamp-shard-00-02-mw9wc.mongodb.net:27017/test?ssl=true&replicaSet=yelpcamp-shard-0&authSource=admin&retryWrites=true", { useNewUrlParser: true });



app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

//passport config
app.use(require("express-session")({
    secret: "i wanna finish my web dev course soon",
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


