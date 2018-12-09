var express  = require("express");
var router   = express.Router();
var passport = require("passport");
var User     = require("../models/user");
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
    User.register(newUser, req.body.password, (err, user)=>{
        if(err){
            req.flash("error", err.message);
            return res.redirect('/register');
        }
        passport.authenticate('local')(req, res, ()=>{
            req.flash("success", `Welcome to ${user.username}!`);
            res.redirect('/campgrounds');
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

router.post('/login', (req, res, next)=>{
    passport.authenticate('local',{
    successRedirect: "/campgrounds",
    successFlash: `Welcome, ${req.body.username}!`,
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