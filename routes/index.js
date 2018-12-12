var express  = require("express");
var router   = express.Router();
var passport = require("passport");
var User     = require("../models/user");
var middleware = require("../middleware");
    require("dotenv").config();
    
//index route
router.get("/", (req, res) => {
  res.render("landing");  
});



//Auth
// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//sign up logic
router.post("/register", (req, res)=>{
    let newUser = new User({username: req.body.username});
    // if(req.body.adminCode === "secretcode123"){
    //     newUser.isAdmin = true;
    // }
    User.register(newUser, req.body.password, (err, user)=>{
        if(err){
            req.flash("error", err.message);
            return res.redirect('/register');
        }
        passport.authenticate('local')(req, res, ()=>{
            req.flash("success", `Welcome to Campgrounds ${user.username}!`);
            res.redirect('/campgrounds');
        });
    });
});

//admin logic auth
router.get("/admin", middleware.isLogged, function(req, res){
    console.log("is it ... "+ req.user.isAdmin);
    if(req.user.isAdmin === true){
        // req.flash("success",`${req.user.username}, you are an admin already!`);
        res.render("/campgrounds/");  
    }
    res.render("admin", {page: 'admin'}); 
});

router.post("/admin", middleware.isLogged, (req, res) => {
    if(req.body.adminCode === process.env.ADMIN_SECRET){
        req.user.isAdmin = true;
 
        User.findByIdAndUpdate(req.user._id, {$set: req.user}, function(err, user) {
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        }    
        else {
            req.flash("success",`Welcome to Administrator Authority Campgrounds, ${req.user.username}!`);
            res.redirect("/campgrounds/");
        }
        });    
    }else {
        res.flash("success","permission denied!");
        res.redirect("/campgrounds/");    
    }
});


//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

router.post('/login', (req, res, next)=>{
    passport.authenticate('local',{
    successRedirect: "/campgrounds",
    successFlash: `Welcome Back, ${req.body.username}!`,
    failureRedirect: "/login",
    failureFlash: true
    })(req, res); 
});

//logout
router.get('/logout', (req,res)=>{
    req.logout();
    req.flash("success", "Logged out successfully!");
    res.redirect('/campgrounds');
});

module.exports = router;